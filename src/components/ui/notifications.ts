import { toast } from 'sonner@2.0.3';

export const useLoadingNotifications = () => {
  const showPlanRegenerationNotification = () => {
    toast.loading('🔄 Regenerando tu plan nutricional...', {
      id: 'plan-regeneration',
      description: 'Obteniendo datos frescos de la API...',
    });
  };

  const showPlanGeneratedNotification = () => {
    toast.dismiss('plan-regeneration');
    toast.success('✅ Plan generado exitosamente', {
      description: 'Tu plan nutricional está listo para el día',
      duration: 3000,
    });
  };

  const showDayChangeNotification = (date: string) => {
    toast.info('🌅 ¡Buenos días! Nuevo plan disponible', {
      description: `Plan generado para ${new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`,
      duration: 5000,
    });
  };

  const showHydrationReminder = () => {
    toast.info('💧 Recordatorio de hidratación', {
      description: 'No olvides beber agua regularmente durante el día',
      duration: 4000,
    });
  };

  const showMealCompletionNotification = (mealName: string, calories: number) => {
    toast.success(`✅ ${mealName} completada`, {
      description: `+${calories} calorías registradas`,
      duration: 2000,
    });
  };

  return {
    showPlanRegenerationNotification,
    showPlanGeneratedNotification,
    showDayChangeNotification,
    showHydrationReminder,
    showMealCompletionNotification,
  };
};