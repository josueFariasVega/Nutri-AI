import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/utils/supabase/client';
import { fetchEdge } from '../../lib/utils/supabase/edge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { useMealTracking } from '../../hooks/useMealTracking';
import { DashboardLoadingState } from '../../components/ui/loading-state';
import { useLoadingNotifications } from '../../components/ui/notifications';
import { 
  Target, 
  Activity, 
  Heart, 
  CheckCircle, 
  Clock,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Brain,
  Lightbulb,
  Award,
  Zap,
  Droplets,
  Flame,
  Utensils,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { logger } from '../../lib/utils/logger';

interface DashboardOverviewProps {
  user: any;
  activeSubsection?: string;
}

export function DashboardOverview({ user, activeSubsection = 'dashboard' }: DashboardOverviewProps) {
  const { 
    mealPlan, 
    nutritionSummary, 
    calorieProgress, 
    toggleMealCompletion,
    updateHydration,
    updateMetrics,
    loading: mealPlanLoading,
    error: mealPlanError,
    hasNutritionPlan,
    regeneratePlan,
    isConnectedToPlan,
    planSource,
    dailyPlan
  } = useMealTracking();
  
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hook para notificaciones contextuales
  const {
    showPlanRegenerationNotification,
    showPlanGeneratedNotification,
    showDayChangeNotification,
    showHydrationReminder,
    showMealCompletionNotification,
  } = useLoadingNotifications();

  // Estado base calculado desde dailyPlan (fuente de verdad)
  const baseMetrics = useMemo(() => ({
    weight: dailyPlan?.metrics?.weight ? dailyPlan.metrics.weight.toString() : '',
    waterGlasses: dailyPlan?.hydration?.glasses || 0,
    exercise: dailyPlan?.metrics?.energy > 6 ? 'Si' : 
             dailyPlan?.metrics?.energy > 0 ? 'No' : '',
    energy: dailyPlan?.metrics?.energy || 8,
    mood: 5,
    sleep: dailyPlan?.metrics?.sleep ? dailyPlan.metrics.sleep.toString() : '7',
    steps: dailyPlan?.metrics?.steps ? dailyPlan.metrics.steps.toString() : ''
  }), [dailyPlan]);

  // Generar datos reales para la semana basados en el historial del usuario
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weekData = [];
    const historicalData = JSON.parse(localStorage.getItem('nutrition_historical_data') || '{}');
    
    // Generar datos para los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
      const dateKey = date.toISOString().split('T')[0];
      
      // Intentar cargar datos reales del localStorage para esa fecha
      let dayCalories = 0;
      let dayWeight = dailyPlan?.metrics?.weight || 0;
      
      try {
        // Cargar historial una vez
        const historicalRecord = historicalData[dateKey];

        if (historicalRecord) {
          dayCalories = historicalRecord.caloriesConsumed || 0;
          dayWeight = historicalRecord.metrics?.weight || dayWeight;
        }
      } catch (error) {
        logger.log(`No hay datos para ${dateKey}`);
      }
      
      // Si es hoy, usar datos actuales
      if (i === 0) {
        dayCalories = nutritionSummary.totalCalories;
        dayWeight = dailyPlan?.metrics?.weight || 0;
      }
      
      weekData.push({
        day: dayName,
        calories: dayCalories,
        weight: dayWeight,
        date: dateKey
      });
    }
    
    return weekData;
  }, [nutritionSummary.totalCalories, dailyPlan?.metrics?.weight]);

  const currentWeight = parseFloat(baseMetrics.weight) || 0;
  const targetWeight = dailyPlan?.plan?.targetWeight || 0;
  const weightChange = 0; // Se calculará cuando tengamos historial real
  
  const [savingMetrics, setSavingMetrics] = useState<Record<string, boolean>>({});
  const [lastSaved, setLastSaved] = useState<Record<string, Date>>({});
  const [regeneratingPlan, setRegeneratingPlan] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);


  const loadDashboardData = async (retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
  
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
  
      const metricsResponse = await fetchEdge('metrics', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        signal: controller.signal
      });
  
      clearTimeout(timeoutId);
  
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      } else if (metricsResponse.status === 404) {
        setMetrics([]);
      } else {
        throw new Error(`HTTP ${metricsResponse.status}`);
      }
    } catch (error) {
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => loadDashboardData(retryCount + 1), delay);
        return;
      } else {
        setMetrics([]);
        toast.info('Usando datos locales. Algunas funciones remotas no están disponibles.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMetricUpdate = async (field: string, value: any) => {
    logger.log('📊 Updating metric:', { field, value });
    logger.log('🔍 updateHydration available:', !!updateHydration);
    logger.log('🔍 updateMetrics available:', !!updateMetrics);
    logger.log('🔍 dailyPlan:', dailyPlan);
    
    setSavingMetrics(prev => ({ ...prev, [field]: true }));
  
    try {
      if (field === 'waterGlasses') {
        logger.log('💧 Processing hydration update...');
        // Usar la función de hidratación conectada
        if (updateHydration) {
          logger.log('💧 Calling updateHydration with value:', value);
          updateHydration(value);
          
          // ✅ SOLUCIÓN: Feedback visual inmediato y actualización de estado
          setLastSaved(prev => ({ ...prev, [field]: new Date() }));
          
          toast.success('💧 Hidratación actualizada y guardada', {
            duration: 2000,
            position: 'bottom-right'
          });

          // ✅ NOTIFICACIÓN DE HIDRATACIÓN
          showHydrationReminder();
        } else {
          logger.error('❌ updateHydration is not available');
        }
      } else {
        // Usar la función de métricas conectada
        if (updateMetrics) {
          const metricUpdate: any = {};
          
          if (field === 'weight') {
            metricUpdate.weight = parseFloat(value) || 0;
          } else if (field === 'exercise') {
            metricUpdate.energy = value === 'Si' ? 8 : value === 'No' ? 3 : 0;
          } else if (field === 'sleep') {
            metricUpdate.sleep = parseFloat(value) || 0;
          } else if (field === 'energy') {
            metricUpdate.energy = value;
          } else if (field === 'steps') {
            metricUpdate.steps = parseInt(value) || 0;
          }
          
          updateMetrics(metricUpdate);
          
          // ✅ SOLUCIÓN: Feedback visual inmediato y confirmación de guardado
          setLastSaved(prev => ({ ...prev, [field]: new Date() }));
          
          // ✅ FORZAR ACTUALIZACIÓN VISUAL INMEDIATA
          setTimeout(() => {
            // Forzar re-render del componente para mostrar datos actualizados
            const event = new CustomEvent('metricsUpdated', { detail: { field, value } });
            window.dispatchEvent(event);
          }, 100);
          
          toast.success(`📊 ${getFieldLabel(field)} actualizada y guardada correctamente`, {
            duration: 3000,
            position: 'bottom-right',
            description: `Valor: ${value} - Guardado en ${new Date().toLocaleTimeString()}`
          });
        }
      }
      
      logger.log('✅ Metric updated successfully');
      
    } catch (error) {
      logger.error('❌ Error updating metric:', error);
      toast.error(`Error al actualizar ${getFieldLabel(field)}`, {
        duration: 3000,
        position: 'bottom-right',
        description: 'Por favor, inténtalo de nuevo'
      });
    } finally {
      setSavingMetrics(prev => ({ ...prev, [field]: false }));
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      weight: 'peso',
      exercise: 'ejercicio',
      sleep: 'horas de sueño',
      energy: 'nivel de energía',
      steps: 'pasos',
      waterGlasses: 'hidratación'
    };
    return labels[field] || field;
  };

  const formatLastSaved = (field: string): string => {
    const lastSavedTime = lastSaved[field];
    if (!lastSavedTime) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSavedTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Guardado ahora';
    if (diffMins < 60) return `Guardado hace ${diffMins}m`;
    return `Guardado hace ${Math.floor(diffMins / 60)}h`;
  };

  const macroData = [
    { name: 'Proteínas', value: 25, color: '#10b981' },
    { name: 'Carbohidratos', value: 50, color: '#3b82f6' },
    { name: 'Grasas', value: 25, color: '#f59e0b' }
  ];

  const aiInsights = [
    {
      icon: Brain,
      title: "Análisis IA",
      description: "Tu patrón de consumo muestra consistencia. Aumenta proteínas en el almuerzo.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Lightbulb,
      title: "Recomendación",
      description: "Momento óptimo para ejercicio: 16:00-18:00 basado en tu energía.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Award,
      title: "Logro Desbloqueado",
      description: "7 días consecutivos cumpliendo objetivos de hidratación.",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const renderDashboardContent = () => (
    <div className="space-y-6">
      {/* Header with current date */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-gray-700">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Actualizado hace 2 min</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Progreso Hoy</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{Math.round(calorieProgress)}%</p>
                <p className="text-xs text-green-600 mt-1">
                  {nutritionSummary.totalCalories} / {nutritionSummary.targetCalories} kcal
                </p>
              </div>
              <div className="relative">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Hidratación</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{baseMetrics.waterGlasses}/8</p>
                <p className="text-xs text-blue-600 mt-1">
                  {Math.round((baseMetrics.waterGlasses / 8) * 100)}% completado
                </p>
              </div>
              <Droplets className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Nivel Energía</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{baseMetrics.energy}/10</p>
                <p className="text-xs text-purple-600 mt-1">
                  {baseMetrics.energy >= 8 ? 'Excelente' : baseMetrics.energy >= 6 ? 'Bueno' : 'Bajo'}
                </p>
              </div>
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Peso Actual</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                  {currentWeight > 0 ? `${currentWeight}kg` : 'No registrado'}
                </p>
                <div className="flex items-center mt-1">
                  {weightChange < 0 ? (
                    <TrendingDown className="w-3 h-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingUp className="w-3 h-3 text-red-600 mr-1" />
                  )}
                  <span className="text-xs text-gray-600">
                    {weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${weightChange}kg esta semana` : 'Registra tu peso para ver progreso'}
                  </span>
                </div>
              </div>
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-400" />
          Insights de IA
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <Card key={index} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${insight.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{insight.title}</h3>
                      <p className="text-xs mt-1 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-400" />
              Progreso Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyData}>
                <defs>
                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#" />
                <XAxis dataKey="day" stroke="#374151" />
                <YAxis stroke="#374151" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffff',
                    border: '1px solidrgba(0, 13, 34, 0)',
                    borderRadius: '1f2937',
                    color: '#'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorCalories)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                ¡Excelente progreso! 🎉
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                A este ritmo alcanzarás tu objetivo en aproximadamente 5 semanas
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                83%
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">Completado</p>
            </div>
          </div>
        </div>
        </Card>


        <Card className="bg-black/10 border-black/500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-400" />
              Distribución Macros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffff',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {macroData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>

            <div className="w-full mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Progreso Diario
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(calorieProgress)}%
                  </span>
                </div>
                <Progress value={calorieProgress} className="h-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {calorieProgress >= 100
                    ? `¡Objetivo alcanzado! (+${nutritionSummary.totalCalories - nutritionSummary.targetCalories} kcal)`
                    : `Te faltan ${nutritionSummary.targetCalories - nutritionSummary.totalCalories} kcal para alcanzar tu objetivo`
                  }
                </p>
              </div>

              <div className="w-full mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Objetivos vs Consumo
                </h4>

                {[
                  { name: 'Proteínas', current: nutritionSummary.protein.current, target: nutritionSummary.protein.target, unit: 'g', color: 'bg-green-500' },
                  { name: 'Carbohidratos', current: nutritionSummary.carbs.current, target: nutritionSummary.carbs.target, unit: 'g', color: 'bg-blue-500' },
                  { name: 'Grasas', current: nutritionSummary.fat.current, target: nutritionSummary.fat.target, unit: 'g', color: 'bg-orange-500' },
                ].map((macro, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{macro.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${macro.color}`} />
                      <span className="text-gray-900 dark:text-white font-medium">
                        {macro.current}/{macro.target}{macro.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
        
  const renderSummaryContent = () => (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-400" />
            Resumen Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">Resumen de Progreso</h3>
            <p className="text-gray-400 mb-4">Vista consolidada de tu progreso semanal y mensual</p>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Ver Resumen Completo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderQuickActionsContent = () => (
    <div className="space-y-6">
      {/* Meal Tracking - Improved Design */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Utensils className="w-5 h-5 mr-2 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Plan de Comidas - Hoy</h3>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {mealPlan.filter(meal => meal.completed).length} de {mealPlan.length} comidas completadas ({Math.round((mealPlan.filter(meal => meal.completed).length / mealPlan.length) * 100)}% adherencia)
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {mealPlan.map((meal) => {
            const Icon = (() => {
              switch (meal.icon) {
                case 'coffee': return Coffee;
                case 'apple': return Apple;
                case 'utensils': return Utensils;
                case 'moon': return Moon;
                default: return Utensils;
              }
            })();
            const mealTypeColors = {
              'Desayuno': 'bg-yellow-100 text-yellow-800',
              'Media Mañana': 'bg-green-100 text-green-800', 
              'Almuerzo': 'bg-blue-100 text-blue-800',
              'Merienda': 'bg-green-100 text-green-800',
              'Cena': 'bg-purple-100 text-purple-800'
            };
            
            return (
              <div key={meal.id} className="p-4 rounded-lg border border-gray-100">
                {/* Meal Header */}
                <div className="flex-col md:flex-row items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      meal.completed ? 'bg-green-500/20' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${meal.completed ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">{meal.time}</span>
                        <Badge className={`text-xs px-2 py-0.5 ${mealTypeColors[meal.meal as keyof typeof mealTypeColors] || 'bg-gray-100 text-gray-800'}`}>
                          {meal.meal}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {meal.items.filter(item => item.consumed).reduce((sum, item) => sum + item.calories, 0)} / {meal.targetCalories} kcal objetivo
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    {meal.completed && (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        ✓ {meal.items.filter(item => item.consumed).length} seleccionado(s)
                      </Badge>
                    )}
                    {!meal.completed && (
                      <Badge className="bg-orange-100 text-orange-700 text-xs">
                        ⏳ Selecciona alimentos
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Individual Food Items */}
                <div className="space-y-2 ml-4 pl-4 border-l-2 border-gray-100">
                  {meal.items.map((item, index) => (
                    <div key={item.id || `${meal.id}-item-${index}`} className="flex items-center justify-between p-2 rounded">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            logger.log('🔍 Checkbox clicked!', {
                              mealId: meal.id,
                              itemId: item.id || `${meal.id}-item-${index}`,
                              itemName: item.name,
                              currentConsumed: item.consumed
                            });
                            toggleMealCompletion(meal.id, item.id || `${meal.id}-item-${index}`);
                          }}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                            item.consumed 
                              ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                              : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                          }`}
                        >
                          {item.consumed ? (
                            <span className="text-green-600 text-sm">✅</span>
                          ) : (
                            <span className="text-gray-400 text-xs">☐</span>
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <h5 className={`text-sm font-medium ${item.consumed ? 'text-gray-900' : 'text-gray-700'}`}>
                            {item.name}
                          </h5>
                          <p className="text-xs text-gray-500">
                            {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • G: {item.fat}g
                          </p>
                        </div>
                      </div>
                      
                      {item.consumed && (
                        <Badge className="bg-green-50 text-green-600 text-xs border border-green-200">
                          ✓ Consumido
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Meal Summary */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Total consumido:</span>
                    <span className="font-medium">
                      {meal.items.filter(item => item.consumed).reduce((sum, item) => sum + item.calories, 0)} kcal
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Hydration Tracking - Improved Design */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Droplets className="w-5 h-5 mr-2 text-blue-500" />
            Hidratación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {(baseMetrics.waterGlasses * 0.25).toFixed(1)}L
            </div>
            <p className="text-sm text-gray-600">de 2.5L objetivo</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3 mb-4">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((baseMetrics.waterGlasses / 10) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-600 font-medium">
              {Math.round((baseMetrics.waterGlasses / 10) * 100)}% completado
            </p>
          </div>

          {/* Water Glasses Visual */}
          <div className="flex justify-center mb-6">
            <div className="flex gap-1 flex-wrap justify-center max-w-full">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleMetricUpdate('waterGlasses', i + 1)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded transition-all duration-200 flex items-center justify-center ${
                    i < (baseMetrics.waterGlasses || 0)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-400 hover:bg-blue-100'
                  }`}
                  title={`Vaso ${i + 1}`}
                >
                  <Droplets className="w-4 h-4 sm:w-6 sm:h-6" />
                </button>
              ))}
            </div>
          </div>  

          {/* Quick Actions */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMetricUpdate('waterGlasses', Math.max(0, (baseMetrics.waterGlasses || 0) - 1))}
              className="text-gray-600 border-gray-300"
            >
              <Minus className="w-4 h-4" />
            </Button>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {baseMetrics.waterGlasses || 0} vasos
              </div>
              <p className="text-xs text-gray-500">(250ml c/u)</p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMetricUpdate('waterGlasses', Math.min(10, (baseMetrics.waterGlasses || 0) + 1))}
              className="text-gray-600 border-gray-300"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex space-x-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMetricUpdate('waterGlasses', Math.min(10, (baseMetrics.waterGlasses || 0) + 1))}
              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              + 1 vaso
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMetricUpdate('waterGlasses', Math.min(10, (baseMetrics.waterGlasses || 0) + 2))}
              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              + 500ml
            </Button>
          </div>

          {/* Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">💡 Tip del día</p>
                <p className="text-xs text-blue-700 mt-1">
                  Bebe un vaso de agua al despertar para activar tu metabolismo
                </p>
              </div>
            </div>
          </div>

          {/* Reminders */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Recordatorios:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Al despertar</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Antes del almuerzo</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Tarde (3-4 PM)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Antes de la cena</span>
              </div>
            </div>
          </div>

          {savingMetrics.waterGlasses && (
            <p className="text-xs text-green-600 mt-2 text-center">Guardando...</p>
          )}
          {!savingMetrics.waterGlasses && lastSaved.waterGlasses && (
            <p className="text-xs text-green-600 mt-2 text-center">{formatLastSaved('waterGlasses')}</p>
          )}
        </CardContent>
      </Card>

      {/* Other Metrics */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
            Otras Métricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={baseMetrics.weight}
                onChange={(e) => handleMetricUpdate('weight', e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ingresa tu peso"
              />
              {savingMetrics.weight && (
                <p className="text-xs text-green-600 mt-1">Guardando...</p>
              )}
              {!savingMetrics.weight && lastSaved.weight && (
                <p className="text-xs text-green-600 mt-1">{formatLastSaved('weight')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Energía (1-10)</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMetricUpdate('energy', Math.max(1, (dailyPlan?.metrics?.energy || 0) - 1))}
                  className="border-gray-300"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="font-medium px-3 py-1 bg-gray-100 rounded border">
                  {dailyPlan?.metrics?.energy || 0}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMetricUpdate('energy', Math.min(10, (dailyPlan?.metrics?.energy || 0) + 1))}
                  className="border-gray-300"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {savingMetrics.energy && (
                <p className="text-xs text-green-600 mt-1">Guardando...</p>
              )}
              {!savingMetrics.energy && lastSaved.energy && (
                <p className="text-xs text-green-600 mt-1">{formatLastSaved('energy')}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSubsection) {
      case 'dashboard':
        return renderDashboardContent();
      case 'summary':
        return renderSummaryContent();
      case 'quick-actions':
        return renderQuickActionsContent();
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div>
      {renderContent()}
    </div>
  );
}