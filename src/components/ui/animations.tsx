import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface TransitionWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function TransitionWrapper({
  children,
  className,
  delay = 0
}: TransitionWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animación para cambio de día
export function DayTransition({
  isChanging,
  children,
  className
}: {
  isChanging: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      {isChanging ? (
        <motion.div
          key="changing"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={cn('relative', className)}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-lg"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6 }}
          />
          <div className="relative p-6 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center mb-4"
            >
              <div className="relative">
                <motion.div
                  className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </motion.div>
                <motion.div
                  className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
            <motion.h3
              className="text-lg font-semibold text-gray-900 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              ¡Nuevo Día, Nuevo Plan! 🌅
            </motion.h3>
            <motion.p
              className="text-sm text-gray-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Preparando tu plan nutricional personalizado para hoy...
            </motion.p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook para animaciones de métricas
export function useMetricAnimation() {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  const animateValue = (key: string, targetValue: number, duration = 1000) => {
    const startValue = animatedValues[key] || 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutCubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (targetValue - startValue) * easeProgress;

      setAnimatedValues(prev => ({
        ...prev,
        [key]: currentValue
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  return { animatedValues, animateValue };
}

// Notificaciones contextuales para carga
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