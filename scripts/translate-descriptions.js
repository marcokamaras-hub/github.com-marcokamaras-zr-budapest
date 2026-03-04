#!/usr/bin/env node
/**
 * Translates all product descriptions (EN → HU) via the free MyMemory API
 * and writes the results back to Supabase description_hu column.
 *
 * Usage: node scripts/translate-descriptions.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env       = readFileSync(resolve(__dirname, '../.env'), 'utf8')
const get       = key => { const m = env.match(new RegExp(`^${key}=(.+)$`, 'm')); return m?.[1]?.trim() }

const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

// ── Translation helper (MyMemory free API, ~10k words/day with email) ──────────
async function translateToHU(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|hu&de=contact@zrbudapest.store`
  const res  = await fetch(url)
  const json = await res.json()
  if (json.responseStatus !== 200) throw new Error(`Translation failed: ${json.responseDetails}`)
  return json.responseData.translatedText
}

// ── Sleep helper for rate limiting ────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('🌍  ZR Budapest — Translating descriptions EN → HU')
console.log('━'.repeat(50))

const { data: products, error } = await supabase
  .from('products')
  .select('id, name, description, description_hu')

if (error) { console.error('Supabase error:', error.message); process.exit(1) }

// Deduplicate — only translate each unique description once
const uniqueMap = new Map()
for (const p of products) {
  if (p.description && !uniqueMap.has(p.description)) {
    uniqueMap.set(p.description, null)
  }
}

const uniqueDescriptions = [...uniqueMap.keys()]
console.log(`Found ${uniqueDescriptions.length} unique descriptions to translate\n`)

let done = 0
for (const desc of uniqueDescriptions) {
  try {
    process.stdout.write(`[${++done}/${uniqueDescriptions.length}] Translating… `)
    const hu = await translateToHU(desc)
    uniqueMap.set(desc, hu)
    console.log('✓')
    await sleep(300) // be polite to the free API
  } catch (err) {
    console.log(`✗ (${err.message}) — keeping EN`)
    uniqueMap.set(desc, desc) // fallback: keep English
  }
}

// ── Push to Supabase ──────────────────────────────────────────────────────────
console.log('\nWriting translations to Supabase…')

let updated = 0
for (const product of products) {
  const hu = uniqueMap.get(product.description)
  if (!hu) continue

  const { error } = await supabase
    .from('products')
    .update({ description_hu: hu })
    .eq('id', product.id)

  if (error) {
    console.error(`  ✗ ${product.name}: ${error.message}`)
  } else {
    updated++
  }
}

console.log(`\n✅  Done — ${updated} products updated with Hungarian descriptions`)
