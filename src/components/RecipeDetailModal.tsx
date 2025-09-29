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
      <DialogContent className="w-[95vw] h-[95vh] sm:w-[90vw] sm:h-[90vh] md:max-w-4xl md:h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-3 py-4 sm:px-4 border-b bg-white flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4 min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 sm:line-clamp-1">
                {recipe.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 mt-1 line-clamp-2 sm:line-clamp-1">
                Información completa de la receta con ingredientes, instrucciones y datos nutricionales
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="flex-shrink-0 h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span className="text-sm text-gray-600">Cargando detalles...</span>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="p-3 sm:p-4 space-y-4">
                {/* Header con imagen y stats - Mejorado para móvil */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Imagen - Responsive */}
                  <div className="md:col-span-1">
                    <div className="aspect-[4/3] sm:aspect-square relative rounded-lg overflow-hidden shadow-md">
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

                  {/* Stats y badges - Mejorado layout */}
                  <div className="md:col-span-1 lg:col-span-2 space-y-4">
                    {/* Stats principales - Grid responsivo */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-blue-600 font-medium">Tiempo</p>
                        <p className="font-bold text-sm text-blue-800">{recipe.readyInMinutes} min</p>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                        <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-xs text-green-600 font-medium">Porciones</p>
                        <p className="font-bold text-sm text-green-800">{recipe.servings}</p>
                      </div>
                      
                      <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <Zap className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-xs text-orange-600 font-medium">Calorías</p>
                        <p className="font-bold text-sm text-orange-800">{getRecipeCalories(recipeDetails || recipe)}</p>
                      </div>
                      
                      {difficulty && (
                        <div className={`text-center p-3 rounded-lg border ${difficulty.bgColor} ${difficulty.bgColor.replace('bg-', 'border-')}`}>
                          <ChefHat className={`w-5 h-5 mx-auto mb-1 ${difficulty.color}`} />
                          <p className={`text-xs font-medium ${difficulty.color}`}>Dificultad</p>
                          <p className={`font-bold text-sm ${difficulty.color.replace('text-', 'text-').replace('600', '800')}`}>
                            {difficulty.level}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Health Score - Solo si está disponible */}
                    {recipe.healthScore && (
                      <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100 max-w-xs mx-auto sm:max-w-none">
                        <div className="flex items-center justify-center space-x-2">
                          <Heart className="w-4 h-4 text-purple-600" />
                          <span className="text-xs text-purple-600 font-medium">Health Score:</span>
                          <span className="font-bold text-sm text-purple-800">{recipe.healthScore}/100</span>
                        </div>
                      </div>
                    )}

                    {/* Badges de dieta - Mejorado */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Características dietéticas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {recipe.vegetarian && (
                          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">🌱 Vegetariano</Badge>
                        )}
                        {recipe.vegan && (
                          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">🌿 Vegano</Badge>
                        )}
                        {recipe.glutenFree && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1">Sin Gluten</Badge>
                        )}
                        {recipe.dairyFree && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1">Sin Lácteos</Badge>
                        )}
                        {recipe.diets?.slice(0, 3).map((diet, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                            {diet}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs con contenido detallado - Mejorado */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full mb-4">
                    <TabsTrigger value="overview" className="text-xs sm:text-sm px-2">
                      <span className="hidden sm:inline">Resumen</span>
                      <span className="sm:hidden">Info</span>
                    </TabsTrigger>
                    <TabsTrigger value="ingredients" className="text-xs sm:text-sm px-2">
                      <span className="hidden sm:inline">Ingredientes</span>
                      <span className="sm:hidden">Ingr.</span>
                    </TabsTrigger>
                    <TabsTrigger value="instructions" className="text-xs sm:text-sm px-2">
                      <span className="hidden sm:inline">Instrucciones</span>
                      <span className="sm:hidden">Pasos</span>
                    </TabsTrigger>
                    <TabsTrigger value="nutrition" className="text-xs sm:text-sm px-2">
                      <span className="hidden sm:inline">Nutrición</span>
                      <span className="sm:hidden">Nutr.</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    {recipeDetails?.summary && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base sm:text-lg">Descripción</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                            {cleanHtmlContent(recipeDetails.summary)}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {recipe.dishTypes && recipe.dishTypes.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base sm:text-lg">Tipo de Plato</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {recipe.dishTypes.map((type, index) => (
                              <Badge key={index} variant="outline" className="text-xs sm:text-sm px-2 py-1">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="ingredients" className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg">Lista de Ingredientes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {recipeDetails?.extendedIngredients ? (
                          <ScrollArea className="h-64 sm:h-80">
                            <div className="space-y-3 pr-2">
                              {recipeDetails.extendedIngredients.map((ingredient, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm sm:text-base font-medium text-gray-900">
                                      {ingredient.amount} {ingredient.unit}
                                    </p>
                                    <p className="text-sm text-gray-700 capitalize">{ingredient.name}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-sm sm:text-base font-medium">Lista de ingredientes no disponible</p>
                            <p className="text-xs sm:text-sm mt-1">Consulta la receta original para más detalles</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="instructions" className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg">Instrucciones de Preparación</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {recipeDetails?.analyzedInstructions?.[0]?.steps ? (
                          <ScrollArea className="h-64 sm:h-80">
                            <div className="space-y-4 pr-2">
                              {recipeDetails.analyzedInstructions[0].steps.map((step, index) => (
                                <div key={index} className="flex space-x-3">
                                  <div className="flex-shrink-0 w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                    {step.number}
                                  </div>
                                  <div className="flex-1 pt-1">
                                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{step.step}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-sm sm:text-base font-medium">Instrucciones detalladas no disponibles</p>
                            <p className="text-xs sm:text-sm mt-1">Consulta la receta original para más detalles</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="nutrition" className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg">Información Nutricional</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {macros ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {macros.protein && (
                              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Proteínas</p>
                                <p className="text-lg sm:text-xl font-bold text-blue-800">
                                  {Math.round(macros.protein.amount)}g
                                </p>
                              </div>
                            )}
                            {macros.carbs && (
                              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <p className="text-xs sm:text-sm text-orange-600 font-medium mb-1">Carbohidratos</p>
                                <p className="text-lg sm:text-xl font-bold text-orange-800">
                                  {Math.round(macros.carbs.amount)}g
                                </p>
                              </div>
                            )}
                            {macros.fat && (
                              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <p className="text-xs sm:text-sm text-purple-600 font-medium mb-1">Grasas</p>
                                <p className="text-lg sm:text-xl font-bold text-purple-800">
                                  {Math.round(macros.fat.amount)}g
                                </p>
                              </div>
                            )}
                            {macros.fiber && (
                              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                                <p className="text-xs sm:text-sm text-green-600 font-medium mb-1">Fibra</p>
                                <p className="text-lg sm:text-xl font-bold text-green-800">
                                  {Math.round(macros.fiber.amount)}g
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-sm sm:text-base font-medium">Información nutricional no disponible</p>
                            <p className="text-xs sm:text-sm mt-1">Los datos nutricionales se cargarán cuando estén disponibles</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Error handling - Mejorado */}
                {error && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
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