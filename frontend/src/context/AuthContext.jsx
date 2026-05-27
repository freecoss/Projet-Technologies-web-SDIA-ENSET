import { createContext, useState, useEffect, useContext } from 'react';
import API_URL from '@/config';
import { fetchApi } from '@/utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bch7al_token'));
  const [loading, setLoading] = useState(true);

  // Vérifier le token et récupérer le profil au chargement
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetchApi('/api/auth/profile');

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          // Token invalide ou expiré
          logout();
        }
      } catch (error) {
        console.error("Erreur Auth:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Écouter l'événement personnalisé déclenché par notre utilitaire fetch (api.js) lors d'un 401
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [token]);

  const login = (userData, jwtToken) => {
    localStorage.setItem('bch7al_token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('bch7al_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (newUserData) => {
    setUser({ ...user, ...newUserData });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
