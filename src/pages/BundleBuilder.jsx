import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Plus, Minus, X, Gift } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { fetchProducts } from '@/api/products'
import { createBundle } from '@/api/bundles'
import { formatPrice } from '@/lib/utils'
import { useT } from '@/lib/i18n'

export default function BundleBuilder() {
  const t = useT()
  const [selectedProducts, setSelectedProducts] = useState([])
  const [bundleName, setBundleName]             = useState('')
  const [searchQuery, setSearchQuery]           = useState('')
  const [currency, setCurrency]                 = useState('EUR')
  const qc = useQueryClient()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  const saveMutation = useMutation({
    mutationFn: createBundle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bundles'] })
      toast.success(t('toast_gift_saved'), { style: { background: '#3D4F3D', color: 'white', border: 'none' } })
      setSelectedProducts([])
      setBundleName('')
    },
  })

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) && p.stock > 0
  )

  const addProduct = product => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.product_id === product.id)
      if (existing) return prev.map(p => p.product_id === product.id ? { ...p, quantity: p.quantity + 1 } : p)
      return [...prev, { product_id: product.id, product_name: product.name, product_price: product.price, product_image: product.image_url, quantity: 1 }]
    })
    toast.success(t('toast_added_bag'), { style: { background: '#3D4F3D', color: 'white', border: 'none' } })
  }

  const updateQty = (productId, qty) => {
    if (qty <= 0) setSelectedProducts(prev => prev.filter(p => p.product_id !== productId))
    else setSelectedProducts(prev => prev.map(p => p.product_id === productId ? { ...p, quantity: qty } : p))
  }

  const subtotal   = selectedProducts.reduce((s, p) => s + p.product_price * p.quantity, 0)
  const discount   = selectedProducts.length >= 3 ? subtotal * 0.1 : 0
  const finalPrice = subtotal - discount
  const totalItems = selectedProducts.reduce((s, p) => s + p.quantity, 0)

  const handleSave = () => {
    if (!bundleName.trim())          return toast.error('Please enter a name for your gift set')
    if (selectedProducts.length === 0) return toast.error('Please add at least one product')
    saveMutation.mutate({ name: bundleName, products: selectedProducts, total_price: finalPrice, is_template: false })
  }

  return (
    <div className="min-h-screen bg-[#F5F3F0]">
      <header className="bg-[#3D4F3D] text-white">
        <div className="px-4 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm tracking-wider mb-4">
              <ArrowLeft className="w-4 h-4" /> {t('back_to_shop_link')}
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl tracking-[0.15em] font-light mb-2">{t('create_gift')}</h1>
                <p className="text-white/60 text-sm tracking-wider">{t('build_collection')}</p>
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
                <Gift className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">

          {/* Product picker */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 border border-[#3D4F3D]/10">
              <Input
                placeholder={t('search_products_ph')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full border-[#3D4F3D]/20 mb-6"
              />
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 bg-[#E8E4DF]" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="border border-[#3D4F3D]/10 p-3 hover:border-[#3D4F3D]/30 transition-colors">
                      <div className="aspect-square bg-[#E8E4DF] mb-3">
                        {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                      </div>
                      <p className="text-xs text-[#3D4F3D] mb-1 line-clamp-2">{product.name}</p>
                      <p className="text-sm font-medium text-[#3D4F3D] mb-2">{formatPrice(product.price, currency)}</p>
                      <Button onClick={() => addProduct(product)} size="sm" className="w-full bg-[#3D4F3D] hover:bg-[#2D3F2D] text-white text-xs tracking-wider h-8">
                        <Plus className="w-3 h-3 mr-1" /> {t('add_btn')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bundle summary */}
          <div>
            <div className="bg-white border border-[#3D4F3D]/10 p-6 sticky top-6">
              <h3 className="text-[#3D4F3D] text-xs tracking-[0.2em] mb-4">{t('your_gift_set')}</h3>
              <Input
                placeholder={t('gift_set_name_ph')}
                value={bundleName}
                onChange={e => setBundleName(e.target.value)}
                className="mb-4 border-[#3D4F3D]/20"
              />

              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-[#3D4F3D]/40 text-xs">
                  <Gift className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>{t('start_adding')}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    <AnimatePresence>
                      {selectedProducts.map(item => (
                        <motion.div key={item.product_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex gap-3 pb-3 border-b border-[#3D4F3D]/10">
                          <div className="w-12 h-16 bg-[#E8E4DF] flex-shrink-0">
                            {item.product_image && <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#3D4F3D] line-clamp-2 mb-1">{item.product_name}</p>
                            <p className="text-xs text-[#3D4F3D]/60">{formatPrice(item.product_price, currency)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center border border-[#3D4F3D]/20 text-[#3D4F3D]"><Minus className="w-3 h-3" /></button>
                              <span className="text-xs text-[#3D4F3D] w-6 text-center">{item.quantity}</span>
                              <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center border border-[#3D4F3D]/20 text-[#3D4F3D]"><Plus className="w-3 h-3" /></button>
                              <button onClick={() => updateQty(item.product_id, 0)} className="ml-auto text-[#3D4F3D]/40 hover:text-[#3D4F3D]"><X className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2 text-xs border-t border-[#3D4F3D]/10 pt-4">
                    <div className="flex justify-between text-[#3D4F3D]/70">
                      <span>{t('subtotal_items', totalItems)}</span>
                      <span>{formatPrice(subtotal, currency)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{t('discount_label')}</span>
                        <span>-{formatPrice(discount, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#3D4F3D] font-medium text-sm pt-2 border-t border-[#3D4F3D]/10">
                      <span>{t('total_label')}</span>
                      <span>{formatPrice(finalPrice, currency)}</span>
                    </div>
                  </div>

                  {selectedProducts.length >= 3 && (
                    <div className="mt-3">
                      <Badge className="bg-green-100 text-green-700 text-[10px] tracking-wider">{t('discount_badge')}</Badge>
                    </div>
                  )}

                  <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full bg-[#3D4F3D] hover:bg-[#2D3F2D] text-white text-xs tracking-[0.2em] h-10 mt-4">
                    <Gift className="w-4 h-4 mr-2" /> {t('save_gift_set')}
                  </Button>
                  <p className="text-[10px] text-center text-[#3D4F3D]/40 mt-3 tracking-wider">{t('gift_set_saved_note')}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
