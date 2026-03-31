import { supabase } from '@/lib/supabaseClient'
import { getSessionId } from '@/lib/sessionId'
import { generateOrderNumber } from '@/lib/utils'

/** Create a new order */
export async function createOrder(orderData) {
  // Append gift wrap / gift message info to notes (avoids DB migration)
  const notesWithGift = [
    orderData.notes,
    orderData.gift_wrap ? 'GIFT WRAPPED' : '',
    orderData.gift_message ? `Gift message: ${orderData.gift_message}` : '',
  ].filter(Boolean).join('\n')

  const { gift_wrap, gift_message, ...rest } = orderData

  const payload = {
    ...rest,
    notes: notesWithGift || undefined,
    order_number: generateOrderNumber(),
    session_id: getSessionId(),
    status: 'pending',
    payment_status: 'unpaid',
  }

  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Fetch orders for the current session (customer "my orders") */
export async function fetchMyOrders() {
  const sessionId = getSessionId()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/** Fetch all orders (admin) */
export async function fetchAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) throw error
  return data
}

/** Update order status (admin) */
export async function updateOrder(id, updates) {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
