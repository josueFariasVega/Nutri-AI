import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  Smartphone,
  Mail,
  Lock,
  Eye,
  Database,
  Trash2,
  ArrowLeft,
  Save,
  AlertTriangle,
  Clock,
  Droplets,
  Utensils,
  TrendingUp,
  Calendar,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchEdge } from '../../lib/utils/supabase/edge';
import { supabase } from '../../lib/utils/supabase/client';

interface SettingsProps {
  user: any;
  onNavigate: (route: string) => void;
}

export function Settings({ user, onNavigate }: SettingsProps) {
  const [activeSection, setActiveSection] = useState('notifications');
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      reminders: true,
      weeklyReport: true,
      achievements: true,
      mealReminders: true,
      waterReminders: true,
      exerciseReminders: false
    },
    privacy: {
      dataCollection: true,
      analytics: false,
      thirdParty: false,
      publicProfile: false,
      shareProgress: false,
      marketingEmails: false
    },
    preferences: {
      theme: 'light',
      language: 'es',
      timezone: 'Europe/Madrid',
      measurements: 'metric',
      startWeekOn: 'monday',
      defaultMealTime: {
        breakfast: '08:00',
        lunch: '14:00',
        dinner: '20:00',
        snacks: '16:00'
      },
      calorieDisplay: 'detailed',
      macroDisplay: 'percentage'
    },
    goals: {
      dailyWaterGoal: 8,
      weeklyWeightTarget: 0.5,
      activityLevel: 'moderate',
      priorityGoal: 'weight_loss'
    }
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load user settings on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        // Get current session to get access token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          return;
        }

        // Create fetch request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetchEdge('user-settings', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const { settings: userSettings } = await response.json();
          setSettings(userSettings);
        } else {
          console.log('Using default settings - no saved settings found');
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
        toast.warning('No se pudieron cargar tus configuraciones. Usando valores por defecto.');
      } finally {
        setInitialLoading(false);
      }
    };

    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Get current session to get access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      console.log('Saving settings for user:', session.user.id);
      
      // Create fetch request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Save settings to backend
      const response = await fetchEdge('save-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ settings }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        console.log('Settings saved successfully:', result);
        toast.success('Configuración guardada exitosamente');
        
        // Apply theme change immediately if changed
        if (settings.preferences.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (settings.preferences.theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        
      } else {
        const errorText = await response.text();
        console.error('Save settings error response:', errorText);
        throw new Error(`Failed to save settings: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      
      if (error.name === 'AbortError') {
        toast.error('La operación tardó demasiado. Por favor, inténtalo de nuevo.');
      } else if (error.message.includes('Failed to fetch')) {
        toast.error('Error de conexión. Verifica tu internet e inténtalo de nuevo.');
      } else {
        toast.error(`Error al guardar la configuración: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
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
        const response = await fetchEdge('delete-account', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        });
      
        if (response.ok) {
          console.log('✅ Datos de Supabase eliminados');
        } else {
          console.warn('Error eliminando datos de Supabase:', response.status);
        }
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Cargando Configuración...</div>
          <div className="text-sm text-gray-500 mt-2">Preparando tus preferencias personalizadas</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => {window.location.hash = '/dashboard';}}
              className="p-2 hover:bg-green-100 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                  <p className="text-gray-600">Personaliza tu experiencia en NutriAI</p>
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={handleSaveSettings}
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categorías</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <div 
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      activeSection === 'notifications' ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveSection('notifications')}
                  >
                    <Bell className={`w-4 h-4 ${activeSection === 'notifications' ? 'text-green-600' : 'text-gray-600'}`} />
                    <span className={`${activeSection === 'notifications' ? 'font-medium text-green-700' : 'text-gray-700'}`}>
                      Notificaciones
                    </span>
                  </div>
                  <div 
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      activeSection === 'privacy' ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveSection('privacy')}
                  >
                    <Shield className={`w-4 h-4 ${activeSection === 'privacy' ? 'text-green-600' : 'text-gray-600'}`} />
                    <span className={`${activeSection === 'privacy' ? 'font-medium text-green-700' : 'text-gray-700'}`}>
                      Privacidad
                    </span>
                  </div>
                  <div 
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      activeSection === 'preferences' ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveSection('preferences')}
                  >
                    <Globe className={`w-4 h-4 ${activeSection === 'preferences' ? 'text-green-600' : 'text-gray-600'}`} />
                    <span className={`${activeSection === 'preferences' ? 'font-medium text-green-700' : 'text-gray-700'}`}>
                      Preferencias
                    </span>
                  </div>
                  <div 
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      activeSection === 'goals' ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveSection('goals')}
                  >
                    <TrendingUp className={`w-4 h-4 ${activeSection === 'goals' ? 'text-green-600' : 'text-gray-600'}`} />
                    <span className={`${activeSection === 'goals' ? 'font-medium text-green-700' : 'text-gray-700'}`}>
                      Metas
                    </span>
                  </div>
                  <div 
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      activeSection === 'danger' ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveSection('danger')}
                  >
                    <AlertTriangle className={`w-4 h-4 ${activeSection === 'danger' ? 'text-red-600' : 'text-gray-600'}`} />
                    <span className={`${activeSection === 'danger' ? 'font-medium text-red-700' : 'text-gray-700'}`}>
                      Zona Peligrosa
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notificaciones */}
            {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-green-600" />
                  <span>Notificaciones</span>
                </CardTitle>
                <CardDescription>
                  Configura cómo y cuándo quieres recibir notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Notificaciones por Email</span>
                    </div>
                    <p className="text-sm text-gray-600">Recibe actualizaciones importantes por correo</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'email', value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Notificaciones Push</span>
                    </div>
                    <p className="text-sm text-gray-600">Recibe notificaciones en tu dispositivo</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'push', value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-medium">Recordatorios de Comidas</span>
                    <p className="text-sm text-gray-600">Te recordamos cuando es hora de comer</p>
                  </div>
                  <Switch
                    checked={settings.notifications.reminders}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'reminders', value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-medium">Reporte Semanal</span>
                    <p className="text-sm text-gray-600">Resumen de tu progreso cada semana</p>
                  </div>
                  <Switch
                    checked={settings.notifications.weeklyReport}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'weeklyReport', value)}
                  />
                </div>
              </CardContent>
            </Card>
            )}

            {/* Privacidad */}
            {activeSection === 'privacy' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>Privacidad y Seguridad</span>
                </CardTitle>
                <CardDescription>
                  Controla cómo se usan y comparten tus datos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Recopilación de Datos</span>
                      <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Permite que la IA mejore tus recomendaciones</p>
                  </div>
                  <Switch
                    checked={settings.privacy.dataCollection}
                    onCheckedChange={(value) => handleSettingChange('privacy', 'dataCollection', value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-medium">Análisis de Uso</span>
                    <p className="text-sm text-gray-600">Ayuda a mejorar la aplicación</p>
                  </div>
                  <Switch
                    checked={settings.privacy.analytics}
                    onCheckedChange={(value) => handleSettingChange('privacy', 'analytics', value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Perfil Público</span>
                    </div>
                    <p className="text-sm text-gray-600">Permite que otros usuarios vean tu progreso</p>
                  </div>
                  <Switch
                    checked={settings.privacy.publicProfile}
                    onCheckedChange={(value) => handleSettingChange('privacy', 'publicProfile', value)}
                  />
                </div>
              </CardContent>
            </Card>
            )}

            {/* Preferencias */}
            {activeSection === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  <span>Preferencias Generales</span>
                </CardTitle>
                <CardDescription>
                  Personaliza la interfaz según tus preferencias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tema</label>
                    <Select
                      value={settings.preferences.theme}
                      onValueChange={(value) => handleSettingChange('preferences', 'theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Oscuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Idioma</label>
                    <Select
                      value={settings.preferences.language}
                      onValueChange={(value) => handleSettingChange('preferences', 'language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Zona Horaria</label>
                    <Select
                      value={settings.preferences.timezone}
                      onValueChange={(value) => handleSettingChange('preferences', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Madrid">Madrid (UTC+1)</SelectItem>
                        <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                        <SelectItem value="America/New_York">Nueva York (UTC-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sistema de Medidas</label>
                    <Select
                      value={settings.preferences.measurements}
                      onValueChange={(value) => handleSettingChange('preferences', 'measurements', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Métrico (kg, cm)</SelectItem>
                        <SelectItem value="imperial">Imperial (lbs, ft)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Horarios de Comidas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Utensils className="w-4 h-4 text-orange-500" />
                        <label className="text-sm font-medium">Desayuno</label>
                      </div>
                      <input
                        type="time"
                        value={settings.preferences.defaultMealTime.breakfast}
                        onChange={(e) => handleSettingChange('preferences', 'defaultMealTime', {
                          ...settings.preferences.defaultMealTime,
                          breakfast: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Utensils className="w-4 h-4 text-blue-500" />
                        <label className="text-sm font-medium">Almuerzo</label>
                      </div>
                      <input
                        type="time"
                        value={settings.preferences.defaultMealTime.lunch}
                        onChange={(e) => handleSettingChange('preferences', 'defaultMealTime', {
                          ...settings.preferences.defaultMealTime,
                          lunch: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Utensils className="w-4 h-4 text-purple-500" />
                        <label className="text-sm font-medium">Cena</label>
                      </div>
                      <input
                        type="time"
                        value={settings.preferences.defaultMealTime.dinner}
                        onChange={(e) => handleSettingChange('preferences', 'defaultMealTime', {
                          ...settings.preferences.defaultMealTime,
                          dinner: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Utensils className="w-4 h-4 text-green-500" />
                        <label className="text-sm font-medium">Merienda</label>
                      </div>
                      <input
                        type="time"
                        value={settings.preferences.defaultMealTime.snacks}
                        onChange={(e) => handleSettingChange('preferences', 'defaultMealTime', {
                          ...settings.preferences.defaultMealTime,
                          snacks: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Metas y Objetivos */}
            {activeSection === 'goals' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Metas y Objetivos</span>
                </CardTitle>
                <CardDescription>
                  Configura tus objetivos de salud y bienestar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <label className="text-sm font-medium">Meta Diaria de Agua (vasos)</label>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={settings.goals.dailyWaterGoal}
                      onChange={(e) => handleSettingChange('goals', 'dailyWaterGoal', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pérdida de Peso Semanal (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={settings.goals.weeklyWeightTarget}
                      onChange={(e) => handleSettingChange('goals', 'weeklyWeightTarget', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nivel de Actividad</label>
                    <Select
                      value={settings.goals.activityLevel}
                      onValueChange={(value) => handleSettingChange('goals', 'activityLevel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentario</SelectItem>
                        <SelectItem value="light">Ligero</SelectItem>
                        <SelectItem value="moderate">Moderado</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="very_active">Muy Activo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Objetivo Principal</label>
                    <Select
                      value={settings.goals.priorityGoal}
                      onValueChange={(value) => handleSettingChange('goals', 'priorityGoal', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight_loss">Perder Peso</SelectItem>
                        <SelectItem value="weight_gain">Ganar Peso</SelectItem>
                        <SelectItem value="maintenance">Mantener Peso</SelectItem>
                        <SelectItem value="muscle_gain">Ganar Músculo</SelectItem>
                        <SelectItem value="health">Mejorar Salud</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Zona Peligrosa */}
            {activeSection === 'danger' && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Zona Peligrosa</span>
                </CardTitle>
                <CardDescription>
                  Acciones irreversibles que afectan tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start space-x-3">
                      <Trash2 className="w-5 h-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-900">Eliminar Cuenta</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Esta acción eliminará permanentemente tu cuenta y todos los datos asociados.
                          No podrás recuperar esta información.
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteAccount}
                          className="mt-3"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar Cuenta
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}