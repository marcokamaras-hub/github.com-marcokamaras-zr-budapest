const SUPABASE_URL = 'https://mbbxrfjgqvximrbumbop.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

function stripHtml(html) {
  if (!html) return null
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || null
}

async function main() {
  console.log('⏳ Fetching travel size products from Shopify…')

  const resp = await fetch(
    'https://zielinskiandrozen.com/collections/travel-size/products.json?limit=250'
  )
  if (!resp.ok) throw new Error(`Shopify fetch failed: ${resp.status}`)
  const { products } = await resp.json()

  console.log(`📦 Got ${products.length} products from Shopify`)

  const rows = products.map(p => {
    // Pick first variant for price/sku/stock
    const v = p.variants[0] || {}
    const image = p.images[0]?.src || null

    // Size: use variant title if it's not just "Default Title"
    const size =
      v.title && v.title !== 'Default Title' ? v.title : null

    // Stock: public API gives inventory_quantity on variants when accessible,
    // but reliably gives `available` boolean
    const stock = v.available ? (v.inventory_quantity > 0 ? v.inventory_quantity : 10) : 0

    const price = parseFloat(v.price) || 0

    return {
      name: p.title,
      sku:  null,  // Travel size SKUs conflict with main line; tracked by category only
      ean:  v.barcode || null,
      price,
      stock,
      category: 'Travel size',
      size,
      description:    stripHtml(p.body_html),
      description_hu: null,
      image_url:      image,
      is_active:      true,
      lightspeed_id:  null,
    }
  })

  // Preview first 3
  console.log('\nSample rows:')
  rows.slice(0, 3).forEach(r =>
    console.log(`  • ${r.name} | ${r.size} | €${r.price} | stock:${r.stock}`)
  )

  // Insert into Supabase
  console.log(`\n⬆️  Inserting ${rows.length} rows into Supabase…`)
  const insResp = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      apikey:          SUPABASE_KEY,
      Authorization:   `Bearer ${SUPABASE_KEY}`,
      Prefer:          'return=representation',
    },
    body: JSON.stringify(rows),
  })

  const text = await insResp.text()
  if (!insResp.ok) {
    console.error('❌ Insert failed:', insResp.status, text)
    process.exit(1)
  }

  const inserted = JSON.parse(text)
  console.log(`✅ Inserted ${inserted.length} travel size products`)
  console.log('   IDs:', inserted.map(r => r.id).join(', '))
}

main().catch(err => { console.error(err); process.exit(1) })
