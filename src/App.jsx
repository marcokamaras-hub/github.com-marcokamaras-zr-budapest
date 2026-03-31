import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { LanguageProvider } from '@/lib/i18n'

import Shop              from '@/pages/Shop'
import Wishlist          from '@/pages/Wishlist'
import BundleBuilder     from '@/pages/BundleBuilder'
import MyOrders          from '@/pages/MyOrders'
import Admin             from '@/pages/Admin'
import AdminLogin        from '@/pages/AdminLogin'
import AdminGuard        from '@/components/AdminGuard'
import OrderConfirmation from '@/pages/OrderConfirmation'
import ProductDetail from '@/pages/ProductDetail'

export default function App() {
  return (
    <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* ── Storefront ── */}
          <Route path="/"         element={<Shop />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/bundle"   element={<BundleBuilder />} />
          <Route path="/orders"   element={<MyOrders />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* ── Admin ── */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <Admin />
              </AdminGuard>
            }
          />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster position="bottom-right" richColors duration={1800} />
    </QueryClientProvider>
    </LanguageProvider>
  )
}
