import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { SearchBar } from "./SearchBar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { LogOut, User, Bell, Check, CheckCheck, Plus } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { fetchApi } from "@/utils/api"
import API_URL from "@/config"

export function Navbar() {
  const { user, token, logout } = useAuth()
  
  const [notifications, setNotifications] = useState([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const notifRef = useRef(null)

  useEffect(() => {
    const fetchNotifications = () => {
      if (user && token) {
        fetchApi('/api/notifications')
          .then(res => res.json())
          .then(data => {
            if(Array.isArray(data)) setNotifications(data)
          })
          .catch(console.error)
      }
    };

    fetchNotifications();

    // Écouter l'événement global de mise à jour des notifications
    window.addEventListener('notifications:updated', fetchNotifications);
    return () => window.removeEventListener('notifications:updated', fetchNotifications);
  }, [user, token])

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetchApi(`/api/notifications/${id}/read`, { method: 'PUT' })
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: 1 } : n))
        window.dispatchEvent(new CustomEvent('notifications:updated'))
      }
    } catch (err) { console.error(err) }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetchApi('/api/notifications/read-all', { method: 'PUT' })
      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: 1 })))
        window.dispatchEvent(new CustomEvent('notifications:updated'))
      }
    } catch (err) { console.error(err) }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-bch7al-darkgray/10 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* Left Section: Logo & Links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-4xl font-extrabold tracking-tighter text-bch7al-navy group-hover:text-bch7al-blue transition-colors">
              bch7al<span className="text-bch7al-blue">.</span>
            </span>
          </Link>
          <Link to="/products" className="hidden md:block text-lg font-bold text-bch7al-navy hover:text-bch7al-blue transition-colors mt-1">
            Produits
          </Link>
        </div>

        {/* Center Section: Search Bar */}
        <div className="hidden md:flex flex-1 items-center justify-center mx-8">
          <div className="w-full max-w-3xl">
            <SearchBar />
          </div>
        </div>

        {/* Actions (Login / User Menu) */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              
              {/* Add Product Button */}
              <Link to="/dashboard" state={{ activeTab: 'products', showAddForm: true }}>
                <Button className="hidden md:flex bg-bch7al-green hover:bg-green-600 text-white font-bold rounded-full px-5 shadow-sm transition-all gap-2">
                  <Plus className="w-5 h-5" /> Ajouter un produit
                </Button>
              </Link>
              
              {/* Notifications Popup */}
              <div className="relative" ref={notifRef}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`hidden sm:flex relative rounded-full h-12 w-12 p-0 transition-colors ${isNotifOpen ? 'bg-bch7al-blue/10 text-bch7al-blue' : 'text-bch7al-darkgray hover:text-bch7al-blue'}`}
                >
                  <Bell className="w-7 h-7" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-bch7al-red rounded-full animate-pulse border-2 border-white"></span>
                  )}
                </Button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-bch7al-darkgray/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                    <div className="p-4 border-b border-bch7al-darkgray/10 flex justify-between items-center bg-bch7al-lightgray/30">
                      <h3 className="font-extrabold text-bch7al-navy">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllAsRead} className="text-xs font-bold text-bch7al-blue hover:text-bch7al-navy flex items-center gap-1">
                          <CheckCheck className="w-3 h-3" /> Tout marquer lu
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-bch7al-darkgray/60 font-medium">
                          Aucune notification
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {notifications.map(notif => (
                            <div key={notif.id} className={`p-4 border-b border-bch7al-darkgray/5 hover:bg-bch7al-lightgray/50 transition-colors flex gap-3 ${notif.isRead ? 'opacity-70' : 'bg-bch7al-blue/5'}`}>
                              <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notif.isRead ? 'bg-bch7al-darkgray/10 text-bch7al-darkgray' : 'bg-bch7al-blue text-white'}`}>
                                <Bell className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${notif.isRead ? 'font-medium text-bch7al-navy/80' : 'font-bold text-bch7al-navy'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-bch7al-darkgray/80 mt-1 line-clamp-2">{notif.message}</p>
                                <p className="text-[10px] font-medium text-bch7al-darkgray/50 mt-2">
                                  {format(new Date(notif.createdAt), 'dd MMM, HH:mm', { locale: fr })}
                                </p>
                              </div>
                              {!notif.isRead && (
                                <button onClick={() => handleMarkAsRead(notif.id)} className="flex-shrink-0 text-bch7al-blue hover:text-bch7al-navy" title="Marquer comme lu">
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 border-t border-bch7al-darkgray/10 text-center bg-bch7al-lightgray/30">
                      <Link to="/dashboard" onClick={() => setIsNotifOpen(false)} className="text-xs font-bold text-bch7al-blue hover:text-bch7al-navy">
                        Voir tout dans le Dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {(user.role === 'admin' || user.role === 'moderator') && (
                  <Link to="/admin">
                    <Button variant="ghost" size="lg" className="gap-2 text-bch7al-navy font-bold text-base bg-orange-500/10 hover:bg-orange-500/20 rounded-full px-5 py-6">
                      {user.role === 'admin' ? "Admin Panel" : "Mod Panel"}
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard">
                  <Button variant="ghost" size="lg" className="gap-3 text-bch7al-navy font-bold text-base bg-bch7al-blue/5 hover:bg-bch7al-blue/10 rounded-full px-5 py-6">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-bch7al-blue/20 text-bch7al-blue shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    {user.name}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="hidden sm:inline-flex text-bch7al-darkgray hover:text-bch7al-blue font-semibold">
                  Se connecter
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-bch7al-blue hover:bg-bch7al-navy text-white font-bold rounded-full px-6 shadow-md hover:shadow-lg transition-all">
                  S'inscrire
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
