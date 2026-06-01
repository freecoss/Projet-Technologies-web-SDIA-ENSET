import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Tag, Store, ThumbsUp, ThumbsDown, MessageSquare, 
  Clock, TrendingDown, ArrowLeft, Image as ImageIcon, Heart, Bell
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'react-toastify'
import { format as formatFn } from 'date-fns'
import API_URL from '@/config'
import { fetchApi } from '@/utils/api'

export function ProductDetail() {
  const { id } = useParams()
  const { user, token } = useAuth()
  
  const [product, setProduct] = useState(null)
  const [prices, setPrices] = useState([])
  const [stats, setStats] = useState(null)
  const [comments, setComments] = useState([])
  const [isFavorite, setIsFavorite] = useState(false)

  // Alert form state
  const [showAddAlert, setShowAddAlert] = useState(false)
  const [alertPrice, setAlertPrice] = useState('')
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false)
  const [stores, setStores] = useState([])
  
  const [showAddPrice, setShowAddPrice] = useState(false)
  const [newPrice, setNewPrice] = useState({ amount: '', store_id: '' })
  const [priceImage, setPriceImage] = useState(null)
  const [isSubmittingPrice, setIsSubmittingPrice] = useState(false)
  
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true)
        const [prodRes, pricesRes, statsRes, commentsRes, storesRes] = await Promise.all([
          fetch(`${API_URL}/api/products/${id}`),
          fetch(`${API_URL}/api/prices/product/${id}`),
          fetch(`${API_URL}/api/prices/stats/${id}`),
          fetch(`${API_URL}/api/comments/product/${id}`),
          fetch(`${API_URL}/api/stores`)
        ])

        if (!prodRes.ok) throw new Error('Produit non trouvé')

        setProduct(await prodRes.json())
        setPrices(await pricesRes.json())
        setStats(await statsRes.json())
        setComments(await commentsRes.json())
        if (storesRes.ok) setStores(await storesRes.json())

        if (user && token) {
          const favRes = await fetchApi('/api/favorites')
          if (favRes.ok) {
            const favs = await favRes.json();
            setIsFavorite(favs.some(f => f.id === parseInt(id)));
          }
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAllData()
  }, [id, user, token])

  const handleVote = async (priceId, type) => {
    if (!user) return toast.info("Vous devez être connecté pour voter.")
    try {
      const res = await fetchApi(`/api/votes/${priceId}`, {
        method: 'POST',
        body: JSON.stringify({ type })
      })
      if (res.ok) {
        // Rafraîchir les prix pour mettre à jour les votes et potentiellement les statuts
        const updatedPrices = await fetchApi(`/api/prices/product/${id}`).then(r => r.json())
        setPrices(updatedPrices)
        
        // Rafraîchir les statistiques car un vote peut avoir validé un prix (passage de pending à active)
        const updatedStats = await fetchApi(`/api/prices/stats/${id}`).then(r => r.json())
        setStats(updatedStats)
      } else {
        const data = await res.json()
        toast.error(data.message || "Erreur lors du vote")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!user) return toast.info("Vous devez être connecté pour commenter.")
    if (!newComment.trim()) return

    try {
      const res = await fetchApi(`/api/comments/product/${id}`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment })
      })
      
      if (res.ok) {
        setNewComment('')
        const updatedComments = await fetch(`${API_URL}/api/comments/product/${id}`).then(r => r.json())
        setComments(updatedComments)
        toast.success("Commentaire ajouté !")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddPrice = async (e) => {
    e.preventDefault()
    if (!user) return toast.info("Connectez-vous pour signaler un prix.")
    setIsSubmittingPrice(true)
    
    try {
      const formData = new FormData()
      formData.append('amount', newPrice.amount)
      formData.append('store_id', newPrice.store_id)
      formData.append('product_id', id)
      if (priceImage) formData.append('proofImage', priceImage)

      const res = await fetchApi('/api/prices', {
        method: 'POST',
        body: formData
      })
      
      if (res.ok) {
        toast.success("Nouveau prix signalé !")
        setShowAddPrice(false)
        setNewPrice({ amount: '', store_id: '' })
        setPriceImage(null)
        // Refresh prices and stats
        const updatedPrices = await fetch(`${API_URL}/api/prices/product/${id}`).then(r => r.json())
        const updatedStats = await fetch(`${API_URL}/api/prices/stats/${id}`).then(r => r.json())
        setPrices(updatedPrices)
        setStats(updatedStats)
      } else {
        const err = await res.json()
        toast.error(err.message || "Erreur")
      }
    } catch (err) { toast.error("Erreur") }
    finally { setIsSubmittingPrice(false) }
  }

  const handleAddAlert = async (e) => {
    e.preventDefault()
    if (!user) return toast.info("Connectez-vous pour créer une alerte.")
    setIsSubmittingAlert(true)
    
    try {
      const res = await fetchApi('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          targetPrice: alertPrice,
          productId: id
        })
      })
      
      if (res.ok) {
        toast.success("Alerte de prix créée !")
        setShowAddAlert(false)
        setAlertPrice('')
      } else {
        const err = await res.json()
        toast.error(err.message || "Erreur lors de la création de l'alerte")
      }
    } catch (err) { 
      toast.error("Erreur de connexion") 
    } finally { 
      setIsSubmittingAlert(false) 
    }
  }

  const handleToggleFavorite = async () => {
    if (!user) return toast.info("Vous devez être connecté pour gérer vos favoris.")
    try {
      const url = `${API_URL}/api/favorites/${id}`;
      const method = isFavorite ? 'DELETE' : 'POST';
      const res = await fetchApi(url, { method });
      if (res.ok) {
        setIsFavorite(!isFavorite);
        if (isFavorite) {
          toast.info("Retiré des favoris")
        } else {
          toast.success("Ajouté aux favoris ! ❤️")
        }
      } else {
        const data = await res.json()
        toast.error(data.message || "Erreur")
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bch7al-blue"></div>
    </div>
  )

  if (error || !product) return (
    <div className="text-center py-20 text-bch7al-red font-bold">{error || "Produit introuvable"}</div>
  )

  // Formatting chart data
  const chartData = stats?.history?.map(h => ({
    date: format(new Date(h.date), 'dd MMM', { locale: fr }),
    Prix_Moyen: parseFloat(h.avg_price),
    Prix_Min: parseFloat(h.min_price)
  })) || []

  return (
    <div className="flex flex-col gap-8 py-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4">
      
      <Link to="/products" className="inline-flex items-center text-bch7al-darkgray hover:text-bch7al-blue transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux produits
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Colonne Gauche: Info & Graphique */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Header Produit */}
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-1/3 aspect-square bg-bch7al-lightgray rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-20 h-20 text-bch7al-darkgray/20" />
                )}
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-bch7al-blue bg-bch7al-blue/10 px-3 py-1 rounded-lg">
                    {product.category_name}
                  </span>
                  <Button 
                    variant="ghost" 
                    onClick={handleToggleFavorite} 
                    className={`rounded-full h-10 w-10 p-0 transition-colors ${
                      isFavorite 
                        ? 'text-bch7al-red bg-bch7al-red/10 hover:bg-bch7al-red/20' 
                        : 'text-bch7al-darkgray hover:text-bch7al-red hover:bg-bch7al-red/10'
                    }`}
                  >
                    <Heart className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} />
                  </Button>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold text-bch7al-navy tracking-tight">{product.name}</h1>
                <p className="text-lg font-medium text-bch7al-darkgray/70">{product.brand || 'Sans marque'}</p>
                
                <p className="text-bch7al-darkgray leading-relaxed pt-2">
                  {product.description || "Aucune description fournie pour ce produit."}
                </p>

                {/* Quick Stats */}
                {stats?.summary?.min_price && (
                  <div className="flex items-center gap-6 pt-4 border-t border-bch7al-darkgray/10">
                    <div>
                      <p className="text-sm font-bold text-bch7al-darkgray/60 uppercase">Meilleur prix</p>
                      <p className="text-3xl font-extrabold text-bch7al-green">{parseFloat(stats.summary.min_price)} DH</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-bch7al-darkgray/60 uppercase">Prix moyen</p>
                      <p className="text-2xl font-bold text-bch7al-navy">{parseFloat(stats.summary.avg_price).toFixed(2)} DH</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Graphique d'évolution */}
          {chartData.length > 0 && (
            <Card className="border border-bch7al-darkgray/10 shadow-sm bg-white rounded-3xl overflow-hidden p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <TrendingDown className="w-6 h-6 text-bch7al-blue" />
                <h2 className="text-2xl font-bold text-bch7al-navy">Historique des prix</h2>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} DH`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0F172A', marginBottom: '0.5rem' }}
                    />
                    <Line type="monotone" dataKey="Prix_Min" stroke="#22C55E" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="Prix_Moyen" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} opacity={0.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

        </div>

        {/* Colonne Droite: Prix & Communauté */}
        <div className="flex flex-col gap-8">
          
          {/* Liste des Prix */}
          <Card className="border border-bch7al-darkgray/10 shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-bch7al-lightgray/50 border-b border-bch7al-darkgray/5 px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-bch7al-navy m-0">
                <Tag className="w-5 h-5 text-bch7al-blue" />
                Les Offres ({prices.length})
              </CardTitle>
              {user && (
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddAlert(!showAddAlert)} size="sm" variant="outline" className="text-bch7al-navy border-bch7al-navy hover:bg-bch7al-navy hover:text-white rounded-xl text-xs">
                    <Bell className="w-3 h-3 mr-1" />
                    Alerte
                  </Button>
                  <Button onClick={() => setShowAddPrice(!showAddPrice)} size="sm" className="bg-bch7al-blue text-white hover:bg-bch7al-navy rounded-xl text-xs">
                    {showAddPrice ? "Annuler" : "+ Signaler"}
                  </Button>
                </div>
              )}
            </CardHeader>
            
            {showAddAlert && (
              <div className="p-4 border-b border-bch7al-darkgray/10 bg-yellow-50/50">
                <form onSubmit={handleAddAlert} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-bch7al-navy flex items-center gap-1">
                      <Bell className="w-3 h-3" /> M'alerter si le prix baisse sous (DH) :
                    </label>
                    <div className="flex gap-2">
                      <Input type="number" step="0.01" required value={alertPrice} onChange={e => setAlertPrice(e.target.value)} className="bg-white rounded-lg h-9 text-sm flex-1" placeholder="Ex: 50.00" />
                      <Button type="submit" disabled={isSubmittingAlert} className="bg-bch7al-navy hover:bg-blue-900 text-white rounded-lg h-9 font-bold text-sm">
                        {isSubmittingAlert ? "..." : "Créer l'alerte"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {showAddPrice && (
              <div className="p-4 border-b border-bch7al-darkgray/10 bg-blue-50/50">
                <form onSubmit={handleAddPrice} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-bch7al-navy">Montant (DH)</label>
                      <Input type="number" step="0.01" required value={newPrice.amount} onChange={e => setNewPrice({...newPrice, amount: e.target.value})} className="bg-white rounded-lg h-9 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-bch7al-navy">Magasin</label>
                      <select required value={newPrice.store_id} onChange={e => setNewPrice({...newPrice, store_id: e.target.value})} className="w-full h-9 px-3 rounded-lg border border-bch7al-darkgray/20 bg-white text-sm focus:ring-2 focus:ring-bch7al-blue">
                        <option value="">Choisir...</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-bch7al-navy">Photo (Preuve)</label>
                    <Input type="file" accept="image/*" onChange={e => setPriceImage(e.target.files[0])} className="bg-white rounded-lg h-9 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-bch7al-blue/10 file:text-bch7al-blue" />
                  </div>
                  <Button type="submit" disabled={isSubmittingPrice} className="w-full bg-bch7al-green hover:bg-green-600 text-white rounded-lg h-9 font-bold text-sm">
                    {isSubmittingPrice ? "Envoi..." : "Valider le prix"}
                  </Button>
                </form>
              </div>
            )}
            
            <CardContent className="p-0 divide-y divide-bch7al-darkgray/5 max-h-[400px] overflow-y-auto">
              {prices.length === 0 ? (
                <div className="p-8 text-center text-bch7al-darkgray/60 font-medium">
                  Aucun prix signalé pour le moment.
                </div>
              ) : (
                prices.map(price => (
                  <div key={price.id} className="p-6 flex flex-col gap-4 hover:bg-bch7al-lightgray/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-bch7al-navy font-bold">
                          <Store className="w-4 h-4 text-bch7al-darkgray" />
                          {price.store_name}
                          {price.status === 'pending' && (
                            <span className="ml-2 text-[10px] uppercase bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold" title="Ce prix doit recevoir des votes positifs pour être validé">En attente</span>
                          )}
                          {price.status === 'active' && (
                            <span className="ml-2 text-[10px] uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Vérifié</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-bch7al-darkgray/60">
                          <Clock className="w-3 h-3" />
                          Signalé par {price.user_name} le {format(new Date(price.observedAt), 'dd/MM/yyyy')}
                        </div>
                        {price.proofImage && (
                          <a href={price.proofImage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-bch7al-blue hover:underline mt-1">
                            <ImageIcon className="w-3 h-3" /> Voir la preuve
                          </a>
                        )}
                      </div>
                      <div className="text-2xl font-extrabold text-bch7al-green">
                        {price.amount} DH
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleVote(price.id, 'upvote')} 
                        className={`h-8 rounded-lg border-bch7al-darkgray/20 transition-colors ${
                          price.userVote === 'upvote'
                            ? 'bg-bch7al-green/10 text-bch7al-green border-bch7al-green/30'
                            : 'hover:bg-bch7al-green/10 hover:text-bch7al-green hover:border-bch7al-green/30'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1.5" />
                        <span className="font-bold">{price.upvotes || 0}</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleVote(price.id, 'downvote')} 
                        className={`h-8 rounded-lg border-bch7al-darkgray/20 transition-colors ${
                          price.userVote === 'downvote'
                            ? 'bg-bch7al-red/10 text-bch7al-red border-bch7al-red/30'
                            : 'hover:bg-bch7al-red/10 hover:text-bch7al-red hover:border-bch7al-red/30'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4 mr-1.5" />
                        <span className="font-bold">{price.downvotes || 0}</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Commentaires */}
          <Card className="border border-bch7al-darkgray/10 shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-bch7al-lightgray/50 border-b border-bch7al-darkgray/5 px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-bch7al-navy">
                <MessageSquare className="w-5 h-5 text-bch7al-blue" />
                Commentaires ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col gap-6">
              
              {/* Formulaire d'ajout */}
              <form onSubmit={handleAddComment} className="flex flex-col gap-3">
                <textarea 
                  placeholder={user ? "Ajouter un commentaire..." : "Connectez-vous pour commenter"}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={!user}
                  className="w-full min-h-[80px] p-3 rounded-xl border border-bch7al-darkgray/20 bg-bch7al-lightgray text-sm focus:outline-none focus:ring-2 focus:ring-bch7al-blue resize-none disabled:opacity-50"
                />
                <Button type="submit" disabled={!user || !newComment.trim()} className="self-end bg-bch7al-navy text-white hover:bg-bch7al-blue rounded-xl h-9 px-6 font-bold">
                  Publier
                </Button>
              </form>

              {/* Liste des commentaires */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {comments.length === 0 ? (
                  <p className="text-sm text-bch7al-darkgray/60 text-center font-medium">Soyez le premier à donner votre avis !</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="bg-bch7al-lightgray/50 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-bch7al-navy">{c.user_name}</span>
                        <span className="text-xs font-medium text-bch7al-darkgray/50">
                          {format(new Date(c.createdAt), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm text-bch7al-darkgray leading-relaxed">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
