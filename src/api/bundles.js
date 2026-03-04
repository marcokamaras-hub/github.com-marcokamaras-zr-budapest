import { supabase } from '@/lib/supabaseClient'
import { getSessionId } from '@/lib/sessionId'

/** Fetch bundles for the current session */
export async function fetchBundles() {
  const sessionId = getSessionId()

  const { data, error } = await supabase
    .from('bundles')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/** Save a new bundle */
export async function createBundle(bundleData) {
  const sessionId = getSessionId()

  const { data, error } = await supabase
    .from('bundles')
    .insert({
      ...bundleData,
      session_id: sessionId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/** Delete a bundle */
export async function deleteBundle(id) {
  const { error } = await supabase
    .from('bundles')
    .delete()
    .eq('id', id)

  if (error) throw error
}
