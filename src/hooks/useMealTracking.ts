/**
 * @fileoverview Meal Tracking Hook - Hook compartido para el seguimiento de comidas
 * @description Maneja el estado de comidas completadas conectado con el cuestionario y API
 * @author Nutrition Platform Team
 * @version 3.0.0
 */

import { useMemo } from 'react';
import { useDailyMealPlan } from './useDailyMealPlan';

export interface MealItem {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  consumed: boolean;
}

export interface Meal {
  id: string;
  time: string;
  meal: string;
  icon: any;
  calories: number;
  items: MealItem[];
  completed: boolean;
}

export interface NutritionSummary {
  totalCalories: number;
  targetCalories: number;
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
}

export interface DietaryPreferences {
  dietType: string[];
  favoriteFood: string[];
  allergies: string[];
  intolerances: string[];
}

/**
 * Hook para el seguimiento unificado de comidas conectado con el cuestionario
 * Ahora usa useDailyMealPlan como fuente de datos principal
 */
export function useMealTracking() {
  // Usar el nuevo hook de planes diarios como fuente principal
  const {
    mealPlan: dailyMealPlan,
    nutritionSummary: dailyNutritionSummary,
    calorieProgress: dailyCalorieProgress,
    toggleMealCompletion: dailyToggleMealCompletion,
    updateHydration: dailyUpdateHydration,
    updateMetrics: dailyUpdateMetrics,
    loading,
    error,
    hasNutritionPlan,
    regeneratePlan,
    forceRefreshFromQuestionnaire,
    dailyPlan,
    isCurrentDay  // ✅ AGREGADO: Extraer isCurrentDay del hook principal
  } = useDailyMealPlan();

  // Preferencias dietéticas por defecto (se pueden obtener del plan nutricional en el futuro)
  const dietaryPreferences: DietaryPreferences = useMemo(() => ({
    dietType: ['Mediterránea', 'Baja en Carbohidratos'],
    favoriteFood: ['Salmón', 'Aguacate', 'Quinoa', 'Brócoli', 'Almendras', 'Pollo'],
    allergies: ['Frutos Secos', 'Mariscos'],
    intolerances: ['Lactosa']
  }), []);

  // Convertir el formato de DailyMeal a Meal para mantener compatibilidad
  const mealPlan: Meal[] = useMemo(() => {
    return dailyMealPlan.map(dailyMeal => ({
      id: dailyMeal.id,
      time: dailyMeal.time,
      meal: dailyMeal.meal,
      icon: dailyMeal.icon,
      calories: dailyMeal.calories,
      items: dailyMeal.items.map(item => ({
        id: item.id,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        consumed: item.consumed
      })),
      completed: dailyMeal.completed
    }));
  }, [dailyMealPlan]);

  // Usar el resumen nutricional del plan diario
  const nutritionSummary: NutritionSummary = useMemo(() => ({
    totalCalories: dailyNutritionSummary.totalCalories,
    targetCalories: dailyNutritionSummary.targetCalories,
    protein: dailyNutritionSummary.protein,
    carbs: dailyNutritionSummary.carbs,
    fat: dailyNutritionSummary.fat
  }), [dailyNutritionSummary]);

  // Usar el progreso de calorías del plan diario
  const calorieProgress = dailyCalorieProgress;

  // Usar la función de toggle del plan diario
  const toggleMealCompletion = dailyToggleMealCompletion;

  // Función de reset que regenera el plan
  const resetMealPlan = regeneratePlan;

  return {
    // Datos principales (compatibles con la interfaz anterior)
    mealPlan,
    nutritionSummary,
    calorieProgress,
    dietaryPreferences,
    
    // Acciones
    toggleMealCompletion,
    resetMealPlan,
    
    // Nuevas propiedades del sistema conectado
    loading,
    error,
    hasNutritionPlan,
    regeneratePlan,
    
    // Información adicional
    isConnectedToPlan: hasNutritionPlan,
    planSource: hasNutritionPlan ? 'questionnaire' : 'fallback',
    updateHydration: dailyUpdateHydration,
    updateMetrics: dailyUpdateMetrics,
    forceRefreshFromQuestionnaire,
    
    // Datos del plan diario
    dailyPlan: dailyPlan,
    isCurrentDay  // ✅ AGREGADO: Propagar isCurrentDay para que las notificaciones funcionen
  };
}
