/**
 * Modal de Detalles de Receta
 * Muestra información completa de una receta seleccionada
 */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { 
  Clock, 
  Users, 
  Zap, 
  ChefHat, 
  Heart, 
  X, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { spoonacularService } from '../lib/spoonacular';

interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  healthScore?: number;
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  diets?: string[];
  dishTypes?: string[];
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
}

interface RecipeDetails extends Recipe {
  summary?: string;
  instructions?: string;
  analyzedInstructions?: Array<{
    steps: Array<{
      number: number;
      step: string;
      ingredients?: Array<{
        id: number;
        name: string;
        image: string;
      }>;
    }>;
  }>;
  extendedIngredients?: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
    image: string;
  }>;
}

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeDetailModal({ recipe, isOpen, onClose }: RecipeDetailModalProps) {
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar detalles completos de la receta
  useEffect(() => {
    if (recipe && isOpen) {
      loadRecipeDetails(recipe.id);
    }
  }, [recipe, isOpen]);

  const loadRecipeDetails = async (recipeId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const details = await spoonacularService.getRecipeInformation(recipeId);
      setRecipeDetails(details);
    } catch (err) {
      console.error('Error loading recipe details:', err);
      setError('No se pudieron cargar los detalles de la receta');
      // Usar datos básicos como fallback
      setRecipeDetails(recipe as RecipeDetails);
    } finally {
      setLoading(false);
    }
  };

  const getRecipeCalories = (recipe: RecipeDetails) => {
    if (!recipe.nutrition?.nutrients) return 'N/A';
    
    const calories = recipe.nutrition.nutrients.find(
      n => n.name.toLowerCase() === 'calories'
    );
    
    return calories ? Math.round(calories.amount) : 'N/A';
  };

  const getMacronutrients = (recipe: RecipeDetails) => {
    if (!recipe.nutrition?.nutrients) return null;
    
    const nutrients = recipe.nutrition.nutrients;
    
    return {
      protein: nutrients.find(n => n.name.toLowerCase() === 'protein'),
      carbs: nutrients.find(n => n.name.toLowerCase() === 'carbohydrates'),
      fat: nutrients.find(n => n.name.toLowerCase() === 'fat'),
      fiber: nutrients.find(n => n.name.toLowerCase() === 'fiber')
    };
  };

  const getDifficultyLevel = (recipe: RecipeDetails) => {
    const time = recipe.readyInMinutes || 0;
    const steps = recipe.analyzedInstructions?.[0]?.steps?.length || 0;
    
    if (time <= 15 || steps <= 5) return { level: 'Fácil', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (time <= 30 || steps <= 10) return { level: 'Medio', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Difícil', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const cleanHtmlContent = (html: string) => {
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
  };

  if (!recipe) return null;

  const difficulty = recipeDetails ? getDifficultyLevel(recipeDetails) : null;
  const macros = recipeDetails ? getMacronutrients(recipeDetails) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <DialogTitle className="text-lg font-bold text-gray-900 line-clamp-1">
                {recipe.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 mt-1">
                Información completa de la receta con ingredientes, instrucciones y datos nutricionales
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span className="ml-2">Cargando detalles...</span>
            </div>
          ) : (
            <div className="h-full overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                {/* Header compacto con imagen y stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1">
                    <div className="aspect-square relative rounded-lg overflow-hidden">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Sin+Imagen';
                        }}
                      />
                      {recipe.vegetarian && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-green-500/90 text-white text-xs">
                            🌱 Vegetariano
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-3">
                    {/* Stats principales en grid compacto */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-blue-600">Tiempo</p>
                        <p className="font-semibold text-sm">{recipe.readyInMinutes} min</p>
                      </div>
                      
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <Users className="w-4 h-4 text-green-600 mx-auto mb-1" />
                        <p className="text-xs text-green-600">Porciones</p>
                        <p className="font-semibold text-sm">{recipe.servings}</p>
                      </div>
                      
                      <div className="text-center p-2 bg-orange-50 rounded-lg">
                        <Zap className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                        <p className="text-xs text-orange-600">Calorías</p>
                        <p className="font-semibold text-sm">{getRecipeCalories(recipeDetails || recipe)} kcal</p>
                      </div>
                      
                      {difficulty && (
                        <div className={`text-center p-2 rounded-lg ${difficulty.bgColor}`}>
                          <ChefHat className={`w-4 h-4 mx-auto mb-1 ${difficulty.color}`} />
                          <p className={`text-xs ${difficulty.color}`}>Dificultad</p>
                          <p className="font-semibold text-sm">{difficulty.level}</p>
                        </div>
                      )}
                    </div>

                    {/* Health Score */}
                    {recipe.healthScore && (
                      <div className="text-center p-2 bg-purple-50 rounded-lg">
                        <Heart className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                        <p className="text-xs text-purple-600">Health Score</p>
                        <p className="font-semibold text-sm">{recipe.healthScore}/100</p>
                      </div>
                    )}

                    {/* Badges de dieta */}
                    <div className="flex flex-wrap gap-1">
                      {recipe.vegetarian && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Vegetariano</Badge>
                      )}
                      {recipe.vegan && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Vegano</Badge>
                      )}
                      {recipe.glutenFree && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Sin Gluten</Badge>
                      )}
                      {recipe.dairyFree && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">Sin Lácteos</Badge>
                      )}
                      {recipe.diets?.slice(0, 3).map((diet, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {diet}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tabs con contenido detallado */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-3">
                    <TabsTrigger value="overview" className="text-xs">Resumen</TabsTrigger>
                    <TabsTrigger value="ingredients" className="text-xs">Ingredientes</TabsTrigger>
                    <TabsTrigger value="instructions" className="text-xs">Instrucciones</TabsTrigger>
                    <TabsTrigger value="nutrition" className="text-xs">Nutrición</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-3">
                    {recipeDetails?.summary && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Descripción</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {cleanHtmlContent(recipeDetails.summary)}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {recipe.dishTypes && recipe.dishTypes.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Tipo de Plato</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1">
                            {recipe.dishTypes.map((type, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="ingredients" className="space-y-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Lista de Ingredientes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {recipeDetails?.extendedIngredients ? (
                          <div className="max-h-60 overflow-y-auto pr-2">
                            <div className="space-y-2">
                              {recipeDetails.extendedIngredients.map((ingredient, index) => (
                                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                                  <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                  <span className="flex-1 text-sm">
                                    <strong>{ingredient.amount} {ingredient.unit}</strong> {ingredient.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Lista de ingredientes no disponible</p>
                            <p className="text-xs">Consulta la receta original para más detalles</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="instructions" className="space-y-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Instrucciones de Preparación</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {recipeDetails?.analyzedInstructions?.[0]?.steps ? (
                          <div className="max-h-60 overflow-y-auto pr-2">
                            <div className="space-y-3">
                              {recipeDetails.analyzedInstructions[0].steps.map((step, index) => (
                                <div key={index} className="flex space-x-3">
                                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                                    {step.number}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-gray-700 text-sm leading-relaxed">{step.step}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Instrucciones detalladas no disponibles</p>
                            <p className="text-xs">Consulta la receta original para más detalles</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="nutrition" className="space-y-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Información Nutricional</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {macros ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {macros.protein && (
                              <div className="text-center p-2 bg-blue-50 rounded-lg">
                                <p className="text-xs text-blue-600">Proteínas</p>
                                <p className="text-base font-bold text-blue-600">
                                  {Math.round(macros.protein.amount)}g
                                </p>
                              </div>
                            )}
                            {macros.carbs && (
                              <div className="text-center p-2 bg-orange-50 rounded-lg">
                                <p className="text-xs text-orange-600">Carbohidratos</p>
                                <p className="text-base font-bold text-orange-600">
                                  {Math.round(macros.carbs.amount)}g
                                </p>
                              </div>
                            )}
                            {macros.fat && (
                              <div className="text-center p-2 bg-purple-50 rounded-lg">
                                <p className="text-xs text-purple-600">Grasas</p>
                                <p className="text-base font-bold text-purple-600">
                                  {Math.round(macros.fat.amount)}g
                                </p>
                              </div>
                            )}
                            {macros.fiber && (
                              <div className="text-center p-2 bg-green-50 rounded-lg">
                                <p className="text-xs text-green-600">Fibra</p>
                                <p className="text-base font-bold text-green-600">
                                  {Math.round(macros.fiber.amount)}g
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Información nutricional no disponible</p>
                            <p className="text-xs">Los datos nutricionales se cargarán cuando estén disponibles</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Error handling */}
                {error && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-700">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
