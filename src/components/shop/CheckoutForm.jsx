import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle, Store, Truck, Calendar, CreditCard, ArrowLeft } from 'lucide-react'
import { format, addDays, nextTuesday, nextFriday } from 'date-fns'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createOrder } from '@/api/orders'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/utils'
import { useT } from '@/lib/i18n'

// ── Delivery date helpers ────────────────────────────────────────────────────
function getDeliveryDates() {
  const today = new Date()
  let tue = nextTuesday(today)
  let fri = nextFriday(today)
  if (tue <= today) tue = addDays(tue, 7)
  if (fri <= today) fri = addDays(fri, 7)
  return { tuesday: tue, friday: fri }
}

// ── Load Revolut embed script once ──────────────────────────────────────────
function useRevolutScript() {
  const [ready, setReady] = useState(!!window.RevolutCheckout)
  useEffect(() => {
    if (window.RevolutCheckout) { setReady(true); return }
    const s = document.createElement('script')
    const revolutEnv = import.meta.env.VITE_REVOLUT_ENV
    s.src = revolutEnv === 'sandbox'
      ? 'https://sandbox-merchant.revolut.com/embed.js'
      : 'https://merchant.revolut.com/embed.js'
    s.async = true
    s.onload = () => setReady(true)
    s.onerror = () => { /* Revolut embed script failed to load */ }
    document.head.appendChild(s)
  }, [])
  return ready
}

// ── Steps ────────────────────────────────────────────────────────────────────
// 'form'    → customer fills in details
// 'paying'  → Revolut widget is being prepared / displayed
// 'success' → payment done

export default function CheckoutForm({ open, onClose, cart, currency, onOrderSuccess, orderSuccess }) {
  const t = useT()
  const revolutScriptReady = useRevolutScript()

  const [step, setStep]                 = useState('form')  // 'form' | 'paying' | 'success'
  const [deliveryMethod, setDeliveryMethod] = useState('delivery')
  const [deliveryDate, setDeliveryDate]     = useState('')
  const [formData, setFormData] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    delivery_address: '', delivery_city: '', delivery_postal_code: '', notes: '',
  })
  const [createdOrderId, setCreatedOrderId] = useState(null)
  const revolutInstanceRef = useRef(null)

  const dates      = getDeliveryDates()
  const subtotal   = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const deliveryFee = deliveryMethod === 'pickup' ? 0 : (subtotal >= 100 ? 0 : 5.99)
  const total      = subtotal + deliveryFee
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)

  const set = patch => setFormData(prev => ({ ...prev, ...patch }))

  // ── Reset when dialog closes ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setStep('form')
      setCreatedOrderId(null)
      setDeliveryDate('')
      setFormData({
        customer_name: '', customer_email: '', customer_phone: '',
        delivery_address: '', delivery_city: '', delivery_postal_code: '', notes: '',
      })
      // Destroy any lingering Revolut widget instance
      if (revolutInstanceRef.current) {
        try { revolutInstanceRef.current.destroy() } catch (_) {}
        revolutInstanceRef.current = null
      }
    }
  }, [open])

  // ── Step 1: create Supabase order → call Edge Fn → open Revolut ──────────
  const createAndPay = useMutation({
    mutationFn: async () => {
      // 1a. Create the order record (unpaid)
      const order = await createOrder({
        ...formData,
        delivery_method:      deliveryMethod,
        delivery_date:        deliveryDate,
        delivery_address:     deliveryMethod === 'pickup' ? 'Székely Mihály u. 4, 1061 Budapest' : formData.delivery_address,
        delivery_city:        deliveryMethod === 'pickup' ? 'Budapest' : formData.delivery_city,
        delivery_postal_code: deliveryMethod === 'pickup' ? '1061' : formData.delivery_postal_code,
        items: cart.map(item => ({
          product_id:   item.id,
          product_name: item.name,
          quantity:     item.quantity,
          price:        item.price,
        })),
        subtotal,
        delivery_fee: deliveryFee,
        total,
        currency: 'EUR',  // Revolut always in EUR; HUF display is cosmetic
      })

      setCreatedOrderId(order.id)

      // 1b. Create Revolut order via Edge Function
      const { data, error } = await supabase.functions.invoke('create-revolut-order', {
        body: {
          order_id:       order.id,
          amount_eur:     total,
          customer_email: formData.customer_email || undefined,
        },
      })

      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)
      if (!data?.public_id) throw new Error('No public_id returned from Revolut')

      return { order, public_id: data.public_id }
    },

    onSuccess: async ({ public_id }) => {
      setStep('paying')

      // 2. Wait for Revolut script then open the payment popup
      const launchWidget = () => {
        window.RevolutCheckout(public_id).then(instance => {
          revolutInstanceRef.current = instance
          instance.payWithPopup({
            onSuccess() {
              revolutInstanceRef.current = null
              setStep('success')
              onOrderSuccess()
              toast.success('Payment successful!', {
                style: { background: '#3D4F3D', color: 'white', border: 'none' },
              })
            },
            onError(message) {
              revolutInstanceRef.current = null
              toast.error(`Payment failed: ${message}`)
              setStep('form')
            },
            onCancel() {
              revolutInstanceRef.current = null
              toast('Payment cancelled', { icon: '↩' })
              setStep('form')
            },
          })
        }).catch(err => {
          toast.error(`Could not open payment: ${err.message}`)
          setStep('form')
        })
      }

      // Revolut script may load async — poll until ready
      if (window.RevolutCheckout) {
        launchWidget()
      } else {
        const poll = setInterval(() => {
          if (window.RevolutCheckout) { clearInterval(poll); launchWidget() }
        }, 200)
        setTimeout(() => {
          clearInterval(poll)
          if (!window.RevolutCheckout) {
            toast.error('Could not load Revolut Pay. Please refresh and try again.')
            setStep('form')
          }
        }, 10000)
      }
    },

    onError: err => {
      toast.error(`Could not process order: ${err.message}`)
      setStep('form')
    },
  })

  const handleSubmit = e => {
    e.preventDefault()
    if (!deliveryDate) return toast.error('Please select a date')
    if (deliveryMethod === 'delivery' && !formData.delivery_address) {
      return toast.error('Please enter a delivery address')
    }
    createAndPay.mutate()
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (orderSuccess || step === 'success') {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-[#F5F3F0] border-none rounded-none">
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 border border-[#3D4F3D] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-[#3D4F3D]" />
            </div>
            <p className="text-[10px] text-[#3D4F3D]/60 tracking-[0.2em]">{t('thank_you')}</p>
            <h3 className="text-xl text-[#3D4F3D] tracking-wider">{t('order_confirmed')}</h3>
            <p className="text-[#3D4F3D]/60 text-sm tracking-wide">
              {t('payment_received')}
            </p>
            <Button
              onClick={onClose}
              className="bg-[#3D4F3D] hover:bg-[#2D3F2D] text-white text-xs tracking-[0.2em] px-8 h-12 rounded-none mt-4"
            >
              {t('continue_shopping')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ── Paying screen (Revolut widget opened in popup) ───────────────────────
  if (step === 'paying') {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-[#F5F3F0] border-none rounded-none">
          <div className="text-center py-12 space-y-5">
            <Loader2 className="w-10 h-10 animate-spin text-[#3D4F3D] mx-auto" />
            <h3 className="text-sm text-[#3D4F3D] tracking-[0.2em]">{t('revolut_opening')}</h3>
            <p className="text-xs text-[#3D4F3D]/50">{t('complete_popup')}</p>
            <button
              onClick={() => setStep('form')}
              className="text-xs text-[#3D4F3D]/40 underline hover:text-[#3D4F3D]/60 mt-4"
            >
              {t('back_to_order')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ── Checkout form ────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#F5F3F0] border-none rounded-none">
        <DialogHeader className="pb-4 border-b border-[#3D4F3D]/10">
          <DialogTitle className="text-[#3D4F3D] text-xs tracking-[0.2em]">{t('delivery_details')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">

          {/* Delivery method */}
          <div className="space-y-3">
            <Label className="text-[10px] text-[#3D4F3D]/70 tracking-wider">{t('delivery_method')}</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'delivery', icon: Truck, titleKey: 'delivery_label', subKey: 'delivery_sub' },
                { value: 'pickup',   icon: Store,  titleKey: 'pickup_label',   subKey: 'pickup_sub' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setDeliveryMethod(opt.value)}
                  className={`flex items-center gap-3 p-4 border w-full text-left transition-all ${
                    deliveryMethod === opt.value
                      ? 'border-[#3D4F3D] bg-[#3D4F3D]/5'
                      : 'border-[#3D4F3D]/20 hover:border-[#3D4F3D]/40'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    deliveryMethod === opt.value ? 'border-[#3D4F3D]' : 'border-[#3D4F3D]/40'
                  }`}>
                    {deliveryMethod === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-[#3D4F3D]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <opt.icon className="w-4 h-4 text-[#3D4F3D]" />
                      <span className="text-xs tracking-wider text-[#3D4F3D]">{t(opt.titleKey)}</span>
                    </div>
                    <p className="text-[10px] text-[#3D4F3D]/50 mt-1">{t(opt.subKey)}</p>
                  </div>
                </button>
              ))}
            </div>
            {deliveryMethod === 'pickup' && (
              <div className="bg-white p-3 border border-[#3D4F3D]/10">
                <p className="text-[10px] text-[#3D4F3D]/70 tracking-wider mb-1">{t('pickup_location')}</p>
                <p className="text-sm text-[#3D4F3D]">{t('budapest_store')}</p>
                <p className="text-xs text-[#3D4F3D]/60">Székely Mihály u. 4, 1061 Budapest</p>
                <p className="text-xs text-[#3D4F3D]/60 mt-1">{t('pickup_note')}</p>
              </div>
            )}
          </div>

          {/* Date selection */}
          <div className="space-y-3">
            <Label className="text-[10px] text-[#3D4F3D]/70 tracking-wider flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              {deliveryMethod === 'pickup' ? t('pickup_date') : t('delivery_date')}
            </Label>
            <Select value={deliveryDate} onValueChange={setDeliveryDate}>
              <SelectTrigger className="bg-white border-[#3D4F3D]/20 rounded-none h-11 text-[#3D4F3D] focus:border-[#3D4F3D] focus:ring-0">
                <SelectValue placeholder={t('select_date')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={format(dates.tuesday, 'yyyy-MM-dd')}>
                  Tuesday, {format(dates.tuesday, 'MMMM d')}
                </SelectItem>
                <SelectItem value={format(dates.friday, 'yyyy-MM-dd')}>
                  Friday, {format(dates.friday, 'MMMM d')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-[#3D4F3D]/10" />

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-[10px] text-[#3D4F3D]/70 tracking-wider">{t('full_name')}</Label>
              <Input required value={formData.customer_name} onChange={e => set({ customer_name: e.target.value })}
                className="mt-2 bg-white border-[#3D4F3D]/20 rounded-none h-11 text-[#3D4F3D] focus:border-[#3D4F3D] focus:ring-0" />
            </div>
            <div>
              <Label className="text-[10px] text-[#3D4F3D]/70 tracking-wider">{t('phone')}</Label>
              <Input type="tel" required value={formData.customer_phone} onChange={e => set({ customer_phone: e.target.value })}
                className="mt-2 bg-white border-[#3D4F3D]/20 rounded-none h-11 text-[#3D4F3D] focus:border-[#3D4F3D] focus:ring-0" />
            </div>
            <div>
              <Label className="text-[10px] text-[#3D4F3D]/70 tracking-wider">{t('email')}</Label>
              <Input type="email" value={formData.customer_email} onChange={e => set({ customer_email: e.target.value })}
                className="mt-2 bg-white border-[#3D4F3D]/20 rounded-none h-11 text-[#3D4F3D] focus:border-[#3D4F3D] focus:ring-0" />
            </div>

            {deliveryMethod === 'delivery' && (
              <>
                <div className="col-span-2">
                  <Label className="text-[10px] text-[#3D4F3D]/70 tracking-wider">{t('delivery_address')}</Label>
                  <Input required value={formData.delivery_address} onChange={e => set({ delivery_address: e.target.value })}
                    className="mt-2 bg-white border-[#3D4F3D]/20 rounded-none h-11 text-[#3D4F3D] focus:border-[#3D4F3D] focus:ring-0" />
                </div>
                <div>
                  <Label className="text-[10px] text-[#3D4F3D]/70 tracking-wider">{t('city')}</Label>
                  <Input required value={formData.delivery_city} onChange={e => set({ delivery_city: e.target.value })}
                    className="mt-2 bg-white border-[#3D4F3D]/20 rounded-none h-11 text-[#3D4F3D] focus:border-[#3D4F3D] focus:ring-0" />
                </div>
                <div>
                  <Label className="text-[10px] text-[#3D4F3D]/70 tracking-wider">{t('postal_code')}</Label>
                  <Input required value={formData.delivery_postal_code} onChange={e => set({ delivery_postal_code: e.target.value })}
                    className="mt-2 bg-white border-[#3D4F3D]/20 rounded-none h-11 text-[#3D4F3D] focus:border-[#3D4F3D] focus:ring-0" />
                </div>
              </>
            )}

            <div className="col-span-2">
              <Label className="text-[10px] text-[#3D4F3D]/70 tracking-wider">{t('notes_opt')}</Label>
              <Textarea value={formData.notes} onChange={e => set({ notes: e.target.value })}
                className="mt-2 bg-white border-[#3D4F3D]/20 rounded-none text-[#3D4F3D] focus:border-[#3D4F3D] focus:ring-0 resize-none"
                rows={2} />
            </div>
          </div>

          <Separator className="bg-[#3D4F3D]/10" />

          {/* Order summary */}
          <div className="bg-white p-4 space-y-3">
            <div className="flex justify-between text-sm text-[#3D4F3D]/70">
              <span className="tracking-wider text-xs">{t('items_count', totalItems)}</span>
              <span>{formatPrice(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#3D4F3D]/70">
              <span className="tracking-wider text-xs">
                {deliveryMethod === 'pickup' ? t('pickup_label') : t('delivery_label')}
              </span>
              <span>{deliveryFee === 0 ? t('free') : formatPrice(deliveryFee, currency)}</span>
            </div>
            <Separator className="bg-[#3D4F3D]/10" />
            <div className="flex justify-between text-[#3D4F3D] font-medium">
              <span className="tracking-wider text-xs">{t('total')}</span>
              <span>{formatPrice(total, currency)}</span>
            </div>
          </div>

          {/* Submit → opens Revolut Pay */}
          <Button
            type="submit"
            className="w-full bg-[#3D4F3D] hover:bg-[#2D3F2D] h-12 rounded-none text-xs tracking-[0.2em] gap-2"
            disabled={createAndPay.isPending}
          >
            {createAndPay.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{t('preparing_payment')}</>
            ) : (
              <><CreditCard className="w-4 h-4" />{t('pay_revolut')}</>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2">
            <img
              src="https://assets.revolut.com/revolut-for-business/brand-kit/revolut-logo-dark.svg"
              alt="Revolut"
              className="h-4 opacity-30"
              onError={e => { e.target.style.display = 'none' }}
            />
            <p className="text-[10px] text-center text-[#3D4F3D]/40 tracking-wider">
              {t('secure_revolut')}
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
