import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Bell, Clock, CheckCircle, AlertTriangle, Info, X, Settings, Target, Droplets, Utensils, Award, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { useMealTracking } from '../../hooks/useMealTracking';
import { useLoadingNotifications } from '../../components/ui/notifications';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'reminder' | 'achievement' | 'warning' | 'info' | 'progress';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionable?: boolean;
  action?: () => void;
}

export function DashboardNotifications() {
  const { 
    mealPlan, 
    nutritionSummary, 
    calorieProgress,
    dailyPlan,
    updateHydration,
    hasNutritionPlan,
    isCurrentDay
  } = useMealTracking();

  // Hook para integración con sistema global de notificaciones
  const {
    showPlanRegenerationNotification,
    showPlanGeneratedNotification,
    showDayChangeNotification,
    showHydrationReminder,
    showMealCompletionNotification,
  } = useLoadingNotifications();

  // Estado para permisos de notificaciones del navegador
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('notification_settings');
    return saved ? JSON.parse(saved) : {
      mealReminders: true,
      hydrationReminders: true,
      progressAlerts: true,
      achievements: true,
      weeklyReports: true,
      nutritionWarnings: true,
      browserNotifications: false,
      soundEnabled: true,
      customSchedule: false
    };
  });

  const [readNotifications, setReadNotifications] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('read_notifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Verificar permisos de notificaciones del navegador al cargar
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      setBrowserNotificationsEnabled(Notification.permission === 'granted' && notificationSettings.browserNotifications);
    }
  }, [notificationSettings.browserNotifications]);

  // Función para solicitar permisos de notificaciones del navegador
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          setBrowserNotificationsEnabled(true);
          setNotificationSettings(prev => ({ ...prev, browserNotifications: true }));
          toast.success('¡Notificaciones del navegador activadas!');
          
          // Mostrar notificación de prueba
          new Notification('NutriAI - Notificaciones Activadas', {
            body: 'Ahora recibirás recordatorios nutricionales en tiempo real',
            icon: '/favicon.ico',
            badge: '/favicon.ico'
          });
        } else {
          toast.error('Permisos de notificación denegados');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        toast.error('Error al solicitar permisos de notificación');
      }
    } else {
      toast.error('Tu navegador no soporta notificaciones');
    }
  };

  // Función para enviar notificación del navegador
  const sendBrowserNotification = (title: string, body: string, icon?: string) => {
    if (browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        silent: !notificationSettings.soundEnabled
      });
    }
  };

  // Generar notificaciones basadas en datos reales del usuario
  const notifications: Notification[] = useMemo(() => {
    if (!hasNutritionPlan || !isCurrentDay) return [];

    const notifs: Notification[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // 1. Recordatorios de comidas basados en el plan real
    if (notificationSettings.mealReminders) {
      const incompleteMeals = mealPlan.filter(meal => !meal.completed);
      const nextMeal = incompleteMeals.find(meal => {
        const [mealHour, mealMinute] = meal.time.split(':').map(Number);
        const mealTime = mealHour * 60 + mealMinute;
        const currentTime = currentHour * 60 + currentMinute;
        return mealTime <= currentTime + 30 && mealTime >= currentTime - 30;
      });

      if (nextMeal) {
        notifs.push({
          id: `meal-reminder-${nextMeal.id}`,
          type: 'reminder',
          title: `Hora de ${nextMeal.meal}`,
          message: `No olvides registrar tu ${nextMeal.meal.toLowerCase()} según tu plan nutricional (${nextMeal.calories} kcal)`,
          time: timeStr,
          read: false,
          priority: 'high',
          actionable: true,
          action: () => {
            // Scroll to meal section or navigate
            toast.success(`Recordatorio para ${nextMeal.meal} marcado como visto`);
            showMealCompletionNotification(nextMeal.meal, nextMeal.calories);
            
            // Enviar notificación del navegador
            sendBrowserNotification(
              `Hora de ${nextMeal.meal}`,
              `No olvides registrar tu ${nextMeal.meal.toLowerCase()} (${nextMeal.calories} kcal)`
            );
          }
        });
      }
    }

    // 2. Alertas de hidratación
    if (notificationSettings.hydrationReminders && dailyPlan?.hydration) {
      const waterGlasses = dailyPlan.hydration.glasses || 0;
      const targetGlasses = 8;
      const expectedGlassesByNow = Math.floor((currentHour / 24) * targetGlasses);
      
      if (waterGlasses < expectedGlassesByNow && currentHour > 8) {
        notifs.push({
          id: 'hydration-reminder',
          type: 'warning',
          title: 'Hidratación insuficiente',
          message: `Llevas ${waterGlasses} vasos de agua. Deberías tener al menos ${expectedGlassesByNow} a esta hora.`,
          time: timeStr,
          read: false,
          priority: 'medium',
          actionable: true,
          action: () => {
            updateHydration(waterGlasses + 1);
            toast.success('¡Vaso de agua agregado!');
            showHydrationReminder();
            
            // Enviar notificación del navegador
            sendBrowserNotification(
              'Hidratación actualizada',
              `¡Excelente! Ahora llevas ${waterGlasses + 1} vasos de agua`
            );
          }
        });
      }
    }

    // 3. Alertas nutricionales basadas en progreso real
    if (notificationSettings.nutritionWarnings && nutritionSummary) {
      const proteinProgress = (nutritionSummary.protein.current / nutritionSummary.protein.target) * 100;
      const calorieProgressPercent = (nutritionSummary.totalCalories / nutritionSummary.targetCalories) * 100;

      // Alerta de proteínas bajas
      if (proteinProgress < 50 && currentHour > 14) {
        notifs.push({
          id: 'protein-warning',
          type: 'warning',
          title: 'Bajo consumo de proteínas',
          message: `Llevas ${nutritionSummary.protein.current}g de proteína hoy. Tu objetivo es ${nutritionSummary.protein.target}g`,
          time: timeStr,
          read: false,
          priority: 'high'
        });
      }

      // Alerta de calorías muy bajas
      if (calorieProgressPercent < 30 && currentHour > 16) {
        notifs.push({
          id: 'calories-low',
          type: 'warning',
          title: 'Consumo calórico bajo',
          message: `Solo has consumido ${nutritionSummary.totalCalories} de ${nutritionSummary.targetCalories} calorías objetivo`,
          time: timeStr,
          read: false,
          priority: 'medium'
        });
      }
    }

    // 4. Logros basados en progreso real
    if (notificationSettings.achievements) {
      const completedMeals = mealPlan.filter(meal => meal.completed).length;
      const totalMeals = mealPlan.length;
      
      // Logro: Todas las comidas completadas
      if (completedMeals === totalMeals && totalMeals > 0) {
        notifs.push({
          id: 'all-meals-completed',
          type: 'achievement',
          title: '¡Día perfecto completado!',
          message: `Has registrado todas tus ${totalMeals} comidas del día. ¡Excelente trabajo!`,
          time: timeStr,
          read: false,
          priority: 'high'
        });
      }

      // Logro: Meta de hidratación alcanzada
      if (dailyPlan?.hydration?.glasses >= 8) {
        notifs.push({
          id: 'hydration-goal',
          type: 'achievement',
          title: '¡Meta de hidratación alcanzada!',
          message: `Has bebido ${dailyPlan.hydration.glasses} vasos de agua. ¡Mantén el buen hábito!`,
          time: timeStr,
          read: false,
          priority: 'medium'
        });
      }

      // Logro: Objetivo calórico alcanzado
      if (calorieProgress >= 90 && calorieProgress <= 110) {
        notifs.push({
          id: 'calorie-goal',
          type: 'achievement',
          title: '¡Objetivo calórico perfecto!',
          message: `Estás en el rango ideal de calorías (${Math.round(calorieProgress)}% del objetivo)`,
          time: timeStr,
          read: false,
          priority: 'medium'
        });
      }
    }

    // 5. Información sobre progreso
    if (notificationSettings.progressAlerts && currentHour === 20) {
      const completionRate = (mealPlan.filter(m => m.completed).length / mealPlan.length) * 100;
      notifs.push({
        id: 'daily-progress',
        type: 'info',
        title: 'Resumen del día',
        message: `Has completado ${Math.round(completionRate)}% de tu plan nutricional hoy`,
        time: timeStr,
        read: false,
        priority: 'low'
      });
    }

    return notifs;
  }, [mealPlan, nutritionSummary, calorieProgress, dailyPlan, notificationSettings, hasNutritionPlan, isCurrentDay]);

  // Filtrar notificaciones leídas
  const unreadNotifications = notifications.filter(notif => !readNotifications.has(notif.id));
  const allNotifications = notifications.map(notif => ({
    ...notif,
    read: readNotifications.has(notif.id)
  }));

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder': return Clock;
      case 'achievement': return Award;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      case 'progress': return TrendingUp;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (type === 'achievement') return 'text-emerald-400 bg-emerald-500/20';
    if (type === 'warning') return 'text-amber-400 bg-amber-500/20';
    if (priority === 'high') return 'text-red-400 bg-red-500/20';
    if (priority === 'medium') return 'text-blue-400 bg-blue-500/20';
    return 'text-slate-400 bg-slate-500/20';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const markAsRead = (id: string) => {
    const newReadNotifications = new Set(readNotifications);
    newReadNotifications.add(id);
    setReadNotifications(newReadNotifications);
    localStorage.setItem('read_notifications', JSON.stringify([...newReadNotifications]));
  };

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadNotifications(allIds);
    localStorage.setItem('read_notifications', JSON.stringify([...allIds]));
    toast.success('Todas las notificaciones marcadas como leídas');
  };

  const deleteNotification = (id: string) => {
    const newReadNotifications = new Set(readNotifications);
    newReadNotifications.add(id);
    setReadNotifications(newReadNotifications);
    localStorage.setItem('read_notifications', JSON.stringify([...newReadNotifications]));
    toast.success('Notificación eliminada');
  };

  const saveSettings = () => {
    localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
    toast.success('Configuración de notificaciones guardada');
  };

  const unreadCount = unreadNotifications.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        {/* Bloque de texto */}
        <div className="md:flex md:items-center md:space-x-4">
          <h1 className="text-2xl font-bold">Centro de Notificaciones</h1>
          <p className="text-slate-400 mt-1 md:mt-0">
            Mantente al día con tu progreso nutricional
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                {unreadCount} nuevas
              </span>
            )}
          </p>
        </div>

        {/* Botón */}
        {unreadCount > 0 && (
          <div>
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
          </div>
        )}
      </div>


      {/* Notifications Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Bell className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{allNotifications.length}</p>
            <p className="text-blue-400 text-sm">Total Notificaciones</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{unreadCount}</p>
            <p className="text-red-600 text-sm">No Leídas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Award className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {allNotifications.filter(n => n.type === 'achievement').length}
            </p>
            <p className="text-emerald-600 text-sm">Logros</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {allNotifications.filter(n => n.type === 'reminder').length}
            </p>
            <p className="text-purple-600 text-sm">Recordatorios</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className=" flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-400" />
            Notificaciones Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No hay notificaciones disponibles</p>
              <p className="text-slate-500 text-sm mt-1">
                Las notificaciones aparecerán basadas en tu progreso nutricional
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      notification.read 
                        ? 'bg-slate-800/50 border-slate-700' 
                        : 'bg-blue-500/10 border-blue-500/30 shadow-lg'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        getNotificationColor(notification.type, notification.priority)
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`font-medium ${notification.read ? 'text-slate-300' : ''}`}>
                            {notification.title}
                          </h3>
                          <Badge className={getPriorityBadge(notification.priority)}>
                            {notification.priority === 'high' ? 'Alta' : 
                             notification.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-sm ${notification.read ? 'text-slate-400' : 'text-slate-300'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {notification.actionable && notification.action && (
                          <Button
                            onClick={notification.action}
                            variant="ghost"
                            size="sm"
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          >
                            <Target className="w-4 h-4" />
                          </Button>
                        )}
                        {!notification.read && (
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteNotification(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-purple-600" />
            Configuración de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Recordatorios de Comidas</Label>
                    <p className="text-sm text-slate-400">Avisos para registrar tus comidas</p>
                  </div>
                  <Switch
                    checked={notificationSettings.mealReminders}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, mealReminders: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Recordatorios de Hidratación</Label>
                    <p className="text-sm text-slate-400">Avisos para beber agua</p>
                  </div>
                  <Switch
                    checked={notificationSettings.hydrationReminders}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, hydrationReminders: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Alertas Nutricionales</Label>
                    <p className="text-sm text-slate-400">Avisos sobre macronutrientes</p>
                  </div>
                  <Switch
                    checked={notificationSettings.nutritionWarnings}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, nutritionWarnings: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Logros y Metas</Label>
                    <p className="text-sm text-slate-400">Celebración de tus logros</p>
                  </div>
                  <Switch
                    checked={notificationSettings.achievements}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, achievements: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Alertas de Progreso</Label>
                    <p className="text-sm text-slate-400">Resumen de tu progreso diario</p>
                  </div>
                  <Switch
                    checked={notificationSettings.progressAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, progressAlerts: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Reportes Semanales</Label>
                    <p className="text-sm text-slate-400">Resumen semanal de progreso</p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, weeklyReports: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Notificaciones del Navegador</Label>
                <p className="text-sm text-slate-400">Recibir notificaciones en el navegador</p>
              </div>
              <Switch
                checked={notificationSettings.browserNotifications}
                onCheckedChange={(checked) => {
                  if (checked && notificationPermission !== 'granted') {
                    requestNotificationPermission();
                  } else {
                    setNotificationSettings(prev => ({ ...prev, browserNotifications: checked }));
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Sonido en Notificaciones</Label>
                <p className="text-sm text-slate-400">Reproducir sonido al recibir notificaciones</p>
              </div>
              <Switch
                checked={notificationSettings.soundEnabled}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, soundEnabled: checked }))
                }
              />
            </div>

            <div className="pt-4 border-t border-slate-700">
              <Button 
                onClick={saveSettings}
                className="bg-green-600 hover:bg-green-600"
              >
                Guardar Configuración
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}