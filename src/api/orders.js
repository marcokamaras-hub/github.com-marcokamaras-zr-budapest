import { supabase } from '@/lib/supabaseClient'
import { getSessionId } from '@/lib/sessionId'
import { generateOrderNumber } from '@/lib/utils'

/** Create a new order */
export async function createOrder(orderData) {
  const payload = {
    ...orderData,
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
