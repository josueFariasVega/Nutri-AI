/**
 * Constantes de configuración para APIs
 */

export const API_CONFIG = {
  SPOONACULAR: {
    BASE_URL: 'https://api.spoonacular.com',
    ENDPOINTS: {
      SEARCH: '/recipes/complexSearch',
      RECIPE_INFO: '/recipes/{id}/information',
      NUTRITION: '/recipes/{id}/nutritionWidget.json',
      RANDOM: '/recipes/random',
      INGREDIENTS: '/recipes/findByIngredients',
      MEAL_PLAN: '/mealplanner/generate',
    },
    DEFAULT_PARAMS: {
      number: '12',
      addRecipeInformation: 'true',
      addRecipeNutrition: 'true',
      fillIngredients: 'true',
      instructionsRequired: 'true',
    },
    RATE_LIMITS: {
      REQUESTS_PER_DAY: 150, // Plan gratuito
      REQUESTS_PER_MINUTE: 1,
    },
  },
  
  // Configuración para otras APIs futuras
  OPENAI: {
    BASE_URL: 'https://api.openai.com/v1',
    ENDPOINTS: {
      CHAT: '/chat/completions',
      EMBEDDINGS: '/embeddings',
    },
  },
  
  SUPABASE: {
    FUNCTIONS_URL: '/functions/v1',
  },
} as const;

// Tipos de dieta soportados por Spoonacular
export const DIET_TYPES = {
  GLUTEN_FREE: 'gluten free',
  KETOGENIC: 'ketogenic',
  VEGETARIAN: 'vegetarian',
  LACTO_VEGETARIAN: 'lacto-vegetarian',
  OVO_VEGETARIAN: 'ovo-vegetarian',
  VEGAN: 'vegan',
  PESCETARIAN: 'pescetarian',
  PALEO: 'paleo',
  PRIMAL: 'primal',
  LOW_FODMAP: 'low fodmap',
  WHOLE30: 'whole30',
} as const;

// Tipos de intolerancia soportados
export const INTOLERANCES = {
  DAIRY: 'dairy',
  EGG: 'egg',
  GLUTEN: 'gluten',
  GRAIN: 'grain',
  PEANUT: 'peanut',
  SEAFOOD: 'seafood',
  SESAME: 'sesame',
  SHELLFISH: 'shellfish',
  SOY: 'soy',
  SULFITE: 'sulfite',
  TREE_NUT: 'tree nut',
  WHEAT: 'wheat',
} as const;

// Tipos de comida
export const MEAL_TYPES = {
  MAIN_COURSE: 'main course',
  SIDE_DISH: 'side dish',
  DESSERT: 'dessert',
  APPETIZER: 'appetizer',
  SALAD: 'salad',
  BREAD: 'bread',
  BREAKFAST: 'breakfast',
  SOUP: 'soup',
  BEVERAGE: 'beverage',
  SAUCE: 'sauce',
  MARINADE: 'marinade',
  FINGERFOOD: 'fingerfood',
  SNACK: 'snack',
  DRINK: 'drink',
} as const;

// Configuración de nutrientes
export const NUTRIENTS = {
  CALORIES: 'calories',
  PROTEIN: 'protein',
  FAT: 'fat',
  CARBOHYDRATES: 'carbohydrates',
  FIBER: 'fiber',
  SUGAR: 'sugar',
  SODIUM: 'sodium',
  POTASSIUM: 'potassium',
  PHOSPHORUS: 'phosphorus',
  VITAMIN_A: 'vitamin a',
  VITAMIN_C: 'vitamin c',
  VITAMIN_D: 'vitamin d',
  VITAMIN_E: 'vitamin e',
  VITAMIN_K: 'vitamin k',
  VITAMIN_B1: 'vitamin b1',
  VITAMIN_B2: 'vitamin b2',
  VITAMIN_B3: 'vitamin b3',
  VITAMIN_B5: 'vitamin b5',
  VITAMIN_B6: 'vitamin b6',
  VITAMIN_B12: 'vitamin b12',
  FOLATE: 'folate',
  CALCIUM: 'calcium',
  IRON: 'iron',
  MAGNESIUM: 'magnesium',
  ZINC: 'zinc',
  MANGANESE: 'manganese',
} as const;
