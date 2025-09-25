/**
 * @fileoverview Hook para plan de comidas con API externa
 * @description Versión mejorada del hook que usa Spoonacular API
 */

import { useCallback } from 'react';
import { Coffee, Apple, Utensils, Moon } from 'lucide-react';
import { recipeService } from '../lib/services/RecipeService';
import { logger } from '../lib/utils/logger';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  consumed: boolean;
}

interface DailyMeal {
  id: string;
  time: string;
  meal: string;
  icon: any;
  calories: number;
  targetCalories: number;
  items: FoodItem[];
  completed: boolean;
}

interface NutritionPlan {
  meals: {
    breakfast?: { targetCalories: number };
    lunch?: { targetCalories: number };
    dinner?: { targetCalories: number };
    snacks?: { targetCalories: number };
  };
  dietType?: string;
  dislikedFood?: string[];
  allergies?: string[];
}

export function useMealPlanWithAPI() {
  const generateItemId = (mealType: string, itemName: string, index: number): string => {
    return `${mealType}_${itemName.toLowerCase().replace(/\s+/g, '_')}_${index}`;
  };

  const convertNutritionPlanToMealsWithAPI = useCallback(async (
    plan: NutritionPlan, 
    completedMeals: string[] = []
  ): Promise<DailyMeal[]> => {
    const mealTimes = {
      breakfast: '07:00',
      'morning-snack': '10:30',
      lunch: '13:30',
      'afternoon-snack': '16:00',
      dinner: '20:00'
    };

    const meals: DailyMeal[] = [];
    const userPreferences = {
      diet_type: plan.dietType || 'none',
      disliked_food: plan.dislikedFood || [],
      allergies: plan.allergies || [],
      cooking_time_preference: 30
    };

    try {
      // Desayuno
      if (plan.meals.breakfast?.targetCalories) {
        const recipes = await recipeService.generateRecipesForMeal({
          mealType: 'breakfast',
          targetCalories: plan.meals.breakfast.targetCalories,
          preferences: userPreferences
        });

        if (recipes.length > 0) {
          meals.push({
            id: 'breakfast',
            time: mealTimes.breakfast,
            meal: 'Desayuno',
            icon: Coffee,
            calories: plan.meals.breakfast.targetCalories,
            targetCalories: plan.meals.breakfast.targetCalories,
            items: recipes.map((recipe, index) => ({
              id: generateItemId('breakfast', recipe.name, index),
              name: recipe.name,
              calories: recipe.calories,
              protein: recipe.protein,
              carbs: recipe.carbs,
              fat: recipe.fat,
              consumed: false
            })),
            completed: completedMeals.includes('breakfast')
          });
        }
      }

      // Almuerzo
      if (plan.meals.lunch?.targetCalories) {
        const recipes = await recipeService.generateRecipesForMeal({
          mealType: 'lunch',
          targetCalories: plan.meals.lunch.targetCalories,
          preferences: userPreferences
        });

        if (recipes.length > 0) {
          meals.push({
            id: 'lunch',
            time: mealTimes.lunch,
            meal: 'Almuerzo',
            icon: Utensils,
            calories: plan.meals.lunch.targetCalories,
            targetCalories: plan.meals.lunch.targetCalories,
            items: recipes.map((recipe, index) => ({
              id: generateItemId('lunch', recipe.name, index),
              name: recipe.name,
              calories: recipe.calories,
              protein: recipe.protein,
              carbs: recipe.carbs,
              fat: recipe.fat,
              consumed: false
            })),
            completed: completedMeals.includes('lunch')
          });
        }
      }

      // Cena
      if (plan.meals.dinner?.targetCalories) {
        const recipes = await recipeService.generateRecipesForMeal({
          mealType: 'dinner',
          targetCalories: plan.meals.dinner.targetCalories,
          preferences: userPreferences
        });

        if (recipes.length > 0) {
          meals.push({
            id: 'dinner',
            time: mealTimes.dinner,
            meal: 'Cena',
            icon: Moon,
            calories: plan.meals.dinner.targetCalories,
            targetCalories: plan.meals.dinner.targetCalories,
            items: recipes.map((recipe, index) => ({
              id: generateItemId('dinner', recipe.name, index),
              name: recipe.name,
              calories: recipe.calories,
              protein: recipe.protein,
              carbs: recipe.carbs,
              fat: recipe.fat,
              consumed: false
            })),
            completed: completedMeals.includes('dinner')
          });
        }
      }

      // Snacks
      if (plan.meals.snacks?.targetCalories) {
        const recipes = await recipeService.generateRecipesForMeal({
          mealType: 'snacks',
          targetCalories: plan.meals.snacks.targetCalories,
          preferences: userPreferences
        });

        if (recipes.length > 0) {
          // Media mañana
          meals.push({
            id: 'morning-snack',
            time: mealTimes['morning-snack'],
            meal: 'Media Mañana',
            icon: Apple,
            calories: Math.round(plan.meals.snacks.targetCalories * 0.4),
            targetCalories: Math.round(plan.meals.snacks.targetCalories * 0.4),
            items: [recipes[0]].map((recipe, index) => ({
              id: generateItemId('morning-snack', recipe.name, index),
              name: recipe.name,
              calories: Math.round(recipe.calories * 0.4),
              protein: Math.round(recipe.protein * 0.4),
              carbs: Math.round(recipe.carbs * 0.4),
              fat: Math.round(recipe.fat * 0.4),
              consumed: false
            })),
            completed: completedMeals.includes('morning-snack')
          });

          // Merienda
          if (recipes.length > 1) {
            meals.push({
              id: 'afternoon-snack',
              time: mealTimes['afternoon-snack'],
              meal: 'Merienda',
              icon: Apple,
              calories: Math.round(plan.meals.snacks.targetCalories * 0.6),
              targetCalories: Math.round(plan.meals.snacks.targetCalories * 0.6),
              items: [recipes[1]].map((recipe, index) => ({
                id: generateItemId('afternoon-snack', recipe.name, index),
                name: recipe.name,
                calories: Math.round(recipe.calories * 0.6),
                protein: Math.round(recipe.protein * 0.6),
                carbs: Math.round(recipe.carbs * 0.6),
                fat: Math.round(recipe.fat * 0.6),
                consumed: false
              })),
              completed: completedMeals.includes('afternoon-snack')
            });
          }
        }
      }

      logger.log(`✅ Generadas ${meals.length} comidas con API externa`);
      return meals;

    } catch (error) {
      logger.error('❌ Error generando comidas con API:', error);
      throw error;
    }
  }, []);

  return {
    convertNutritionPlanToMealsWithAPI
  };
}
