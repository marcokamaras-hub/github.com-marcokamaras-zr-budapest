import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/utils'

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (!orderId) return
    supabase.from('orders').select('*').eq('id', orderId).single()
      .then(({ data }) => setOrder(data))
  }, [orderId])

  return (
    <div className="min-h-screen bg-[#F5F3F0] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Checkmark */}
        <div className="w-16 h-16 rounded-full bg-[#3D4F3D] flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>

        <div>
          <p className="text-[10px] tracking-[0.3em] text-[#3D4F3D]/50 uppercase mb-2">Thank You</p>
          <h1 className="text-2xl text-[#3D4F3D] font-light tracking-wide">Order Received</h1>
          {order?.order_number && (
            <p className="text-xs text-[#3D4F3D]/60 mt-1 tracking-widest">#{order.order_number}</p>
          )}
        </div>

        {order && (
          <div className="border border-[#3D4F3D]/10 p-5 text-left space-y-3">
            <div className="flex justify-between text-xs text-[#3D4F3D]">
              <span className="tracking-widest text-[10px] text-[#3D4F3D]/50 uppercase">Delivery</span>
              <span>{order.delivery_method === 'pickup' ? 'Store Pickup' : 'Delivery'} · {order.delivery_date}</span>
            </div>
            {order.items && JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items)).map((item, i) => (
              <div key={i} className="flex justify-between text-xs text-[#3D4F3D]">
                <span>{item.product_name || item.name} × {item.quantity}</span>
                <span>€{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-[#3D4F3D]/10 pt-2 flex justify-between text-sm text-[#3D4F3D] font-medium">
              <span>Total</span>
              <span>€{order.total?.toFixed(2)}</span>
            </div>
          </div>
        )}

        <p className="text-xs text-[#3D4F3D]/60 leading-relaxed">
          A confirmation has been sent to {order?.customer_email || 'your email'}. We'll be in touch shortly.
        </p>

        <button
          onClick={() => navigate('/')}
          style={{ touchAction: 'manipulation' }}
          className="w-full border border-[#3D4F3D] text-[#3D4F3D] text-xs tracking-[0.2em] py-3 hover:bg-[#3D4F3D] hover:text-white transition-all"
        >
          CONTINUE SHOPPING
        </button>
      </div>
    </div>
  )
}
