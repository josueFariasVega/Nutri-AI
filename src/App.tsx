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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

function AppRouter() {
  const { currentRoute, navigate } = useRouter();
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState<boolean | null>(null);
  const [showDeletedUserFix, setShowDeletedUserFix] = useState(false);

  // Función para verificar si es un usuario completamente nuevo
  const checkIfNewUser = async () => {
    if (!user) return false;

    try {
      console.log('🔍 CHECKING NEW USER: Verifying if user is completely new...');

      // Verificar múltiples fuentes de datos
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      // PRIMERO: Verificar si el usuario está marcado como eliminado
      try {
        const deletedCheckResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-b9678739/deleted-user/${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (deletedCheckResponse.ok) {
          console.log('🚨 DELETED USER DETECTED: User is marked as deleted, treating as new user');
          return true;
        }
      } catch (deletedError) {
        // Si no podemos verificar el estado de eliminación, continuar con checks normales
        console.log('ℹ️ Could not check deletion status, continuing with normal checks');
      }

      const checks = await Promise.all([
        fetchEdge('user-status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }).then(r => r.ok ? r.json() : { hasCompletedQuestionnaire: false }),
        fetchEdge('user-profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetchEdge('nutrition-plan', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      const [statusData, profileData, planData] = checks;

      console.log('🔍 CHECKING NEW USER: Status:', statusData);
      console.log('🔍 CHECKING NEW USER: Profile:', profileData);
      console.log('🔍 CHECKING NEW USER: Plan:', planData);

      // Si no tiene cuestionario completado Y no tiene perfil Y no tiene plan, es nuevo
      if (!statusData?.hasCompletedQuestionnaire && !profileData && !planData) {
        console.log('✅ NEW USER DETECTED: User has no previous data');
        return true;
      }

      // Si tiene datos pero el cuestionario no está marcado como completado, limpiar todo
      if (statusData?.hasCompletedQuestionnaire === false && (profileData || planData)) {
        console.log('⚠️ DATA INCONSISTENCY: User has data but questionnaire not marked as completed');
        console.log('🧹 AUTO-CLEANUP: Clearing inconsistent data...');
        await clearAllUserData();
        return true;
      }

      return false;
    } catch (error) {
      console.error('🔍 CHECKING NEW USER: Error:', error);
      return false;
    }
  };

  // Función para limpiar completamente los datos del usuario actual
  const clearAllUserData = async () => {
    if (!user) return;

    try {
      console.log('🧹 CLEARING ALL DATA: Starting complete cleanup for user:', user.id);

      // Eliminar todos los datos asociados con el usuario
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Llamar al endpoint de eliminación de cuenta
        const deleteResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-b9678739/delete-account`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (deleteResponse.ok) {
          console.log('🧹 CLEARING ALL DATA: Server data cleared successfully');

          // También limpiar localStorage completamente
          const keysToRemove = [
            'daily_meal_plan',
            'last_plan_generation',
            'nutrition_historical_data',
            'recipe_cache',
            'user_settings',
            'user_profile'
          ];

          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('🧹 CLEARING ALL DATA: Removed localStorage key:', key);
          });

          toast.success('Todos los datos eliminados completamente');
          return true;
        } else {
          console.error('🧹 CLEARING ALL DATA: Failed to clear server data');
          toast.error('Error al eliminar datos del servidor');
          return false;
        }
      }
    } catch (error) {
      console.error('🧹 CLEARING ALL DATA: Error:', error);
      toast.error('Error técnico al limpiar datos');
      return false;
    }
  };

  // Función para verificar estado del cuestionario
  const checkQuestionnaireStatus = async () => {
    if (!user || !isAuthenticated) {
      setHasCompletedQuestionnaire(null);
      return;
    }

    try {
      console.log('🔍 INITIAL CHECK: Checking user status for:', user.id);

      // Primero verificar si es un usuario completamente nuevo
      const isNewUser = await checkIfNewUser();

      if (isNewUser) {
        console.log('✅ NEW USER: User has no previous data, ready for questionnaire');
        setHasCompletedQuestionnaire(false);
        return;
      }

      // Si no es nuevo, verificar el estado normal
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
        console.log('📋 STATUS CHECK: Server reports questionnaire completed:', completed);
        setHasCompletedQuestionnaire(completed);

        // Si el servidor dice que está completado pero no tenemos datos, limpiar
        if (completed && !isNewUser) {
          console.log('🔄 STATUS SYNC: Questionnaire completed, starting auto-verification...');
          autoVerifyAndFixStatus();
        }
      } else {
        console.log('❌ STATUS CHECK: Error response from server');
        setHasCompletedQuestionnaire(false);
      }
    } catch (error) {
      console.error('❌ STATUS CHECK: Error:', error);
      setHasCompletedQuestionnaire(false);
    }
  };

  // Función para verificar automáticamente y corregir el estado
  const autoVerifyAndFixStatus = async () => {
    if (!user) return;

    try {
      console.log('🔄 AUTO-VERIFY: Checking and fixing questionnaire status...');

      // Verificar el estado actual
      await refreshQuestionnaireStatus();

      // Si después de un tiempo razonable sigue sin estar completado, intentar corrección automática
      setTimeout(async () => {
        if (hasCompletedQuestionnaire === false) {
          console.log('🔄 AUTO-VERIFY: Status still false, attempting auto-fix...');

          // Verificar si realmente existe un cuestionario completado
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            try {
              // Intentar obtener el cuestionario directamente
              const questionnaireResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-b9678739/questionnaire`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (questionnaireResponse.ok) {
                console.log('🔄 AUTO-VERIFY: Questionnaire exists on server, forcing status update...');
                await forceUpdateQuestionnaireStatus();
              }
            } catch (error) {
              console.log('🔄 AUTO-VERIFY: Error checking questionnaire existence:', error);
            }
          }
        }
      }, 3000); // Esperar 3 segundos antes de verificar
    } catch (error) {
      console.log('🔄 AUTO-VERIFY: Error:', error);
    }
  };

  // Función para refrescar el estado del cuestionario
  const refreshQuestionnaireStatus = async () => {
    if (!user || !isAuthenticated) return;

    try {
      console.log('🔄 Refreshing questionnaire status for user:', user.id);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('❌ No session found for refresh');
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
        console.log('📋 Server response - hasCompletedQuestionnaire:', hasCompletedQuestionnaire);
        setHasCompletedQuestionnaire(hasCompletedQuestionnaire);
        logger.log('Questionnaire status updated:', hasCompletedQuestionnaire);
      } else {
        console.error('❌ Error response from user-status:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Error refreshing questionnaire status:', error);
      logger.error('Error refreshing questionnaire status:', error);
    }
  };

  // Función para verificar estado y navegar
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

        // Solo navegar si no estamos ya en la ruta objetivo
        if (currentRoute !== targetRoute) {
          logger.log('Navigating to:', targetRoute);
          navigate(targetRoute);
        }

        if (targetRoute === '/dashboard' && hasCompletedQuestionnaire) {
          toast.success('¡Bienvenido a tu dashboard nutricional!');
        }
      } else {
        logger.log('User status check failed, redirecting to questionnaire');
        if (currentRoute !== '/questionnaire') {
          navigate('/questionnaire');
        }
        toast.info('Completa tu cuestionario para acceder a todas las funciones');
      }
    } catch (error) {
      logger.error('Error checking user status:', error);
      if (currentRoute !== '/questionnaire') {
        navigate('/questionnaire');
      }
      toast.warning('Error verificando tu estado. Por favor, completa el cuestionario.');
    }
  };

  // Función para forzar actualización del estado del cuestionario
  const forceUpdateQuestionnaireStatus = async () => {
    if (!user) return;

    try {
      console.log('🔧 FORCE UPDATE: Updating questionnaire status...');
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        console.log('🔧 FORCE UPDATE: Attempting to update profile directly...');

        // Actualizar el perfil directamente usando el endpoint PUT
        const updateResponse = await fetchEdge('user-profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            has_completed_questionnaire: true,
            questionnaire_completed_at: new Date().toISOString()
          })
        });

        if (updateResponse.ok) {
          console.log('🔧 FORCE UPDATE: Profile updated successfully');
          toast.success('Estado del cuestionario actualizado manualmente');

          // Forzar actualización inmediata del estado local
          setHasCompletedQuestionnaire(true);

          // Navegar al dashboard inmediatamente
          setTimeout(() => {
            navigate('/dashboard');
          }, 500);
        } else {
          console.error('🔧 FORCE UPDATE: Failed to update profile:', updateResponse.status, await updateResponse.text());
          toast.error('Error al actualizar el estado del cuestionario');

          // Si el servidor falla, proceder de todas formas
          console.log('🔧 FORCE UPDATE: Server failed, proceeding anyway...');
          setHasCompletedQuestionnaire(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 500);
        }
      }
    } catch (error) {
      console.log('🔧 FORCE UPDATE: Error:', error);
      toast.error('Error técnico al actualizar el estado');

      // Proceder de todas formas como último recurso
      console.log('🔧 FORCE UPDATE: Proceeding as last resort...');
      setHasCompletedQuestionnaire(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    }
  };

  // Función de emergencia para limpiar completamente todo
  const emergencyCleanup = async () => {
    console.log('🚨 EMERGENCY CLEANUP: Starting complete cleanup...');

    try {
      // 1. Limpiar servidor si hay sesión
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-b9678739/delete-account`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }).catch(() => console.log('Server cleanup failed, continuing with local cleanup...'));
        }
      }

      // 2. Limpiar localStorage completamente
      const keysToRemove = [
        'daily_meal_plan', 'last_plan_generation', 'nutrition_historical_data',
        'user_settings', 'user_preferences', 'recipe_cache', 'user_profile',
        'supabase.auth.token', 'supabase.auth.refreshToken'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ Removed:', key);
      });

      // 3. Limpiar todas las claves relacionadas
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('nutri') || key.includes('meal') ||
            key.includes('user') || key.includes('auth') || key.includes('recipe')) {
          localStorage.removeItem(key);
          console.log('🗑️ Removed related key:', key);
        }
      });

      // 4. Limpiar sessionStorage
      sessionStorage.clear();

      // 5. Cerrar sesión
      await supabase.auth.signOut();

      console.log('✅ EMERGENCY CLEANUP: Complete cleanup finished');
      toast.success('Limpieza completa realizada');

      // Recargar la página para estado completamente limpio
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);

      return true;
    } catch (error) {
      console.error('❌ EMERGENCY CLEANUP: Error:', error);
      toast.error('Error en limpieza de emergencia');
      return false;
    }
  };

  // Función específica para limpiar datos de usuario eliminado
  const fixDeletedUser = async () => {
    console.log('🔧 FIX DELETED USER: Starting fix for deleted user issue...');

    try {
      // 1. Verificar si realmente hay datos del usuario anterior
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('🔧 Current session user ID:', session.user.id);

        // 2. Intentar obtener datos que no deberían existir
        const responses = await Promise.allSettled([
          fetchEdge('user-status', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetchEdge('user-profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetchEdge('nutrition-plan', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          })
        ]);

        console.log('🔧 Checking for existing data...');
        responses.forEach((response, index) => {
          if (response.status === 'fulfilled' && response.value.ok) {
            console.log(`🔧 Data source ${index + 1}: EXISTS (should be cleaned)`);
          } else {
            console.log(`🔧 Data source ${index + 1}: CLEAN`);
          }
        });

        // 3. Limpiar todo lo que encuentre
        await emergencyCleanup();

        console.log('✅ FIX DELETED USER: Fix completed');
        toast.success('Problema de usuario eliminado solucionado');

        return true;
      } else {
        console.log('🔧 No active session, user is already clean');
        return true;
      }
    } catch (error) {
      console.error('❌ FIX DELETED USER: Error:', error);
      toast.error('Error al solucionar problema de usuario eliminado');
      return false;
    }
  };

  // Función de debug para verificar el estado del cuestionario
  const debugQuestionnaireStatus = async () => {
    if (!user) return;

    try {
      console.log('🔍 DEBUG: Checking questionnaire status...');
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const response = await fetchEdge('user-status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('🔍 DEBUG: Response status:', response.status);
        console.log('🔍 DEBUG: Response ok:', response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log('🔍 DEBUG: Server response data:', data);
          setHasCompletedQuestionnaire(data.hasCompletedQuestionnaire);

          // También intentar obtener el perfil completo
          try {
            const profileResponse = await fetchEdge('user-profile', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });

            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              console.log('🔍 DEBUG: Full profile data:', profileData);
            }
          } catch (profileError) {
            console.log('🔍 DEBUG: Error getting profile:', profileError);
          }

        } else {
          console.log('🔍 DEBUG: Error response:', await response.text());
        }
      }
    } catch (error) {
      console.log('🔍 DEBUG: Error:', error);
    }
  };

  // Verificar estado del cuestionario cuando el usuario está autenticado
  useEffect(() => {
    checkQuestionnaireStatus();
  }, [user, isAuthenticated]);

  // Detectar automáticamente si hay problema de usuario eliminado
  useEffect(() => {
    if (user && isAuthenticated && hasCompletedQuestionnaire === false) {
      // Verificar si realmente hay datos del usuario que no deberían estar
      const checkForOrphanedData = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Verificar si existe algún dato que indique que este usuario tuvo una cuenta anterior
            const profileResponse = await fetchEdge('user-profile', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            }).catch(() => null);
            const planResponse = await fetchEdge('nutrition-plan', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            }).catch(() => null);

            if (profileResponse?.ok || planResponse?.ok) {
              console.log('⚠️ ORPHANED DATA DETECTED: User has data but questionnaire not completed');
              setShowDeletedUserFix(true);
            }
          }
        } catch (error) {
          console.log('Error checking for orphaned data:', error);
        }
      };

      // Pequeño delay para permitir que otros checks se completen
      setTimeout(checkForOrphanedData, 2000);
    }
  }, [user, isAuthenticated, hasCompletedQuestionnaire]);

  // Manejar protección de rutas y redirecciones
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




  // Exponer función de debug globalmente
  (window as any).debugQuestionnaireStatus = debugQuestionnaireStatus;





  // Exponer funciones de debug globalmente
  (window as any).forceUpdateQuestionnaireStatus = forceUpdateQuestionnaireStatus;
  (window as any).clearAllUserData = clearAllUserData;
  (window as any).checkIfNewUser = checkIfNewUser;
  (window as any).debugQuestionnaireStatus = debugQuestionnaireStatus;

  // También exponer información útil para debugging
  (window as any).debugInfo = {
    currentUser: user,
    hasCompletedQuestionnaire,
    currentRoute,
    isAuthenticated
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
        <TechQuestionnaire 
        user={user} 
        onNavigate={handleNavigate} 
        refreshQuestionnaireStatus={refreshQuestionnaireStatus}
        />
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

  // Si se detecta problema de usuario eliminado, mostrar componente especial
  if (showDeletedUserFix && user && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Cuenta Anterior Detectada</CardTitle>
              <CardDescription className="text-gray-600">
                Detectamos que tienes datos de una cuenta anterior. ¿Quieres limpiarlos completamente?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Problema:</strong> Parece que eliminaste tu cuenta anteriormente, pero algunos datos siguen existiendo.
                  Esto puede causar conflictos con tu nueva sesión.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={async () => {
                    const success = await (window as any).fixDeletedUser();
                    if (success) {
                      setShowDeletedUserFix(false);
                      setTimeout(() => {
                        window.location.reload();
                      }, 1500);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpiar Datos Anteriores
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowDeletedUserFix(false)}
                  className="w-full"
                >
                  Continuar con Datos Existentes
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>💡 <strong>Tip:</strong> Usa "Limpiar Datos Anteriores" para comenzar completamente de nuevo</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onSignOut={handleSignOut} onNavigate={handleNavigate} showNavigation={true} children={layoutChildren} />
  );
}

export default function App() {
  return (
    <RouterProvider initialRoute="/" children={<AppRouter />} />
  );
}