import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"

export function SearchBar() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-sm items-center">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un produit..."
        className="pl-10 pr-4 py-2 bg-white border-bch7al-darkgray/20 focus-visible:ring-bch7al-blue rounded-full shadow-sm"
      />
      <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-bch7al-darkgray/50 hover:text-bch7al-blue transition-colors">
        <Search className="h-4 w-4" />
      </button>
    </form>
  )
}
