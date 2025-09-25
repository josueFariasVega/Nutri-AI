import React, { useState, useEffect } from 'react';
import { supabase } from './lib/utils/supabase/client';
import { fetchEdge } from './lib/utils/supabase/edge';
import { useAuth } from './hooks/useAuth';
import { RouterProvider, useRouter, matchRoute } from './components/common/Router';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './app/landing/LandingPage';
import { AuthPage } from './app/auth/AuthPage';
import { TechQuestionnaire } from './app/questionnaire/TechQuestionnaire';
import { TechDashboard } from './app/dashboard/TechDashboard';  
import { UserProfile } from './app/profile/UserProfile';
import { Settings } from './app/settings/Settings'; 
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { logger } from './lib/utils/logger';

function AppRouter() {
  const { currentRoute, navigate } = useRouter();
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState<boolean | null>(null);

  // Verificar estado del cuestionario cuando el usuario está autenticado
  useEffect(() => {
    const checkQuestionnaireStatus = async () => {
      if (!user || !isAuthenticated) {
        setHasCompletedQuestionnaire(null);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetchEdge('user-status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const { hasCompletedQuestionnaire: completed } = await response.json();
          setHasCompletedQuestionnaire(completed);
          logger.log('Questionnaire status updated:', completed);
        }
      } catch (error) {
        logger.error('Error checking questionnaire status:', error);
        setHasCompletedQuestionnaire(false);
      }
    };

    checkQuestionnaireStatus();
  }, [user, isAuthenticated]);

  useEffect(() => {
    // Handle route protection and redirects
    if (!loading) {
      const protectedRoutes = ['/profile', '/dashboard', '/questionnaire', '/settings'];
      
      if (!isAuthenticated && protectedRoutes.includes(currentRoute)) {
        logger.log('No user, redirecting from protected route to home');
        navigate('/', { replace: true });
      }
      
      // If user is authenticated and on auth page, redirect to home
      if (isAuthenticated && currentRoute === '/auth') {
        logger.log('User authenticated, redirecting from auth to home');
        navigate('/', { replace: true });
      }
    }
  }, [currentRoute, navigate, isAuthenticated, loading]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesión cerrada exitosamente');
  };

  const checkUserStatusAndNavigate = async (targetRoute: string) => {
    if (!user) return;
    
    try {
      logger.log('Checking user questionnaire status for:', targetRoute);
      
      // Get current session to get access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        logger.log('No session found, redirecting to auth');
        navigate('/auth');
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      const response = await fetchEdge('user-status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const { hasCompletedQuestionnaire } = await response.json();
        logger.log('User has completed questionnaire:', hasCompletedQuestionnaire);
        
        if (targetRoute === '/dashboard' && !hasCompletedQuestionnaire) {
          logger.log('Dashboard access denied - questionnaire not completed');
          navigate('/questionnaire');
          toast.warning('Completa tu cuestionario primero para acceder al dashboard');
          return;
        }
        
        navigate(targetRoute);
        
        if (targetRoute === '/dashboard') {
          toast.success('Bienvenido a tu dashboard nutricional');
        }
      } else {
        logger.log('User status check failed, redirecting to questionnaire');
        navigate('/questionnaire');
        toast.info('Completa tu cuestionario para acceder a todas las funciones');
      }
    } catch (error) {
      logger.error('Error checking user status:', error);
      navigate('/questionnaire');
      toast.warning('Error verificando tu estado. Por favor, completa el cuestionario.');
    }
  };

  const handleNavigate = (route: string) => {
    logger.log('=== NAVIGATION DEBUG ===');
    logger.log('Route requested:', route);
    logger.log('Current route:', currentRoute);
    logger.log('User logged in:', !!user);
    logger.log('Navigate function available:', typeof navigate);
    
    // Check if trying to access protected routes without authentication
    const protectedRoutes = ['/profile', '/dashboard', '/questionnaire', '/settings'];
    const isProtectedRoute = protectedRoutes.includes(route);
    
    if (isProtectedRoute && !isAuthenticated) {
      logger.log('Redirecting to auth - protected route without login');
      navigate('/auth');
      toast.info('Inicia sesión para acceder a tu plan nutricional personalizado');
      return;
    }

    // Check if trying to access dashboard without completing questionnaire
    if (route === '/dashboard' && user) {
      logger.log('Checking if user has completed questionnaire before accessing dashboard');
      checkUserStatusAndNavigate(route);
      return;
    }
    
    try {
      logger.log('Navigating to:', route);
      navigate(route);
      logger.log('Navigation successful for:', route);
      
      // Provide helpful feedback based on destination
      if (route === '/auth') {
        toast.info('Te llevamos a la página de inicio de sesión');
      } else if (route === '/questionnaire') {
        if (user) {
          toast.success('¡Perfecto! Completa tu cuestionario para obtener tu plan personalizado');
        }
      } else if (route === '/profile') {
        if (user) {
          toast.info('Aquí puedes actualizar tu información personal');
        }
      } else if (route === '/settings') {
        if (user) {
          toast.info('Personaliza tu experiencia en NutriAI');
        }
      }
      // Note: Dashboard toast is handled in checkUserStatusAndNavigate
      
    } catch (error) {
      logger.error('Navigation error:', error);
      // Fallback navigation
      try {
        window.location.hash = route;
        toast.warning('Usando navegación alternativa...');
      } catch (fallbackError) {
        logger.error('Fallback navigation failed:', fallbackError);
        toast.error('Error de navegación. Por favor, recarga la página.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Cargando NutriAI...</div>
          <div className="text-sm text-gray-500 mt-2">Preparando tu experiencia personalizada</div>
        </div>
      </div>
    );
  }

  const layoutChildren = (
    <>
      {/* Route Components */}
      {matchRoute(currentRoute, '/') && (
        <LandingPage onNavigate={handleNavigate} hasCompletedQuestionnaire={hasCompletedQuestionnaire} />
      )}
      {matchRoute(currentRoute, '/auth') && (
        <AuthPage onNavigate={handleNavigate} />
      )}
      {matchRoute(currentRoute, '/questionnaire') && user && (
        <TechQuestionnaire user={user} onNavigate={handleNavigate} />
      )}
      {matchRoute(currentRoute, '/dashboard') && user && (
        <TechDashboard user={user} onNavigate={handleNavigate} onSignOut={handleSignOut} />
      )}
      {matchRoute(currentRoute, '/profile') && user && (
        <UserProfile user={user} onNavigate={handleNavigate} />
      )}
      {matchRoute(currentRoute, '/settings') && user && (
        <Settings user={user} onNavigate={handleNavigate} />
      )}
      
      {/* 404 - Route not found */}
      {!matchRoute(currentRoute, '/') && 
       !matchRoute(currentRoute, '/auth') && 
       !matchRoute(currentRoute, '/questionnaire') && 
       !matchRoute(currentRoute, '/dashboard') && 
       !matchRoute(currentRoute, '/profile') && 
       !matchRoute(currentRoute, '/settings') && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <p className="text-xl mb-8">Página no encontrada</p>
            <button 
              onClick={() => {
                logger.log('404: Navigate to home');
                handleNavigate('/');
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}
      
      <Toaster />
    </>
  );

  return (
    <Layout user={user} onSignOut={handleSignOut} onNavigate={handleNavigate} showNavigation={true} children={layoutChildren} />
  );
}

export default function App() {
  return (
    <RouterProvider initialRoute="/" children={<AppRouter />} />
  );
}