import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Utensils, Clock, ChefHat, Apple, Coffee, Moon, ShoppingCart, Activity, Pill } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useMealTracking } from '../../hooks/useMealTracking';
import { RecipeSearchEngine } from '../../components/RecipeSearchEngine';

interface DashboardNutritionProps {
  activeSubsection?: string;
}

export function DashboardNutrition({ activeSubsection = 'meal-plan' }: DashboardNutritionProps) {
  const { mealPlan, nutritionSummary } = useMealTracking();

  const recipes = [
    {
      id: 1,
      name: 'Ensalada de Quinoa Mediterránea',
      time: '15 min',
      calories: 320,
      difficulty: 'Fácil',
      image: '🥗',
      ingredients: ['Quinoa', 'Tomate cherry', 'Pepino', 'Aceitunas', 'Queso feta']
    },
    {
      id: 2,
      name: 'Salmón con Vegetales',
      time: '25 min',
      calories: 480,
      difficulty: 'Medio',
      image: '🐟',
      ingredients: ['Salmón', 'Brócoli', 'Zanahoria', 'Aceite de oliva', 'Limón']
    },
    {
      id: 3,
      name: 'Smoothie Verde Detox',
      time: '5 min',
      calories: 180,
      difficulty: 'Fácil',
      image: '🥤',
      ingredients: ['Espinaca', 'Piña', 'Mango', 'Agua de coco', 'Jengibre']
    }
  ];

  const renderMealPlanContent = () => (
    <div className="space-y-6">
      {/* Nutrition Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-blue-600 text-sm font-medium">Calorías</p>
              <p className="text-2xl font-bold text-blue-600">{nutritionSummary.totalCalories}</p>
              <p className="text-xs text-blue-600">/ {nutritionSummary.targetCalories} kcal</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(nutritionSummary.totalCalories / nutritionSummary.targetCalories) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-green-600 text-sm font-medium">Proteínas</p>
              <p className="text-2xl font-bold text-green-600">{nutritionSummary.protein.current}g</p>
              <p className="text-xs text-green-600">/ {nutritionSummary.protein.target}g</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="h-2 bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((nutritionSummary.protein.current / nutritionSummary.protein.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-orange-600 text-sm font-medium">Carbohidratos</p>
              <p className="text-2xl font-bold text-orange-600">{nutritionSummary.carbs.current}g</p>
              <p className="text-xs text-orange-600">/ {nutritionSummary.carbs.target}g</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="h-2 bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((nutritionSummary.carbs.current / nutritionSummary.carbs.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-purple-600 text-sm font-medium">Grasas</p>
              <p className="text-2xl font-bold text-purple-600">{nutritionSummary.fat.current}g</p>
              <p className="text-xs text-purple-600">/ {nutritionSummary.fat.target}g</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="h-2 bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((nutritionSummary.fat.current / nutritionSummary.fat.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meal Plan - READ ONLY */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              Plan de Comidas de Hoy
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Solo lectura
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Para modificar el estado de las comidas, ve a la sección de Resumen → Acciones Rápidas
          </p>
        </CardHeader>
        <CardContent>
          {/* Progress Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Progreso del Día</h4>
                <p className="text-sm text-gray-600">
                  {mealPlan.filter(meal => meal.completed).length} de{' '}
                  {mealPlan.length} comidas completadas
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((mealPlan.filter(meal => meal.completed).length / 
                    Math.max(mealPlan.length, 1)) * 100)}%
                </div>
                <p className="text-xs text-gray-500">Completado</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {mealPlan.map((meal, index) => {
              // Validar y asignar icono con fallback
              let IconComponent = Utensils; // Fallback por defecto
              
              if (meal.icon && typeof meal.icon === 'function') {
                IconComponent = meal.icon;
              } else {
                // Asignar iconos basados en el tipo de comida
                switch (meal.meal) {
                  case 'Desayuno':
                    IconComponent = Coffee;
                    break;
                  case 'Media Mañana':
                    IconComponent = Apple;
                    break;
                  case 'Almuerzo':
                    IconComponent = Utensils;
                    break;
                  case 'Merienda':
                    IconComponent = Apple;
                    break;
                  case 'Cena':
                    IconComponent = Moon;
                    break;
                  default:
                    IconComponent = Utensils;
                }
              }
              
              return (
                <div key={meal.id || index} className={`p-4 rounded-lg border transition-all duration-200 ${
                  meal.completed 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-white/5 border'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        meal.completed ? 'bg-green-500/20' : 'bg-green-500'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${meal.completed ? 'text-green-400' : 'text-white'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium">{meal.meal}</h3>
                        <p className="text-sm">{meal.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{meal.calories} kcal</p>
                      {meal.completed && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Completado
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {meal.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between text-sm">
                        <span className="">{item.name}</span>
                        <div className="flex items-center space-x-4 text-xs ">
                          <span>{item.calories} kcal</span>
                          <span>P: {item.protein}g</span>
                          <span>C: {item.carbs}g</span>
                          <span>G: {item.fat}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecipesContent = () => (
    <div className="space-y-6">

  <h2 className="text-2xl font-bold text-center mb-8 leading-tight">
    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
      Encuentra la receta perfecta para ti
    </span>
  </h2>

    <RecipeSearchEngine />

      {/* Recipe Suggestions */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ChefHat className="w-5 h-5 mr-2 text-green-600" />
            Recetas Sugeridas
          </CardTitle>
          <p className="text-sm text-green-600 mt-1">Basadas en tus preferencias y restricciones</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200">
                <div className="text-center mb-3">
                  <div className="text-4xl mb-2">{recipe.image}</div>
                  <h3 className=" font-medium">{recipe.name}</h3>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="">Tiempo:</span>
                    <span className="">{recipe.time}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="">Calorías:</span>
                    <span className="">{recipe.calories} kcal</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="">Dificultad:</span>
                    <Badge className={`text-xs ${
                      recipe.difficulty === 'Fácil' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {recipe.difficulty}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs mb-3">Ingredientes:</p>
                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients.slice(0, 3).map((ingredient, i) => (
                      <Badge key={i} className="bg-gray-700 text-gray-300 text-xs">
                        {ingredient}
                      </Badge>
                    ))}
                    {recipe.ingredients.length > 3 && (
                      <Badge className="bg-gray-700 text-gray-300 text-xs">
                        +{recipe.ingredients.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm">
                  Ver Receta
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNutritionTrackingContent = () => (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-400" />
            Seguimiento Nutricional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">Seguimiento Nutricional</h3>
            <p className="text-gray-400 mb-4">Registra tus comidas y monitorea tu progreso nutricional</p>
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              Registrar Comida
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSupplementsContent = () => (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Pill className="w-5 h-5 mr-2 text-blue-400" />
            Suplementos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">Gestión de Suplementos</h3>
            <p className="text-gray-400 mb-4">Administra y programa tus suplementos diarios</p>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Agregar Suplemento
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreferences = () => (
  <div className="space-y-6">
    {/* Dietary Preferences Section */}
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ChefHat className="w-5 h-5 mr-2 text-green-500" />
          Preferencias Alimentarias
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">Configuración de tu perfil nutricional</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Diet Type */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tipo de Dieta</h4>
          <div className="flex flex-wrap gap-2">
            {nutritionSummary.dietaryPreferences?.dietType.map((diet, index) => (
              <Badge key={index} className="bg-blue-100 text-blue-800 px-3 py-1">
                {diet}
              </Badge>
            )) || [
              <Badge key="med" className="bg-blue-100 text-blue-800 px-3 py-1">Mediterránea</Badge>,
              <Badge key="low" className="bg-blue-100 text-blue-800 px-3 py-1">Baja en Carbohidratos</Badge>
            ]}
          </div>
        </div>

        {/* Favorite Foods */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Alimentos Favoritos</h4>
          <div className="flex flex-wrap gap-2">
            {['Salmón', 'Aguacate', 'Quinoa', 'Brócoli', 'Almendras', 'Pollo'].map((food, index) => (
              <Badge key={index} className="bg-green-100 text-green-800 px-3 py-1">
                {food}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Restrictions and Allergies Section */}
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2 text-red-500" />
          Restricciones y Alergias
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">Alimentos a evitar en tu plan</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Allergies */}
        <div>
          <h4 className="text-sm font-medium text-red-700 mb-3">Alergias</h4>
          <div className="flex flex-wrap gap-2 text-red-500">
            {['Frutos Secos', 'Mariscos'].map((allergy, index) => (
              <Badge key={index} className="bg-red-100 text-red-800 px-3 py-1">
                {allergy}
              </Badge>
            ))}
          </div>
        </div>

        {/* Intolerances */}
        <div>
          <h4 className="text-sm font-medium text-orange-500 mb-3">Intolerancias</h4>
          <div className="flex flex-wrap gap-2 text-orange-500">
            {['Lactosa'].map((intolerance, index) => (
              <Badge key={index} className="bg-orange-100 text-orange-800 px-3 py-1">
                {intolerance}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

  const renderContent = () => {
    switch (activeSubsection) {
      case 'meal-plan':
        return renderMealPlanContent();
      case 'recipes':
        return renderRecipesContent();
      case 'nutrition-tracking':
        return renderNutritionTrackingContent();
      case 'supplements':
        return renderSupplementsContent();
      case 'preferences':
        return renderPreferences();
      default:
        return renderMealPlanContent();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-600">Plan Nutricional</h1>
          <p className="mt-1">Busca tu prerapado para hoy</p>
        </div>
        {/*<Button className="bg-green-500 hover:bg-green-600 text-white">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Lista de Compras
        </Button>*/}
      </div>

      {renderContent()}
    </div>
  );
}
