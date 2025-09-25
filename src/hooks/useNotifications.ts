/**
 * Hook unificado para manejar notificaciones basadas en datos reales del usuario
 */
import { useState, useMemo, useCallback } from 'react';
import { useMealTracking } from './useMealTracking';

export interface Notification {
  id: string;
  tipo: 'exito' | 'info' | 'advertencia' | 'error';
  titulo: string;
  mensaje: string;
  tiempo: string;
  leida: boolean;
  accion?: {
    texto: string;
    ruta: string;
  };
  priority: 'high' | 'medium' | 'low';
  actionable?: boolean;
  onAction?: () => void;
}

export function useNotifications() {
  const { 
    mealPlan, 
    nutritionSummary, 
    calorieProgress,
    dailyPlan,
    updateHydration,
    hasNutritionPlan,
    isCurrentDay
  } = useMealTracking();

  const [readNotifications, setReadNotifications] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('read_notifications_center');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [notificationSettings] = useState(() => {
    const saved = localStorage.getItem('notification_settings');
    return saved ? JSON.parse(saved) : {
      mealReminders: true,
      hydrationReminders: true,
      progressAlerts: true,
      achievements: true,
      weeklyReports: true,
      nutritionWarnings: true
    };
  });

  // Generar notificaciones basadas en datos reales del usuario
  const notificaciones: Notification[] = useMemo(() => {
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
          tipo: 'info',
          titulo: `Hora de ${nextMeal.meal}`,
          mensaje: `No olvides registrar tu ${nextMeal.meal.toLowerCase()} según tu plan nutricional (${nextMeal.calories} kcal)`,
          tiempo: '2 min',
          leida: false,
          priority: 'high',
          accion: {
            texto: 'Ver plan',
            ruta: '/dashboard'
          },
          actionable: true,
          onAction: () => {
            console.log(`Recordatorio para ${nextMeal.meal} marcado como visto`);
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
          tipo: 'advertencia',
          titulo: 'Recordatorio de agua',
          mensaje: `Es hora de beber agua. Llevas ${waterGlasses} de ${targetGlasses} vasos hoy.`,
          tiempo: '15 min',
          leida: false,
          priority: 'medium',
          actionable: true,
          onAction: () => {
            updateHydration(waterGlasses + 1);
            console.log('¡Vaso de agua agregado!');
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
          tipo: 'advertencia',
          titulo: 'Bajo consumo de proteínas',
          mensaje: `Llevas ${nutritionSummary.protein.current}g de proteína hoy. Tu objetivo es ${nutritionSummary.protein.target}g`,
          tiempo: '30 min',
          leida: false,
          priority: 'high',
          accion: {
            texto: 'Ver progreso',
            ruta: '/dashboard?section=progress'
          }
        });
      }

      // Alerta de calorías muy bajas
      if (calorieProgressPercent < 30 && currentHour > 16) {
        notifs.push({
          id: 'calories-low',
          tipo: 'error',
          titulo: 'Consumo calórico bajo',
          mensaje: `Solo has consumido ${nutritionSummary.totalCalories} de ${nutritionSummary.targetCalories} calorías objetivo`,
          tiempo: '45 min',
          leida: false,
          priority: 'medium',
          accion: {
            texto: 'Ver plan',
            ruta: '/dashboard'
          }
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
          tipo: 'exito',
          titulo: 'Plan nutricional actualizado',
          mensaje: `Has registrado todas tus ${totalMeals} comidas del día. ¡Excelente trabajo!`,
          tiempo: '2 min',
          leida: false,
          priority: 'high',
          accion: {
            texto: 'Ver plan',
            ruta: '/dashboard'
          }
        });
      }

      // Logro: Meta de hidratación alcanzada
      if (dailyPlan?.hydration?.glasses >= 8) {
        notifs.push({
          id: 'hydration-goal',
          tipo: 'exito',
          titulo: '¡Meta de hidratación alcanzada!',
          mensaje: `Has bebido ${dailyPlan.hydration.glasses} vasos de agua. ¡Mantén el buen hábito!`,
          tiempo: '5 min',
          leida: false,
          priority: 'medium',
          accion: {
            texto: 'Ver progreso',
            ruta: '/dashboard?section=progress'
          }
        });
      }

      // Logro: Objetivo calórico alcanzado
      if (calorieProgress >= 90 && calorieProgress <= 110) {
        notifs.push({
          id: 'calorie-goal',
          tipo: 'exito',
          titulo: '¡Objetivo calórico perfecto!',
          mensaje: `Estás en el rango ideal de calorías (${Math.round(calorieProgress)}% del objetivo)`,
          tiempo: '10 min',
          leida: false,
          priority: 'medium',
          accion: {
            texto: 'Ver progreso',
            ruta: '/dashboard?section=progress'
          }
        });
      }
    }

    // 5. Meta de ejercicio pendiente (simulada basada en métricas)
    if (notificationSettings.progressAlerts && dailyPlan?.metrics) {
      const energyLevel = dailyPlan.metrics.energy || 0;
      
      if (energyLevel < 6 && currentHour > 17) {
        notifs.push({
          id: 'exercise-pending',
          tipo: 'advertencia',
          titulo: 'Meta de ejercicio pendiente',
          mensaje: 'Te faltan 20 minutos para completar tu meta diaria.',
          tiempo: '1 hora',
          leida: false,
          priority: 'medium',
          accion: {
            texto: 'Ver ejercicios',
            ruta: '/dashboard?section=progress'
          }
        });
      }
    }

    return notifs;
  }, [mealPlan, nutritionSummary, calorieProgress, dailyPlan, notificationSettings, hasNutritionPlan, isCurrentDay]);

  // Filtrar notificaciones leídas
  const allNotifications = notificaciones.map(notif => ({
    ...notif,
    leida: readNotifications.has(notif.id)
  }));

  // Contar no leídas
  const noLeidas = allNotifications.filter(n => !n.leida).length;

  // Marcar como leída
  const marcarComoLeida = useCallback((id: string) => {
    const newReadNotifications = new Set(readNotifications);
    newReadNotifications.add(id);
    setReadNotifications(newReadNotifications);
    localStorage.setItem('read_notifications_center', JSON.stringify([...newReadNotifications]));
  }, [readNotifications]);

  // Marcar todas como leídas
  const marcarTodasComoLeidas = useCallback(() => {
    const allIds = new Set(notificaciones.map(n => n.id));
    setReadNotifications(allIds);
    localStorage.setItem('read_notifications_center', JSON.stringify([...allIds]));
  }, [notificaciones]);

  // Eliminar notificación
  const eliminarNotificacion = useCallback((id: string) => {
    const newReadNotifications = new Set(readNotifications);
    newReadNotifications.add(id);
    setReadNotifications(newReadNotifications);
    localStorage.setItem('read_notifications_center', JSON.stringify([...newReadNotifications]));
  }, [readNotifications]);

  // Agregar nueva notificación (para compatibilidad)
  const agregarNotificacion = useCallback((notificacion: Omit<Notification, 'id'>) => {
    console.log('Nueva notificación agregada:', notificacion);
    // En el futuro, esto podría agregar notificaciones personalizadas
  }, []);

  return {
    notificaciones: allNotifications,
    noLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    agregarNotificacion
  };
}
