import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Heart, ShoppingBag, X, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { fetchWishlist, removeFromWishlist } from '@/api/wishlists'
import { fetchProducts } from '@/api/products'
import { formatPrice } from '@/lib/utils'
import { useT } from '@/lib/i18n'

export default function Wishlist() {
  const t = useT()
  const [currency, setCurrency] = useState('EUR')
  const qc = useQueryClient()

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success(t('toast_removed_wishlist'), { style: { background: '#3D4F3D', color: 'white', border: 'none' } })
    },
  })

  const getProductDetails = item => {
    const product = products.find(p => p.id === item.product_id)
    return product || {
      id:       item.product_id,
      name:     item.product_name,
      price:    item.product_price,
      image_url: item.product_image,
      category: item.product_category,
      stock:    0,
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F3F0]">
      <header className="bg-[#3D4F3D] text-white">
        <div className="px-4 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm tracking-wider mb-4">
              <ArrowLeft className="w-4 h-4" />
              {t('back_to_shop')}
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl tracking-[0.15em] font-light mb-2">{t('my_wishlist')}</h1>
                <p className="text-white/60 text-sm tracking-wider">{t('saved_items', wishlist.length)}</p>
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
                <Heart className="w-8 h-8 fill-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="text-center py-20">
              <p className="text-[#3D4F3D]/60 text-sm tracking-wider">{t('loading')}</p>
            </div>
          ) : wishlist.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-[#3D4F3D]/20 mx-auto mb-6" />
              <h2 className="text-xl text-[#3D4F3D] tracking-wider mb-3">{t('wishlist_empty')}</h2>
              <p className="text-[#3D4F3D]/60 text-sm tracking-wider mb-8">{t('wishlist_hint')}</p>
              <Link to="/">
                <Button className="bg-[#3D4F3D] hover:bg-[#2D3F2D] text-white text-xs tracking-[0.2em] px-8 h-12 rounded-none">
                  {t('continue_shopping')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              <AnimatePresence>
                {wishlist.map(item => {
                  const product = getProductDetails(item)
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative"
                    >
                      <div className="relative aspect-[3/4] bg-[#E8E4DF] overflow-hidden mb-4">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center px-4">
                              <div className="w-20 h-24 mx-auto mb-3 bg-[#3D4F3D]/10 rounded-sm" />
                              <span className="text-[#3D4F3D]/40 text-xs tracking-wider">ZIELINSKI & ROZEN</span>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => removeMutation.mutate(item.id)}
                          className="absolute top-3 right-3 bg-white/90 hover:bg-white p-1.5 rounded-full shadow transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-[#3D4F3D]" />
                        </button>
                        {product.stock <= 0 && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <span className="text-[#3D4F3D] text-xs tracking-widest">{t('out_of_stock')}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-center space-y-1 mb-3">
                        <p className="text-[10px] text-[#3D4F3D]/60 tracking-widest uppercase">{product.category}</p>
                        <h3 className="text-sm font-medium text-[#3D4F3D] tracking-wide uppercase">
                          {product.name?.replace(product.category, '').trim() || product.name}
                        </h3>
                        <p className="text-sm text-[#3D4F3D]">{formatPrice(product.price, currency)}</p>
                      </div>
                      <Link to="/" className="block">
                        <Button
                          className="w-full bg-[#3D4F3D] hover:bg-[#2D3F2D] text-white text-xs tracking-widest py-3 rounded-none"
                          disabled={product.stock <= 0}
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          {t('view_in_shop')}
                        </Button>
                      </Link>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
