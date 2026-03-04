import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'

// ─── Revolut webhook signature verification ───────────────────────────────────
// Revolut signs the payload with HMAC-SHA256 using your webhook secret.
// Header: Revolut-Signature: v1=<hex_digest>
// Also requires: Revolut-Request-Timestamp header (anti-replay: reject if > 5 min old)
async function verifySignature(
  secret: string,
  payload: string,
  timestamp: string,
  signature: string,
): Promise<boolean> {
  try {
    const signingInput = `${timestamp}.${payload}`
    const keyData = new TextEncoder().encode(secret)
    const msgData = new TextEncoder().encode(signingInput)

    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const rawSig = await crypto.subtle.sign('HMAC', key, msgData)
    const expected = Array.from(new Uint8Array(rawSig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // signature header may be "v1=abc123,v2=xyz..." — extract v1
    const v1 = signature.split(',').find(s => s.startsWith('v1='))?.slice(3) ?? ''
    return v1 === expected
  } catch {
    return false
  }
}

// ─── Payment status mapping ───────────────────────────────────────────────────
const REVOLUT_TO_PAYMENT_STATUS: Record<string, string> = {
  COMPLETED:   'paid',
  AUTHORISED:  'paid',
  DECLINED:    'failed',
  CANCELLED:   'failed',
  FAILED:      'failed',
  REFUNDED:    'refunded',
  CHARGEBACK:  'refunded',
}

const REVOLUT_TO_ORDER_STATUS: Record<string, string> = {
  COMPLETED:   'confirmed',
  AUTHORISED:  'confirmed',
}

serve(async (req: Request) => {
  try {
    const body = await req.text()

    // ── 1. Verify webhook signature ───────────────────────────────────────────
    const webhookSecret = Deno.env.get('REVOLUT_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('[revolut-webhook] REVOLUT_WEBHOOK_SECRET not set')
      return new Response('Misconfigured', { status: 500 })
    }

    const timestamp  = req.headers.get('Revolut-Request-Timestamp') ?? ''
    const signature  = req.headers.get('Revolut-Signature') ?? ''

    // Anti-replay: reject if timestamp is older than 5 minutes
    const tsMs = parseInt(timestamp, 10)
    if (isNaN(tsMs) || Date.now() - tsMs > 5 * 60 * 1000) {
      console.warn('[revolut-webhook] Stale timestamp, rejecting')
      return new Response('Stale request', { status: 400 })
    }

    const valid = await verifySignature(webhookSecret, body, timestamp, signature)
    if (!valid) {
      console.warn('[revolut-webhook] Signature mismatch')
      return new Response('Invalid signature', { status: 401 })
    }

    // ── 2. Parse event ────────────────────────────────────────────────────────
    const event = JSON.parse(body)
    const { event: eventType, order } = event

    console.log('[revolut-webhook] Event:', eventType, '| Revolut order:', order?.id)

    if (!order) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── 3. Map Revolut state → our statuses ───────────────────────────────────
    const revolutState  = order.state as string
    const paymentStatus = REVOLUT_TO_PAYMENT_STATUS[revolutState]
    const orderStatus   = REVOLUT_TO_ORDER_STATUS[revolutState]

    if (!paymentStatus) {
      console.log('[revolut-webhook] Unhandled state:', revolutState)
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── 4. Update order in Supabase ───────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const updates: Record<string, string> = { payment_status: paymentStatus }
    if (orderStatus) updates.status = orderStatus

    // Look up by merchant_order_ext_ref (our order UUID) or by revolut_order_id
    const extRef = order.merchant_order_ext_ref as string | undefined

    let query = supabase.from('orders').update(updates)
    if (extRef) {
      query = query.eq('id', extRef)
    } else {
      query = query.eq('revolut_order_id', order.id)
    }

    const { error: dbErr, count } = await query.select('id', { count: 'exact', head: true })
    if (dbErr) {
      console.error('[revolut-webhook] DB error:', dbErr.message)
    } else {
      console.log('[revolut-webhook] Updated', count, 'order(s) →', updates)
    }

    // ── 5. Trigger confirmation email on payment success ──────────────────────
    if (paymentStatus === 'paid' && extRef) {
      supabase.functions.invoke('send-email', {
        body: { type: 'order_confirmed', order_id: extRef },
      }).catch((e: Error) => console.error('[revolut-webhook] send-email error:', e.message))
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[revolut-webhook] Unhandled error:', err)
    return new Response('Internal error', { status: 500 })
  }
})
