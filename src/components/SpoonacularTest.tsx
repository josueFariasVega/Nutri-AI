/**
 * Componente de prueba para la API de Spoonacular
 */
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Loader2, Search, Clock, Users, Zap, AlertTriangle } from 'lucide-react';
import { spoonacularService } from '../lib/spoonacular';

interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
}

// Datos de prueba para cuando la API no funciona
const recetasPrueba: Recipe[] = [
  {
    id: 1,
    title: "Ensalada César con Pollo",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop",
    readyInMinutes: 15,
    servings: 2,
    nutrition: {
      nutrients: [
        { name: "Calories", amount: 420, unit: "kcal" },
        { name: "Protein", amount: 35, unit: "g" },
        { name: "Carbohydrates", amount: 12, unit: "g" },
        { name: "Fat", amount: 28, unit: "g" }
      ]
    }
  },
  {
    id: 2,
    title: "Salmón a la Plancha con Vegetales",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=200&fit=crop",
    readyInMinutes: 25,
    servings: 4,
    nutrition: {
      nutrients: [
        { name: "Calories", amount: 380, unit: "kcal" },
        { name: "Protein", amount: 32, unit: "g" },
        { name: "Carbohydrates", amount: 8, unit: "g" },
        { name: "Fat", amount: 24, unit: "g" }
      ]
    }
  },
  {
    id: 3,
    title: "Bowl de Quinoa con Aguacate",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop",
    readyInMinutes: 20,
    servings: 3,
    nutrition: {
      nutrients: [
        { name: "Calories", amount: 340, unit: "kcal" },
        { name: "Protein", amount: 14, unit: "g" },
        { name: "Carbohydrates", amount: 45, unit: "g" },
        { name: "Fat", amount: 12, unit: "g" }
      ]
    }
  }
];

export function SpoonacularTest() {
  const [busqueda, setBusqueda] = useState('');
  const [recetas, setRecetas] = useState<Recipe[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [usandoDatosPrueba, setUsandoDatosPrueba] = useState(false);

  const buscarRecetas = async () => {
    if (!busqueda.trim()) return;

    setCargando(true);
    setError('');
    setUsandoDatosPrueba(false);
    
    try {
      console.log('🔍 Buscando recetas:', busqueda);
      
      const resultado = await spoonacularService.searchRecipes({
        query: busqueda,
        number: 6,
      });

      console.log('✅ Resultado de Spoonacular:', resultado);
      setRecetas(resultado.results || []);
      
    } catch (err: unknown) {
      console.error('❌ Error en Spoonacular:', err);
      const errorMessage = (err as Error)?.message || 'Desconocido';
      
      // Si es error 401, usar datos de prueba
      if (errorMessage.includes('401') || errorMessage.includes('not authorized')) {
        console.log('🧪 Usando datos de prueba debido a error de API');
        setRecetas(recetasPrueba);
        setUsandoDatosPrueba(true);
        setError('API no disponible - Mostrando datos de prueba');
      } else {
        setError(`Error al buscar recetas: ${errorMessage}`);
      }
    } finally {
      setCargando(false);
    }
  };

  const obtenerCalorias = (receta: Recipe) => {
    if (!receta.nutrition?.nutrients) return 'N/A';
    
    const calorias = receta.nutrition.nutrients.find(
      n => n.name.toLowerCase() === 'calories'
    );
    
    return calorias ? `${Math.round(calorias.amount)} kcal` : 'N/A';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-green-600" />
            <span>Prueba de API Spoonacular</span>
            {usandoDatosPrueba && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Datos de prueba
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Buscar recetas (ej: pasta, chicken, salad)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarRecetas()}
              className="flex-1"
            />
            <Button 
              onClick={buscarRecetas}
              disabled={cargando || !busqueda.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {cargando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {cargando ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {error && (
            <div className={`p-4 rounded-lg border ${
              usandoDatosPrueba 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${
                usandoDatosPrueba ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {error}
              </p>
              {error.includes('401') && (
                <div className="mt-2 text-xs text-yellow-600">
                  <p>💡 Para usar la API real:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Ve a <a href="https://spoonacular.com/food-api" target="_blank" rel="noopener noreferrer" className="underline">spoonacular.com/food-api</a></li>
                    <li>Regístrate y obtén tu API key</li>
                    <li>Actualiza VITE_SPOONACULAR_API_KEY en tu archivo .env</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {recetas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recetas.map((receta) => (
            <Card key={receta.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative">
                <img
                  src={receta.image}
                  alt={receta.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-orange-500 text-white">
                    {obtenerCalorias(receta)}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {receta.title}
                </h3>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{receta.readyInMinutes} min</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{receta.servings} porciones</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => {
                    console.log('📝 Detalles de receta:', receta);
                    alert(`ID de receta: ${receta.id}\n${usandoDatosPrueba ? 'Datos de prueba' : 'Datos reales de Spoonacular'}`);
                  }}
                >
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {!cargando && recetas.length === 0 && busqueda && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron recetas para "{busqueda}"</p>
            <p className="text-sm text-gray-500 mt-2">Intenta con otros términos de búsqueda</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
