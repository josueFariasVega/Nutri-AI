  import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Target, Activity, Heart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { useMealTracking } from '../../hooks/useMealTracking';
import { supabase } from '../../lib/utils/supabase/client';
import { fetchEdge } from '../../lib/utils/supabase/edge';

export function DashboardAnalytics() {
  const { 
    nutritionSummary, 
    calorieProgress, 
    mealPlan,
    dailyPlan 
  } = useMealTracking();

  // ✅ Obtener targetWeight del perfil del usuario
  const [userTargetWeight, setUserTargetWeight] = useState<number>(0);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetchEdge('user-profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.profile && data.profile.targetWeight) {
            setUserTargetWeight(parseFloat(data.profile.targetWeight) || 0);
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, []);

  // Datos reales basados en el usuario actual
  const currentWeight = dailyPlan?.metrics?.weight || 0;
  const targetWeight = userTargetWeight; // ✅ Ahora viene del perfil del usuario
  const currentSteps = dailyPlan?.metrics?.steps || 0;
  const currentSleep = dailyPlan?.metrics?.sleep || 0;
  const currentEnergy = dailyPlan?.metrics?.energy || 0;
  const currentHydration = dailyPlan?.hydration?.consumed || 0;

  // ✅ Cargar historial de datos una sola vez
const historicalData: Record<string, any> = useMemo(() => {
  try {
    return JSON.parse(localStorage.getItem('nutrition_historical_data') || '{}');
  } catch (error) {
    console.error('Error cargando historial:', error);
    return {};
  }
}, []);

  // Progreso mensual - usando datos históricos reales
  const monthlyProgress = useMemo(() => {
  const months = new Map<string, { weight: number; calories: number; adherence: number; count: number }>();
  
  // Procesar datos históricos
  Object.values(historicalData).forEach((record: any) => {
    const monthKey = new Date(record.date).toLocaleDateString('es-ES', { month: 'short' });
    const entry = months.get(monthKey) || { weight: 0, calories: 0, adherence: 0, count: 0 };
    
    entry.weight += record.metrics?.weight || 0;
    entry.calories += record.caloriesConsumed;
    entry.adherence += record.completionRate || 0;
    entry.count += 1;
    
    months.set(monthKey, entry);
  });
  
  // Convertir a array con promedios
  const result = Array.from(months.entries()).map(([month, data]) => ({
    month,
    weight: Math.round(data.weight / data.count) || 0,
    calories: Math.round(data.calories / data.count) || 0,
    adherence: Math.round(data.adherence / data.count) || 0
  }));
  
  // Agregar mes actual si no existe
  const currentMonth = new Date().toLocaleDateString('es-ES', { month: 'short' });
  const hasCurrentMonth = result.some(item => item.month === currentMonth);
  
  if (!hasCurrentMonth) {
    result.push({
      month: currentMonth,
      weight: currentWeight,
      calories: nutritionSummary.totalCalories,
      adherence: Math.round(calorieProgress)
    });
  }
  
  return result.sort((a, b) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months.indexOf(a.month) - months.indexOf(b.month);
  });
}, [historicalData, currentWeight, nutritionSummary.totalCalories, calorieProgress]);

  // Métricas semanales - usando datos históricos
  const weeklyMetrics = useMemo(() => {
    const today = new Date();
    const weekDays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    
    return weekDays.map((day, index) => {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - (6 - index));
      const dateKey = targetDate.toISOString().split('T')[0];
      
      const historicalRecord = historicalData[dateKey];
      
      return {
        day,
        steps: historicalRecord?.metrics?.steps || (index === 6 ? currentSteps : 0),
        sleep: historicalRecord?.metrics?.sleep || (index === 6 ? currentSleep : 0),
        mood: historicalRecord?.metrics?.energy || (index === 6 ? currentEnergy : 0)
      };
    });
  }, [historicalData, currentSteps, currentSleep, currentEnergy]);

  // Análisis nutricional con datos reales
  const nutritionBreakdown = useMemo(() => [
    { 
      nutrient: 'Proteínas', 
      current: nutritionSummary.protein.current, 
      target: nutritionSummary.protein.target, 
      unit: 'g' 
    },
    { 
      nutrient: 'Carbohidratos', 
      current: nutritionSummary.carbs.current, 
      target: nutritionSummary.carbs.target, 
      unit: 'g' 
    },
    { 
      nutrient: 'Grasas', 
      current: nutritionSummary.fat.current, 
      target: nutritionSummary.fat.target, 
      unit: 'g' 
    },
    { 
      nutrient: 'Agua', 
      current: Math.round(currentHydration / 1000 * 10) / 10, 
      target: 2.5, 
      unit: 'L' 
    }
  ], [nutritionSummary, currentHydration]);

  // Cards de analytics con datos reales
  const analyticsCards = useMemo(() => {
    const completedMeals = mealPlan.filter(meal => meal.completed).length;
    const totalMeals = mealPlan.length;
    const adherencePercentage = totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0;
    
    // Calcular progreso de peso correcto
    const weightDifference = targetWeight - currentWeight; // Diferencia hacia el objetivo
    const isGaining = weightDifference > 0; // Necesita ganar peso
    const isLosing = weightDifference < 0; // Necesita perder peso
    const isAtTarget = Math.abs(weightDifference) < 0.5; // Está en el objetivo
    
    return [
      {
        title: 'Progreso Peso',
        value: currentWeight > 0 && targetWeight > 0 ? 
          (isAtTarget ? 
            `¡Objetivo alcanzado! ${currentWeight}kg` :
            `${Math.abs(weightDifference).toFixed(1)}kg por ${isGaining ? 'ganar' : 'perder'}`
          ) : 
          'Configura objetivo',
        change: currentWeight > 0 && targetWeight > 0 ? 
          (isAtTarget ? 
            '🎯 En objetivo' :
            `Objetivo: ${targetWeight}kg`
          ) : 
          'Registra tu peso',
        trend: isAtTarget ? 'up' : (isGaining ? 'up' : 'down'),
        icon: isAtTarget ? Target : (isGaining ? TrendingUp : TrendingDown),
        color: isAtTarget ? 'text-green-600' : (isGaining ? 'text-blue-600' : 'text-orange-600'),
        bgColor: isAtTarget ? 'bg-green-500/20' : (isGaining ? 'bg-blue-500/20' : 'bg-orange-500/20'),
        borderColor: isAtTarget ? 'border-green-500/30' : (isGaining ? 'border-blue-500/30' : 'border-orange-500/30')
      },
      {
        title: 'Adherencia Hoy',
        value: `${adherencePercentage}%`,
        change: `${completedMeals}/${totalMeals} comidas`,
        trend: adherencePercentage >= 80 ? 'up' : 'down',
        icon: Target,
        color: 'text-blue-600',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30'
      },
      {
        title: 'Nivel Energía',
        value: `${currentEnergy}/10`,
        change: currentEnergy >= 8 ? 'Excelente' : currentEnergy >= 6 ? 'Bueno' : 'Bajo',
        trend: currentEnergy >= 7 ? 'up' : 'down',
        icon: Activity,
        color: 'text-purple-600',
        bgColor: 'bg-purple-500/20',
        borderColor: 'border-purple-500/30'
      },
      {
        title: 'Progreso Calorías',
        value: `${Math.round(calorieProgress)}%`,
        change: `${nutritionSummary.totalCalories}/${nutritionSummary.targetCalories} kcal`,
        trend: calorieProgress >= 80 ? 'up' : 'down',
        icon: Heart,
        color: 'text-red-600',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30'
      }
    ];
  }, [currentWeight, mealPlan, currentEnergy, calorieProgress, nutritionSummary, targetWeight]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between md:w-1/2">
        <div>
          <h1 className="text-2xl font-bold text-green-600">Analytics Detallado</h1>
          <p className="mt-1">Análisis profundo de tu progreso nutricional</p>
          {(currentWeight === 0 || nutritionSummary.totalCalories === 0) && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                📊 <strong>Tu historial está creciendo:</strong> Los gráficos se llenarán automáticamente conforme uses la aplicación día a día.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 md:w-1/2">
          <Calendar className="w-4 h-4 text-green-600 mt-3" />
          <span className="text-sm mt-3 md:mt-0">Datos en tiempo real</span>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsCards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <Card key={index} className={`${card.bgColor} ${card.borderColor} border`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendIcon className={`w-3 h-3 mr-1 ${card.trend === 'up' ? 'text-green-400' : 'text-green-400'}`} />
                      <span className="text-xs">{card.change}</span>
                    </div>
                  </div>
                  <Icon className={`w-8 h-8 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Progreso Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyProgress}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#weightGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              Métricas Semanales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="steps" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Adherence Chart */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-600" />
            Adherencia al Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" domain={[80, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="adherence" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Nutrition Breakdown */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="w-5 h-5 mr-2 text-red-600" />
            Análisis Nutricional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nutritionBreakdown.map((item, index) => {
              const percentage = (item.current / item.target) * 100;
              const isOnTarget = percentage >= 90 && percentage <= 110;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.nutrient}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{item.current}{item.unit}</span>
                      <span className="text-sm">/ {item.target}{item.unit}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isOnTarget 
                          ? 'bg-green-500/20 text-green-400' 
                          : percentage < 90 
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isOnTarget 
                          ? 'bg-green-500' 
                          : percentage < 90 
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}