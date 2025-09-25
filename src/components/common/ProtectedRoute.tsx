import React from 'react';
import { useRouter } from '../common/Router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: any;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  user, 
  requireAuth = true, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { navigate } = useRouter();

  React.useEffect(() => {
    if (requireAuth && !user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, requireAuth, redirectTo, navigate]);

  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}