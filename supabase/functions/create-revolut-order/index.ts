import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── CORS ────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

// ─── Revolut Merchant API ────────────────────────────────────────────────────
// Set REVOLUT_ENV=sandbox in Supabase secrets to use the sandbox (test) environment
const isSandbox = Deno.env.get('REVOLUT_ENV') === 'sandbox'
const REVOLUT_API = isSandbox
  ? 'https://sandbox-merchant.revolut.com/api'
  : 'https://merchant.revolut.com/api'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const {
      order_id,      // our Supabase order UUID (already inserted as 'pending')
      amount_eur,    // number, e.g. 49.99
      customer_email,
    } = await req.json()

    if (!order_id || !amount_eur) {
      return json({ error: 'Missing order_id or amount_eur' }, 400)
    }

    const secretKey = Deno.env.get('REVOLUT_SECRET_KEY')
    if (!secretKey) return json({ error: 'REVOLUT_SECRET_KEY not set' }, 500)

    // ── 1. Create order in Revolut Merchant API ───────────────────────────────
    const revolutRes = await fetch(`${REVOLUT_API}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Revolut-Api-Version': '2024-09-01',
      },
      body: JSON.stringify({
        amount: Math.round(amount_eur * 100),   // Revolut expects integer cents
        currency: 'EUR',
        merchant_order_ext_ref: order_id,        // our DB order ID for webhook lookup
        customer_email: customer_email || undefined,
        description: 'Zielinski & Rozen Budapest',
        settlement_currency: 'EUR',
      }),
    })

    const revolut = await revolutRes.json()

    if (!revolutRes.ok) {
      console.error(`[create-revolut-order] Revolut error (${isSandbox ? 'sandbox' : 'production'}):`, JSON.stringify(revolut))
      return json({ error: revolut.message ?? 'Revolut API error', detail: revolut }, revolutRes.status)
    }

    // Log full Revolut response to diagnose missing public_id
    console.log('[create-revolut-order] Revolut order response:', JSON.stringify(revolut))

    // ── 2. Persist Revolut order ID + mark payment as pending ─────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { error: dbErr } = await supabase
      .from('orders')
      .update({
        revolut_order_id: revolut.id,
        payment_status: 'pending',
      })
      .eq('id', order_id)

    if (dbErr) console.error('[create-revolut-order] DB error:', dbErr.message)

    // ── 3. Return token for the frontend Revolut Pay widget ───────────────────
    // Revolut API v2024-09-01 uses "token" field (older versions used "public_id")
    return json({ public_id: revolut.token ?? revolut.public_id, revolut_order_id: revolut.id })

  } catch (err) {
    console.error('[create-revolut-order] Unhandled error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})
