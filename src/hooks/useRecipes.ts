/**
 * @fileoverview Hook para gestión de recetas con Spoonacular
 * @description Hook personalizado que maneja búsqueda, filtrado y caché de recetas
 * @author Nutrition Platform Team
 * @version 1.0.0
 * @since 2025-01-12
 * 
 * @example
 * ```tsx
 * const { recipes, loading, searchRecipes, filterByDiet } = useRecipes();
 * 
 * // Buscar recetas
 * await searchRecipes('pasta');
 * 
 * // Filtrar por dieta
 * const vegetarianRecipes = filterByDiet('vegetarian');
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { spoonacularService } from '../lib/spoonacular';
import type { SpoonacularRecipe } from '../types/spoonacular/api';

/**
 * Interface para el estado de recetas
 * @interface RecipeState
 */
interface RecipeState {
    /** Lista de recetas actuales */
    recipes: SpoonacularRecipe[];
    /** Estado de carga */
    loading: boolean;
    /** Mensaje de error si existe */
    error: string | null;
    /** Término actual de búsqueda */
    searchTerm: string;
    /** Filtros aplicados */
    filters: RecipeFilters;
}

/**
 * Interface para filtros de recetas
 * @interface RecipeFilters
 */
interface RecipeFilters {
    /** Tipo de dieta */
    diet?: string;
    /** Intolerancias alimentarias */
    intolerances?: string[];
    /** Rango de calorías */
    calories?: {
        min: number;
        max: number;
    };
    /** Tiempo máximo de preparación */
    maxReadyTime?: number;
}

/**
 * Hook personalizado para gestión de recetas
 * @returns {Object} Objeto con estado y funciones para manejar recetas
 */
export function useRecipes() {
    const [state, setState] = useState<RecipeState>({
        recipes: [],
        loading: false,
        error: null,
        searchTerm: '',
        filters: {}
    });

    /**
     * Busca recetas por término de búsqueda
     * @param {string} query - Término de búsqueda
     * @param {RecipeFilters} filters - Filtros de búsqueda
     * @returns {Promise<void>}
     */
    const searchRecipes = useCallback(async (
        query: string,
        filters: RecipeFilters = {}
    ): Promise<void> => {
        setState(prev => ({
            ...prev,
            loading: true,
            error: null, 
            searchTerm: query,
            filters
        }));

        try {
            const params = {
                query,
                number: 12,
                ...filters.diet && { diet: filters.diet },
                ...filters.intolerances && {
                    intolerances: filters.intolerances.join(',')
                },
                ...filters.calories && {
                    minCalories: filters.calories.min,
                    maxCalories: filters.calories.max
                },
                ...filters.maxReadyTime && { maxReadyTime: filters.maxReadyTime }
            };

            const response = await spoonacularService.searchRecipes(params);

            setState(prev => ({
                ...prev,
                recipes: response.results,
                loading: false
            }));
            
        } catch (error) {
            let userFriendlyMessage = 'Error al buscar recetas';
            
            if (error instanceof Error) {
                const errorMessage = error.message.toLowerCase();
                
                // Detectar errores específicos de límites de API
                if (errorMessage.includes('daily points limit') || 
                    errorMessage.includes('limit of') || 
                    errorMessage.includes('quota') ||
                    errorMessage.includes('rate limit')) {
                    userFriendlyMessage = 'Has alcanzado el límite de búsquedas de recetas por hoy. ¡Vuelve mañana para descubrir más recetas deliciosas!';
                } else if (errorMessage.includes('network') || 
                          errorMessage.includes('fetch') ||
                          errorMessage.includes('connection')) {
                    userFriendlyMessage = 'Problema de conexión. Por favor, verifica tu internet e intenta nuevamente.';
                } else if (errorMessage.includes('unauthorized') || 
                          errorMessage.includes('forbidden')) {
                    userFriendlyMessage = 'Servicio temporalmente no disponible. Intenta más tarde.';
                } else if (errorMessage.includes('not found') || 
                          errorMessage.includes('404')) {
                    userFriendlyMessage = 'No se encontraron recetas con esos criterios. Intenta con otros ingredientes.';
                } else {
                    userFriendlyMessage = 'No pudimos cargar las recetas en este momento. Intenta nuevamente en unos minutos.';
                }
            }
            
            setState(prev => ({
                ...prev,
                error: userFriendlyMessage,
                loading: false
            }));
        }
    }, []);

    /**
     * Filtra recetas por tipo de dieta
     * @param {string} dietType - Tipo de dieta
     * @returns {SpoonacularRecipe[]} Recetas filtradas
     */
    const filterByDiet = useCallback((dietType: string): SpoonacularRecipe[] => {
        return state.recipes.filter(recipe => {
            // Verificar si la receta tiene el tipo de dieta específico
            const dietTypes = recipe.diets || [];
            
            switch (dietType.toLowerCase()) {
                case 'omnivore':
                case 'omnívora':
                    // Omnívoro: no vegetariano ni vegano
                    return !recipe.vegetarian && !recipe.vegan;
                    
                case 'vegetarian':
                case 'vegetariana':
                    return recipe.vegetarian || dietTypes.includes('vegetarian');
                    
                case 'vegan':
                case 'vegana':
                    return recipe.vegan || dietTypes.includes('vegan');
                    
                case 'ketogenic':
                case 'keto':
                case 'ketogénica':
                    return dietTypes.includes('ketogenic') || dietTypes.includes('keto');
                    
                case 'paleo':
                    return dietTypes.includes('paleo') || dietTypes.includes('paleolithic');
                    
                case 'mediterranean':
                case 'mediterránea':
                    return dietTypes.includes('mediterranean');
                    
                case 'gluten free':
                case 'sin gluten':
                    return recipe.glutenFree || dietTypes.includes('gluten free');
                    
                case 'dairy free':
                case 'sin lácteos':
                    return recipe.dairyFree || dietTypes.includes('dairy free');
                    
                default:
                    // Búsqueda genérica en el array de dietas
                    return dietTypes.some(diet => 
                        diet.toLowerCase().includes(dietType.toLowerCase())
                    );
            }
        });
    }, [state.recipes]);

    /**
     * Obtiene recetas por rango de calorías
     * @param {number} min - Calorías mínimas
     * @param {number} max - Calorías máximas
     * @returns {SpoonacularRecipe[]} Recetas filtradas
     */
    const filterByCalories = useCallback((min: number, max: number): SpoonacularRecipe[] => {
        return state.recipes.filter(recipe => {
            const calories = recipe.nutrition?.nutrients?.find(
                n => n.name.toLowerCase() === 'calories'
            )?.amount || 0;
            return calories >= min && calories <= max;
        });
    }, [state.recipes]);

    /**
     * Limpia los resultados de búsqueda
     */
    const clearResults = useCallback(() => {
        setState({
            recipes: [],
            loading: false,
            error: null,
            searchTerm: '',
            filters: {}
        });
    }, []);

    /**
     * Recetas agrupadas por tipo de comida
     */   
    const recipesByMealType = useMemo(() => {
        return {
            breakfast: state.recipes.filter(r => r.dishTypes?.includes('breakfast')),
            lunch: state.recipes.filter(r =>
                r.dishTypes?.includes('main course') ||
                r.dishTypes?.includes('lunch')
            ),
            dinner: state.recipes.filter(r =>
                r.dishTypes?.includes('main course') ||
                r.dishTypes?.includes('dinner')
            ),
            snack: state.recipes.filter(r => r.dishTypes?.includes('snack'))
        };
    }, [state.recipes]);

    return {
        // Estado
        recipes: state.recipes,
        loading: state.loading,
        error: state.error,
        searchTerm: state.searchTerm,
        filters: state.filters,
        
        // Funciones
        searchRecipes,
        filterByDiet,
        filterByCalories,
        clearResults,
        
        // Datos computados
        recipesByMealType,
        
        // Estadísticas
        totalRecipes: state.recipes.length,
        hasResults: state.recipes.length > 0
    };
}