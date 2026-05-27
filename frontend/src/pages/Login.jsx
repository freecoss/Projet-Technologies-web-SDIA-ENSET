import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import API_URL from '@/config'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        // Extraire le token et le reste des infos
        const { token, ...userData } = data
        login(userData, token)
        navigate('/') // Retour à l'accueil
      } else {
        setError(data.message || 'Erreur lors de la connexion')
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de joindre le serveur: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4 animate-in fade-in duration-500">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-bch7al-darkgray/5 border border-bch7al-darkgray/10 w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-bch7al-navy mb-2">Bon retour ! 👋</h1>
          <p className="text-bch7al-darkgray/70">Connectez-vous pour continuer à économiser.</p>
        </div>

        {error && (
          <div className="bg-bch7al-red/10 border border-bch7al-red/20 text-bch7al-red px-4 py-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-bch7al-navy ml-1">Adresse Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-bch7al-darkgray/40" />
              <Input 
                type="email" 
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-bch7al-lightgray rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-bch7al-navy ml-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-bch7al-darkgray/40" />
              <Input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 bg-bch7al-lightgray rounded-xl"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 text-lg font-bold rounded-xl bg-bch7al-blue hover:bg-bch7al-navy transition-all mt-4"
          >
            {isLoading ? "Connexion..." : (
              <>Se connecter <ArrowRight className="ml-2 h-5 w-5" /></>
            )}
          </Button>
        </form>

        <p className="text-center mt-8 text-bch7al-darkgray/80 text-sm">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-bold text-bch7al-blue hover:underline">
            S'inscrire
          </Link>
        </p>

      </div>
    </div>
  )
}
