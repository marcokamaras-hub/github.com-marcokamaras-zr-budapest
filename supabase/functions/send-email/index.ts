import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Types ───────────────────────────────────────────────────────────────────
type EmailType = 'order_confirmed' | 'order_shipped' | 'low_stock_alert'

interface OrderItem {
  product_name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_method: 'delivery' | 'pickup'
  delivery_date: string
  delivery_address?: string
  delivery_city?: string
  delivery_postal_code?: string
  notes?: string
  items: OrderItem[]
  subtotal: number
  delivery_fee: number
  total: number
  status: string
}

// ─── Brand colours ───────────────────────────────────────────────────────────
const GREEN  = '#3D4F3D'
const BG     = '#F5F3F0'
const MUTED  = '#8a9a8a'
const LOGO   = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69324dcdd5b74406aba69c8c/f85d99a42_ZRlogo.png'

// ─── Shared email shell ───────────────────────────────────────────────────────
function shell(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Zielinski & Rozen</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <img src="${LOGO}" alt="Zielinski & Rozen" height="48" style="display:block;" />
            <p style="margin:10px 0 0;font-size:10px;letter-spacing:0.2em;color:${MUTED};text-transform:uppercase;">
              Perfumerie · Budapest
            </p>
          </td>
        </tr>

        <!-- Body -->
        ${body}

        <!-- Footer -->
        <tr>
          <td style="padding-top:40px;border-top:1px solid #ddd;text-align:center;">
            <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.15em;color:${MUTED};text-transform:uppercase;">
              Zielinski &amp; Rozen Budapest
            </p>
            <p style="margin:0;font-size:11px;color:${MUTED};">
              Székely Mihály u. 4, 1061 Budapest
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Order items table ────────────────────────────────────────────────────────
function itemsTable(items: OrderItem[]): string {
  const rows = items.map(i => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:${GREEN};">${i.product_name}</td>
      <td style="padding:8px 0;font-size:13px;color:${MUTED};text-align:center;">×${i.quantity}</td>
      <td style="padding:8px 0;font-size:13px;color:${GREEN};text-align:right;">€${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`).join('')

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <th style="text-align:left;font-size:9px;letter-spacing:0.15em;color:${MUTED};text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #ddd;">Product</th>
      <th style="text-align:center;font-size:9px;letter-spacing:0.15em;color:${MUTED};text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #ddd;">Qty</th>
      <th style="text-align:right;font-size:9px;letter-spacing:0.15em;color:${MUTED};text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #ddd;">Price</th>
    </tr>
    ${rows}
  </table>`
}

// ─── Template: Order Confirmed ────────────────────────────────────────────────
function tplOrderConfirmed(order: Order): { subject: string; html: string } {
  const deliveryLabel = order.delivery_method === 'pickup' ? 'PICKUP' : 'DELIVERY'
  const deliveryAddr  = order.delivery_method === 'pickup'
    ? 'Székely Mihály u. 4, 1061 Budapest'
    : [order.delivery_address, order.delivery_city, order.delivery_postal_code].filter(Boolean).join(', ')

  const html = shell(`
    <tr>
      <td style="background:#fff;padding:32px;border:1px solid #e8e4df;">

        <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;color:${MUTED};text-transform:uppercase;">Thank you</p>
        <h1 style="margin:0 0 24px;font-size:22px;font-weight:300;letter-spacing:0.1em;color:${GREEN};text-transform:uppercase;">
          Order Confirmed
        </h1>

        <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:${GREEN};">
          Dear ${order.customer_name},<br/>
          Your order <strong>${order.order_number}</strong> has been received and payment confirmed.
          We will prepare your order for ${deliveryLabel.toLowerCase()} on
          <strong>${new Date(order.delivery_date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}</strong>.
        </p>

        <!-- Items -->
        <div style="margin-bottom:24px;">
          ${itemsTable(order.items)}
        </div>

        <!-- Totals -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ddd;margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;font-size:12px;color:${MUTED};">Subtotal</td>
            <td style="padding:8px 0;font-size:12px;color:${MUTED};text-align:right;">€${order.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:12px;color:${MUTED};">${deliveryLabel}</td>
            <td style="padding:4px 0;font-size:12px;color:${MUTED};text-align:right;">${order.delivery_fee === 0 ? 'FREE' : '€' + order.delivery_fee.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 0;font-size:14px;font-weight:600;color:${GREEN};border-top:1px solid #ddd;">Total</td>
            <td style="padding:12px 0 0;font-size:14px;font-weight:600;color:${GREEN};text-align:right;border-top:1px solid #ddd;">€${order.total.toFixed(2)}</td>
          </tr>
        </table>

        <!-- Delivery info -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:16px;margin-bottom:8px;">
          <tr>
            <td style="font-size:9px;letter-spacing:0.15em;color:${MUTED};text-transform:uppercase;padding-bottom:6px;">${deliveryLabel} DETAILS</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:${GREEN};">${deliveryAddr}</td>
          </tr>
          ${order.notes ? `<tr><td style="font-size:12px;color:${MUTED};padding-top:6px;">Note: ${order.notes}</td></tr>` : ''}
        </table>

      </td>
    </tr>
  `)

  return {
    subject: `Order confirmed — ${order.order_number} · Zielinski & Rozen`,
    html,
  }
}

// ─── Template: Order Shipped ──────────────────────────────────────────────────
function tplOrderShipped(order: Order): { subject: string; html: string } {
  const isPickup = order.delivery_method === 'pickup'

  const html = shell(`
    <tr>
      <td style="background:#fff;padding:32px;border:1px solid #e8e4df;">

        <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;color:${MUTED};text-transform:uppercase;">
          ${isPickup ? 'Ready for pickup' : 'On its way'}
        </p>
        <h1 style="margin:0 0 24px;font-size:22px;font-weight:300;letter-spacing:0.1em;color:${GREEN};text-transform:uppercase;">
          ${isPickup ? 'Your Order Is Ready' : 'Your Order Is Shipped'}
        </h1>

        <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:${GREEN};">
          Dear ${order.customer_name},<br/>
          ${isPickup
            ? `Your order <strong>${order.order_number}</strong> is ready for pickup at our store. Please come by at your convenience.`
            : `Your order <strong>${order.order_number}</strong> is on its way and will be delivered on
               <strong>${new Date(order.delivery_date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}</strong>.`
          }
        </p>

        <!-- Items recap -->
        <div style="margin-bottom:24px;">
          ${itemsTable(order.items)}
        </div>

        ${isPickup ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:16px;">
          <tr>
            <td style="font-size:9px;letter-spacing:0.15em;color:${MUTED};text-transform:uppercase;padding-bottom:6px;">PICKUP ADDRESS</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:${GREEN};">Székely Mihály u. 4, 1061 Budapest</td>
          </tr>
        </table>` : ''}

      </td>
    </tr>
  `)

  return {
    subject: isPickup
      ? `Your order is ready for pickup — ${order.order_number}`
      : `Your order is on its way — ${order.order_number}`,
    html,
  }
}

// ─── Template: Low Stock Alert (to admin) ─────────────────────────────────────
function tplLowStock(products: Array<{ name: string; sku: string; stock: number }>): { subject: string; html: string } {
  const rows = products.map(p => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:${GREEN};border-bottom:1px solid #f0ede9;">${p.name}</td>
      <td style="padding:8px 0;font-size:13px;color:${MUTED};border-bottom:1px solid #f0ede9;">${p.sku || '—'}</td>
      <td style="padding:8px 0;font-size:13px;color:#e53935;font-weight:600;text-align:right;border-bottom:1px solid #f0ede9;">${p.stock} left</td>
    </tr>`).join('')

  const html = shell(`
    <tr>
      <td style="background:#fff;padding:32px;border:1px solid #e8e4df;">

        <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;color:#e53935;text-transform:uppercase;">Stock Alert</p>
        <h1 style="margin:0 0 24px;font-size:22px;font-weight:300;letter-spacing:0.1em;color:${GREEN};text-transform:uppercase;">
          Low Stock Warning
        </h1>

        <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:${GREEN};">
          The following ${products.length === 1 ? 'product has' : `${products.length} products have`}
          fallen below 5 units. Please restock soon.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <th style="text-align:left;font-size:9px;letter-spacing:0.15em;color:${MUTED};text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #ddd;">Product</th>
            <th style="text-align:left;font-size:9px;letter-spacing:0.15em;color:${MUTED};text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #ddd;">SKU</th>
            <th style="text-align:right;font-size:9px;letter-spacing:0.15em;color:${MUTED};text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #ddd;">Stock</th>
          </tr>
          ${rows}
        </table>

      </td>
    </tr>
  `)

  return {
    subject: `⚠️ Low stock alert — ${products.length} product${products.length > 1 ? 's' : ''} need restocking`,
    html,
  }
}

// ─── Resend sender ────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey  = Deno.env.get('RESEND_API_KEY')
  const from    = Deno.env.get('RESEND_FROM') ?? 'Zielinski & Rozen <orders@zielinski-rozen.hu>'

  if (!apiKey) throw new Error('RESEND_API_KEY not set')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { type, order_id, products } = await req.json() as {
      type: EmailType
      order_id?: string
      products?: Array<{ name: string; sku: string; stock: number }>
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── order_confirmed ───────────────────────────────────────────────────────
    if (type === 'order_confirmed' || type === 'order_shipped') {
      if (!order_id) return new Response(JSON.stringify({ error: 'order_id required' }), { status: 400, headers: CORS })

      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single()

      if (error || !order) {
        console.error('[send-email] Order not found:', order_id)
        return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: CORS })
      }

      if (!order.customer_email) {
        console.log('[send-email] No customer email for order', order.order_number)
        return new Response(JSON.stringify({ skipped: 'no customer email' }), { headers: CORS })
      }

      const { subject, html } = type === 'order_confirmed'
        ? tplOrderConfirmed(order as Order)
        : tplOrderShipped(order as Order)

      await sendEmail(order.customer_email, subject, html)

      // Also notify admin on new order
      const adminEmail = Deno.env.get('ADMIN_EMAIL')
      if (type === 'order_confirmed' && adminEmail) {
        await sendEmail(
          adminEmail,
          `New order ${order.order_number} — €${(order.total ?? 0).toFixed(2)}`,
          tplOrderConfirmed(order as Order).html,
        )
      }

      console.log(`[send-email] Sent ${type} for order ${order.order_number}`)
      return new Response(JSON.stringify({ sent: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    // ── low_stock_alert ───────────────────────────────────────────────────────
    if (type === 'low_stock_alert') {
      const adminEmail = Deno.env.get('ADMIN_EMAIL')
      if (!adminEmail) return new Response(JSON.stringify({ error: 'ADMIN_EMAIL not set' }), { status: 500, headers: CORS })

      let lowStockProducts = products

      // If no products passed, fetch from DB
      if (!lowStockProducts || lowStockProducts.length === 0) {
        const { data } = await supabase
          .from('products')
          .select('name, sku, stock')
          .gt('stock', 0)
          .lt('stock', 5)
          .eq('is_active', true)

        lowStockProducts = data ?? []
      }

      if (lowStockProducts.length === 0) {
        return new Response(JSON.stringify({ skipped: 'no low stock products' }), { headers: CORS })
      }

      const { subject, html } = tplLowStock(lowStockProducts)
      await sendEmail(adminEmail, subject, html)

      console.log(`[send-email] Sent low_stock_alert for ${lowStockProducts.length} products`)
      return new Response(JSON.stringify({ sent: true, count: lowStockProducts.length }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), { status: 400, headers: CORS })

  } catch (err) {
    console.error('[send-email] Error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
