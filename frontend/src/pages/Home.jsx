import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Package, Tags, Store, ArrowRight } from "lucide-react"
import API_URL from "@/config"

export function Home() {
  const { user } = useAuth()
  const [publicStats, setPublicStats] = useState({
    users: 0,
    products: 0,
    prices: 0,
    stores: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stats/public`)
        if (res.ok) {
          const data = await res.json()
          setPublicStats(data)
        }
      } catch (err) {
        console.error("Erreur de chargement des statistiques", err)
      }
    }
    fetchStats()
  }, [])

  const stats = [
    { label: "Utilisateurs", value: publicStats.users, icon: Users, color: "text-bch7al-blue" },
    { label: "Produits", value: publicStats.products, icon: Package, color: "text-purple-500" },
    { label: "Prix Signalés", value: publicStats.prices, icon: Tags, color: "text-bch7al-green" },
    { label: "Magasins", value: publicStats.stores, icon: Store, color: "text-orange-500" },
  ]

  return (
    <div className="flex flex-col gap-20 py-12 md:py-20 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center space-y-8 px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-bch7al-navy tracking-tight max-w-4xl leading-[1.1]">
          Suivez les prix.<br />
          <span className="text-bch7al-blue">Comparez les offres.</span><br />
          Économisez intelligemment.
        </h1>
        <p className="text-xl text-bch7al-darkgray max-w-2xl font-medium">
          {user 
            ? `Heureux de vous revoir parmi nous, ${user.name} ! Continuez à explorer les meilleures offres du moment ou accédez à votre espace personnel.`
            : "Rejoignez la communauté bch7al. Ne payez plus jamais trop cher en profitant des historiques de prix et des alertes de baisse en temps réel."
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Link to="/products">
            <Button size="lg" className="w-full sm:w-auto bg-bch7al-blue text-white hover:bg-bch7al-navy h-14 px-8 text-lg rounded-full shadow-lg shadow-bch7al-blue/20 transition-all hover:-translate-y-1">
              Explorer les produits
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          {user ? (
            <Link to={user.role === 'admin' || user.role === 'moderator' ? "/admin" : "/dashboard"}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-bch7al-darkgray/20 text-bch7al-navy hover:bg-white hover:text-bch7al-blue transition-all">
                Mon Tableau de Bord
              </Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-bch7al-darkgray/20 text-bch7al-navy hover:bg-white hover:text-bch7al-blue transition-all">
                Créer un compte
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Global Statistics Section */}
      <section className="px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-6xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="border border-bch7al-darkgray/10 shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-[2rem] overflow-hidden group hover:-translate-y-1">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className={`p-4 rounded-2xl bg-bch7al-lightgray group-hover:scale-110 transition-transform duration-300 ${stat.color}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-4xl font-extrabold text-bch7al-navy">{stat.value}</h3>
                    <p className="text-sm font-bold text-bch7al-darkgray/60 uppercase tracking-widest">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
