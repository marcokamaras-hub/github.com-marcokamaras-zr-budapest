import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'
import { ChevronLeft } from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { lang: appLang } = useLanguage()
  const [product, setProduct] = useState(null)
  const [similar, setSimilar] = useState([])
  const [currency, setCurrency] = useState(() => { try { return localStorage.getItem('zr_currency') || 'EUR' } catch { return 'EUR' } })
  const [descLang, setDescLang] = useState(appLang)
  const [added, setAdded] = useState(false)

  // Browse list from Shop navigation state
  const browseIds = location.state?.browseIds || []
  const currentIndex = browseIds.indexOf(id)
  const prevId = currentIndex > 0 ? browseIds[currentIndex - 1] : null
  const nextId = currentIndex < browseIds.length - 1 ? browseIds[currentIndex + 1] : null

  // Swipe handling
  const touchStartX = useRef(null)
  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = e => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 60) return
    if (dx < 0 && nextId) navigate(`/product/${nextId}`, { state: { browseIds }, replace: true })
    if (dx > 0 && prevId) navigate(`/product/${prevId}`, { state: { browseIds }, replace: true })
  }

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data }) => {
        setProduct(data)
        if (data) {
          supabase.from('products').select('*').eq('category', data.category).eq('is_active', true).neq('id', id).limit(8)
            .then(({ data: sim }) => setSimilar(sim || []))
        }
      })
  }, [id])

  // Find all size variants (same name + category)
  const [variants, setVariants] = useState([])
  useEffect(() => {
    if (!product) return
    supabase.from('products').select('*')
      .ilike('name', product.name)
      .eq('category', product.category)
      .eq('is_active', true)
      .then(({ data }) => setVariants(data || []))
  }, [product])

  const addToCart = () => {
    if (!product || product.stock === 0) return
    try {
      const cart = JSON.parse(localStorage.getItem('zr_cart') || '[]')
      const idx = cart.findIndex(i => i.id === product.id)
      if (idx >= 0) cart[idx].quantity += 1
      else cart.push({ id: product.id, name: product.name, category: product.category, size: product.size, price: product.price, quantity: 1, image_url: product.image_url, stock: product.stock })
      localStorage.setItem('zr_cart', JSON.stringify(cart))
      setAdded(true)
      setTimeout(() => setAdded(false), 1500)
    } catch {}
  }

  if (!product) return (
    <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#3D4F3D] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#3D4F3D]/10 flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} style={{ touchAction: 'manipulation' }} className="flex items-center gap-1 text-[#3D4F3D] text-[11px] tracking-[0.15em]">
          <ChevronLeft className="w-4 h-4" /> BACK
        </button>
        <div className="flex gap-2">
          {['EUR','HUF'].map(c => (
            <button key={c} onClick={() => { setCurrency(c); localStorage.setItem('zr_currency', c) }}
              style={{ touchAction: 'manipulation' }}
              className={`text-[10px] tracking-widest px-2 py-1 ${currency === c ? 'text-[#3D4F3D] font-bold' : 'text-[#3D4F3D]/40'}`}>{c}</button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
      <motion.div key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}>

      {/* Image — swipeable, blurred backdrop */}
      <div
        className="relative w-full overflow-hidden select-none"
        style={{ height: '75vw', touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {product.image_url && (
          <>
            <img src={product.image_url} aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110"
              style={{ filter: 'blur(18px)', opacity: 0.7 }} />
            <img src={product.image_url} alt={product.name}
              className="relative z-10 w-full h-full object-contain"
              style={{ display: 'block' }} />
          </>
        )}
        {/* Prev / Next arrows */}
        {prevId && (
          <button onTouchEnd={e => { e.stopPropagation(); navigate(`/product/${prevId}`, { state: { browseIds }, replace: true }) }}
            style={{ touchAction: 'manipulation' }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <ChevronLeft className="w-5 h-5 text-[#3D4F3D]" />
          </button>
        )}
        {nextId && (
          <button onTouchEnd={e => { e.stopPropagation(); navigate(`/product/${nextId}`, { state: { browseIds }, replace: true }) }}
            style={{ touchAction: 'manipulation' }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <ChevronLeft className="w-5 h-5 text-[#3D4F3D] rotate-180" />
          </button>
        )}
        {/* Position counter */}
        {browseIds.length > 1 && (
          <div className="absolute top-3 right-3 z-20 bg-black/30 text-white text-[10px] tracking-widest px-2 py-1">
            {currentIndex + 1} / {browseIds.length}
          </div>
        )}
        {/* Swipe hint */}
        {browseIds.length > 1 && (
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 text-white/70 text-[9px] tracking-widest whitespace-nowrap pointer-events-none">
            SWIPE TO BROWSE
          </p>
        )}
      </div>

      {/* Details */}
      <div className="px-5 pt-5 pb-4">
        <div className="border-t-2 border-b-2 border-dashed border-[#3D4F3D] py-3 mb-3">
          <h1 className="text-2xl text-[#3D4F3D] font-bold tracking-wider leading-tight uppercase">
            {product.name}
          </h1>
        </div>
        <div className="border-b-2 border-dashed border-[#3D4F3D] pb-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-[#3D4F3D] font-bold tracking-wider uppercase">
            {product.category}{product.size && ` · ${product.size}`}
          </p>
          <p className="text-xl text-[#3D4F3D] font-light">{formatPrice(product.price, currency)}</p>
        </div>

        {/* Size variants */}
        {variants.length > 1 && (
          <div className="flex gap-2 mb-4">
            {variants.sort((a,b) => a.price - b.price).map(v => (
              <button key={v.id} onClick={() => {
                // Swap current product's position in browseIds with the new variant so swiping still works
                const updatedIds = currentIndex >= 0
                  ? [...browseIds.slice(0, currentIndex), v.id, ...browseIds.slice(currentIndex + 1)]
                  : browseIds
                navigate(`/product/${v.id}`, { state: { browseIds: updatedIds }, replace: true })
              }}
                style={{ touchAction: 'manipulation' }}
                className={`px-3 py-1.5 text-[11px] tracking-[0.1em] border transition-all ${v.id === product.id ? 'bg-[#3D4F3D] text-white border-[#3D4F3D]' : 'border-[#3D4F3D]/30 text-[#3D4F3D]'}`}>
                {v.size || `€${v.price}`}
              </button>
            ))}
          </div>
        )}

        {/* Stock status */}
        {product.stock === 0 && <p className="text-xs tracking-[0.15em] text-red-600 mb-3">OUT OF STOCK</p>}
        {product.stock > 0 && product.stock < 5 && <p className="text-xs tracking-[0.15em] text-amber-700 mb-3">ONLY {product.stock} LEFT</p>}

        {/* Description language tabs */}
        <div className="mb-4">
          <div className="flex gap-2 mb-3">
            {['EN','HU','RU'].map(l => (
              <button key={l} onClick={() => setDescLang(l)}
                style={{ touchAction: 'manipulation' }}
                className={`px-3 py-1 text-[10px] tracking-widest border transition-colors ${descLang === l ? 'bg-[#3D4F3D] text-white border-[#3D4F3D]' : 'border-[#3D4F3D]/20 text-[#3D4F3D]'}`}>{l}</button>
            ))}
          </div>
          <p className="text-sm text-[#3D4F3D] leading-relaxed tracking-wide">
            {descLang === 'HU' ? (product.description_hu || product.description) : descLang === 'RU' ? (product.description_ru || product.description) : product.description}
          </p>
        </div>
      </div>

      </motion.div>
      </AnimatePresence>

      {/* ADD TO CART — sticky bottom */}
      <div className="sticky bottom-0 bg-white border-t border-[#3D4F3D]/10 px-5 py-3 flex gap-3 items-center">
        <button
          onClick={addToCart}
          disabled={product.stock === 0}
          style={{ touchAction: 'manipulation' }}
          className={`flex-1 h-12 text-xs tracking-[0.2em] uppercase font-bold flex items-center justify-between px-5 transition-all ${product.stock === 0 ? 'bg-[#3D4F3D]/20 text-[#3D4F3D]/40 cursor-not-allowed' : added ? 'bg-[#2D3F2D] text-white' : 'bg-[#3D4F3D] text-white active:bg-[#2D3F2D]'}`}
        >
          <span>{added ? '✓ ADDED' : product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO BAG'}</span>
          <span>{formatPrice(product.price, currency)}</span>
        </button>
      </div>

      {/* You may also like */}
      {similar.length > 0 && (
        <div className="px-5 py-6 border-t border-[#3D4F3D]/10">
          <p className="text-[9px] tracking-[0.25em] text-[#3D4F3D]/50 uppercase mb-3">You May Also Like</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {similar.map(p => (
              <button key={p.id} onClick={() => navigate(`/product/${p.id}`, { replace: true })}
                style={{ touchAction: 'manipulation' }}
                className="flex-shrink-0 w-24 text-left">
                <div className="w-24 h-28 bg-[#E8E4DF] overflow-hidden mb-1">
                  {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <p className="text-[9px] text-[#3D4F3D] leading-tight line-clamp-2">{p.name}</p>
                <p className="text-[10px] text-[#3D4F3D] font-medium mt-0.5">{formatPrice(p.price, currency)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="h-4" />
    </div>
  )
}
