#!/usr/bin/env node
/**
 * ZR Budapest — Product importer
 * Fetches all products from zielinskiandrozen.com Shopify JSON API
 * and upserts them into the Supabase `products` table.
 *
 * Usage:
 *   node scripts/import-products.js
 *
 * Requires .env with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Load .env manually (no dotenv dependency needed) ─────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath   = resolve(__dirname, '../.env')
const env       = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
)

const SUPABASE_URL      = env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  console.error('    Add SUPABASE_SERVICE_ROLE_KEY to your .env file (from Supabase dashboard → Settings → API)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ── Category mapping: Shopify product_type → our category names ───────────────
const CATEGORY_MAP = {
  'Hand Cream':         'Hand cream',
  'Body Cream':         'Body cream',
  'Body Lotion':        'Body cream',
  'Body Scrub':         'Body scrub',
  'Body Oil':           'Body oil',
  'Shower Gel':         'Shower gel',
  'Shampoo':            'Shampoo',
  'Hair Conditioner':   'Hair conditioner',
  'Keratin Hair Mask':  'Keratin hair mask',
  'Dead Sea Salt':      'Dead sea salt',
  'Liquid Soap':        'Liquid soap',
  'Solid Soap':         'Solid soap',
  'Candle':             'Candle',
  'Diffuser':           'Diffuser',
  'Perfume':            'Perfume',
  'Eau de Parfum':      'Perfume',
  'Fragrance':          'Perfume',
  'Gift Set':           'Giftbox',
  'Gift Box':           'Giftbox',
  'Giftbox':            'Giftbox',
}

function mapCategory(productType) {
  if (!productType) return 'Other'
  // Exact match first
  if (CATEGORY_MAP[productType]) return CATEGORY_MAP[productType]
  // Partial match
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (productType.toLowerCase().includes(key.toLowerCase())) return val
  }
  return productType // keep original if no match
}

// ── Extract size from tags or title (e.g. "50ml", "100ml", "200ml") ───────────
function extractSize(tags = [], title = '') {
  const sizeRe = /\b(\d+\s*ml|\d+\s*g|\d+\s*cl)\b/i
  for (const tag of tags) {
    const m = tag.match(sizeRe)
    if (m) return m[1].replace(/\s+/, '')
  }
  const m = title.match(sizeRe)
  return m ? m[1].replace(/\s+/, '') : ''
}

// ── Fetch all products from Shopify JSON API (paginated) ─────────────────────
async function fetchAllProducts() {
  const all   = []
  let page    = 1
  const limit = 250

  while (true) {
    const url = `https://zielinskiandrozen.com/products.json?limit=${limit}&page=${page}`
    console.log(`  Fetching page ${page}…  (${url})`)

    const res  = await fetch(url)
    const data = await res.json()

    if (!data.products || data.products.length === 0) break
    all.push(...data.products)
    console.log(`  → got ${data.products.length} products (total so far: ${all.length})`)

    if (data.products.length < limit) break
    page++

    // polite delay between pages
    await new Promise(r => setTimeout(r, 500))
  }

  return all
}

// ── Map Shopify product → our DB schema ───────────────────────────────────────
function mapProduct(p) {
  const variant = p.variants?.[0] ?? {}
  const image   = p.images?.[0]?.src ?? null

  return {
    name:         p.title,
    sku:          variant.sku || null,
    ean:          variant.barcode || null,
    price:        parseFloat(variant.price) || 0,
    stock:        variant.inventory_quantity ?? 0,
    category:     mapCategory(p.product_type),
    size:         extractSize(p.tags, p.title),
    description:  p.body_html?.replace(/<[^>]+>/g, '').trim() || null,  // strip HTML tags
    description_hu: null,
    image_url:    image,
    is_active:    p.status !== 'archived',
    lightspeed_id: null,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🛍️  ZR Budapest — Product Importer')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 1. Fetch from Shopify
  console.log('📦  Fetching products from zielinskiandrozen.com…')
  const shopifyProducts = await fetchAllProducts()
  console.log(`\n✓  Found ${shopifyProducts.length} products total\n`)

  // 2. Map to our schema
  const mapped = shopifyProducts.map(mapProduct)

  // 3. Show preview
  const byCategory = {}
  for (const p of mapped) {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1
  }
  console.log('📊  Category breakdown:')
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cat.padEnd(22)} ${count}`)
  }

  // 4. Upsert into Supabase in batches of 50
  console.log(`\n⬆️   Upserting ${mapped.length} products into Supabase…`)
  const batchSize = 50
  let inserted = 0, errors = 0

  for (let i = 0; i < mapped.length; i += batchSize) {
    const batch = mapped.slice(i, i + batchSize)
    const { error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'sku', ignoreDuplicates: false })

    if (error) {
      console.error(`  ❌  Batch ${Math.floor(i / batchSize) + 1} error:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
      process.stdout.write(`  ✓  ${inserted}/${mapped.length}\r`)
    }
  }

  console.log(`\n\n✅  Done! ${inserted} products imported, ${errors} errors.`)
  console.log(`\n👉  Visit https://zr-budapest.vercel.app to see your products live.\n`)
}

main().catch(err => {
  console.error('\n❌  Fatal error:', err.message)
  process.exit(1)
})
