import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from '@/lib/i18n'

export default function FilterPanel({ filters, onFiltersChange, allProducts, isOpen, onToggle, collections, onCollectionSelect, noDesktopPanel }) {
  const t = useT()

  const maxPrice = Math.max(...allProducts.map(p => p.price || 0), 210);
  const minPrice = allProducts.length > 0
    ? Math.min(...allProducts.map(p => p.price || Infinity))
    : 0;

  const handlePriceChange = (value) => {
    onFiltersChange({ ...filters, priceRange: [0, value[0]] });
  };

  const handleBestsellerToggle = () => {
    const turningOn = !filters.bestsellersOnly
    onFiltersChange({
      ...filters,
      bestsellersOnly: turningOn,
      newArrivalsOnly: false,
      ...(turningOn ? { collections: [], category: 'all' } : {}),
    })
  }

  const handleNewArrivalsToggle = () => {
    const turningOn = !filters.newArrivalsOnly
    onFiltersChange({
      ...filters,
      newArrivalsOnly: turningOn,
      bestsellersOnly: false,
      ...(turningOn ? { collections: [], category: 'all' } : {}),
    })
  }

  const handleInStockToggle = () => {
    onFiltersChange({ ...filters, inStockOnly: !filters.inStockOnly });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      category:        filters.category,
      collections:     [],
      priceRange:      [0, maxPrice],
      bestsellersOnly: false,
      newArrivalsOnly: false,
      inStockOnly:     false,
    });
  };

  const activeFiltersCount =
    (filters.priceRange[1] < maxPrice ? 1 : 0) +
    (filters.bestsellersOnly ? 1 : 0) +
    (filters.newArrivalsOnly ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  // Shared filter content used in both desktop sidebar and mobile sheet
  const filterContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[#3D4F3D] text-sm tracking-[0.2em] font-medium">{t('filters')}</h3>
        {activeFiltersCount > 0 && (
          <Button onClick={clearAllFilters} variant="ghost" size="sm" className="text-xs text-[#3D4F3D]/60 hover:text-[#3D4F3D]">
            {t('clear_all')}
          </Button>
        )}
      </div>

      {/* Special Collections */}
      <div className="space-y-3">
        <Label className="text-[10px] text-[#3D4F3D]/50 tracking-[0.15em] uppercase">
          {t('collections')}
        </Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox id="bestsellers" checked={filters.bestsellersOnly} onCheckedChange={handleBestsellerToggle} />
            <label htmlFor="bestsellers" className="text-sm text-[#3D4F3D] cursor-pointer">{t('bestsellers_filter')}</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="newarrivals" checked={filters.newArrivalsOnly} onCheckedChange={handleNewArrivalsToggle} />
            <label htmlFor="newarrivals" className="text-sm text-[#3D4F3D] cursor-pointer">{t('new_arrivals')}</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="instock" checked={filters.inStockOnly} onCheckedChange={handleInStockToggle} />
            <label htmlFor="instock" className="text-sm text-[#3D4F3D] cursor-pointer">{t('in_stock_only')}</label>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-[10px] text-[#3D4F3D]/50 tracking-[0.15em] uppercase">
          {t('price_range')}
        </Label>
        <div className="px-2">
          <Slider
            min={0}
            max={maxPrice}
            step={5}
            value={[filters.priceRange[1]]}
            onValueChange={handlePriceChange}
            className="my-4"
          />
          <div className="flex justify-between text-xs text-[#3D4F3D]/70">
            <span>€0</span>
            <span>€{filters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="pt-4 border-t border-[#3D4F3D]/10">
          <Label className="text-[10px] text-[#3D4F3D]/50 tracking-[0.15em] uppercase mb-3 block">
            {t('active_filters')}
          </Label>
          <div className="flex flex-wrap gap-2">
            {filters.bestsellersOnly && (
              <Badge variant="outline" className="bg-[#3D4F3D]/5 border-[#3D4F3D]/20">
                {t('bestsellers_filter')}
                <button onClick={handleBestsellerToggle} className="ml-1 hover:text-red-600"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.newArrivalsOnly && (
              <Badge variant="outline" className="bg-[#3D4F3D]/5 border-[#3D4F3D]/20">
                {t('new_arrivals')}
                <button onClick={handleNewArrivalsToggle} className="ml-1 hover:text-red-600"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.inStockOnly && (
              <Badge variant="outline" className="bg-[#3D4F3D]/5 border-[#3D4F3D]/20">
                {t('in_stock_badge')}
                <button onClick={handleInStockToggle} className="ml-1 hover:text-red-600"><X className="w-3 h-3" /></button>
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Shop By — shown only in mobile sheet */}
      {collections && onCollectionSelect && (
        <div className="space-y-3 lg:hidden border-t border-[#3D4F3D]/10 pt-6">
          <Label className="text-[10px] text-[#3D4F3D]/50 tracking-[0.15em] uppercase">
            {t('shop_by')}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {collections.map(col => (
              <button
                key={col.key}
                onClick={() => { onCollectionSelect(col.key); onToggle(); }}
                className={`px-3 py-2.5 text-[10px] tracking-widest border transition-colors text-left ${
                  filters.collections[0] === col.key
                    ? 'bg-[#3D4F3D] text-white border-[#3D4F3D]'
                    : 'bg-white text-[#3D4F3D] border-[#3D4F3D]/20 hover:border-[#3D4F3D]/60'
                }`}
              >
                {t(`col_${col.key}`)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* ── Mobile: bottom sheet ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/30 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
            />
            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#F5F3F0] rounded-t-2xl overflow-y-auto"
              style={{ maxHeight: '82vh' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-[#F5F3F0]">
                <div className="w-10 h-1 bg-[#3D4F3D]/20 rounded-full" />
              </div>
              <div className="px-6 pb-10">
                {filterContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop: static sidebar panel ── */}
      {!noDesktopPanel && (
        <div className="hidden lg:block bg-white border border-[#3D4F3D]/10 p-6">
          {filterContent}
        </div>
      )}
    </>
  )
}
