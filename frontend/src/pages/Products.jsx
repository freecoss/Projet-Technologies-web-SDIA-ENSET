import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal, Tag, Package, Image as ImageIcon } from "lucide-react"
import API_URL from "@/config"

export function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [currentPage, setCurrentPage] = useState(1)

  const [searchParams] = useSearchParams()

  // Filters state - initialize from URL params if coming from SearchBar
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStore, setSelectedStore] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedStore) params.append('store', selectedStore)
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)
      params.append('page', currentPage)
      params.append('limit', 12)

      const [prodRes, catRes, storeRes] = await Promise.all([
        fetch(`${API_URL}/api/products?${params.toString()}`),
        fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/stores`)
      ])
      
      if (prodRes.ok) {
        const data = await prodRes.json()
        setProducts(data.products || [])
        setPagination(data.pagination || { total: 0, page: 1, totalPages: 1 })
      }
      if (catRes.ok) setCategories(await catRes.json())
      if (storeRes.ok) setStores(await storeRes.json())
    } catch (error) {
      console.error("Erreur de chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load categories and stores once, and products on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts()
    }, 500) // Debounce 500ms
    return () => clearTimeout(timer)
  }, [search, selectedCategory, selectedStore, minPrice, maxPrice, currentPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedCategory, selectedStore, minPrice, maxPrice])

  const filteredProducts = useMemo(() => {
    return products.sort((a, b) => {
      // Sorting remains on the frontend for now for better UI reactivity
      const priceA = a.current_price ? parseFloat(a.current_price) : Infinity
      const priceB = b.current_price ? parseFloat(b.current_price) : Infinity
      
      if (sortBy === 'price_asc') return priceA - priceB
      if (sortBy === 'price_desc') return priceB - priceA
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [products, sortBy])

  return (
    <div className="flex flex-col md:flex-row gap-8 py-8 animate-in fade-in duration-500">
      
      {/* Sidebar - Filtres */}
      <aside className="w-full md:w-64 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-bch7al-darkgray/10 space-y-6">
          <div className="flex items-center gap-2 text-bch7al-navy font-bold text-lg border-b pb-4">
            <SlidersHorizontal className="w-5 h-5" />
            Filtres
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-bch7al-darkgray">Catégorie</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-bch7al-darkgray/20 bg-bch7al-lightgray text-sm focus:outline-none focus:ring-2 focus:ring-bch7al-blue"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-bch7al-darkgray">Magasin</label>
            <select 
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-bch7al-darkgray/20 bg-bch7al-lightgray text-sm focus:outline-none focus:ring-2 focus:ring-bch7al-blue"
            >
              <option value="">Tous les magasins</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-bch7al-darkgray">Prix (DH)</label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                placeholder="Min" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)} 
                className="bg-bch7al-lightgray"
              />
              <span className="text-bch7al-darkgray/50">-</span>
              <Input 
                type="number" 
                placeholder="Max" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-bch7al-lightgray" 
              />
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full text-bch7al-navy border-bch7al-darkgray/20 hover:bg-bch7al-lightgray"
            onClick={() => {
              setSelectedCategory('')
              setSelectedStore('')
              setMinPrice('')
              setMaxPrice('')
              setSearch('')
            }}
          >
            Réinitialiser
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-bch7al-darkgray/10">
          <div className="relative w-full sm:max-w-md">
            <Input
              type="text"
              placeholder="Rechercher par nom ou marque..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-bch7al-lightgray rounded-full"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bch7al-darkgray/50" />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-sm font-medium text-bch7al-darkgray whitespace-nowrap">Trier par:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-3 pr-8 rounded-full border border-bch7al-darkgray/20 bg-bch7al-lightgray text-sm font-medium text-bch7al-navy focus:outline-none focus:ring-2 focus:ring-bch7al-blue"
            >
              <option value="recent">Plus récent</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>
        </div>

        {/* Grille */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bch7al-blue"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-bch7al-darkgray bg-white rounded-2xl border border-bch7al-darkgray/10 border-dashed">
            <Package className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Aucun produit trouvé.</p>
            <p className="text-sm opacity-70">Essayez de modifier vos filtres.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="block">
                <Card className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-2xl cursor-pointer h-full">
                  {/* Image Placeholder */}
                  <div className="aspect-square bg-bch7al-lightgray flex items-center justify-center relative overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <ImageIcon className="w-16 h-16 text-bch7al-darkgray/20" />
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-bch7al-blue" />
                      <span className="font-bold text-bch7al-navy">{product.current_price ? `${product.current_price} DH` : '-- DH'}</span>
                    </div>
                  </div>
                  
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-bch7al-blue bg-bch7al-blue/10 px-2 py-1 rounded-md">
                          {product.category_name || 'Catégorie'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-xl text-bch7al-navy truncate">{product.name}</h3>
                      <p className="text-sm font-medium text-bch7al-darkgray/70">{product.brand || 'Sans marque'}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-full border-bch7al-darkgray/20"
            >
              ← Précédent
            </Button>
            <span className="text-sm font-semibold text-bch7al-navy bg-bch7al-lightgray px-4 py-2 rounded-full">
              Page {currentPage} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
              className="rounded-full border-bch7al-darkgray/20"
            >
              Suivant →
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
