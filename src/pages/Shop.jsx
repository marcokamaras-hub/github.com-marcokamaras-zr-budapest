import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Menu, Search, Heart, ShoppingBag, X, ChevronDown, ChevronLeft, ChevronRight, Gift, Package, PackageOpen, LayoutGrid, ArrowRight, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { formatPrice } from '@/lib/utils'
import { useLanguage, useT, useCatLabel } from '@/lib/i18n'
import { COLLECTIONS, matchesCollections } from '@/lib/collections'
import { fetchProducts } from '@/api/products'
import { fetchWishlist, addToWishlist, removeFromWishlist } from '@/api/wishlists'
import CartDrawer from '@/components/shop/CartDrawer'
import CheckoutForm from '@/components/shop/CheckoutForm'
import FilterPanel from '@/components/shop/FilterPanel'

// Mobile nav: 2 tabs only
const categories = [
  { value: 'all',         label: 'ALL PRODUCTS' },
  { value: 'bestsellers', label: 'BEST SELLERS'  },
]

// Desktop nav: full 17 tabs
const ALL_CATEGORIES = [
  { value: 'all',               label: 'ALL PRODUCTS'   },
  { value: 'bestsellers',       label: 'BEST SELLERS'   },
  { value: 'Perfume',           label: 'PERFUMES'       },
  { value: 'Hand cream',        label: 'HAND CREAM'     },
  { value: 'Body cream',        label: 'BODY CREAM'     },
  { value: 'Diffuser',          label: 'DIFFUSERS'      },
  { value: 'Shower gel',        label: 'SHOWER GEL'     },
  { value: 'Body scrub',        label: 'BODY SCRUB'     },
  { value: 'Body oil',          label: 'BODY OIL'       },
  { value: 'Candle',            label: 'CANDLES'        },
  { value: 'Liquid soap',       label: 'LIQUID SOAP'    },
  { value: 'Solid soap',        label: 'SOLID SOAP'     },
  { value: 'Shampoo',           label: 'SHAMPOO'        },
  { value: 'Hair conditioner',  label: 'CONDITIONER'    },
  { value: 'Keratin hair mask', label: 'HAIR MASK'      },
  { value: 'Dead sea salt',     label: 'DEAD SEA SALT'  },
  { value: 'Giftbox',           label: 'GIFT SETS'      },
]

// Used only by AllProductsSections carousels — not shown as nav tabs
const SECTION_CATS = [
  { value: 'Perfume',           label: 'PERFUMES'      },
  { value: 'Hand cream',        label: 'HAND CREAM'    },
  { value: 'Body cream',        label: 'BODY CREAM'    },
  { value: 'Diffuser',          label: 'DIFFUSERS'     },
  { value: 'Shower gel',        label: 'SHOWER GEL'    },
  { value: 'Body scrub',        label: 'BODY SCRUB'    },
  { value: 'Body oil',          label: 'BODY OIL'      },
  { value: 'Candle',            label: 'CANDLES'       },
  { value: 'Liquid soap',       label: 'LIQUID SOAP'   },
  { value: 'Solid soap',        label: 'SOLID SOAP'    },
  { value: 'Shampoo',           label: 'SHAMPOO'       },
  { value: 'Hair conditioner',  label: 'CONDITIONER'   },
  { value: 'Keratin hair mask', label: 'HAIR MASK'     },
  { value: 'Dead sea salt',     label: 'DEAD SEA SALT' },
  { value: 'Giftbox',           label: 'GIFT SETS'     },
]

const bestSellers = [
  { rank:  1, category: 'Perfume',      name: 'Black Pepper, Vetiver, Neroli, Amber',  size: '50ml'  },
  { rank:  2, category: 'Perfume',      name: 'Black Pepper, Vetiver, Neroli, Amber',  size: '10ml'  },
  { rank:  3, category: 'Perfume',      name: 'Black Vanilla',                         size: '50ml'  },
  { rank:  4, category: 'Perfume',      name: 'Pink Pepper, Elemi, Cinnamon, Leather', size: '10ml'  },
  { rank:  5, category: 'Perfume',      name: 'Black Vanilla',                         size: '10ml'  },
  { rank:  6, category: 'Perfume',      name: 'Amberwood, Vanilla, Davana',            size: '10ml'  },
  { rank:  7, category: 'Perfume',      name: 'Pink Pepper, Elemi, Cinnamon, Leather', size: '50ml'  },
  { rank:  8, category: 'Perfume',      name: 'Leather, Sandalwood, Amber',            size: '50ml'  },
  { rank:  9, category: 'Perfume',      name: 'Amberwood, Vanilla, Davana',            size: '50ml'  },
  { rank: 10, category: 'Liquid soap',  name: 'Black Pepper, Vetiver, Neroli, Amber',  size: '300ml' },
  { rank: 11, category: 'Body cream',   name: 'Black Pepper, Vetiver, Neroli, Amber',  size: '195ml' },
  { rank: 12, category: 'Perfume',      name: 'Oud, Amber, Wood Blend',                size: '50ml'  },
  { rank: 13, category: 'Hand cream',   name: 'Black Pepper, Vetiver, Neroli, Amber',  size: '50ml'  },
  { rank: 14, category: 'Perfume',      name: 'Tobacco, Cedarwood, Pepper',            size: '10ml'  },
  { rank: 15, category: 'Shower gel',   name: 'Black Pepper, Vetiver, Neroli, Amber',  size: '300ml' },
  { rank: 16, category: 'Perfume',      name: 'Orange & Jasmine',                      size: '10ml'  },
  { rank: 17, category: 'Giftbox',      name: 'Everyday Hand Care Giftbox',            size: null    },
  { rank: 18, category: 'Perfume',      name: 'Apple, Lotus',                          size: '10ml'  },
  { rank: 19, category: 'Perfume',      name: 'Oud, Amber, Wood Blend',                size: '10ml'  },
  { rank: 20, category: 'Diffuser',     name: 'Pink Pepper, Elemi, Cinnamon, Leather', size: '212ml' },
  { rank: 21, category: 'Candle',       name: 'Pink Pepper, Elemi, Cinnamon, Leather', size: null    },
  { rank: 22, category: 'Body cream',   name: 'Pink Pepper, Elemi, Cinnamon, Leather', size: '195ml' },
  { rank: 23, category: 'Perfume',      name: 'Oakmoss & Amber',                       size: '10ml'  },
  { rank: 24, category: 'Perfume',      name: 'Tobacco, Vetiver, Amber',               size: '10ml'  },
  { rank: 25, category: 'Perfume',      name: 'Blackcurrant, Geranium, Amber, Leather',size: '10ml'  },
  { rank: 26, category: 'Hand cream',   name: 'Pink Pepper, Elemi, Cinnamon, Leather', size: '50ml'  },
  { rank: 27, category: 'Perfume',      name: 'Tobacco, Cedarwood, Pepper',            size: '50ml'  },
  { rank: 28, category: 'Perfume',      name: 'Blackcurrant, Geranium, Amber, Leather',size: '50ml'  },
  { rank: 29, category: 'Body Butter',  name: 'Orange & Jasmine',                      size: '200ml' },
  { rank: 30, category: 'Diffuser',     name: 'Cedarwood, Neroli, Amber',              size: '85ml'  },
  { rank: 31, category: 'Perfume',      name: 'White Blend',                           size: '10ml'  },
  { rank: 32, category: 'Perfume',      name: 'Red grapefruit, Bergamot, Amber',       size: '10ml'  },
  { rank: 33, category: 'Perfume',      name: 'Lavender, Vanilla, Amber, Musk',        size: '10ml'  },
  { rank: 34, category: 'Perfume',      name: 'Grapefruit, Basil, Petitgrain',         size: '10ml'  },
  { rank: 35, category: 'Perfume',      name: 'Orange & Jasmine',                      size: '50ml'  },
  { rank: 36, category: 'Diffuser',     name: 'Black Vanilla',                         size: '85ml'  },
  { rank: 37, category: 'Hand cream',   name: 'Black Vanilla',                         size: '50ml'  },
  { rank: 38, category: 'Hand cream',   name: 'Vetiver, Lemon',                        size: '50ml'  },
  { rank: 39, category: 'Perfume',      name: 'Rosemary & Lemon',                      size: '10ml'  },
  { rank: 40, category: 'Perfume',      name: 'Vetiver, Lemon',                        size: '10ml'  },
  { rank: 41, category: 'Body Butter',  name: 'Black Vanilla',                         size: '200ml' },
  { rank: 42, category: 'Perfume',      name: 'Oakmoss & Amber',                       size: '50ml'  },
  { rank: 43, category: 'Perfume',      name: 'Rosemary & Lemon',                      size: '50ml'  },
  { rank: 44, category: 'Perfume',      name: 'Cedarwood, Neroli, Amber',              size: '50ml'  },
  { rank: 45, category: 'Perfume',      name: 'White Blend',                           size: '50ml'  },
  { rank: 46, category: 'Perfume',      name: 'Red grapefruit, Bergamot, Amber',       size: '50ml'  },
  { rank: 47, category: 'Diffuser',     name: 'Orange & Jasmine',                      size: '85ml'  },
  { rank: 48, category: 'Diffuser',     name: 'Pink Pepper, Elemi, Cinnamon, Leather', size: '85ml'  },
]

function isNewArrival(product) {
  const n = (product.name || '').toLowerCase()
  // New diffuser scents (all sizes)
  if (product.category === 'Diffuser') {
    if (n.includes('amberwood') || (n.includes('vanilla') && n.includes('davana'))) return true
    if (n.includes('oud')) return true
    if (n.includes('blackcurrant') || n.includes('black currant') || n.includes('black,currant')) return true
    if (n.includes('pink pepper')) return true
    if (n.includes('leather')) return true
  }
  // Travel size 100ml
  if (product.category === 'Travel size' && (product.size === '100ml' || product.size === '100 ml')) return true
  return false
}

function isBestSeller(product) {
  return bestSellers.some(bs => {
    const catMatch  = bs.category === product.category
    const nameMatch = product.name?.toLowerCase() === bs.name.toLowerCase()
    const sizeMatch = !bs.size || product.size === bs.size
    return catMatch && nameMatch && sizeMatch
  })
}

function getBestSellerRank(product) {
  const match = bestSellers.find(bs => {
    const catMatch  = bs.category === product.category
    const nameMatch = product.name?.toLowerCase() === bs.name.toLowerCase()
    const sizeMatch = !bs.size || product.size === bs.size
    return catMatch && nameMatch && sizeMatch
  })
  return match ? match.rank : 999
}

// ─── Product Card ───────────────────────────────────────────
function ProductCard({ product, onAddToCart, onToggleWishlist, isInWishlist, currency, onProductClick }) {
  const [isHovered, setIsHovered] = useState(false)
  const t = useT()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group cursor-pointer"
      onClick={() => onProductClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] bg-[#E8E4DF] overflow-hidden mb-3">
        {product.image_url ? (
          <>
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-all duration-500 group-hover:opacity-0"
              onError={e => { e.target.style.display = 'none' }}
            />
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 scale-105"
              onError={e => { e.target.style.display = 'none' }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-[#3D4F3D]/20 text-center px-4">
              <PackageOpen className="w-12 h-12 mx-auto mb-2" />
              <p className="text-xs tracking-wider">NO IMAGE</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={e => { e.stopPropagation(); onProductClick(product) }}
              className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors flex items-center justify-center"
            >
              <span className="bg-white px-6 py-2 text-[#3D4F3D] text-xs tracking-[0.2em] border border-[#3D4F3D]/20 hover:bg-[#3D4F3D] hover:text-white transition-colors">
                QUICK VIEW
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={e => { e.stopPropagation(); onToggleWishlist(product) }}
          className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
        >
          <Heart className={`w-4 h-4 transition-colors ${isInWishlist ? 'fill-[#3D4F3D] text-[#3D4F3D]' : 'text-[#3D4F3D]/60'}`} />
        </button>

        {product.stock === 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#3D4F3D] py-2 text-center z-10">
            <span className="text-white text-[9px] tracking-[0.2em] uppercase">{t('out_of_stock')}</span>
          </div>
        )}
      </div>

      <div className="text-center space-y-0.5 px-2">
        <p className="text-[9px] text-[#3D4F3D]/50 tracking-[0.15em] uppercase">
          {product.category}{product.size && ` - ${product.size}`}
        </p>
        <h3 className="text-xs text-[#3D4F3D] tracking-wide leading-snug min-h-[32px] line-clamp-2">
          {product.name?.replace(product.category, '').replace(`(${product.size})`, '').trim() || product.name}
        </h3>
        <p className="text-sm text-[#3D4F3D] font-light pt-1">{formatPrice(product.price, currency)}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); if (product.stock > 0) onAddToCart(product) }}
        disabled={product.stock === 0}
        className={`mt-3 w-full border text-[9px] tracking-[0.2em] py-2.5 transition-all duration-200 ${
          product.stock === 0
            ? 'border-[#3D4F3D]/10 text-[#3D4F3D]/30 cursor-not-allowed'
            : 'border-[#3D4F3D]/20 hover:bg-[#3D4F3D] hover:text-white hover:border-[#3D4F3D] text-[#3D4F3D]'
        }`}
      >
        {product.stock === 0 ? t('out_of_stock') : t('add_to_bag')}
      </button>
    </motion.div>
  )
}

// ─── All Products Section View ────────────────────────────────
function AllProductsSections({ products, onAddToCart, onToggleWishlist, isInWishlist, currency, onProductClick, onCategorySelect }) {
  const t       = useT()
  const catLabel = useCatLabel()
  const sectionCats = SECTION_CATS

  const bestsellersProducts = products
    .filter(isBestSeller)
    .sort((a, b) => getBestSellerRank(a) - getBestSellerRank(b))
    .slice(0, 8)

  return (
    <div className="space-y-10 pt-4">
      {/* Best sellers row */}
      {bestsellersProducts.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4 border-b border-[#3D4F3D]/10 pb-3">
            <h2 className="text-xs text-[#3D4F3D] tracking-[0.3em] font-medium">{t('best_sellers_title')}</h2>
            <button
              onClick={() => onCategorySelect('bestsellers')}
              className="text-[10px] text-[#3D4F3D]/50 tracking-wider hover:text-[#3D4F3D] flex items-center gap-1 transition-colors"
            >
              {t('see_all')} ({products.filter(isBestSeller).length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4 lg:mx-0 lg:px-0">
            {bestsellersProducts.map(product => (
              <div key={product.id} className="flex-shrink-0 w-44 md:w-52">
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  onToggleWishlist={onToggleWishlist}
                  isInWishlist={isInWishlist(product.id)}
                  currency={currency}
                  onProductClick={p => onProductClick(p, bestsellersProducts)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category rows */}
      {sectionCats.map(cat => {
        const catProducts = products.filter(p => p.category === cat.value)
        if (catProducts.length === 0) return null
        return (
          <section key={cat.value}>
            <div className="flex items-baseline justify-between mb-4 border-b border-[#3D4F3D]/10 pb-3">
              <h2 className="text-xs text-[#3D4F3D] tracking-[0.3em] font-medium">{catLabel(cat.value)}</h2>
              <button
                onClick={() => onCategorySelect(cat.value)}
                className="text-[10px] text-[#3D4F3D]/50 tracking-wider hover:text-[#3D4F3D] flex items-center gap-1 transition-colors"
              >
                {t('see_all')} ({catProducts.length}) <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4 lg:mx-0 lg:px-0">
              {catProducts.slice(0, 8).map(product => (
                <div key={product.id} className="flex-shrink-0 w-44 md:w-52">
                  <ProductCard
                    product={product}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    isInWishlist={isInWishlist(product.id)}
                    currency={currency}
                    onProductClick={p => onProductClick(p, catProducts)}
                  />
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

// ─── Main Shop Page ──────────────────────────────────────────
export default function Shop() {
  const { lang, setLang } = useLanguage()
  const t        = useT()
  const catLabel = useCatLabel()
  const [cart, setCart]                       = useState([])
  const [cartOpen, setCartOpen]               = useState(false)
  const [checkoutOpen, setCheckoutOpen]       = useState(false)
  const [orderSuccess, setOrderSuccess]       = useState(false)
  const [searchQuery, setSearchQuery]         = useState('')
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen]           = useState(false)
  const [currency, setCurrency]               = useState('EUR')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [browseList, setBrowseList]           = useState([])
  const [descriptionLang, setDescriptionLang] = useState('EN')
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const tabsContainerRef = useRef(null)
  const productGridRef   = useRef(null)
  const touchStartX      = useRef(null)
  const [filters, setFilters] = useState({
    category:        'bestsellers',
    priceRange:      [0, 210],
    collections:     [],
    bestsellersOnly: false,
    newArrivalsOnly: false,
    inStockOnly:     false,
  })

  const qc = useQueryClient()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
  })

  const maxPrice = Math.max(...products.map(p => p.price || 0), 210)

  // Scroll to top on initial mount
  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    if (products.length > 0 && filters.priceRange[1] === 210) {
      setFilters(prev => ({ ...prev, priceRange: [0, maxPrice] }))
    }
  }, [products.length])

  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeTab = tabsContainerRef.current.querySelector('[data-active="true"]')
      if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [filters.category])

  // Scroll product grid to top whenever the active collections change
  useEffect(() => {
    if (productGridRef.current) {
      productGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [filters.collections])

  // Sync description language with app language
  useEffect(() => { setDescriptionLang(lang) }, [lang])

  // Wishlist mutations
  const addWishlistMutation = useMutation({
    mutationFn: addToWishlist,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Added to wishlist', { style: { background: '#3D4F3D', color: 'white', border: 'none' } })
    },
  })

  const removeWishlistMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Removed from wishlist', { style: { background: '#3D4F3D', color: 'white', border: 'none' } })
    },
  })

  const isInWishlist = productId => wishlist.some(item => item.product_id === productId)

  const toggleWishlist = product => {
    const item = wishlist.find(w => w.product_id === product.id)
    if (item) {
      removeWishlistMutation.mutate(item.id)
    } else {
      addWishlistMutation.mutate(product)
    }
  }

  // Cart
  const addToCart = product => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
    toast.success(t('toast_added_bag'), { style: { background: '#3D4F3D', color: 'white', border: 'none' } })
  }

  const updateQuantity = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id))
    else setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  const removeItem = id => setCart(prev => prev.filter(i => i.id !== id))

  // Products that pass every filter EXCEPT price — used so FilterPanel's
  // minPrice/maxPrice always reflect what's actually visible on screen.
  const priceRangeProducts = products.filter(product => {
    let matchesCat
    if (filters.category === 'bestsellers') matchesCat = isBestSeller(product)
    else if (filters.category === 'all')    matchesCat = true
    else                                    matchesCat = product.category === filters.category
    const matchesBestseller  = !filters.bestsellersOnly || isBestSeller(product)
    const matchesInStock     = !filters.inStockOnly || product.stock > 0
    return matchesCat && matchesCollections(product, filters.collections) && matchesBestseller && matchesInStock
  })

  // Filtering & sorting
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesCategory
      if (filters.category === 'bestsellers')  matchesCategory = isBestSeller(product)
      else if (filters.category === 'all')     matchesCategory = true
      else                                     matchesCategory = product.category === filters.category

      // "Shop By" modes — bypass category/collection/price when active
      if (filters.bestsellersOnly) return matchesSearch && isBestSeller(product)
      if (filters.newArrivalsOnly) return matchesSearch && isNewArrival(product)

      const matchesPrice      = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
      const matchesCollection = matchesCollections(product, filters.collections)
      const matchesInStock    = !filters.inStockOnly || product.stock > 0

      return matchesSearch && matchesCategory && matchesPrice && matchesCollection && matchesInStock
    })
    .sort((a, b) => {
      if (filters.category !== 'bestsellers' && !filters.bestsellersOnly) return 0
      return getBestSellerRank(a) - getBestSellerRank(b)
    })

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const activeFiltersCount =
    (filters.priceRange[1] < maxPrice ? 1 : 0) +
    (filters.bestsellersOnly ? 1 : 0) +
    (filters.newArrivalsOnly ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    filters.collections.length

  const handleCategorySelect = value => {
    setFilters(prev => ({ ...prev, category: value, collections: [], priceRange: [0, maxPrice], bestsellersOnly: false, newArrivalsOnly: false }))
    setMobileMenuOpen(false)
    setDesktopMenuOpen(false)
  }

  // Exclusive radio-style collection selector
  const handleCollectionSelect = (key) => {
    const isActive = filters.collections[0] === key
    setFilters(prev => ({
      ...prev,
      collections:     isActive ? [] : [key],
      category:        'all',
      bestsellersOnly: false,
      newArrivalsOnly: false,
      inStockOnly:     false,
      priceRange:      [0, maxPrice],
    }))
  }

  // ── Product browse / navigation ──────────────────────────────────────────
  const openProduct = (product, list) => {
    setSelectedProduct(product)
    setBrowseList(list && list.length > 0 ? list : filteredProducts)
  }

  const currentBrowseIndex = browseList.findIndex(p => p.id === selectedProduct?.id)
  const hasPrev = currentBrowseIndex > 0
  const hasNext = currentBrowseIndex < browseList.length - 1

  const goPrev = () => hasPrev && setSelectedProduct(browseList[currentBrowseIndex - 1])
  const goNext = () => hasNext && setSelectedProduct(browseList[currentBrowseIndex + 1])

  // Keyboard arrows while modal is open
  useEffect(() => {
    if (!selectedProduct) return
    const onKey = e => {
      if (e.key === 'ArrowLeft')  goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedProduct?.id, currentBrowseIndex, browseList.length])

  // Touch swipe handlers
  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd   = e => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 60)       goNext()
    else if (diff < -60) goPrev()
    touchStartX.current = null
  }

  return (
    <div className="min-h-screen bg-[#F5F3F0]">

      {/* ── Header ── */}
      <header className="relative z-50 bg-[#3D4F3D]">
        <div className="bg-[#2F4E3C] px-4 lg:px-8">
          <div className="mx-1 flex items-end pb-3 justify-between h-52 md:items-center md:pb-0 md:h-56">

            {/* Left — Menu */}
            <div className="flex items-center gap-6">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="text-white lg:hidden flex items-center gap-1.5">
                    <Menu className="w-6 h-6" />
                    <span className="text-xs tracking-wider">{t('menu')}</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-[#F5F3F0] border-none p-0">
                  <div className="p-6">
                    <SheetHeader className="mb-8">
                      <SheetTitle className="text-[#3D4F3D] tracking-widest text-sm">MENU</SheetTitle>
                    </SheetHeader>
                    <nav className="space-y-4">
                      {categories.map(cat => (
                        <button
                          key={cat.value}
                          onClick={() => handleCategorySelect(cat.value)}
                          className={`block w-full text-left text-sm tracking-wider py-2 transition-colors ${
                            filters.category === cat.value
                              ? 'text-[#3D4F3D] font-medium'
                              : 'text-[#3D4F3D]/60 hover:text-[#3D4F3D]'
                          }`}
                        >
                          {catLabel(cat.value)}
                        </button>
                      ))}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>

              <nav className="hidden lg:flex items-center gap-6">
                <div className="relative">
                  <button
                    onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
                    className="text-white text-sm tracking-widest flex items-center gap-1 py-4"
                  >
                    MENU <ChevronDown className={`w-4 h-4 transition-transform ${desktopMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {desktopMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 bg-[#3D4F3D] border border-white/10 py-2 min-w-48 z-50"
                      >
                        {categories.map(cat => (
                          <button
                            key={cat.value}
                            onClick={() => handleCategorySelect(cat.value)}
                            className={`block w-full text-left px-4 py-2 text-sm tracking-wider transition-colors ${
                              filters.category === cat.value
                                ? 'text-white bg-white/10'
                                : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {catLabel(cat.value)}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>
            </div>

            {/* Centre — Logo */}
            <div className="absolute left-1/2 -translate-x-1/2 top-4 md:top-[32%] md:-translate-y-1/2 w-[72%] sm:w-auto">
              <div className="text-center">
                <img
                  src="https://mbbxrfjgqvximrbumbop.supabase.co/storage/v1/object/public/public/images/zrlogo_clean.png"
                  alt="PERFUMERIE ZIELINSKI & ROZEN"
                  className="h-24 md:h-32 w-auto mx-auto brightness-0 invert"
                />
                <a
                  href="https://search.google.com/local/writereview?placeid=ChIJsRp7GAXdQUcRXLVF1-Ipo7o"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-white/80 hover:text-white text-center text-[11px] md:text-base font-light normal-case tracking-[0.04em] md:tracking-[0.15em] px-1 md:px-2 py-1 mt-1 transition-colors"
                >
                  Budapest · Székely Mihály u. 4, 1061
                  <span className="block text-white/60 text-[10px] md:text-sm tracking-wide mt-0.5">{t('tagline')}</span>
                </a>
              </div>
            </div>

            {/* Right — Icons */}
            <div className="flex items-center gap-4">
              <button onClick={() => setSearchOpen(!searchOpen)} className="text-white flex items-center justify-center w-6 h-6">
                <Search className="w-6 h-6" />
              </button>
              <Link to="/wishlist" className="text-white relative hidden md:flex items-center justify-center w-6 h-6">
                <Heart className="w-6 h-6" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#3D4F3D] text-[10px] rounded-full flex items-center justify-center font-medium">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link to="/bundle" className="text-white hidden sm:flex items-center justify-center w-6 h-6">
                <Gift className="w-6 h-6" />
              </Link>
              <Link to="/orders" className="text-white hidden sm:flex items-center justify-center w-6 h-6">
                <Package className="w-6 h-6" />
              </Link>
              <button className="text-white relative flex items-center justify-center w-6 h-6" onClick={() => setCartOpen(true)}>
                <ShoppingBag className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#3D4F3D] text-[10px] rounded-full flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Language + Currency toggle — EN/HU stacked above EUR/HUF */}
          <div className="flex justify-center pb-4">
            {[['EN','EUR'], ['HU','HUF']].map(([l, cur]) => (
              <div key={l} className="flex flex-col items-center">
                <button
                  onClick={() => setLang(l)}
                  className={`px-3 py-0.5 text-[10px] tracking-widest transition-colors ${
                    lang === l ? 'text-white font-bold' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {l}
                </button>
                <button
                  onClick={() => setCurrency(cur)}
                  className={`px-3 py-1 text-xs tracking-widest transition-colors ${
                    currency === cur ? 'text-white font-bold' : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {cur}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#3D4F3D] border-t border-white/10 overflow-hidden"
            >
              <div className="px-4 lg:px-8 py-4">
                <div className="max-w-xl mx-auto relative">
                  <Input
                    placeholder={t('search_ph')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-none h-12 pl-4 pr-12 text-sm tracking-wide"
                    autoFocus
                  />
                  <button onClick={() => setSearchOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Category nav ── */}
      <div className="sticky top-0 z-40 bg-[#F5F3F0] border-b border-[#3D4F3D]/10 shadow-sm">
        <div className="px-4 lg:px-8">
          {/* Mobile: 2 tabs */}
          <div className="md:hidden flex items-center gap-4 py-4 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.value}
                data-active={filters.category === cat.value}
                onClick={() => setFilters(prev => ({ ...prev, category: cat.value, collections: [], priceRange: [0, maxPrice], bestsellersOnly: false, newArrivalsOnly: false }))}
                className={`text-xs tracking-widest transition-all pb-1 whitespace-nowrap flex-shrink-0 ${
                  filters.category === cat.value
                    ? 'text-[#3D4F3D] border-b border-[#3D4F3D]'
                    : 'text-[#3D4F3D]/50 hover:text-[#3D4F3D]'
                }`}
              >
                {catLabel(cat.value)}
              </button>
            ))}
          </div>
          {/* Desktop: all 17 tabs */}
          <div ref={tabsContainerRef} className="hidden md:flex items-center gap-6 lg:gap-8 py-4 overflow-x-auto scrollbar-hide">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                data-active={filters.category === cat.value}
                onClick={() => setFilters(prev => ({ ...prev, category: cat.value, collections: [], priceRange: [0, maxPrice], bestsellersOnly: false, newArrivalsOnly: false }))}
                className={`text-xs tracking-widest transition-all pb-1 whitespace-nowrap flex-shrink-0 ${
                  filters.category === cat.value
                    ? 'text-[#3D4F3D] border-b border-[#3D4F3D]'
                    : 'text-[#3D4F3D]/50 hover:text-[#3D4F3D]'
                }`}
              >
                {catLabel(cat.value)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product count */}
      <div className="mx-2 pt-2 pr-3 pb-3 pl-3 opacity-45 lg:px-8 flex items-center justify-between">
        <p className="text-[#3D4F3D]/60 text-xs tracking-wider">
          {t('bestsellers_count', filteredProducts.length)}
        </p>
        <p className="text-[#3D4F3D]/60 text-xs tracking-wider hidden sm:block">
          {t('free_delivery_banner', currency === 'EUR' ? '€100' : '39 500 Ft')}
        </p>
      </div>

      {/* ── Main content ── */}
      <main className="px-4 lg:px-12 pb-28 md:pb-20 bg-[#F5F3F0]">
        {filters.category === 'all' && !searchQuery && filters.collections.length === 0 && !filters.bestsellersOnly && !filters.newArrivalsOnly ? (
          /* ── Section view ── */
          isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 pt-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] bg-[#E8E4DF]" />
                  <Skeleton className="h-2 w-16 mx-auto bg-[#E8E4DF]" />
                  <Skeleton className="h-3 w-28 mx-auto bg-[#E8E4DF]" />
                  <Skeleton className="h-3 w-12 mx-auto bg-[#E8E4DF]" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Shop By — compact row above sections (desktop only) */}
              <div className="hidden lg:flex items-center gap-2 overflow-x-auto lg:overflow-x-visible scrollbar-hide py-4 border-b border-[#3D4F3D]/10 mb-6">
                <span className="text-[10px] tracking-[0.2em] text-[#3D4F3D]/40 uppercase flex-shrink-0 pr-1">
                  {t('shop_by')}
                </span>
                {COLLECTIONS.map(col => (
                  <button
                    key={col.key}
                    onClick={() => handleCollectionSelect(col.key)}
                    className="px-3 py-1.5 text-[10px] tracking-widest border border-[#3D4F3D]/20 bg-white text-[#3D4F3D] hover:border-[#3D4F3D]/60 transition-colors flex-shrink-0"
                  >
                    {t(`col_${col.key}`)}
                  </button>
                ))}
              </div>
              <AllProductsSections
                products={products}
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                isInWishlist={isInWishlist}
                currency={currency}
                onProductClick={openProduct}
                onCategorySelect={cat => setFilters(prev => ({ ...prev, category: cat }))}
              />
            </>
          )
        ) : (
          /* ── Filtered grid view ── */
          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            <div className="hidden lg:block space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto scrollbar-hide">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                allProducts={priceRangeProducts}
                isOpen={filterPanelOpen}
                onToggle={() => setFilterPanelOpen(!filterPanelOpen)}
                collections={COLLECTIONS}
                onCollectionSelect={handleCollectionSelect}
              />
            </div>

            <div ref={productGridRef}>
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[3/4] bg-[#E8E4DF]" />
                      <Skeleton className="h-2 w-16 mx-auto bg-[#E8E4DF]" />
                      <Skeleton className="h-3 w-28 mx-auto bg-[#E8E4DF]" />
                      <Skeleton className="h-3 w-12 mx-auto bg-[#E8E4DF]" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-32">
                  <p className="text-[#3D4F3D]/40 text-xs tracking-[0.2em]">{t('no_results')} "{searchQuery}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      onToggleWishlist={toggleWishlist}
                      isInWishlist={isInWishlist(product.id)}
                      currency={currency}
                      onProductClick={p => openProduct(p, filteredProducts)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#2F4E3C] text-white px-4 py-8 lg:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <p className="text-xs tracking-[0.2em] mb-4 text-white/60">{t('contact')}</p>
            <a
              href="mailto:contact@zrbudapest.store"
              className="text-sm tracking-wide opacity-70 hover:opacity-100 transition-opacity underline-offset-2 hover:underline"
            >
              contact@zrbudapest.store
            </a>
            <br />
            <a
              href="tel:+3617049973"
              className="text-sm tracking-wide opacity-70 hover:opacity-100 transition-opacity underline-offset-2 hover:underline mt-1 inline-block"
            >
              +36 1 704 9973
            </a>
          </div>
          <div className="text-center">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69324dcdd5b74406aba69c8c/f85d99a42_ZRlogo.png"
              alt="Zielinski & Rozen"
              className="h-36 mx-auto object-contain brightness-0 invert"
            />
          </div>
          <div className="px-2 text-right">
            <p className="text-xs tracking-[0.2em] mb-4 text-white/60">
              {t('free_delivery_banner', currency === 'EUR' ? '€100' : '39 500 Ft')}
            </p>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Sz%C3%A9kely+Mih%C3%A1ly+u.+4%2C+1061+Budapest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-wide opacity-70 hover:opacity-100 transition-opacity underline-offset-2 hover:underline"
            >
              Székely Mihály u. 4, 1061 Budapest
            </a>
          </div>
        </div>
      </footer>

      {/* Admin link — bottom-left on desktop, above mobile nav on mobile */}
      <div className="fixed bottom-20 left-4 md:bottom-4 md:left-4 z-40">
        <Link to="/admin" className="text-xs text-[#3D4F3D]/40 hover:text-[#3D4F3D]/60 underline">Admin</Link>
      </div>

      {/* ── Floating bag FAB — desktop only (mobile uses bottom nav) ── */}
      <motion.button
        className="hidden md:flex fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#3D4F3D] hover:bg-[#2D3F2D] shadow-lg items-center justify-center transition-colors"
        onClick={() => setCartOpen(true)}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
        aria-label="Open shopping bag"
      >
        <ShoppingBag className="w-6 h-6 text-white" />
        {cartCount > 0 && (
          <motion.span
            key={cartCount}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#3D4F3D] text-[10px] rounded-full flex items-center justify-center font-bold shadow"
          >
            {cartCount}
          </motion.span>
        )}
      </motion.button>

      {/* ── Filter pill — mobile floats above bottom nav, desktop bottom-center ── */}
      <div className="fixed bottom-[64px] md:bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <motion.button
          onClick={() => setFilterPanelOpen(true)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="pointer-events-auto bg-[#3D4F3D] text-white tracking-[0.25em] rounded-full shadow-lg flex items-center gap-2 text-[9px] px-5 py-2.5 md:text-[8px] md:px-4 md:py-2"
        >
          <SlidersHorizontal className="w-3 h-3 md:w-2.5 md:h-2.5" />
          FILTER &amp; SHOP BY
          {activeFiltersCount > 0 && (
            <span className="bg-white text-[#3D4F3D] font-bold rounded-full flex items-center justify-center leading-none text-[9px] w-4 h-4 md:text-[8px] md:w-3.5 md:h-3.5">
              {activeFiltersCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* ── Mobile FilterPanel bottom sheet (rendered here so it sits above everything) ── */}
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        allProducts={priceRangeProducts}
        isOpen={filterPanelOpen}
        onToggle={() => setFilterPanelOpen(false)}
        collections={COLLECTIONS}
        onCollectionSelect={handleCollectionSelect}
        noDesktopPanel
      />

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-[#3D4F3D]/10">
        <div className="flex items-center justify-around py-2 px-1 pb-safe">
          <button
            onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}
            className="flex flex-col items-center gap-0.5 py-1 px-2 text-[#3D4F3D] transition-colors"
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[9px] tracking-wider">{t('shop')}</span>
          </button>
          <Link to="/wishlist" className="flex flex-col items-center gap-0.5 py-1 px-2 text-[#3D4F3D]/50 hover:text-[#3D4F3D] transition-colors relative">
            <Heart className="w-5 h-5" />
            <span className="text-[9px] tracking-wider">{t('wishlist')}</span>
            {wishlist.length > 0 && (
              <span className="absolute top-0.5 right-1 w-3.5 h-3.5 bg-[#3D4F3D] text-white text-[8px] rounded-full flex items-center justify-center font-medium">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link to="/bundle" className="flex flex-col items-center gap-0.5 py-1 px-2 text-[#3D4F3D]/50 hover:text-[#3D4F3D] transition-colors">
            <Gift className="w-5 h-5" />
            <span className="text-[9px] tracking-wider">{t('bundle')}</span>
          </Link>
          <Link to="/orders" className="flex flex-col items-center gap-0.5 py-1 px-2 text-[#3D4F3D]/50 hover:text-[#3D4F3D] transition-colors">
            <Package className="w-5 h-5" />
            <span className="text-[9px] tracking-wider">{t('orders')}</span>
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-2 text-[#3D4F3D]/50 hover:text-[#3D4F3D] transition-colors relative"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[9px] tracking-wider">{t('bag')}</span>
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-1 w-3.5 h-3.5 bg-[#3D4F3D] text-white text-[8px] rounded-full flex items-center justify-center font-medium">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Cart */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }}
        currency={currency}
      />

      {/* Checkout */}
      <CheckoutForm
        open={checkoutOpen}
        onClose={() => { setCheckoutOpen(false); setOrderSuccess(false) }}
        cart={cart}
        currency={currency}
        onOrderSuccess={() => { setOrderSuccess(true); setCart([]) }}
        orderSuccess={orderSuccess}
      />

      {/* Product detail dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={open => !open && setSelectedProduct(null)}>
        <DialogContent
          className="max-w-6xl max-h-[95vh] overflow-y-auto bg-white border-none p-0 rounded-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {selectedProduct && (
            <div className="grid lg:grid-cols-2">
              {/* Image with overlaid controls */}
              <div className="bg-[#E8E4DF] relative">
                <div className="aspect-[3/4] lg:min-h-[600px]">
                  {selectedProduct.image_url && (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} loading="lazy" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* ← BACK button — mobile-prominent */}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 left-4 flex items-center gap-1 bg-white/85 backdrop-blur-sm text-[#3D4F3D] text-[10px] tracking-[0.15em] px-3 py-2 hover:bg-white transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> {t('back')}
                </button>

                {/* Position counter */}
                {browseList.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/30 text-white text-[10px] tracking-widest px-2.5 py-1.5">
                    {currentBrowseIndex + 1} / {browseList.length}
                  </div>
                )}

                {/* Prev arrow */}
                {hasPrev && (
                  <button
                    onClick={goPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                    aria-label="Previous product"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#3D4F3D]" />
                  </button>
                )}

                {/* Next arrow */}
                {hasNext && (
                  <button
                    onClick={goNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                    aria-label="Next product"
                  >
                    <ChevronRight className="w-5 h-5 text-[#3D4F3D]" />
                  </button>
                )}

                {/* Swipe hint — shown briefly on mobile first open */}
                {browseList.length > 1 && (
                  <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-[9px] tracking-widest whitespace-nowrap md:hidden pointer-events-none">
                    {t('swipe_browse')}
                  </p>
                )}
              </div>

              <div className="flex flex-col h-full">
                <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
                  <div className="mb-8">
                    <div className="border-t-2 border-b-2 border-dashed border-[#3D4F3D] py-4 mb-4">
                      <DialogTitle className="text-3xl lg:text-4xl text-[#3D4F3D] font-bold tracking-wider leading-tight uppercase">
                        {selectedProduct.name?.replace(selectedProduct.category, '').replace(`(${selectedProduct.size})`, '').trim() || selectedProduct.name}
                      </DialogTitle>
                    </div>
                    <div className="border-t-2 border-b-2 border-dashed border-[#3D4F3D] py-3 flex items-center justify-between">
                      <p className="text-sm text-[#3D4F3D] font-bold tracking-wider uppercase">
                        {selectedProduct.category}{selectedProduct.size && ` ${selectedProduct.size}`}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {['EUR', 'HUF'].map(cur => (
                            <button
                              key={cur}
                              onClick={() => setCurrency(cur)}
                              className={`px-2 py-0.5 text-[10px] tracking-widest transition-colors ${
                                currency === cur
                                  ? 'text-[#3D4F3D] font-bold'
                                  : 'text-[#3D4F3D]/40 hover:text-[#3D4F3D]/70'
                              }`}
                            >
                              {cur}
                            </button>
                          ))}
                        </div>
                        <p className="text-xl text-[#3D4F3D] font-bold">{formatPrice(selectedProduct.price, currency)}</p>
                      </div>
                    </div>
                  </div>

                  {selectedProduct.size && (
                    <div className="mb-4">
                      <div className="inline-block border-2 border-[#3D4F3D] px-8 py-3">
                        <span className="text-base font-bold text-[#3D4F3D] tracking-wider">{selectedProduct.size}</span>
                      </div>
                    </div>
                  )}

                  {selectedProduct.stock === 0 && (
                    <p className="text-xs tracking-[0.15em] text-red-600 mb-4">{t('out_of_stock')}</p>
                  )}
                  {selectedProduct.stock > 0 && selectedProduct.stock < 5 && (
                    <p className="text-xs tracking-[0.15em] text-amber-700 mb-4">{t('only_left', selectedProduct.stock)}</p>
                  )}

                  <div className="mb-8 mt-12">
                    <div className="flex justify-center gap-2 mb-4">
                      {['EN', 'HU'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => setDescriptionLang(lang)}
                          className={`px-4 py-1 text-xs tracking-widest transition-colors border ${
                            descriptionLang === lang
                              ? 'bg-[#3D4F3D] text-white border-[#3D4F3D]'
                              : 'bg-white text-[#3D4F3D] border-[#3D4F3D]/20 hover:border-[#3D4F3D]/40'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-[#3D4F3D] leading-relaxed tracking-wide">
                      {descriptionLang === 'EN'
                        ? (selectedProduct.description || 'Zielinski & Rozen fragrances are unisex, designed to evolve and reveal their unique essence on your skin.')
                        : (selectedProduct.description_hu || selectedProduct.description || 'Zielinski & Rozen fragrances are unisex, designed to evolve and reveal their unique essence on your skin.')}
                    </p>
                  </div>
                </div>

                <div className="p-8 lg:px-12 lg:pb-12 bg-white">
                  <div className="space-y-4">
                    <Button
                      onClick={() => { addToCart(selectedProduct); setSelectedProduct(null) }}
                      className="w-full bg-[#3D4F3D] hover:bg-[#2D3F2D] text-white text-sm tracking-[0.15em] h-16 rounded-none uppercase font-bold flex items-center justify-between px-6"
                    >
                      <span>{t('add_to_cart')}</span>
                      <span>{formatPrice(selectedProduct.price, currency)}</span>
                    </Button>
                    <button
                      onClick={() => toggleWishlist(selectedProduct)}
                      className="w-full text-center text-[#3D4F3D] text-base tracking-wide hover:underline"
                    >
                      {isInWishlist(selectedProduct.id) ? t('remove_wishlist') : t('add_wishlist')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
