/**
 * @fileoverview Professional Recipe Service
 * @description Servicio profesional para gestión de recetas con API externa
 * @author Nutrition Platform Team
 * @version 2.0.0
 */

import { spoonacularService } from '../spoonacular';
import { logger } from '../utils/logger';

interface UserPreferences {
  diet_type?: string;
  disliked_food?: string[];
  allergies?: string[];
  cooking_time_preference?: number;
  cuisine_preferences?: string[];
}

interface NutritionalTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Recipe {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
  sourceUrl?: string;
  spoonacularId?: number;
}

interface MealPlanRequest {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  targetCalories: number;
  preferences: UserPreferences;
  excludeRecipeIds?: string[];
}

interface RecipeCache {
  [key: string]: {
    recipes: Recipe[];
    timestamp: number;
    lastUsed: Record<string, number>; // recipeId -> timestamp
  };
}

export class RecipeService {
  private cache: RecipeCache = {};
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
  private readonly RECIPE_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 días sin repetir
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Genera recetas para un tipo de comida específico
   */
  async generateRecipesForMeal(request: MealPlanRequest): Promise<Recipe[]> {
    try {
      logger.log(`🍽️ Generando recetas para ${request.mealType}`, request);
      logger.log('🔑 API Key disponible:', !!import.meta.env.VITE_SPOONACULAR_API_KEY);
      logger.log('🔑 API Key valor:', import.meta.env.VITE_SPOONACULAR_API_KEY);

      // 1. Intentar obtener de cache válido
      const cachedRecipes = this.getCachedRecipes(request);
      if (cachedRecipes.length > 0) {
        logger.log(`📦 Usando ${cachedRecipes.length} recetas del cache`);
        return cachedRecipes;
      }

      // 2. Buscar en API externa
      logger.log('🌐 Intentando obtener recetas de API externa...');
      const apiRecipes = await this.fetchFromAPI(request);
      if (apiRecipes.length > 0) {
        this.updateCache(request, apiRecipes);
        logger.log(`🌐 Obtenidas ${apiRecipes.length} recetas de API`);
        return this.selectBestRecipes(apiRecipes, request);
      }

      // 3. Fallback a recetas locales mejoradas
      logger.warn('⚠️ API no disponible, usando fallback local');
      return this.getFallbackRecipes(request);

    } catch (error) {
      logger.error('❌ Error generando recetas:', error);
      return this.getFallbackRecipes(request);
    }
  }

  /**
   * Obtiene recetas del cache si están válidas y no han sido usadas recientemente
   */
  private getCachedRecipes(request: MealPlanRequest): Recipe[] {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache[cacheKey];

    if (!cached || this.isCacheExpired(cached.timestamp)) {
      return [];
    }

    // Filtrar recetas que no han sido usadas recientemente
    const now = Date.now();
    const availableRecipes = cached.recipes.filter(recipe => {
      const lastUsed = cached.lastUsed[recipe.id] || 0;
      return (now - lastUsed) > this.RECIPE_COOLDOWN;
    });

    return availableRecipes.slice(0, 3); // Máximo 3 recetas por comida
  }

  /**
   * Busca recetas en la API de Spoonacular
   */
  private async fetchFromAPI(request: MealPlanRequest): Promise<Recipe[]> {
    let attempts = 0;
    
    while (attempts < this.MAX_RETRIES) {
      try {
        const response = await spoonacularService.getRecipesByMealType(
          request.mealType,
          request.preferences.diet_type,
          [
            ...(request.preferences.disliked_food || []),
            ...(request.preferences.allergies || []),
            ...(request.excludeRecipeIds || [])
          ],
          request.targetCalories
        );

        return response.results.map(recipe => ({
          id: `spoon_${recipe.id}`,
          name: recipe.title,
          calories: this.extractCalories(recipe),
          protein: this.extractNutrient(recipe, 'protein'),
          carbs: this.extractNutrient(recipe, 'carbohydrates'),
          fat: this.extractNutrient(recipe, 'fat'),
          image: recipe.image,
          readyInMinutes: recipe.readyInMinutes,
          servings: recipe.servings,
          sourceUrl: recipe.sourceUrl,
          spoonacularId: recipe.id
        }));

      } catch (error) {
        attempts++;
        logger.warn(`⚠️ Intento ${attempts} fallido:`, error);
        
        if (attempts >= this.MAX_RETRIES) {
          throw error;
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    return [];
  }

  /**
   * Selecciona las mejores recetas basado en objetivos nutricionales
   */
  private selectBestRecipes(recipes: Recipe[], request: MealPlanRequest): Recipe[] {
    const targetCalories = request.targetCalories;
    
    // Ordenar por proximidad a calorías objetivo
    const sortedRecipes = recipes.sort((a, b) => {
      const diffA = Math.abs(a.calories - targetCalories);
      const diffB = Math.abs(b.calories - targetCalories);
      return diffA - diffB;
    });

    // Seleccionar hasta 3 recetas variadas
    const selected: Recipe[] = [];
    const usedNames = new Set<string>();

    for (const recipe of sortedRecipes) {
      if (selected.length >= 3) break;
      
      // Evitar recetas muy similares
      const recipeName = recipe.name.toLowerCase();
      const isUnique = !Array.from(usedNames).some(name => 
        this.areSimilarRecipes(name, recipeName)
      );

      if (isUnique) {
        selected.push(recipe);
        usedNames.add(recipeName);
      }
    }

    return selected;
  }

  /**
   * Verifica si dos recetas son similares
   */
  private areSimilarRecipes(name1: string, name2: string): boolean {
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');
    
    const commonWords = words1.filter(word => 
      words2.includes(word) && word.length > 3
    );
    
    return commonWords.length >= 2;
  }

  /**
   * Recetas de fallback mejoradas y variadas
   */
  private getFallbackRecipes(request: MealPlanRequest): Recipe[] {
    const fallbackDatabase = {
      breakfast: [
        { name: 'Avena con frutos rojos y almendras', calories: 320, protein: 12, carbs: 45, fat: 8 },
        { name: 'Tostada integral con aguacate y huevo', calories: 380, protein: 18, carbs: 25, fat: 22 },
        { name: 'Smoothie verde con espinacas y plátano', calories: 280, protein: 15, carbs: 35, fat: 6 },
        { name: 'Yogurt griego con granola casera', calories: 350, protein: 20, carbs: 30, fat: 12 },
        { name: 'Pancakes de avena con miel', calories: 420, protein: 16, carbs: 55, fat: 10 },
        { name: 'Bowl de açaí con coco y semillas', calories: 390, protein: 8, carbs: 48, fat: 18 },
        { name: 'Tortilla francesa con verduras', calories: 310, protein: 22, carbs: 8, fat: 20 },
        { name: 'Muesli con leche de almendras', calories: 340, protein: 11, carbs: 42, fat: 14 }
      ],
      lunch: [
        { name: 'Ensalada de quinoa con pollo y verduras', calories: 520, protein: 35, carbs: 45, fat: 18 },
        { name: 'Salmón a la plancha con arroz integral', calories: 580, protein: 42, carbs: 38, fat: 24 },
        { name: 'Bowl mediterráneo con hummus', calories: 480, protein: 18, carbs: 52, fat: 22 },
        { name: 'Pasta integral con pesto y tomates cherry', calories: 510, protein: 16, carbs: 68, fat: 16 },
        { name: 'Curry de lentejas con arroz basmati', calories: 490, protein: 22, carbs: 72, fat: 8 },
        { name: 'Wrap de pavo con vegetales frescos', calories: 450, protein: 28, carbs: 42, fat: 16 },
        { name: 'Risotto de champiñones y espárragos', calories: 470, protein: 14, carbs: 58, fat: 18 },
        { name: 'Poke bowl con atún y edamame', calories: 540, protein: 38, carbs: 44, fat: 20 }
      ],
      dinner: [
        { name: 'Pescado blanco al horno con verduras', calories: 380, protein: 32, carbs: 15, fat: 18 },
        { name: 'Pechuga de pollo con puré de coliflor', calories: 420, protein: 38, carbs: 12, fat: 22 },
        { name: 'Tofu salteado con brócoli y sésamo', calories: 340, protein: 24, carbs: 18, fat: 20 },
        { name: 'Merluza en papillote con limón', calories: 360, protein: 35, carbs: 8, fat: 16 },
        { name: 'Ensalada de salmón ahumado y aguacate', calories: 450, protein: 28, carbs: 12, fat: 32 },
        { name: 'Calabacín relleno de quinoa y verduras', calories: 320, protein: 15, carbs: 35, fat: 12 },
        { name: 'Sepia a la plancha con espinacas', calories: 290, protein: 30, carbs: 8, fat: 14 },
        { name: 'Crema de calabaza con semillas', calories: 280, protein: 8, carbs: 25, fat: 16 }
      ],
      snacks: [
        { name: 'Mix de frutos secos y dátiles', calories: 180, protein: 6, carbs: 15, fat: 12 },
        { name: 'Yogurt natural con arándanos', calories: 120, protein: 8, carbs: 18, fat: 2 },
        { name: 'Hummus con bastones de zanahoria', calories: 150, protein: 6, carbs: 12, fat: 8 },
        { name: 'Manzana con mantequilla de almendra', calories: 200, protein: 6, carbs: 20, fat: 12 },
        { name: 'Batido de proteínas con plátano', calories: 220, protein: 25, carbs: 18, fat: 4 },
        { name: 'Tostada de centeno con queso fresco', calories: 160, protein: 12, carbs: 15, fat: 6 },
        { name: 'Smoothie de mango y coco', calories: 190, protein: 4, carbs: 28, fat: 8 },
        { name: 'Pudding de chía con frutas', calories: 210, protein: 8, carbs: 22, fat: 10 }
      ]
    };

    const mealRecipes = fallbackDatabase[request.mealType] || fallbackDatabase.snacks;
    
    // Seleccionar recetas aleatorias que se ajusten a las calorías objetivo
    const targetCalories = request.targetCalories;
    const suitableRecipes = mealRecipes.filter(recipe => 
      Math.abs(recipe.calories - targetCalories) <= targetCalories * 0.3
    );

    // Si no hay recetas adecuadas, usar las más cercanas
    const recipesToUse = suitableRecipes.length > 0 ? suitableRecipes : mealRecipes;
    
    // Seleccionar 2-3 recetas aleatorias
    const shuffled = [...recipesToUse].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(3, shuffled.length));

    return selected.map((recipe, index) => ({
      ...recipe,
      id: `fallback_${request.mealType}_${index}_${Date.now()}`,
      image: undefined,
      readyInMinutes: 30,
      servings: 1
    }));
  }

  /**
   * Actualiza el cache con nuevas recetas
   */
  private updateCache(request: MealPlanRequest, recipes: Recipe[]): void {
    const cacheKey = this.generateCacheKey(request);
    
    this.cache[cacheKey] = {
      recipes,
      timestamp: Date.now(),
      lastUsed: {}
    };

    this.saveCacheToStorage();
  }

  /**
   * Marca una receta como usada
   */
  markRecipeAsUsed(recipeId: string, mealType: string): void {
    Object.keys(this.cache).forEach(cacheKey => {
      if (cacheKey.includes(mealType)) {
        const cached = this.cache[cacheKey];
        if (cached.lastUsed) {
          cached.lastUsed[recipeId] = Date.now();
        }
      }
    });

    this.saveCacheToStorage();
  }

  /**
   * Utilidades privadas
   */
  private generateCacheKey(request: MealPlanRequest): string {
    const preferences = request.preferences;
    return `${request.mealType}_${preferences.diet_type || 'none'}_${request.targetCalories}`;
  }

  private isCacheExpired(timestamp: number): boolean {
    return (Date.now() - timestamp) > this.CACHE_DURATION;
  }

  private extractCalories(recipe: any): number {
    return recipe.nutrition?.nutrients?.find((n: any) => 
      n.name.toLowerCase() === 'calories'
    )?.amount || 300;
  }

  private extractNutrient(recipe: any, nutrientName: string): number {
    return recipe.nutrition?.nutrients?.find((n: any) => 
      n.name.toLowerCase() === nutrientName.toLowerCase()
    )?.amount || 0;
  }

  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('recipe_cache');
      if (stored) {
        this.cache = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Error loading recipe cache:', error);
      this.cache = {};
    }
  }

  private saveCacheToStorage(): void {
    try {
      localStorage.setItem('recipe_cache', JSON.stringify(this.cache));
    } catch (error) {
      logger.error('Error saving recipe cache:', error);
    }
  }

  /**
   * Limpia el cache expirado
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      if (this.isCacheExpired(this.cache[key].timestamp)) {
        delete this.cache[key];
      }
    });
    this.saveCacheToStorage();
  }
}

// Instancia singleton
export const recipeService = new RecipeService();
