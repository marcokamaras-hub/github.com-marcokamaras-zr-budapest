import { supabase } from '@/lib/supabaseClient'
import { getSessionId } from '@/lib/sessionId'

/** Fetch wishlist items for the current session */
export async function fetchWishlist() {
  const sessionId = getSessionId()

  const { data, error } = await supabase
    .from('wishlists')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/** Add a product to the wishlist */
export async function addToWishlist(product) {
  const sessionId = getSessionId()

  const { data, error } = await supabase
    .from('wishlists')
    .insert({
      session_id:       sessionId,
      product_id:       product.id,
      product_name:     product.name,
      product_price:    product.price,
      product_image:    product.image_url,
      product_category: product.category,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/** Remove a product from the wishlist */
export async function removeFromWishlist(id) {
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('id', id)

  if (error) throw error
}
