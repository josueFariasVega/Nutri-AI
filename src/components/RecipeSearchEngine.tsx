/**
 * Motor de Búsqueda de Recetas Inteligente
 * Conectado con las preferencias del usuario del cuestionario
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Search, Clock, Users, Zap, ChefHat, Filter, Heart, Sparkles } from 'lucide-react';
import { useRecipes } from '../hooks/useRecipes';
import { useMealTracking } from '../hooks/useMealTracking';
import { RecipeDetailModal } from './RecipeDetailModal';

interface RecipeSearchEngineProps {
  className?: string;
}

export function RecipeSearchEngine({ className = '' }: RecipeSearchEngineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [maxTime, setMaxTime] = useState<string>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { 
    recipes, 
    loading, 
    error, 
    searchRecipes, 
    filterByDiet,
    clearResults,
    hasResults 
  } = useRecipes();
  
  const { dailyPlan } = useMealTracking();

  // Obtener preferencias del usuario del cuestionario
  const userPreferences = useMemo(() => {
    // Aquí obtendrías las preferencias reales del cuestionario
    // Por ahora usamos valores por defecto que se pueden conectar con el KV store
    return {
      dietType: 'mediterranean', // Del cuestionario
      allergies: ['nuts'], // Del cuestionario
      intolerances: ['lactose'], // Del cuestionario
      preferredCuisines: ['mediterranean', 'italian', 'healthy'], // Del cuestionario
      calorieRange: { min: 200, max: 600 }, // Basado en objetivos
      maxCookingTime: 45 // Del cuestionario
    };
  }, [dailyPlan]);

  // Sugerencias inteligentes basadas en preferencias
  const smartSuggestions = useMemo(() => {
    const suggestions = [];
    
    // Basado en tipo de dieta
    if (userPreferences.dietType === 'mediterranean') {
      suggestions.push('salmón mediterráneo', 'ensalada griega', 'pollo con aceitunas');
    } else if (userPreferences.dietType === 'vegetarian') {
      suggestions.push('quinoa bowl', 'pasta vegetariana', 'curry de lentejas');
    } else if (userPreferences.dietType === 'keto') {
      suggestions.push('aguacate relleno', 'salmón grillado', 'ensalada césar');
    }
    
    // Basado en hora del día
    const hour = new Date().getHours();
    if (hour < 11) {
      suggestions.push('desayuno saludable', 'smoothie bowl', 'avena overnight');
    } else if (hour < 15) {
      suggestions.push('almuerzo ligero', 'ensalada completa', 'bowl nutritivo');
    } else {
      suggestions.push('cena saludable', 'proteína magra', 'vegetales asados');
    }
    
    return suggestions.slice(0, 6);
  }, [userPreferences]);

  // Búsqueda inteligente con filtros automáticos
  const handleSmartSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return;

    const filters = {
      diet: userPreferences.dietType,
      intolerances: [...userPreferences.allergies, ...userPreferences.intolerances],
      calories: userPreferences.calorieRange,
      maxReadyTime: selectedMealType === 'snack' ? 15 : 
                   maxTime !== 'all' ? parseInt(maxTime) : userPreferences.maxCookingTime
    };

    await searchRecipes(query, filters);
  };

  // Búsqueda por sugerencia
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSmartSearch(suggestion);
  };

  // Abrir modal de detalles
  const handleRecipeClick = (recipe: any) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  // Filtrar recetas por tipo de comida
  const filteredRecipes = useMemo(() => {
    if (selectedMealType === 'all') return recipes;
    
    return recipes.filter(recipe => {
      switch (selectedMealType) {
        case 'breakfast':
          return recipe.dishTypes?.includes('breakfast') || 
                 recipe.title.toLowerCase().includes('breakfast') ||
                 recipe.title.toLowerCase().includes('desayuno');
        case 'lunch':
          return recipe.dishTypes?.includes('main course') || 
                 recipe.dishTypes?.includes('lunch') ||
                 recipe.title.toLowerCase().includes('lunch') ||
                 recipe.title.toLowerCase().includes('almuerzo');
        case 'dinner':
          return recipe.dishTypes?.includes('main course') || 
                 recipe.dishTypes?.includes('dinner') ||
                 recipe.title.toLowerCase().includes('dinner') ||
                 recipe.title.toLowerCase().includes('cena');
        case 'snack':
          return recipe.dishTypes?.includes('snack') || 
                 recipe.dishTypes?.includes('appetizer') ||
                 recipe.title.toLowerCase().includes('snack');
        default:
          return true;
      }
    });
  }, [recipes, selectedMealType]);

  // Obtener calorías de una receta
  const getRecipeCalories = (recipe: any) => {
    if (!recipe.nutrition?.nutrients) return 'N/A';
    
    const calories = recipe.nutrition.nutrients.find(
      (n: any) => n.name.toLowerCase() === 'calories'
    );
    
    return calories ? `${Math.round(calories.amount)} kcal` : 'N/A';
  };

  // Obtener nivel de dificultad estimado
  const getDifficultyLevel = (recipe: any) => {
    const time = recipe.readyInMinutes || 0;
    const steps = recipe.analyzedInstructions?.[0]?.steps?.length || 0;
    
    if (time <= 15 || steps <= 5) return { level: 'Fácil', color: 'bg-green-500/20 text-green-400' };
    if (time <= 30 || steps <= 10) return { level: 'Medio', color: 'bg-yellow-500/20 text-yellow-400' };
    return { level: 'Difícil', color: 'bg-red-500/20 text-red-400' };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con preferencias del usuario */}
      <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-600">Búsqueda Personalizada</h3>
                <p className="text-sm text-green-600/80">Basada en tus preferencias del cuestionario</p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Heart className="w-3 h-3 mr-1" />
              {userPreferences.dietType}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              Sin: {userPreferences.allergies.join(', ')}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Max: {userPreferences.maxCookingTime} min
            </Badge>
            <Badge variant="outline" className="text-xs">
              {userPreferences.calorieRange.min}-{userPreferences.calorieRange.max} kcal
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Barra de búsqueda principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ChefHat className="w-6 h-6 text-green-600" />
            <span>Encuentra tu receta perfecta</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Búsqueda principal */}
          <div className="flex space-x-2">
            <Input
              placeholder="¿Qué te apetece cocinar hoy?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
              className="flex-1"
            />
            <Button 
              onClick={() => handleSmartSearch()}
              disabled={loading || !searchQuery.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-3">
            <Select value={selectedMealType} onValueChange={setSelectedMealType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo de comida" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="breakfast">Desayuno</SelectItem>
                <SelectItem value="lunch">Almuerzo</SelectItem>
                <SelectItem value="dinner">Cena</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>

            <Select value={maxTime} onValueChange={setMaxTime}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tiempo máximo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquiera</SelectItem>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
              </SelectContent>
            </Select>

            {hasResults && (
              <Button variant="outline" onClick={clearResults} size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Limpiar ({filteredRecipes.length})
              </Button>
            )}
          </div>

          {/* Sugerencias inteligentes */}
          {!hasResults && (
            <div>
              <p className="text-sm font-medium mb-3 text-green-600">Sugerencias para ti:</p>
              <div className="flex flex-wrap gap-2">
                {smartSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs hover:bg-green-50 hover:border-green-300"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Error handling */}
          {error && (
            <Card>
              <CardContent className="text-center py-8">
                {error.includes('límite de búsquedas') ? (
                  <>
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      ¡Límite de búsquedas alcanzado!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Has utilizado todas tus búsquedas de recetas por hoy.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-green-800">
                        <strong>¡Buenas noticias!</strong> Tus búsquedas se renovarán mañana.
                        Mientras tanto, puedes revisar las recetas que ya encontraste.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Mientras esperas, puedes:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                          🍽️ Ver recetas guardadas
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => clearResults()}>
                          📝 Planificar menú
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Problema temporal
                    </h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button 
                      onClick={() => handleSmartSearch()} 
                      variant="outline" 
                      size="sm"
                      disabled={loading}
                    >
                      {loading ? 'Reintentando...' : 'Reintentar búsqueda'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resultados de recetas */}
          {filteredRecipes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => {
                const difficulty = getDifficultyLevel(recipe);
                
                return (
                  <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="aspect-video relative">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen';
                        }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Badge className="bg-orange-500/90 text-white text-xs">
                          {getRecipeCalories(recipe)}
                        </Badge>
                        <Badge className={`${difficulty.color} text-xs`}>
                          {difficulty.level}
                        </Badge>
                      </div>
                      {recipe.vegetarian && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-green-500/90 text-white text-xs">
                            Vegetariano
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-3 line-clamp-2 min-h-[3.5rem]">
                        {recipe.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{recipe.readyInMinutes || 'N/A'} min</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{recipe.servings || 'N/A'} porciones</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Zap className="w-4 h-4" />
                          <span>{recipe.healthScore || 'N/A'}/100</span>
                        </div>
                      </div>

                      {/* Etiquetas de dieta */}
                      {recipe.diets && recipe.diets.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {recipe.diets.slice(0, 2).map((diet, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {diet}
                            </Badge>
                          ))}
                          {recipe.diets.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{recipe.diets.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full hover:bg-green-50 hover:border-green-300"
                        onClick={() => handleRecipeClick(recipe)}
                      >
                        <ChefHat className="w-4 h-4 mr-2" />
                        Ver Receta Completa
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Estado vacío */}
          {!loading && !hasResults && searchQuery && !error && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No encontramos recetas</h3>
                <p className="text-gray-600 mb-4">
                  No se encontraron recetas para "{searchQuery}" con tus preferencias actuales
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Intenta:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => handleSuggestionClick('pollo')}>
                      Buscar "pollo"
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSuggestionClick('ensalada')}>
                      Buscar "ensalada"
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSuggestionClick('pasta')}>
                      Buscar "pasta"
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modal de detalles de receta */}
          <RecipeDetailModal
            recipe={selectedRecipe}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        </CardContent>
      </Card>
    </div>
  );
}