/**
 * @fileoverview Spoonacular API Service
 * @description Servicio para integración con la API de Spoonacular
 * @author Nutrition Platform Team
 * @version 1.0.0
 */

import { API_CONFIG } from '../types/constants';
import type {
  SpoonacularSearchParams,
  SpoonacularRecipeResponse,
  SpoonacularRecipe,
  SpoonacularNutrition,
} from '../../types/spoonacular/api.ts';

/**
 * Clase para manejar las peticiones a la API de Spoonacular
 */
export class SpoonacularService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_SPOONACULAR_API_KEY || '';
    this.baseUrl = API_CONFIG.SPOONACULAR.BASE_URL;
    
    // Debug: Verificar clave API
    //console.log('🔑 API Key configurada:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NO ENCONTRADA');
    //console.log('🌐 Base URL:', this.baseUrl);
    //console.log('🔍 API Key completa para debug:', this.apiKey);
  }

  /**
   * Buscar recetas basadas en parámetros específicos
   * @param params - Parámetros de búsqueda
   * @returns Promise con los resultados de la búsqueda
   */
  async searchRecipes(params: SpoonacularSearchParams): Promise<SpoonacularRecipeResponse> {
    // Verificar que tenemos API key
    if (!this.apiKey) {
      throw new Error('API Key de Spoonacular no configurada. Verifica tu archivo .env');
    }

    const searchParams = new URLSearchParams({
      apiKey: this.apiKey,
      ...API_CONFIG.SPOONACULAR.DEFAULT_PARAMS,
      ...params,
    } as any);

    const url = `${this.baseUrl}${API_CONFIG.SPOONACULAR.ENDPOINTS.SEARCH}?${searchParams}`;

    //console.log('🔍 URL de búsqueda:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));

    try {
      const response = await fetch(url);

      /*console.log('📡 Respuesta de API:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });*/

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error de API:', errorText);

        // Si es error 402 (límite excedido), lanzar error específico
        if (response.status === 402) {
          throw new Error(`Spoonacular API error: ${response.status} - ${errorText}. Límite diario de puntos excedido.`);
        }

        throw new Error(`Spoonacular API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      //console.log('✅ Datos recibidos:', data);
      return data;
    } catch (error) {
      //console.error('Error searching recipes:', error);
      throw error;
    }
  }

  /**
   * Obtener información detallada de una receta
   * @param recipeId - ID de la receta
   * @returns Promise con la información de la receta
   */
  async getRecipeInformation(recipeId: number): Promise<SpoonacularRecipe> {
    if (!this.apiKey) {
      throw new Error('API Key de Spoonacular no configurada');
    }

    const url = `${this.baseUrl}${API_CONFIG.SPOONACULAR.ENDPOINTS.RECIPE_INFO.replace('{id}', recipeId.toString())}`;
    
    const searchParams = new URLSearchParams({
      apiKey: this.apiKey,
      includeNutrition: 'true',
    });

    try {
      const response = await fetch(`${url}?${searchParams}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spoonacular API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting recipe information:', error);
      throw error;
    }
  }

  /**
   * Obtener información nutricional de una receta
   * @param recipeId - ID de la receta
   * @returns Promise con la información nutricional
   */
  async getRecipeNutrition(recipeId: number): Promise<SpoonacularNutrition> {
    if (!this.apiKey) {
      throw new Error('API Key de Spoonacular no configurada');
    }

    const url = `${this.baseUrl}${API_CONFIG.SPOONACULAR.ENDPOINTS.NUTRITION.replace('{id}', recipeId.toString())}`;

    const searchParams = new URLSearchParams({
      apiKey: this.apiKey,
    });

    try {
      const response = await fetch(`${url}?${searchParams}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spoonacular API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting recipe nutrition:', error);
      throw error;
    }
  }

  /**
   * Buscar recetas por tipo de comida y restricciones dietéticas
   * @param mealType - Tipo de comida (breakfast, lunch, dinner, snack)
   * @param dietType - Tipo de dieta (vegetarian, vegan, keto, etc.)
   * @param excludeIngredients - Ingredientes a excluir
   * @param targetCalories - Calorías objetivo
   * @returns Promise con recetas filtradas
   */
  async getRecipesByMealType(
    mealType: string,
    dietType?: string,
    excludeIngredients?: string[],
    targetCalories?: number
  ): Promise<SpoonacularRecipeResponse> {
    const params: SpoonacularSearchParams = {
      type: this.mapMealTypeToSpoonacular(mealType),
      number: 8,
    };

    if (dietType && dietType !== 'none') {
      params.diet = dietType;
    }

    if (excludeIngredients && excludeIngredients.length > 0) {
      params.excludeIngredients = excludeIngredients.join(',');
    }

    if (targetCalories) {
      params.maxCalories = Math.round(targetCalories * 1.2);
      params.minCalories = Math.round(targetCalories * 0.8);
    }

    return this.searchRecipes(params);
  }

  /**
   * Mapear tipos de comida a formato de Spoonacular
   * @param mealType - Tipo de comida interno
   * @returns Tipo de comida para Spoonacular
   */
  private mapMealTypeToSpoonacular(mealType: string): string {
    const mapping: Record<string, string> = {
      breakfast: 'breakfast',
      lunch: 'main course',
      dinner: 'main course',
      snacks: 'snack',
      snack: 'snack',
    };

    return mapping[mealType] || 'main course';
  }

  /**
   * Generar sugerencias de comidas para un plan nutricional
   * @param mealType - Tipo de comida
   * @param preferences - Preferencias dietéticas
   * @param targetCalories - Calorías objetivo
   * @returns Promise con sugerencias de comidas
   */
  async generateMealSuggestions(
    mealType: string,
    preferences: any,
    targetCalories: number
  ): Promise<any[]> {
    try {
      const response = await this.getRecipesByMealType(
        mealType,
        preferences?.diet_type,
        preferences?.disliked_food,
        targetCalories
      );

      return response.results.map((recipe) => ({
        id: recipe.id,
        name: recipe.title,
        calories: this.extractCalories(recipe.nutrition),
        protein: this.extractNutrient(recipe.nutrition, 'Protein'),
        carbs: this.extractNutrient(recipe.nutrition, 'Carbohydrates'),
        fat: this.extractNutrient(recipe.nutrition, 'Fat'),
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        sourceUrl: recipe.sourceUrl,
      }));
    } catch (error) {
      console.error('Error generating meal suggestions:', error);
      // Fallback a sugerencias predeterminadas si la API falla
      return this.getFallbackMealSuggestions(mealType);
    }
  }

  /**
   * Extraer calorías de la información nutricional
   * @param nutrition - Información nutricional
   * @returns Calorías o valor por defecto
   */
  private extractCalories(nutrition?: SpoonacularNutrition): number {
    if (!nutrition?.nutrients) return 0;
    
    const caloriesNutrient = nutrition.nutrients.find(
      (n) => n.name.toLowerCase() === 'calories'
    );
    
    return Math.round(caloriesNutrient?.amount || 0);
  }

  /**
   * Extraer un nutriente específico
   * @param nutrition - Información nutricional
   * @param nutrientName - Nombre del nutriente
   * @returns Cantidad del nutriente
   */
  private extractNutrient(nutrition?: SpoonacularNutrition, nutrientName?: string): number {
    if (!nutrition?.nutrients) return 0;

    const nutrient = nutrition.nutrients.find(
      (n) => n.name.toLowerCase() === (nutrientName?.toLowerCase() || '')
    );

    return Math.round(nutrient?.amount || 0);
  }

  /**
   * Generar sugerencias de comidas de fallback cuando la API falla
   * @param mealType - Tipo de comida
   * @returns Array de sugerencias básicas
   */
  private getFallbackMealSuggestions(mealType: string): any[] {
    const fallbackRecipes = {
      breakfast: [
        { name: 'Avena con frutas', calories: 320, protein: 12, carbs: 45, fat: 8 },
        { name: 'Tostada con aguacate', calories: 280, protein: 8, carbs: 25, fat: 16 },
        { name: 'Yogurt con granola', calories: 300, protein: 15, carbs: 35, fat: 10 }
      ],
      lunch: [
        { name: 'Ensalada de quinoa', calories: 450, protein: 18, carbs: 55, fat: 15 },
        { name: 'Sándwich integral', calories: 380, protein: 22, carbs: 42, fat: 12 },
        { name: 'Sopa de verduras', calories: 220, protein: 8, carbs: 28, fat: 6 }
      ],
      dinner: [
        { name: 'Pechuga de pollo asada', calories: 320, protein: 35, carbs: 8, fat: 12 },
        { name: 'Salmón al horno', calories: 380, protein: 28, carbs: 5, fat: 24 },
        { name: 'Ensalada de atún', calories: 290, protein: 25, carbs: 12, fat: 16 }
      ],
      snacks: [
        { name: 'Mix de frutos secos', calories: 180, protein: 6, carbs: 12, fat: 14 },
        { name: 'Manzana con mantequilla de almendras', calories: 200, protein: 5, carbs: 18, fat: 12 },
        { name: 'Yogurt natural', calories: 120, protein: 10, carbs: 8, fat: 4 }
      ]
    };

    return fallbackRecipes[mealType as keyof typeof fallbackRecipes] || fallbackRecipes.breakfast;
  }

}

// Instancia singleton del servicio
export const spoonacularService = new SpoonacularService();
