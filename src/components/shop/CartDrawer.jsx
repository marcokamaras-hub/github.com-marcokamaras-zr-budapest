import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Minus, Plus, X, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice } from '@/lib/utils'
import { useT } from '@/lib/i18n'

export default function CartDrawer({ open, onClose, cart, onUpdateQuantity, onRemoveItem, onCheckout, currency }) {
  const t = useT()

  const subtotal      = cart.reduce((s, item) => s + item.price * item.quantity, 0)
  const deliveryFee   = subtotal >= 100 ? 0 : 5.99
  const total         = subtotal + deliveryFee
  const totalQty      = cart.reduce((s, item) => s + item.quantity, 0)
  const freeDeliveryPct = Math.min((subtotal / 100) * 100, 100)

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-[#F5F3F0] border-none p-0">
        <SheetHeader className="p-6 border-b border-[#3D4F3D]/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-[#3D4F3D] text-xs tracking-[0.2em]">
              {t('shopping_bag', totalQty)}
            </SheetTitle>
            <button onClick={() => onClose(false)} className="text-[#3D4F3D]/60 hover:text-[#3D4F3D]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <ShoppingBag className="w-12 h-12 text-[#3D4F3D]/20 mb-4" />
            <p className="text-[#3D4F3D]/60 text-sm tracking-wider">{t('bag_empty')}</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                <AnimatePresence>
                  {cart.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-4"
                    >
                      <div className="w-20 h-24 bg-[#E8E4DF] flex-shrink-0">
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><div className="w-8 h-10 bg-[#3D4F3D]/10" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] text-[#3D4F3D]/50 tracking-wider uppercase mb-1">{item.category}</p>
                            <h4 className="text-[#3D4F3D] text-sm tracking-wide uppercase line-clamp-2">
                              {item.name?.replace(item.category, '').replace(`(${item.size})`, '').trim()}
                            </h4>
                            {item.size && <p className="text-[10px] text-[#3D4F3D]/50 tracking-wider mt-0.5">{item.size}</p>}
                          </div>
                          <button onClick={() => onRemoveItem(item.id)} className="text-[#3D4F3D]/40 hover:text-[#3D4F3D]">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border border-[#3D4F3D]/20">
                            <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="p-2 text-[#3D4F3D]/60 hover:text-[#3D4F3D]">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm text-[#3D4F3D]">{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="p-2 text-[#3D4F3D]/60 hover:text-[#3D4F3D]">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[#3D4F3D] text-sm">{formatPrice(item.price * item.quantity, currency)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            <div className="p-6 border-t border-[#3D4F3D]/10 space-y-4 bg-white">
              {/* Free delivery progress */}
              {subtotal < 100 && subtotal > 0 && (
                <div className="space-y-1.5">
                  <div className="w-full h-0.5 bg-[#3D4F3D]/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3D4F3D] transition-all duration-500"
                      style={{ width: `${freeDeliveryPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#3D4F3D]/50 tracking-wider">
                    {t('away_free', formatPrice(100 - subtotal, currency))}
                  </p>
                </div>
              )}
              {subtotal >= 100 && (
                <p className="text-[10px] text-[#3D4F3D] tracking-wider">{t('free_unlocked')}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#3D4F3D]/70">
                  <span className="tracking-wider">{t('subtotal')}</span>
                  <span>{formatPrice(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-[#3D4F3D]/70">
                  <span className="tracking-wider">{t('delivery')}</span>
                  <span>{deliveryFee === 0 ? t('free') : formatPrice(deliveryFee, currency)}</span>
                </div>
              </div>
              <Separator className="bg-[#3D4F3D]/10" />
              <div className="flex justify-between text-[#3D4F3D] font-medium">
                <span className="tracking-wider">{t('total')}</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
              <Button
                className="w-full bg-[#3D4F3D] hover:bg-[#2D3F2D] text-white text-xs tracking-[0.2em] h-12 rounded-none"
                onClick={onCheckout}
              >
                {t('checkout')}
              </Button>
              <p className="text-[10px] text-center text-[#3D4F3D]/40 tracking-wider">{t('secure_payment')}</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
