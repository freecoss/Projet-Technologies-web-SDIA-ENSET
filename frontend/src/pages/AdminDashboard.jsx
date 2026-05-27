import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, Package, Tag, Store, BarChart3, 
  CheckCircle, XCircle, Trash2, Edit, Save, Plus
} from 'lucide-react'
import { toast } from 'react-toastify'
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { fetchApi } from '@/utils/api'

const COLORS = ['#2ECC71', '#F39C12', '#E74C3C']; // Approved (Green), Pending (Orange), Rejected (Red)

export function AdminDashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Data States
  const [stats, setStats] = useState(null)
  const [usersList, setUsersList] = useState([])
  const [pendingProducts, setPendingProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [stores, setStores] = useState([])

  // Category CRUD State
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryData, setCategoryData] = useState({ name: '', description: '' })
  const [isSubmittingCat, setIsSubmittingCat] = useState(false)

  // Store CRUD State
  const [showStoreForm, setShowStoreForm] = useState(false)
  const [editingStore, setEditingStore] = useState(null)
  const [storeData, setStoreData] = useState({ name: '', website: '', address: '', logo: '' })
  const [isSubmittingStore, setIsSubmittingStore] = useState(false)

  // Redirect if not admin or moderator
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      toast.error("Accès refusé. Réservé aux administrateurs et modérateurs.")
      navigate('/')
    }
  }, [user, navigate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, prodsRes, catsRes, storesRes] = await Promise.all([
        fetchApi('/api/admin/stats'),
        fetchApi('/api/users'),
        fetchApi('/api/products/pending'),
        fetchApi('/api/categories'),
        fetchApi('/api/stores')
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (usersRes.ok) setUsersList(await usersRes.json())
      if (prodsRes.ok) setPendingProducts(await prodsRes.json())
      if (catsRes.ok) setCategories(await catsRes.json())
      if (storesRes.ok) setStores(await storesRes.json())
    } catch (err) {
      console.error(err)
      toast.error("Erreur de connexion au serveur.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'moderator') && token) {
      fetchData()
    }
  }, [user, token])

  // --- ACTIONS UTILISATEURS ---
  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await fetchApi(`/api/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      })
      if (res.ok) {
        toast.success("Rôle mis à jour")
        setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u))
      } else {
        const err = await res.json()
        toast.error(err.message || "Erreur")
      }
    } catch (e) { toast.error("Erreur") }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir bannir (supprimer) cet utilisateur ?")) return
    try {
      const res = await fetchApi(`/api/users/${userId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success("Utilisateur banni")
        setUsersList(usersList.filter(u => u.id !== userId))
        setStats({...stats, totalUsers: stats.totalUsers - 1})
      } else {
        const err = await res.json()
        toast.error(err.message || "Erreur")
      }
    } catch (e) { toast.error("Erreur") }
  }

  // --- ACTIONS PRODUITS ---
  const handleProductStatus = async (productId, status) => {
    try {
      const res = await fetchApi(`/api/products/${productId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast.success(`Produit ${status === 'approved' ? 'approuvé' : 'rejeté'} !`)
        setPendingProducts(pendingProducts.filter(p => p.id !== productId))
        fetchData() // Refresh stats
      }
    } catch (e) { toast.error("Erreur") }
  }

  // --- ACTIONS CATEGORIES ---
  const handleSaveCategory = async (e) => {
    e.preventDefault()
    setIsSubmittingCat(true)
    try {
      const method = editingCategory ? 'PUT' : 'POST'
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : `/api/categories`
      const res = await fetchApi(url, {
        method,
        body: JSON.stringify(categoryData)
      })
      if (res.ok) {
        toast.success("Catégorie enregistrée")
        setShowCategoryForm(false)
        fetchData()
      } else toast.error("Erreur")
    } catch (err) { toast.error("Erreur") } finally { setIsSubmittingCat(false) }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Supprimer cette catégorie ?")) return
    try {
      const res = await fetchApi(`/api/categories/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success("Supprimée"); fetchData() }
    } catch (err) { toast.error("Erreur") }
  }

  // --- ACTIONS MAGASINS ---
  const handleSaveStore = async (e) => {
    e.preventDefault()
    setIsSubmittingStore(true)
    try {
      const method = editingStore ? 'PUT' : 'POST'
      const url = editingStore ? `/api/stores/${editingStore.id}` : `/api/stores`
      const res = await fetchApi(url, {
        method,
        body: JSON.stringify(storeData)
      })
      if (res.ok) {
        toast.success("Magasin enregistré")
        setShowStoreForm(false)
        fetchData()
      } else toast.error("Erreur")
    } catch (err) { toast.error("Erreur") } finally { setIsSubmittingStore(false) }
  }

  const handleDeleteStore = async (id) => {
    if (!window.confirm("Supprimer ce magasin ?")) return
    try {
      const res = await fetchApi(`/api/stores/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success("Supprimé"); fetchData() }
    } catch (err) { toast.error("Erreur") }
  }

  // Charts Data Prep
  const pieData = stats ? [
    { name: 'Approuvés', value: stats.totalProducts },
    { name: 'En Attente', value: stats.pendingProducts },
    { name: 'Rejetés', value: stats.rejectedProducts || 0 }
  ] : []

  const barData = stats ? [
    { name: 'Produits', value: stats.totalProducts + stats.pendingProducts + (stats.rejectedProducts||0) },
    { name: 'Prix Renseignés', value: stats.totalPrices },
    { name: 'Commentaires', value: stats.totalComments }
  ] : []

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in flex flex-col md:flex-row gap-8">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <div className="bg-bch7al-navy p-6 rounded-3xl mb-4 text-center text-white shadow-lg">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-extrabold text-lg">{user.role === 'admin' ? 'Admin Panel' : 'Mod Panel'}</h2>
        </div>

        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'overview' ? 'bg-bch7al-blue text-white shadow-md' : 'text-bch7al-darkgray hover:bg-bch7al-lightgray'}`}>
            <BarChart3 className="w-5 h-5" /> Vue d'ensemble
          </button>
          <button onClick={() => setActiveTab('products')} className={`flex justify-between items-center px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'products' ? 'bg-bch7al-blue text-white shadow-md' : 'text-bch7al-darkgray hover:bg-bch7al-lightgray'}`}>
            <div className="flex items-center gap-3"><Package className="w-5 h-5" /> Produits</div>
            {pendingProducts.length > 0 && <span className="bg-bch7al-red text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingProducts.length}</span>}
          </button>

          {user.role === 'admin' && (
            <>
              <button onClick={() => setActiveTab('users')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'users' ? 'bg-bch7al-blue text-white shadow-md' : 'text-bch7al-darkgray hover:bg-bch7al-lightgray'}`}>
                <Users className="w-5 h-5" /> Utilisateurs
              </button>
              <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'categories' ? 'bg-bch7al-blue text-white shadow-md' : 'text-bch7al-darkgray hover:bg-bch7al-lightgray'}`}>
                <Tag className="w-5 h-5" /> Catégories
              </button>
              <button onClick={() => setActiveTab('stores')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'stores' ? 'bg-bch7al-blue text-white shadow-md' : 'text-bch7al-darkgray hover:bg-bch7al-lightgray'}`}>
                <Store className="w-5 h-5" /> Magasins
              </button>
            </>
          )}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-bch7al-darkgray/10 min-h-[60vh]">
        {loading || !stats ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bch7al-blue"></div>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in">
                <h2 className="text-3xl font-extrabold text-bch7al-navy mb-6">Vue d'ensemble</h2>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-bch7al-lightgray p-6 rounded-2xl flex flex-col justify-center">
                    <span className="text-bch7al-darkgray font-bold text-sm">Total Utilisateurs</span>
                    <span className="text-4xl font-extrabold text-bch7al-navy">{stats.totalUsers}</span>
                  </div>
                  <div className="bg-bch7al-lightgray p-6 rounded-2xl flex flex-col justify-center">
                    <span className="text-bch7al-darkgray font-bold text-sm">Produits Actifs</span>
                    <span className="text-4xl font-extrabold text-bch7al-green">{stats.totalProducts}</span>
                  </div>
                  <div className="bg-bch7al-lightgray p-6 rounded-2xl flex flex-col justify-center">
                    <span className="text-bch7al-darkgray font-bold text-sm">En attente</span>
                    <span className="text-4xl font-extrabold text-orange-500">{stats.pendingProducts}</span>
                  </div>
                  <div className="bg-bch7al-lightgray p-6 rounded-2xl flex flex-col justify-center">
                    <span className="text-bch7al-darkgray font-bold text-sm">Total Prix</span>
                    <span className="text-4xl font-extrabold text-bch7al-blue">{stats.totalPrices}</span>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                  {/* Pie Chart */}
                  <div className="bg-white border border-bch7al-darkgray/10 p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-lg text-bch7al-navy mb-4 text-center">Produits par Statut</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={90}
                            paddingAngle={5} dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="bg-white border border-bch7al-darkgray/10 p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-lg text-bch7al-navy mb-4 text-center">Activité de la Plateforme</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" tick={{fontSize: 12}} />
                          <YAxis tick={{fontSize: 12}} />
                          <Tooltip cursor={{fill: 'transparent'}} />
                          <Bar dataKey="value" fill="#1C64F2" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-3xl font-extrabold text-bch7al-navy mb-6">Gestion Utilisateurs</h2>
                <div className="overflow-x-auto bg-white border border-bch7al-darkgray/10 rounded-2xl">
                  <table className="w-full text-left text-sm text-bch7al-navy">
                    <thead className="bg-bch7al-lightgray text-xs uppercase text-bch7al-darkgray">
                      <tr>
                        <th className="px-6 py-4">Utilisateur</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Rôle</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bch7al-darkgray/10">
                      {usersList.map(u => (
                        <tr key={u.id} className="hover:bg-bch7al-lightgray/50 transition-colors">
                          <td className="px-6 py-4 font-bold">{u.name}</td>
                          <td className="px-6 py-4">{u.email}</td>
                          <td className="px-6 py-4">
                            <select 
                              value={u.role} 
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              disabled={u.id === user.id}
                              className="bg-white border border-bch7al-darkgray/20 rounded-lg px-2 py-1 text-xs font-bold uppercase focus:ring-2 focus:ring-bch7al-blue"
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            {u.id !== user.id && (
                              <button onClick={() => handleDeleteUser(u.id)} className="text-bch7al-red hover:text-red-700 bg-bch7al-red/10 p-2 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PRODUCTS */}
            {activeTab === 'products' && (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-3xl font-extrabold text-bch7al-navy mb-6">Produits en attente</h2>
                {pendingProducts.length === 0 ? (
                  <p className="text-bch7al-darkgray bg-bch7al-lightgray p-6 rounded-2xl text-center font-bold">Aucun produit en attente d'approbation.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingProducts.map(p => (
                      <div key={p.id} className="border border-bch7al-darkgray/10 rounded-2xl p-4 flex gap-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-24 h-24 bg-bch7al-lightgray rounded-xl overflow-hidden shrink-0">
                          {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-4 text-bch7al-darkgray/20" />}
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-bch7al-blue uppercase">{p.category_name}</span>
                            <h4 className="font-extrabold text-bch7al-navy text-lg leading-tight">{p.name}</h4>
                            <p className="text-xs text-bch7al-darkgray mt-1">Par: <span className="font-bold">{p.user_name}</span></p>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button onClick={() => handleProductStatus(p.id, 'approved')} size="sm" className="bg-bch7al-green hover:bg-green-600 text-white rounded-lg flex-1 h-8">
                              <CheckCircle className="w-4 h-4 mr-1" /> Approuver
                            </Button>
                            <Button onClick={() => handleProductStatus(p.id, 'rejected')} size="sm" variant="destructive" className="rounded-lg flex-1 h-8">
                              <XCircle className="w-4 h-4 mr-1" /> Rejeter
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-extrabold text-bch7al-navy">Gestion Catégories</h2>
                  <Button onClick={() => { setEditingCategory(null); setCategoryData({name:'', description:''}); setShowCategoryForm(!showCategoryForm); }} className="bg-bch7al-blue text-white rounded-xl">
                    {showCategoryForm ? "Annuler" : <><Plus className="w-4 h-4 mr-2"/> Nouvelle Catégorie</>}
                  </Button>
                </div>
                
                {showCategoryForm && (
                  <form onSubmit={handleSaveCategory} className="bg-bch7al-lightgray/50 p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-start">
                    <Input required placeholder="Nom de la catégorie" value={categoryData.name} onChange={e => setCategoryData({...categoryData, name: e.target.value})} className="bg-white rounded-xl" />
                    <Input placeholder="Description" value={categoryData.description} onChange={e => setCategoryData({...categoryData, description: e.target.value})} className="bg-white rounded-xl flex-1" />
                    <Button type="submit" disabled={isSubmittingCat} className="bg-bch7al-green hover:bg-green-600 text-white rounded-xl">
                      <Save className="w-4 h-4 mr-2"/> Enregistrer
                    </Button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="border border-bch7al-darkgray/10 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between group hover:border-bch7al-blue/30 transition-colors">
                      <div>
                        <h4 className="font-extrabold text-lg text-bch7al-navy">{cat.name}</h4>
                        <p className="text-sm text-bch7al-darkgray mt-1 line-clamp-2">{cat.description || "Aucune description"}</p>
                      </div>
                      <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingCategory(cat); setCategoryData({name: cat.name, description: cat.description||''}); setShowCategoryForm(true); }} className="text-bch7al-blue p-2 bg-bch7al-blue/10 rounded-lg hover:bg-bch7al-blue/20"><Edit className="w-4 h-4"/></button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-bch7al-red p-2 bg-bch7al-red/10 rounded-lg hover:bg-bch7al-red/20"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STORES */}
            {activeTab === 'stores' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-extrabold text-bch7al-navy">Gestion Magasins</h2>
                  <Button onClick={() => { setEditingStore(null); setStoreData({name:'', website:'', address:'', logo:''}); setShowStoreForm(!showStoreForm); }} className="bg-bch7al-blue text-white rounded-xl">
                    {showStoreForm ? "Annuler" : <><Plus className="w-4 h-4 mr-2"/> Nouveau Magasin</>}
                  </Button>
                </div>

                {showStoreForm && (
                  <form onSubmit={handleSaveStore} className="bg-bch7al-lightgray/50 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-bold text-bch7al-navy">Nom</label><Input required value={storeData.name} onChange={e => setStoreData({...storeData, name: e.target.value})} className="bg-white rounded-xl" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-bold text-bch7al-navy">Site Web URL</label><Input value={storeData.website} onChange={e => setStoreData({...storeData, website: e.target.value})} className="bg-white rounded-xl" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-bold text-bch7al-navy">Logo URL (Optionnel)</label><Input value={storeData.logo} onChange={e => setStoreData({...storeData, logo: e.target.value})} className="bg-white rounded-xl" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-bold text-bch7al-navy">Adresse</label><Input value={storeData.address} onChange={e => setStoreData({...storeData, address: e.target.value})} className="bg-white rounded-xl" /></div>
                    <Button type="submit" disabled={isSubmittingStore} className="md:col-span-2 bg-bch7al-green hover:bg-green-600 text-white rounded-xl mt-2">
                      <Save className="w-4 h-4 mr-2"/> {isSubmittingStore ? "Enregistrement..." : "Enregistrer Magasin"}
                    </Button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores.map(store => (
                    <div key={store.id} className="border border-bch7al-darkgray/10 rounded-2xl p-5 bg-white shadow-sm flex items-center gap-4 group hover:border-bch7al-blue/30 transition-colors">
                      <div className="w-16 h-16 bg-bch7al-lightgray rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                        {store.logo ? <img src={store.logo} className="w-full h-full object-cover"/> : <Store className="w-6 h-6 text-bch7al-darkgray/30"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-lg text-bch7al-navy truncate">{store.name}</h4>
                        <p className="text-xs text-bch7al-darkgray truncate">{store.website || "Pas de site web"}</p>
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingStore(store); setStoreData({name: store.name, website: store.website||'', address: store.address||'', logo: store.logo||''}); setShowStoreForm(true); }} className="text-xs font-bold text-bch7al-blue hover:underline">Modifier</button>
                          <span className="text-bch7al-darkgray/20">|</span>
                          <button onClick={() => handleDeleteStore(store.id)} className="text-xs font-bold text-bch7al-red hover:underline">Supprimer</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
