import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Package, Clock, Truck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fetchMyOrders } from '@/api/orders'
import { formatPrice } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const STATUS_ICONS = {
  pending:   Clock,
  confirmed: AlertCircle,
  preparing: Package,
  shipped:   Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
}

const STATUS_COLORS = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  shipped:   'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function MyOrders() {
  const t = useT()
  const [currency, setCurrency] = useState('EUR')
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: fetchMyOrders,
  })

  return (
    <div className="min-h-screen bg-[#F5F3F0]">
      <header className="bg-[#3D4F3D] text-white">
        <div className="px-4 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm tracking-wider mb-4">
              <ArrowLeft className="w-4 h-4" /> {t('back_to_shop')}
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl tracking-[0.15em] font-light mb-2">{t('my_orders')}</h1>
                <p className="text-white/60 text-sm tracking-wider">{t('orders_count', orders.length)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {['EUR', 'HUF'].map(cur => (
                    <button
                      key={cur}
                      onClick={() => setCurrency(cur)}
                      className={`px-2 py-0.5 text-[10px] tracking-widest transition-colors ${
                        currency === cur ? 'text-white font-bold' : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
                <Package className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 bg-[#E8E4DF]" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-[#3D4F3D]/20 mx-auto mb-6" />
              <h2 className="text-xl text-[#3D4F3D] tracking-wider mb-3">{t('no_orders')}</h2>
              <p className="text-[#3D4F3D]/60 text-sm tracking-wider mb-8">{t('no_orders_hint')}</p>
              <Link to="/" className="inline-block bg-[#3D4F3D] hover:bg-[#2D3F2D] text-white text-xs tracking-[0.2em] px-8 py-3 transition-colors">
                {t('start_shopping')}
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => {
                const statusKey  = order.status || 'pending'
                const statusInfo = t(`status_${statusKey}`) || t('status_pending')
                const StatusIcon = STATUS_ICONS[statusKey] || Clock
                const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.pending
                return (
                  <div key={order.id} className="bg-white border border-[#3D4F3D]/10 overflow-hidden">
                    <div className="p-6 border-b border-[#3D4F3D]/10 bg-[#F9F8F6]">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs text-[#3D4F3D]/50 tracking-wider mb-1">{t('order_number')}</p>
                          <p className="text-lg font-medium text-[#3D4F3D] tracking-wide">{order.order_number}</p>
                          <p className="text-xs text-[#3D4F3D]/60 mt-1">
                            {order.created_at ? format(new Date(order.created_at), 'MMMM d, yyyy • HH:mm') : '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#3D4F3D]/50 tracking-wider mb-1">{t('total')}</p>
                          <p className="text-lg font-medium text-[#3D4F3D]">{formatPrice(order.total, currency)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="mb-6">
                        <Badge className={`${statusColor} border-0 px-3 py-1`}>
                          <StatusIcon className="w-4 h-4 mr-2" />
                          {statusInfo?.label || statusKey}
                        </Badge>
                        <p className="text-xs text-[#3D4F3D]/60 mt-2">{statusInfo?.desc}</p>
                      </div>
                      <div className="space-y-4 mb-6">
                        <p className="text-xs text-[#3D4F3D]/50 tracking-wider">{t('items_label')}</p>
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="w-16 h-20 bg-[#E8E4DF] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#3D4F3D] font-medium">{item.product_name}</p>
                              <p className="text-xs text-[#3D4F3D]/50 mt-1">{t('quantity', item.quantity)}</p>
                              <p className="text-sm text-[#3D4F3D] mt-1">{formatPrice(item.price * item.quantity, currency)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {order.delivery_method === 'delivery' && (
                        <div className="border-t border-[#3D4F3D]/10 pt-4">
                          <p className="text-xs text-[#3D4F3D]/50 tracking-wider mb-2">{t('delivery_addr')}</p>
                          <p className="text-sm text-[#3D4F3D]">{order.delivery_address}</p>
                          <p className="text-sm text-[#3D4F3D]">{order.delivery_city}, {order.delivery_postal_code}</p>
                        </div>
                      )}
                      {order.notes && (
                        <div className="border-t border-[#3D4F3D]/10 pt-4 mt-4">
                          <p className="text-xs text-[#3D4F3D]/50 tracking-wider mb-2">{t('notes_label')}</p>
                          <p className="text-sm text-[#3D4F3D]">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
