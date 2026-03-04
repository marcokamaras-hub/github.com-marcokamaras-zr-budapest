// Phase 3 — Lightspeed Retail stock sync
// Fetches inventory from Lightspeed and updates products.stock in Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // TODO Phase 3: refresh Lightspeed OAuth2 token if expired
  // TODO Phase 3: GET /API/Account/{id}/Item.json from Lightspeed
  // TODO Phase 3: match by SKU/EAN → upsert products.stock
  // TODO Phase 3: log result to sync_log table
  // TODO Phase 3: alert admin if any product stock < 5
  return new Response(JSON.stringify({ error: 'Not implemented yet — Phase 3' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 501,
  })
})
