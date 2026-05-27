import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  User, Heart, Package, Bell, LogOut, Check, CheckCheck, 
  Plus, Tag, Image as ImageIcon, Clock, CheckCircle2, XCircle, Star
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'react-toastify'
import API_URL from '@/config'
import { fetchApi } from '@/utils/api'

export function Dashboard() {
  const { user, token, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [activeTab, setActiveTab] = useState('profile')
  
  // States
  const [favorites, setFavorites] = useState([])
  const [myProducts, setMyProducts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [categories, setCategories] = useState([])
  const [alerts, setAlerts] = useState([])
  
  // Loading states
  const [loading, setLoading] = useState(true)

  // New Product Form State
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', brand: '', category_id: '' })
  const [imageFile, setImageFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editProfileData, setEditProfileData] = useState({ name: '', email: '' })
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [editAvatarFile, setEditAvatarFile] = useState(null)
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  // Handle Location State (e.g. from Navbar button)
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab)
    }
    if (location.state?.showAddForm) {
      setShowAddForm(location.state.showAddForm)
    }
    
    // Clear state after reading it to avoid re-triggering on normal re-renders
    window.history.replaceState({}, document.title)
  }, [location.state])

  // Redirection if not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate('/login')
    } else if (user && !isEditingProfile) {
      setEditProfileData({ name: user.name, email: user.email })
    }
  }, [user, loading, navigate, isEditingProfile])

  // Sync notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user && token) {
        const notifRes = await fetchApi('/api/notifications')
        if (notifRes.ok) setNotifications(await notifRes.json())
      }
    };

    window.addEventListener('notifications:updated', fetchNotifications);
    return () => window.removeEventListener('notifications:updated', fetchNotifications);
  }, [user, token]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true)
    try {
      const [favRes, prodRes, notifRes, catRes, alertsRes] = await Promise.all([
        fetchApi('/api/favorites'),
        fetchApi('/api/products/my-products'),
        fetchApi('/api/notifications'),
        fetchApi('/api/categories'),
        fetchApi('/api/alerts')
      ])

      if (favRes.ok) setFavorites(await favRes.json())
      if (prodRes.ok) setMyProducts(await prodRes.json())
      if (notifRes.ok) setNotifications(await notifRes.json())
      if (catRes.ok) setCategories(await catRes.json())
      if (alertsRes.ok) setAlerts(await alertsRes.json())

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token])

  // --- ACTIONS NOTIFICATIONS ---
  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetchApi(`/api/notifications/${id}/read`, {
        method: 'PUT'
      })
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: 1 } : n))
        window.dispatchEvent(new CustomEvent('notifications:updated'))
      }
    } catch (err) { console.error(err) }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetchApi('/api/notifications/read-all', {
        method: 'PUT'
      })
      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: 1 })))
        window.dispatchEvent(new CustomEvent('notifications:updated'))
      }
    } catch (err) { console.error(err) }
  }

  // --- ACTIONS PROFILE ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setIsSubmittingProfile(true)
    
    try {
      const formData = new FormData()
      formData.append('name', editProfileData.name)
      formData.append('email', editProfileData.email)
      
      if (editAvatarFile) {
        formData.append('avatar', editAvatarFile)
      }

      const res = await fetchApi('/api/auth/profile', {
        method: 'PUT',
        body: formData
      })

      if (res.ok) {
        const updatedUser = await res.json()
        updateUser(updatedUser)
        toast.success("Profil mis à jour avec succès !")
        setIsEditingProfile(false)
        setEditAvatarFile(null)
      } else {
        let errorMessage = "Erreur lors de la mise à jour";
        try {
          const data = await res.json();
          errorMessage = data.message || errorMessage;
        } catch (e) {
          errorMessage = `Erreur Serveur: ${res.status}`;
        }
        toast.error(errorMessage)
      }
    } catch (err) {
      console.error(err)
      toast.error(`Erreur réseau: ${err.message}`)
    } finally {
      setIsSubmittingProfile(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warn("Les mots de passe ne correspondent pas.")
      return
    }

    setIsSubmittingPassword(true)
    
    try {
      const res = await fetchApi('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          password: passwordData.newPassword
        })
      })

      if (res.ok) {
        toast.success("Mot de passe mis à jour avec succès !")
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        let errorMessage = "Erreur lors de la mise à jour du mot de passe";
        try {
          const data = await res.json();
          errorMessage = data.message || errorMessage;
        } catch (e) {
          errorMessage = `Erreur Serveur: ${res.status}`;
        }
        toast.error(errorMessage)
      }
    } catch (err) {
      console.error(err)
      toast.error(`Erreur réseau: ${err.message}`)
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  // --- ACTIONS PRODUITS ---
  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.category_id) return toast.warn("Nom et Catégorie requis.")
    
    setIsSubmitting(true)
    try {
      // Utilisation de FormData pour envoyer l'image + champs textes (Cloudinary support)
      const formData = new FormData()
      formData.append('name', newProduct.name)
      formData.append('description', newProduct.description)
      formData.append('brand', newProduct.brand)
      formData.append('category_id', newProduct.category_id)
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const res = await fetchApi('/api/products', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        toast.success("Produit soumis avec succès ! Il est en attente de validation.")
        setShowAddForm(false)
        setNewProduct({ name: '', description: '', brand: '', category_id: '' })
        setImageFile(null)
        fetchData() // Rafraîchir la liste
      } else {
        const data = await res.json()
        toast.error(data.message || "Erreur lors de la soumission")
      }
    } catch (err) {
      console.error(err)
      toast.error("Erreur de connexion au serveur.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- ACTIONS ALERTES ---
  const handleDeleteAlert = async (id) => {
    if (!window.confirm("Supprimer cette alerte ?")) return
    try {
      const res = await fetchApi(`/api/alerts/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setAlerts(alerts.filter(a => a.id !== id))
        toast.success("Alerte supprimée")
      } else {
        toast.error("Erreur de suppression")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  // --- HELPERS ---
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="bg-bch7al-green/10 text-bch7al-green px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approuvé</span>
      case 'rejected': return <span className="bg-bch7al-red/10 text-bch7al-red px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Refusé</span>
      default: return <span className="bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> En attente</span>
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500 flex flex-col md:flex-row gap-8">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-bch7al-darkgray/10 mb-4 text-center">
          <div className="w-24 h-24 bg-bch7al-lightgray rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-bch7al-blue/10">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-bch7al-darkgray/40" />
            )}
          </div>
          <h2 className="font-extrabold text-xl text-bch7al-navy">{user.name}</h2>
          <p className="text-sm text-bch7al-darkgray/60 mb-3">{user.role === 'admin' ? 'Administrateur' : user.role === 'user' ? 'Utilisateur' : user.role}</p>
          <div className="flex items-center justify-center gap-1.5 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full w-fit mx-auto">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-bold">{user.reputation || 0} pts</span>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'profile' ? 'bg-bch7al-blue text-white shadow-md' : 'text-bch7al-darkgray hover:bg-bch7al-lightgray'}`}>
            <User className="w-5 h-5" /> Mon Profil
          </button>
          <button onClick={() => setActiveTab('favorites')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'favorites' ? 'bg-bch7al-blue text-white shadow-md' : 'text-bch7al-darkgray hover:bg-bch7al-lightgray'}`}>
            <Heart className="w-5 h-5" /> Mes Favoris
          </button>
          <button onClick={() => setActiveTab('products')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'products' ? 'bg-bch7al-blue text-white shadow-md' : 'text-bch7al-darkgray hover:bg-bch7al-lightgray'}`}>
            <Package className="w-5 h-5" /> Mes Produits
          </button>
          <button onClick={() => setActiveTab('alerts')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'alerts' ? 'bg-bch7al-blue text-white shadow-md' : 'text-bch7al-darkgray hover:bg-bch7al-lightgray'}`}>
            <Bell className="w-5 h-5" /> Mes Alertes
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'notifications' ? 'bg-bch7al-blue text-white shadow-md' : 'text-bch7al-darkgray hover:bg-bch7al-lightgray'}`}>
            <div className="flex items-center gap-3"><Bell className="w-5 h-5" /> Notifications</div>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="bg-bch7al-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>
          
          <div className="h-px bg-bch7al-darkgray/10 my-2"></div>
          
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-bch7al-red hover:bg-bch7al-red/10 transition-all">
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-bch7al-darkgray/10 min-h-[60vh]">
        
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bch7al-blue"></div>
          </div>
        ) : (
          <>
            {/* ONGLET PROFIL */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-extrabold text-bch7al-navy">Informations Personnelles</h2>
                  {!isEditingProfile && (
                    <Button onClick={() => setIsEditingProfile(true)} className="bg-bch7al-blue hover:bg-bch7al-navy text-white rounded-xl">
                      Modifier Profil
                    </Button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="max-w-md bg-bch7al-lightgray/50 p-6 rounded-2xl border border-bch7al-darkgray/10 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-bch7al-navy">Nouvel Avatar (optionnel)</label>
                      <Input type="file" accept="image/*" onChange={e => setEditAvatarFile(e.target.files[0])} className="bg-white rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-bch7al-navy">Nom complet</label>
                      <Input value={editProfileData.name} onChange={e => setEditProfileData({...editProfileData, name: e.target.value})} required className="bg-white rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-bch7al-navy">Adresse Email</label>
                      <Input type="email" value={editProfileData.email} onChange={e => setEditProfileData({...editProfileData, email: e.target.value})} required className="bg-white rounded-xl" />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)} className="rounded-xl flex-1 border-bch7al-darkgray/20">
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isSubmittingProfile} className="bg-bch7al-green hover:bg-green-600 text-white rounded-xl flex-1">
                        {isSubmittingProfile ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid gap-6 max-w-md">
                    <div>
                      <label className="text-sm font-bold text-bch7al-darkgray">Nom complet</label>
                      <div className="mt-1 p-3 bg-bch7al-lightgray rounded-xl font-medium text-bch7al-navy">{user.name}</div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-bch7al-darkgray">Adresse Email</label>
                      <div className="mt-1 p-3 bg-bch7al-lightgray rounded-xl font-medium text-bch7al-navy">{user.email}</div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-bch7al-darkgray">Rôle</label>
                      <div className="mt-1 p-3 bg-bch7al-lightgray rounded-xl font-medium text-bch7al-navy uppercase text-sm tracking-wider">{user.role}</div>
                    </div>

                    {/* PASSWORD CHANGE SEPARATE FORM */}
                    <div className="border-t border-bch7al-darkgray/10 pt-6 mt-4">
                      <h3 className="text-lg font-extrabold text-bch7al-navy mb-4">Changer le mot de passe</h3>
                      <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-bch7al-navy">Ancien mot de passe</label>
                          <Input type="password" required value={passwordData.oldPassword} onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} className="bg-white rounded-xl border-bch7al-darkgray/20" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-bch7al-navy">Nouveau mot de passe</label>
                          <Input type="password" required value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="bg-white rounded-xl border-bch7al-darkgray/20" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-bch7al-navy">Confirmer le nouveau mot de passe</label>
                          <Input type="password" required value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="bg-white rounded-xl border-bch7al-darkgray/20" />
                        </div>
                        
                        <Button type="submit" disabled={isSubmittingPassword} className="w-full bg-bch7al-navy hover:bg-bch7al-blue text-white rounded-xl mt-2">
                          {isSubmittingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ONGLET FAVORIS */}
            {activeTab === 'favorites' && (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-3xl font-extrabold text-bch7al-navy mb-8">Mes Produits Favoris</h2>
                
                {favorites.length === 0 ? (
                  <p className="text-bch7al-darkgray/60 font-medium text-center py-10">Vous n'avez pas encore de favoris.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map(product => (
                      <Link key={product.favorite_id} to={`/products/${product.id}`} className="block group">
                        <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-2xl h-full relative">
                          <div className="absolute top-3 right-3 z-10 text-bch7al-red">
                            <Heart className="w-6 h-6 drop-shadow-md" fill="currentColor" />
                          </div>
                          <div className="aspect-square bg-bch7al-lightgray flex items-center justify-center relative overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <ImageIcon className="w-16 h-16 text-bch7al-darkgray/20" />
                            )}
                          </div>
                          <CardContent className="p-5">
                            <span className="text-xs font-bold uppercase text-bch7al-blue">{product.category_name}</span>
                            <h3 className="font-extrabold text-xl text-bch7al-navy mt-1 truncate">{product.name}</h3>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ONGLET PRODUITS */}
            {activeTab === 'products' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-extrabold text-bch7al-navy">Produits Soumis</h2>
                  <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-bch7al-blue text-white hover:bg-bch7al-navy rounded-xl">
                    {showAddForm ? "Annuler" : <><Plus className="w-4 h-4 mr-2" /> Proposer un produit</>}
                  </Button>
                </div>

                {showAddForm ? (
                  <div className="bg-bch7al-lightgray/50 p-6 rounded-2xl border border-bch7al-darkgray/10 mb-8 animate-in slide-in-from-top-4">
                    <h3 className="text-xl font-bold text-bch7al-navy mb-4">Proposer un nouveau produit</h3>
                    <form onSubmit={handleAddProduct} className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-bch7al-navy">Nom du produit</label>
                          <Input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="bg-white rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-bch7al-navy">Marque</label>
                          <Input value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} className="bg-white rounded-xl" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-bch7al-navy">Catégorie</label>
                          <select required value={newProduct.category_id} onChange={e => setNewProduct({...newProduct, category_id: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-bch7al-darkgray/20 bg-white text-sm focus:ring-2 focus:ring-bch7al-blue">
                            <option value="">Sélectionner une catégorie...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-bch7al-navy">Image (Cloudinary)</label>
                          <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="bg-white rounded-xl file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bch7al-blue/10 file:text-bch7al-blue hover:file:bg-bch7al-blue/20 cursor-pointer" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-bch7al-navy">Description</label>
                        <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full min-h-[100px] p-3 rounded-xl border border-bch7al-darkgray/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-bch7al-blue resize-none"></textarea>
                      </div>

                      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto md:place-self-end mt-2 bg-bch7al-green hover:bg-green-600 text-white rounded-xl">
                        {isSubmitting ? "Envoi..." : "Soumettre pour validation"}
                      </Button>
                    </form>
                  </div>
                ) : null}

                {myProducts.length === 0 ? (
                  <p className="text-bch7al-darkgray/60 font-medium text-center py-10">Vous n'avez proposé aucun produit.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myProducts.map(product => (
                      <Link key={product.id} to={`/products/${product.id}`} className="block group">
                        <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-2xl h-full relative">
                          <div className="absolute top-3 left-3 z-10">
                            {getStatusBadge(product.status)}
                          </div>
                          <div className="aspect-square bg-bch7al-lightgray flex items-center justify-center relative overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <ImageIcon className="w-16 h-16 text-bch7al-darkgray/20" />
                            )}
                          </div>
                          <CardContent className="p-5">
                            <span className="text-xs font-bold uppercase text-bch7al-blue">{product.category_name}</span>
                            <h3 className="font-extrabold text-xl text-bch7al-navy mt-1 truncate">{product.name}</h3>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ONGLET NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-extrabold text-bch7al-navy">Notifications</h2>
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="rounded-xl border-bch7al-darkgray/20 hover:bg-bch7al-lightgray">
                      <CheckCheck className="w-4 h-4 mr-2" /> Tout marquer lu
                    </Button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p className="text-bch7al-darkgray/60 font-medium text-center py-10">Aucune notification.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`p-4 rounded-2xl flex items-start gap-4 transition-colors ${notif.isRead ? 'bg-bch7al-lightgray/50' : 'bg-bch7al-blue/5 border border-bch7al-blue/20'}`}>
                        <div className={`p-2 rounded-full mt-1 ${notif.isRead ? 'bg-bch7al-darkgray/10 text-bch7al-darkgray' : 'bg-bch7al-blue text-white'}`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-sm ${notif.isRead ? 'font-semibold text-bch7al-navy/80' : 'font-extrabold text-bch7al-navy'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-sm text-bch7al-darkgray/80 mt-1">{notif.message}</p>
                          <p className="text-xs font-medium text-bch7al-darkgray/50 mt-2">
                            {format(new Date(notif.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notif.id)} className="text-bch7al-blue hover:bg-bch7al-blue/10 shrink-0" title="Marquer comme lu">
                            <Check className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* ONGLET ALERTES */}
            {activeTab === 'alerts' && (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-3xl font-extrabold text-bch7al-navy mb-8">Mes Alertes de Prix</h2>
                
                {alerts.length === 0 ? (
                  <p className="text-bch7al-darkgray/60 font-medium text-center py-10">Vous n'avez défini aucune alerte de prix.</p>
                ) : (
                  <div className="grid gap-4 max-w-2xl">
                    {alerts.map(alert => (
                      <div key={alert.id} className={`flex items-center justify-between p-4 rounded-2xl border ${alert.active ? 'border-bch7al-blue/30 bg-blue-50/30' : 'border-bch7al-darkgray/10 bg-bch7al-lightgray'}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 border border-bch7al-darkgray/10">
                            {alert.product_image ? (
                              <img src={alert.product_image} alt={alert.product_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-bch7al-darkgray/20"><ImageIcon className="w-6 h-6"/></div>
                            )}
                          </div>
                          <div>
                            <Link to={`/products/${alert.product_id}`} className="font-extrabold text-bch7al-navy hover:text-bch7al-blue transition-colors">
                              {alert.product_name}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full border border-bch7al-darkgray/10">Cible : {alert.targetPrice} DH</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${alert.active ? 'bg-bch7al-green/10 text-bch7al-green' : 'bg-bch7al-darkgray/10 text-bch7al-darkgray'}`}>
                                {alert.active ? 'Active' : 'Déclenchée'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" onClick={() => handleDeleteAlert(alert.id)} className="text-bch7al-red hover:bg-bch7al-red/10 rounded-full h-10 w-10 p-0 shrink-0">
                          <XCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}
