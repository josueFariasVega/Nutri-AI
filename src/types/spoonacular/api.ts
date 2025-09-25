/**
 * Tipos para la API de Spoonacular
 */

export interface SpoonacularSearchParams {
  query?: string;
  number?: number;
  diet?: string;
  excludeIngredients?: string;
  includeIngredients?: string;
  intolerances?: string;
  type?: string;
  minCalories?: number;
  maxCalories?: number;
  minProtein?: number;
  maxProtein?: number;
  minCarbs?: number;
  maxCarbs?: number;
  minFat?: number;
  maxFat?: number;
  addRecipeInformation?: string;
  addRecipeNutrition?: string;
  fillIngredients?: string;
  instructionsRequired?: string;
}

export interface SpoonacularNutrient {
  name: string;
  amount: number;
  unit: string;
  percentOfDailyNeeds?: number;
}

export interface SpoonacularNutrition {
  nutrients: SpoonacularNutrient[];
  properties?: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  flavonoids?: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  ingredients?: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
    nutrients: SpoonacularNutrient[];
  }>;
  caloricBreakdown?: {
    percentProtein: number;
    percentFat: number;
    percentCarbs: number;
  };
  weightPerServing?: {
    amount: number;
    unit: string;
  };
}

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType?: string;
  servings: number;
  readyInMinutes: number;
  license?: string;
  sourceName?: string;
  sourceUrl?: string;
  spoonacularSourceUrl?: string;
  aggregateLikes?: number;
  healthScore?: number;
  spoonacularScore?: number;
  pricePerServing?: number;
  analyzedInstructions?: Array<{
    name: string;
    steps: Array<{
      number: number;
      step: string;
      ingredients: Array<{
        id: number;
        name: string;
        localizedName: string;
        image: string;
      }>;
      equipment: Array<{
        id: number;
        name: string;
        localizedName: string;
        image: string;
      }>;
      length?: {
        number: number;
        unit: string;
      };
    }>;
  }>;
  cheap?: boolean;
  creditsText?: string;
  cuisines?: string[];
  dairyFree?: boolean;
  diets?: string[];
  gaps?: string;
  glutenFree?: boolean;
  instructions?: string;
  ketogenic?: boolean;
  lowFodmap?: boolean;
  occasions?: string[];
  sustainable?: boolean;
  vegan?: boolean;
  vegetarian?: boolean;
  veryHealthy?: boolean;
  veryPopular?: boolean;
  whole30?: boolean;
  weightWatcherSmartPoints?: number;
  dishTypes?: string[];
  extendedIngredients?: Array<{
    id: number;
    aisle: string;
    image: string;
    consistency: string;
    name: string;
    nameClean: string;
    original: string;
    originalName: string;
    amount: number;
    unit: string;
    meta: string[];
    measures: {
      us: {
        amount: number;
        unitShort: string;
        unitLong: string;
      };
      metric: {
        amount: number;
        unitShort: string;
        unitLong: string;
      };
    };
  }>;
  nutrition?: SpoonacularNutrition;
  summary?: string;
  winePairing?: {
    pairedWines: string[];
    pairingText: string;
    productMatches: Array<{
      id: number;
      title: string;
      description: string;
      price: string;
      imageUrl: string;
      averageRating: number;
      ratingCount: number;
      score: number;
      link: string;
    }>;
  };
}

export interface SpoonacularRecipeResponse {
  results: SpoonacularRecipe[];
  offset: number;
  number: number;
  totalResults: number;
}

export interface SpoonacularRandomRecipeResponse {
  recipes: SpoonacularRecipe[];
}

export interface SpoonacularIngredientSearchResponse {
  results: Array<{
    id: number;
    name: string;
    image: string;
  }>;
  offset: number;
  number: number;
  totalResults: number;
}
