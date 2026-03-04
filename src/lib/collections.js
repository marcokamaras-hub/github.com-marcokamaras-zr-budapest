// ─── Shop collection groups ────────────────────────────────────────────────
// Each group maps a user-facing label key to a product match function.
// Used in the FilterPanel (replaces the old size filter) and in Shop.jsx filtering.

export const COLLECTIONS = [
  {
    key: 'perfume',
    // All 50ml and 10ml perfumes
    match: p => p.category === 'Perfume' && ['50ml', '10ml'].includes(p.size),
  },
  {
    key: 'home_scent',
    // Diffusers (all sizes), liquid soap / hand soap, candles
    match: p => ['Diffuser', 'Candle', 'Liquid soap'].includes(p.category),
  },
  {
    key: 'body',
    // Body cream/lotion, shower gel, body oil, body butter, body scrub, antiperspirant
    match: p => ['Body cream', 'Shower gel', 'Body oil', 'Body scrub', 'Body Butter', 'Antiperspirant roll-on'].includes(p.category),
  },
  {
    key: 'hands',
    // Hand cream, solid soap, liquid soap, hand cleansing gel/spray
    match: p => ['Hand cream', 'Solid soap', 'Liquid soap', 'Hand Cleansing Gel', 'Hand Cleansing Spray'].includes(p.category),
  },
  {
    key: 'self_care',
    // Candles, dead sea salt, diffusers
    match: p => ['Candle', 'Dead sea salt', 'Diffuser'].includes(p.category),
  },
  {
    key: 'hair',
    // Shampoo, conditioner, all hair masks, hair serum, cream for curly hair
    match: p => ['Shampoo', 'Hair conditioner', 'Keratin hair mask', 'Hair Mask Blond Care', 'Hair Mask Damaged Hair', 'Hair Serum', 'Cream For Curly Hair'].includes(p.category),
  },
  {
    key: 'travel',
    // All travel size products
    match: p => p.category === 'Travel size',
  },
]

/**
 * Returns true if product belongs to at least one of the selected collection keys.
 * Returns true when no collections are selected (no restriction).
 */
export function matchesCollections(product, selectedCollections) {
  if (!selectedCollections || selectedCollections.length === 0) return true
  return COLLECTIONS
    .filter(c => selectedCollections.includes(c.key))
    .some(c => c.match(product))
}
