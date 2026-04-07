import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, ShoppingCart, Euro, AlertCircle, Plus, Pencil, Search, Clock, Truck, CheckCircle2, XCircle, Upload, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllProducts, createProduct, updateProduct } from '@/api/products'
import { fetchAllOrders, updateOrder } from '@/api/orders'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   icon: Clock,        color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', icon: AlertCircle,  color: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Preparing', icon: Package,      color: 'bg-purple-100 text-purple-700' },
  shipped:   { label: 'Shipped',   icon: Truck,        color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', icon: XCircle,      color: 'bg-red-100 text-red-700' },
}

const CATEGORIES = [
  'Perfume', 'Hand cream', 'Body cream', 'Body scrub', 'Body oil',
  'Shower gel', 'Shampoo', 'Hair conditioner', 'Keratin hair mask',
  'Liquid soap', 'Solid soap', 'Candle', 'Diffuser',
  'Dead sea salt', 'Giftbox', 'Other',
]

// ─── Product Form ────────────────────────────────────────────
function ProductForm({ product, onSubmit, onClose }) {
  const [formData, setFormData] = useState(product || {
    name: '', sku: '', ean: '', price: '', stock: 0,
    category: 'Perfume', size: '', description: '', description_hu: '',
    image_url: '', is_active: true,
  })

  const set = patch => setFormData(prev => ({ ...prev, ...patch }))

  const handleSubmit = e => {
    e.preventDefault()
    onSubmit({ ...formData, price: parseFloat(formData.price) || 0, stock: parseInt(formData.stock) || 0 })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Product Name *</Label>
          <Input value={formData.name} onChange={e => set({ name: e.target.value })} required className="mt-1" />
        </div>
        <div>
          <Label>SKU</Label>
          <Input value={formData.sku} onChange={e => set({ sku: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>EAN</Label>
          <Input value={formData.ean} onChange={e => set({ ean: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Price (€) *</Label>
          <Input type="number" step="0.01" value={formData.price} onChange={e => set({ price: e.target.value })} required className="mt-1" />
        </div>
        <div>
          <Label>Stock</Label>
          <Input type="number" value={formData.stock} onChange={e => set({ stock: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Category *</Label>
          <Select value={formData.category} onValueChange={v => set({ category: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Size</Label>
          <Input value={formData.size} onChange={e => set({ size: e.target.value })} placeholder="e.g. 50 ml" className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Image URL</Label>
          <Input value={formData.image_url} onChange={e => set({ image_url: e.target.value })} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Description (EN)</Label>
          <Textarea value={formData.description} onChange={e => set({ description: e.target.value })} className="mt-1" rows={2} />
        </div>
        <div className="col-span-2">
          <Label>Description (HU)</Label>
          <Textarea value={formData.description_hu} onChange={e => set({ description_hu: e.target.value })} className="mt-1" rows={2} />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <Switch checked={formData.is_active} onCheckedChange={v => set({ is_active: v })} />
          <Label>Active (visible in shop)</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="bg-stone-900 hover:bg-stone-800">{product ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  )
}

// ─── Admin Page ──────────────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate()
  const [search, setSearch]               = useState('')
  const [productDialog, setProductDialog] = useState({ open: false, product: null })
  const [statusFilter, setStatusFilter]   = useState('all')
  const [csvImporting, setCsvImporting]   = useState(false)
  const csvInputRef = useRef(null)
  const qc = useQueryClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  const { data: products = [], isLoading: prodLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchAllProducts,
  })

  const { data: orders = [], isLoading: ordLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchAllOrders,
  })

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setProductDialog({ open: false, product: null }); toast.success('Product created') },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setProductDialog({ open: false, product: null }); toast.success('Product updated') },
  })

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => updateOrder(id, data),
    onSuccess: (_, { id, data }) => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Order updated')
      // Trigger shipping email when status moves to shipped or delivered
      if (data.status === 'shipped' || data.status === 'delivered') {
        supabase.functions.invoke('send-email', {
          body: { type: 'order_shipped', order_id: id },
        }).catch(() => { /* email notification failed silently */ })
      }
    },
  })

  const handleProductSubmit = data => {
    if (productDialog.product) updateMutation.mutate({ id: productDialog.product.id, data })
    else createMutation.mutate(data)
  }

  const handleCsvImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setCsvImporting(true)
    try {
      const text = await file.text()
      const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) throw new Error('CSV appears empty')

      // RFC 4180-compliant CSV parser (handles quoted fields with commas)
      const parseCsvLine = (line) => {
        const cols = []
        let cur = '', inQuotes = false
        for (let i = 0; i < line.length; i++) {
          const ch = line[i]
          if (ch === '"') { inQuotes = !inQuotes }
          else if (ch === ',' && !inQuotes) { cols.push(cur.trim()); cur = '' }
          else { cur += ch }
        }
        cols.push(cur.trim())
        return cols
      }

      const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase())
      const skuIdx   = headers.findIndex(h => ['sku', 'custom sku', 'item_code', 'reference', 'code', 'manufact. sku'].includes(h))
      const eanIdx   = headers.findIndex(h => ['ean', 'barcode', 'upc', 'ean13'].includes(h))
      const stockIdx = headers.findIndex(h => ['stock', 'quantity', 'qty', 'available', 'inventory', 'remaining'].includes(h))

      if (stockIdx === -1) throw new Error('No stock/quantity column found — expected: stock, quantity, qty, or remaining')
      if (skuIdx === -1 && eanIdx === -1) throw new Error('No SKU or EAN column found — expected: sku, ean, or barcode')

      const rows = lines.slice(1).map(line => {
        const cols = parseCsvLine(line)
        return {
          sku:   skuIdx  !== -1 ? cols[skuIdx]  : null,
          ean:   eanIdx  !== -1 ? cols[eanIdx]  : null,
          stock: parseInt(cols[stockIdx]) || 0,
        }
      }).filter(r => r.sku || r.ean)

      const updates = rows.map(row => {
        const match = products.find(p =>
          (row.sku && p.sku === row.sku) ||
          (row.ean && p.ean === row.ean)
        )
        return match ? { id: match.id, stock: row.stock } : null
      }).filter(Boolean)

      const notFound = rows.length - updates.length
      await Promise.all(updates.map(u =>
        supabase.from('products').update({ stock: u.stock }).eq('id', u.id)
      ))
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success(`Import complete — ${updates.length} updated${notFound ? `, ${notFound} not matched` : ''}`)
    } catch (err) {
      toast.error(`Import failed: ${err.message}`)
    } finally {
      setCsvImporting(false)
    }
  }

  const [stockSort, setStockSort] = useState(null) // null | 'asc' | 'desc'

  const filteredProducts = products
    .filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (stockSort === 'asc')  return (a.stock ?? 0) - (b.stock ?? 0)
      if (stockSort === 'desc') return (b.stock ?? 0) - (a.stock ?? 0)
      return 0
    })

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)

  const totalRevenue   = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0)
  const pendingOrders  = orders.filter(o => o.status === 'pending').length
  const lowStock       = products.filter(p => p.stock > 0 && p.stock < 5).length

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
            <p className="text-stone-500 text-sm">Zielinski & Rozen — Budapest</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
            <Button onClick={() => csvInputRef.current?.click()} disabled={csvImporting} variant="outline" size="sm" className="gap-2">
              <Upload className={`w-4 h-4 ${csvImporting ? 'animate-pulse' : ''}`} />
              {csvImporting ? 'Importing...' : 'Import CSV'}
            </Button>
            <Button onClick={handleSignOut} variant="ghost" size="sm" className="gap-2 text-stone-500 hover:text-red-600">
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Products',       value: products.length,         icon: Package,      bg: 'bg-blue-100',   ic: 'text-blue-600' },
            { label: 'Low Stock',      value: lowStock,                icon: AlertCircle,  bg: 'bg-amber-100',  ic: 'text-amber-600' },
            { label: 'Pending Orders', value: pendingOrders,           icon: ShoppingCart, bg: 'bg-purple-100', ic: 'text-purple-600' },
            { label: 'Revenue',        value: `€${totalRevenue.toFixed(0)}`, icon: Euro,   bg: 'bg-green-100',  ic: 'text-green-600' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.ic}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <p className="text-xs text-stone-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="bg-white border">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* ── Products tab ── */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">Inventory</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
                  </div>
                  <Dialog open={productDialog.open} onOpenChange={open => setProductDialog({ open, product: null })}>
                    <DialogTrigger asChild>
                      <Button className="bg-stone-900 hover:bg-stone-800"><Plus className="w-4 h-4 mr-2" />Add Product</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>{productDialog.product ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
                      <ProductForm product={productDialog.product} onSubmit={handleProductSubmit} onClose={() => setProductDialog({ open: false, product: null })} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {prodLoading ? (
                  <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>
                            <button
                              onClick={() => setStockSort(s => s === 'asc' ? 'desc' : 'asc')}
                              className="flex items-center gap-1 hover:text-black transition-colors"
                            >
                              Stock
                              <span className="text-xs text-stone-400">
                                {stockSort === 'asc' ? '↑' : stockSort === 'desc' ? '↓' : '↕'}
                              </span>
                            </button>
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map(product => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium max-w-xs truncate">{product.name}</TableCell>
                            <TableCell className="text-stone-500 text-sm">{product.sku || '-'}</TableCell>
                            <TableCell><Badge variant="secondary">{product.category}</Badge></TableCell>
                            <TableCell>€{Number(product.price).toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={product.stock <= 0 ? 'text-red-600' : product.stock < 5 ? 'text-amber-600' : ''}>
                                {product.stock}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={product.is_active ? 'bg-green-100 text-green-700' : ''} variant={product.is_active ? 'default' : 'secondary'}>
                                {product.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => setProductDialog({ open: true, product })}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Orders tab ── */}
          <TabsContent value="orders">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">Orders</CardTitle>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {ordLoading ? (
                  <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-stone-500">No orders yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map(order => {
                          const status     = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                          const StatusIcon = status.icon
                          return (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{order.customer_name}</p>
                                  <p className="text-xs text-stone-500">{order.customer_phone}</p>
                                </div>
                              </TableCell>
                              <TableCell>{order.items?.length || 0} items</TableCell>
                              <TableCell className="font-medium">€{Number(order.total).toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                                  {order.payment_status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${status.color} border-0`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />{status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-stone-500 text-sm">
                                {order.created_at ? format(new Date(order.created_at), 'MMM d, HH:mm') : '-'}
                              </TableCell>
                              <TableCell>
                                <Select value={order.status} onValueChange={v => updateOrderMutation.mutate({ id: order.id, data: { status: v } })}>
                                  <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                                      <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
