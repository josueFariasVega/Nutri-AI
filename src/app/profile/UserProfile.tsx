import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/utils/supabase/client';
import { fetchEdge } from '../../lib/utils/supabase/edge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { 
  User, 
  Mail, 
  Calendar, 
  Target, 
  Activity, 
  Settings, 
  Shield,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Zap,
  Brain
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface UserProfileProps {
  user: any;
  onNavigate: (page: string) => void;
}

export function UserProfile({ user, onNavigate }: UserProfileProps) {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    targetWeight: '',
    activityLevel: '',
    goal: ''
  });
  const [userStats, setUserStats] = useState({
    plansGenerated: 0,
    daysActive: 0,
    adherenceRate: 0,
    joinDate: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load user profile data
      const response = await fetchEdge('user-profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setUserData(prev => ({
            ...prev,
            ...data.profile
          }));
        }
        if (data.stats) {
          setUserStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error al cargar datos del perfil');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Preparar datos a guardar (solo los campos editables)
      const dataToSave = {
        name: userData.name,
        email: userData.email,
        age: userData.age,
        gender: userData.gender,
        height: userData.height,
        weight: userData.weight,
        targetWeight: userData.targetWeight,
        activityLevel: userData.activityLevel,
        goal: userData.goal
      };

      // 1. Actualizar perfil en KV store
      const response = await fetchEdge('user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        // 2. Actualizar metadatos del usuario en Supabase Auth si el nombre cambió
        if (userData.name !== user?.user_metadata?.name) {
          const { error: updateError } = await supabase.auth.updateUser({
            data: { name: userData.name }
          });
          
          if (updateError) {
            console.error('Error updating user metadata:', updateError);
            toast.error('Perfil actualizado pero el nombre puede no reflejarse inmediatamente');
          }
        }
        
        toast.success('✅ Perfil actualizado correctamente');
        setEditing(false);
        
        // 3. Recargar datos del perfil para asegurar sincronización
        await loadUserData();
        
        console.log('💾 Datos guardados correctamente:', dataToSave);

        // Si personal health data cambió, regenerar plan nutricional
        if (dataToSave.weight !== userData.weight || dataToSave.targetWeight !== userData.targetWeight || dataToSave.activityLevel !== userData.activityLevel || dataToSave.goal !== userData.goal) {
          console.log('🔄 Datos de salud cambiaron, regenerando plan nutricional...');
          
          // Importar dinámicamente el hook para evitar dependencias circulares
          import('../../hooks/useDailyMealPlan').then(({ useDailyMealPlan }) => {
            // Esta función se ejecutará después de que se complete el guardado
            setTimeout(async () => {
              try {
                // Aquí podríamos llamar a regenerateNutritionPlan, pero como es un hook,
                // es mejor hacer la llamada directa a la API
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                  const response = await fetchEdge('regenerate-plan', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                  });
                  
                  if (response.ok) {
                    console.log('✅ Plan nutricional regenerado después de actualizar perfil');
                    toast.success('Perfil y plan nutricional actualizados correctamente');
                  } else {
                    console.warn('⚠️ Perfil actualizado pero no se pudo regenerar el plan');
                  }
                }
              } catch (error) {
                console.error('❌ Error regenerando plan después de actualizar perfil:', error);
              }
            }, 1000); // Dar tiempo para que se guarde el perfil primero
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error al guardar perfil:', errorData);
        toast.error(`Error al actualizar el perfil: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error inesperado al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const formatJoinDate = (dateString: string) => {
    if (!dateString) return 'Recientemente';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ ELIMINAR CUENTA PERMANENTEMENTE\n\n' +
      'Esta acción eliminará TODOS tus datos:\n' +
      '• Perfil y configuraciones\n' +
      '• Historial nutricional completo\n' +
      '• Progreso y métricas\n\n' +
      '¿Estás COMPLETAMENTE SEGURO?'
    );
    
    if (!confirmed) {
      toast.info('Eliminación cancelada');
      return;
    }
  
    const confirmation = prompt('Escribe "ELIMINAR CUENTA" para confirmar:');
    if (confirmation !== 'ELIMINAR CUENTA') {
      if (confirmation !== null) {
        toast.error('Texto incorrecto. Eliminación cancelada.');
      }
      return;
    }
  
    setLoading(true);
    
    try {
      toast.loading('Eliminando cuenta...', { id: 'delete-account' });
  
      // 1️⃣ OBTENER SESIÓN
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }
  
      const userId = session.user.id;
      console.log('🗑️ Eliminando cuenta para usuario:', userId);
  
      // 2️⃣ ELIMINAR DATOS DE SUPABASE
      try {
        await supabase.from('user_settings').delete().eq('user_id', userId);
        await supabase.from('nutrition_plans').delete().eq('user_id', userId);
        await supabase.from('user_profiles').delete().eq('user_id', userId);
        console.log('✅ Datos de Supabase eliminados');
      } catch (supabaseError) {
        console.warn('Error eliminando datos de Supabase:', supabaseError);
      }
  
      // 3️⃣ LIMPIAR LOCALSTORAGE COMPLETO
      const keysToDelete = [
        'daily_meal_plan',
        'last_plan_generation', 
        'nutrition_historical_data',
        'user_settings',
        'user_preferences'
      ];
  
      keysToDelete.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Error eliminando ${key}:`, e);
        }
      });
  
      // Limpiar claves relacionadas con Supabase y nutrición
      Object.keys(localStorage).forEach(key => {
        if (
          key.includes('supabase') || 
          key.includes('nutri') || 
          key.includes('meal') || 
          key.includes('user') ||
          key.includes('auth')
        ) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Error eliminando ${key}:`, e);
          }
        }
      });
  
      console.log('✅ localStorage limpiado');
  
      // 4️⃣ CERRAR SESIÓN
      await supabase.auth.signOut();
      console.log('✅ Sesión cerrada');
  
      // 5️⃣ LIMPIAR ESTADO ADICIONAL
      sessionStorage.clear();
      
      // 6️⃣ NOTIFICACIÓN Y REDIRECCIÓN
      toast.success('✅ Cuenta eliminada exitosamente', { id: 'delete-account' });
      
      setTimeout(() => {
        toast.success(
          'Tu cuenta ha sido eliminada completamente.\n' +
          'Puedes crear una nueva cuenta cuando quieras.\n' +
          'Redirigiendo al inicio...',
          { duration: 4000 }
        );
        
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }, 1000);
  
    } catch (error) {
      console.error('❌ Error eliminando cuenta:', error);
      toast.error(
        'Error eliminando la cuenta. Contacta soporte si persiste.',
        { id: 'delete-account' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCommingSoon = async () => {
    toast.info('Esta funcionalidad está en desarrollo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center space-x-4 mb-6">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-green-200 shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white text-2xl font-bold">
                  {(userData.name || userData.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {userData.name || 'Usuario'}
              </h1>
              <p className="text-gray-600 flex items-center mb-3">
                <Mail className="w-4 h-4 mr-2" />
                {userData.email}
              </p>
              <div className="flex items-center space-x-3">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                  <Zap className="w-3 h-3 mr-1" />
                  Plan Premium
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                  <Brain className="w-3 h-3 mr-1" />
                  IA Optimizada
                </Badge>
              </div>
            </div>
            <div className="flex space-x-2">
              {!editing ? (
                <Button
                  onClick={() => setEditing(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditing(false)}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{userStats.plansGenerated}</div>
                <div className="text-sm text-gray-600">Planes Generados</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{userStats.daysActive}</div>
                <div className="text-sm text-gray-600">Días Activo</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{userStats.adherenceRate}%</div>
                <div className="text-sm text-gray-600">Adherencia</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
              <CardContent className="p-4 text-center">
                <div className="text-sm font-bold text-orange-600">Miembro desde</div>
                <div className="text-xs text-gray-600">{formatJoinDate(userStats.joinDate)}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-3 bg-white shadow-lg rounded-xl p-2 border-0 flex flex-col md:flex-row ">
            <TabsTrigger 
              value="profile" 
              className="rounded-lg py-3 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white font-medium transition-all duration-200"
            >
              <User className="w-4 h-4 mr-2" />
              Información Personal
            </TabsTrigger>
            <TabsTrigger 
              value="health" 
              className="rounded-lg py-3 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white font-medium transition-all duration-200"
            >
              <Activity className="w-4 h-4 mr-2" />
              Datos de Salud
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-lg py-3 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white font-medium transition-all duration-200"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-900">
                  <User className="w-6 h-6 mr-3 text-green-600" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Gestiona tu información básica y datos de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nombre Completo
                    </Label>
                    <Input
                      id="name"
                      value={userData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!editing}
                      className="bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      value={userData.email}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-600"
                    />
                    <p className="text-xs text-gray-500">El email no se puede modificar</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                      Edad
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      value={userData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      disabled={!editing}
                      className="bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                      Género
                    </Label>
                    <Input
                      id="gender"
                      value={userData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      disabled={!editing}
                      className="bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-900">
                  <Activity className="w-6 h-6 mr-3 text-green-600" />
                  Datos de Salud y Fitness
                </CardTitle>
                <CardDescription>
                  Información utilizada para personalizar tu plan nutricional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-sm font-medium text-gray-700">
                      Altura (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      value={userData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      disabled={!editing}
                      className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                      Peso Actual (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      value={userData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      disabled={!editing}
                      className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetWeight" className="text-sm font-medium text-gray-700">
                      Peso Objetivo (kg)
                    </Label>
                    <Input
                      id="targetWeight"
                      type="number"
                      value={userData.targetWeight}
                      onChange={(e) => handleInputChange('targetWeight', e.target.value)}
                      disabled={!editing}
                      className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <Separator className="bg-gray-200" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="activityLevel" className="text-sm font-medium text-gray-700">
                      Nivel de Actividad
                    </Label>
                    <Input
                      id="activityLevel"
                      value={userData.activityLevel}
                      onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                      disabled={!editing}
                      placeholder="Ej: Moderada, Alta, Sedentaria"
                      className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal" className="text-sm font-medium text-gray-700">
                      Objetivo Principal
                    </Label>
                    <Input
                      id="goal"
                      value={userData.goal}
                      onChange={(e) => handleInputChange('goal', e.target.value)}
                      disabled={!editing}
                      placeholder="Ej: Perder peso, Ganar músculo, Mantener"
                      className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {userData.weight && userData.height && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Cálculo de IMC
                    </h4>
                    <p className="text-blue-700">
                      Tu IMC actual es: <span className="font-bold">
                        {(parseFloat(userData.weight) / Math.pow(parseFloat(userData.height) / 100, 2)).toFixed(1)}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-900">
                  <Settings className="w-6 h-6 mr-3 text-green-600" />
                  Configuración de Cuenta
                </CardTitle>
                <CardDescription>
                  Opciones avanzadas y configuración de privacidad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-900">Regenerar Plan Nutricional</h4>
                      <p className="text-sm text-gray-600">Actualiza tu plan con base en cambios recientes</p>
                    </div>
                    <Button
                      onClick={handleCommingSoon}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Actualizar Plan
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                    <div>
                      <h4 className="font-medium text-red-900 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Zona de Peligro
                      </h4>
                      <p className="text-sm text-red-600">Acciones irreversibles de cuenta</p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Eliminar Cuenta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}