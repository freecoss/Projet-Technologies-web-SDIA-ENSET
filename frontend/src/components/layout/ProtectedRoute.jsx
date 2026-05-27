import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bch7al-lightgray/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-bch7al-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-bch7al-navy font-bold animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
