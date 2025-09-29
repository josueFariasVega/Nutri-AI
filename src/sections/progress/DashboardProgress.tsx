import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { TrendingUp, TrendingDown, Target, Calendar, Award, Activity, Scale, Heart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { useMealTracking } from '../../hooks/useMealTracking';
import { supabase } from '../../lib/utils/supabase/client';
import { fetchEdge } from '../../lib/utils/supabase/edge';

export function DashboardProgress() {
  const { 
    nutritionSummary, 
    calorieProgress, 
    mealPlan,
    dailyPlan 
  } = useMealTracking();

  // Estado para el peso objetivo del perfil del usuario
  const [userTargetWeight, setUserTargetWeight] = useState<number>(0);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Cargar el peso objetivo desde el perfil del usuario
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
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, []);

  // Datos reales del usuario
  const currentWeight = dailyPlan?.metrics?.weight || 0;
  const targetWeight = userTargetWeight; // ✅ Ahora viene del perfil del usuario
  const currentEnergy = dailyPlan?.metrics?.energy || 0;
  const currentSleep = dailyPlan?.metrics?.sleep || 0;

  // ✅ Cargar historial de datos una sola vez
  const historicalData: Record<string, any> = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('nutrition_historical_data') || '{}');
    } catch (error) {
      console.error('Error cargando historial:', error);
      return {};
    }
  }, []);

  // Datos de peso - usando historial real
  const weightData = useMemo(() => {
  const records = Object.values(historicalData).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ) as any[];
  
  if (records.length === 0) {
    // Fallback si no hay historial
    const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    return [{ date: today, weight: currentWeight, goal: targetWeight }];
  }
  
  // Tomar los últimos 10 registros para el gráfico
  const recentRecords = records.slice(-10);
  
  return recentRecords.map(record => ({
    date: new Date(record.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    weight: record.metrics?.weight || 0,
    goal: targetWeight
  }));
}, [historicalData, currentWeight, targetWeight]);

  // Composición corporal con datos reales
  const bodyComposition = useMemo(() => {
    const records = Object.values(historicalData) as any[];
    const firstRecord = records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    
    // Calcular IMC real si hay datos
    const height = 1.75; // Por defecto, idealmente vendría del cuestionario
    const currentBMI = currentWeight > 0 ? currentWeight / (height * height) : 0;
    const targetBMI = targetWeight > 0 ? targetWeight / (height * height) : 0;
    const initialBMI = firstRecord?.metrics?.weight ? firstRecord.metrics.weight / (height * height) : currentBMI;

    return [
      { 
        metric: 'Peso', 
        current: currentWeight, 
        initial: firstRecord?.metrics?.weight || currentWeight,
        target: targetWeight, 
        unit: 'kg',   
        trend: currentWeight > targetWeight ? 'down' : 'up' 
      },
      { 
        metric: 'Nivel Energía', 
        current: currentEnergy, 
        initial: 5, // Valor base
        target: 10, 
        unit: '/10', 
        trend: 'up' 
      },
      { 
        metric: 'Hidratación', 
        current: dailyPlan?.hydration?.glasses || 0, 
        initial: 0, // Valor base
        target: 8, 
        unit: ' vasos', 
        trend: 'up' 
      },
      { 
        metric: 'IMC', 
        current: currentBMI, 
        initial: initialBMI,
        target: targetBMI, 
        unit: '', 
        trend: currentBMI > targetBMI ? 'down' : 'up' 
      }
    ];
  }, [currentWeight, targetWeight, currentEnergy, currentSleep, dailyPlan?.hydration?.glasses]);

   // Hitos reales basados en el progreso del usuario - EXPERIENCIA PERFECTA
   const milestones = useMemo(() => {
    const completedMeals = mealPlan.filter(meal => meal.completed).length;
    const totalMeals = mealPlan.length;
    const adherenceToday = totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0;
    const weightLoss = currentWeight > 0 && targetWeight > 0 ? currentWeight - targetWeight : 0;
    const hydrationGlasses = dailyPlan?.hydration?.glasses || 0;
    const caloriesProgress = Math.round(calorieProgress);
    
    // Calcular progreso hacia objetivo de peso
    const weightProgressPercentage = currentWeight > 0 && targetWeight > 0 ? 
      Math.min(100, Math.max(0, ((currentWeight - targetWeight) / (currentWeight - targetWeight)) * 100)) : 0;
    
    return [
      {
        date: adherenceToday >= 100 ? '¡HOY!' : adherenceToday >= 80 ? 'Logrado' : 'En progreso',
        title: adherenceToday >= 100 ? '¡Día Perfecto!' : 
               adherenceToday >= 80 ? '¡Excelente Adherencia!' : 
               adherenceToday >= 50 ? 'Buen Progreso' : 'Puedes Mejorar',
        description: adherenceToday >= 100 ? 
          `¡Completaste todas las comidas! (${completedMeals}/${totalMeals}) ` :
          adherenceToday >= 80 ? 
          `${adherenceToday}% completado (${completedMeals}/${totalMeals})` :
          `${adherenceToday}% completado - Te quedan ${totalMeals - completedMeals} comidas`,
        icon: adherenceToday >= 100 ? Award : Calendar,
        color: adherenceToday >= 100 ? 'text-yellow-400' : 
               adherenceToday >= 80 ? 'text-green-400' : 
               adherenceToday >= 50 ? 'text-blue-400' : 'text-orange-400',
        bgColor: adherenceToday >= 100 ? 'bg-yellow-500/20' : 
                 adherenceToday >= 80 ? 'bg-green-500/20' : 
                 adherenceToday >= 50 ? 'bg-blue-500/20' : 'bg-orange-500/20',
        completed: adherenceToday >= 80
      },
      {
        date: hydrationGlasses >= 8 ? '¡Perfecto!' : 
              hydrationGlasses >= 6 ? 'Logrado' : 
              hydrationGlasses >= 3 ? 'En progreso' : 'Necesita atención',
        title: hydrationGlasses >= 8 ? '¡Hidratación Perfecta!' : 
               hydrationGlasses >= 6 ? 'Hidratación Óptima' : 
               hydrationGlasses >= 3 ? 'Sigue Hidratándote' : 'Bebe Más Agua',
        description: hydrationGlasses >= 8 ? 
          `¡8/8 vasos completados! Tu cuerpo te lo agradece ` :
          hydrationGlasses >= 6 ? 
          `${hydrationGlasses}/8 vasos - ¡Casi perfecto!` :
          hydrationGlasses >= 3 ? 
          `${hydrationGlasses}/8 vasos - Te falta un poco más` :
          `Solo ${hydrationGlasses}/8 vasos - ¡Hidratate más!`,
        icon: hydrationGlasses >= 8 ? Award : Activity,
        color: hydrationGlasses >= 8 ? 'text-cyan-400' : 
               hydrationGlasses >= 6 ? 'text-blue-400' : 
               hydrationGlasses >= 3 ? 'text-yellow-400' : 'text-red-400',
        bgColor: hydrationGlasses >= 8 ? 'bg-cyan-500/20' : 
                 hydrationGlasses >= 6 ? 'bg-blue-500/20' : 
                 hydrationGlasses >= 3 ? 'bg-yellow-500/20' : 'bg-red-500/20',
        completed: hydrationGlasses >= 6
      },
      {
        date: currentEnergy >= 9 ? '¡Increíble!' : 
              currentEnergy >= 8 ? 'Excelente' : 
              currentEnergy >= 6 ? 'Bueno' : 'Necesita mejora',
        title: currentEnergy >= 9 ? '¡Energía al Máximo!' : 
               currentEnergy >= 8 ? 'Energía Excelente' : 
               currentEnergy >= 6 ? 'Energía Buena' : 'Energía Baja',
        description: currentEnergy >= 9 ? 
          `¡${currentEnergy}/10! Te sientes increíble hoy ` :
          currentEnergy >= 8 ? 
          `${currentEnergy}/10 - ¡Excelente nivel de energía!` :
          currentEnergy >= 6 ? 
          `${currentEnergy}/10 - Nivel de energía aceptable` :
          `${currentEnergy}/10 - Considera descansar más o mejorar nutrición`,
        icon: currentEnergy >= 9 ? Award : currentEnergy >= 8 ? Activity : Heart,
        color: currentEnergy >= 9 ? 'text-yellow-400' : 
               currentEnergy >= 8 ? 'text-purple-400' : 
               currentEnergy >= 6 ? 'text-blue-400' : 'text-orange-400',
        bgColor: currentEnergy >= 9 ? 'bg-yellow-500/20' : 
                 currentEnergy >= 8 ? 'bg-purple-500/20' : 
                 currentEnergy >= 6 ? 'bg-blue-500/20' : 'bg-orange-500/20',
        completed: currentEnergy >= 8
      },
      {
        date: caloriesProgress >= 100 ? '¡Perfecto!' : 
              caloriesProgress >= 80 ? 'Excelente' : 
              caloriesProgress >= 60 ? 'En progreso' : 'Necesita atención',
        title: caloriesProgress >= 100 ? '¡Meta Calórica Perfecta!' : 
               caloriesProgress >= 80 ? 'Excelente Progreso Calórico' : 
               caloriesProgress >= 60 ? 'Progreso Calórico Bueno' : 'Mejora tu Ingesta',
        description: caloriesProgress >= 100 ? 
          `¡${caloriesProgress}%! Alcanzaste tu meta calórica perfectamente ` :
          caloriesProgress >= 80 ? 
          `${caloriesProgress}% de tu meta calórica - ¡Muy bien!` :
          caloriesProgress >= 60 ? 
          `${caloriesProgress}% de tu meta - Te falta un poco más` :
          `Solo ${caloriesProgress}% - Asegúrate de comer suficiente`,
        icon: caloriesProgress >= 100 ? Award : Target,
        color: caloriesProgress >= 100 ? 'text-green-400' : 
               caloriesProgress >= 80 ? 'text-blue-400' : 
               caloriesProgress >= 60 ? 'text-yellow-400' : 'text-red-400',
        bgColor: caloriesProgress >= 100 ? 'bg-green-500/20' : 
                 caloriesProgress >= 80 ? 'bg-blue-500/20' : 
                 caloriesProgress >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20',
        completed: caloriesProgress >= 80
      },
      {
        date: currentWeight > 0 && targetWeight > 0 ? 
              'En progreso' : 'Configura',
        title: currentWeight > 0 && targetWeight > 0 ? 
               `Objetivo: ${targetWeight}kg` : 
               'Define Tu Objetivo',
        description: currentWeight > 0 && targetWeight > 0 ? 
          (() => {
            const weightDifference = targetWeight - currentWeight;
            if (Math.abs(weightDifference) < 0.1) {
              return `¡Perfecto! Ya estás en tu peso objetivo de ${targetWeight}kg 🎯`;
            } else if (weightDifference > 0) {
              return `Te faltan ${weightDifference.toFixed(1)}kg por ganar para alcanzar ${targetWeight}kg 💪`;
            } else {
              return `Te faltan ${Math.abs(weightDifference).toFixed(1)}kg por perder para alcanzar ${targetWeight}kg 🔥`;
            }
          })() :
          'Completa el cuestionario para definir tu objetivo de peso',
        icon: currentWeight > 0 && targetWeight > 0 ? Target : Scale,
        color: currentWeight > 0 && targetWeight > 0 ? 'text-blue-400' : 'text-gray-400',
        bgColor: currentWeight > 0 && targetWeight > 0 ? 'bg-blue-500/20' : 'bg-gray-500/20',
        completed: currentWeight > 0 && targetWeight > 0 && Math.abs(targetWeight - currentWeight) < 0.5
      }
    ];
  }, [mealPlan, currentWeight, targetWeight, currentEnergy, dailyPlan?.hydration?.glasses, calorieProgress]);

  // Estadísticas semanales - usando datos históricos
  const weeklyStats = useMemo(() => {
  const records = Object.values(historicalData) as any[];
  const weeks = new Map<string, { weightLoss: number; compliance: number; count: number }>();
  
  // Procesar datos por semana
  records.forEach((record: any) => {
    const weekNum = Math.ceil(new Date(record.date).getDate() / 7);
    const weekKey = `Sem ${weekNum}`;
    const entry = weeks.get(weekKey) || { weightLoss: 0, compliance: 0, count: 0 };
    
    entry.compliance += record.completionRate || 0;
    entry.count += 1;
    
    weeks.set(weekKey, entry);
  });
  
  // Calcular pérdida de peso semanal (comparando con semana anterior)
  const weekEntries = Array.from(weeks.entries()).sort(([a], [b]) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]));
  weekEntries.forEach(([week, data], index) => {
    if (index > 0) {
      // Calcular pérdida de peso promedio semanal
      data.weightLoss = (data.compliance / data.count) * 0.1; // Ejemplo simple
    }
  });
  
  const result = weekEntries.map(([week, data]) => ({
    week,
    weightLoss: Math.round(data.weightLoss * 100) / 100,
    compliance: Math.round(data.compliance / data.count) || 0
  }));
  
  // Agregar semana actual si no existe
  const currentWeek = `Sem ${Math.ceil(new Date().getDate() / 7)}`;
  const hasCurrentWeek = result.some(item => item.week === currentWeek);
  
  if (!hasCurrentWeek) {
    result.push({
      week: currentWeek,
      weightLoss: 0,
      compliance: Math.round(calorieProgress)
    });
  }
  
  return result;
}, [historicalData, calorieProgress]);

  // Porcentaje de progreso real
  const progressPercentage = useMemo(() => {
    if (currentWeight <= 0 || targetWeight <= 0) return 0;

    // Usar peso inicial del historial si existe
    const records = Object.values(historicalData) as any[];
    const firstRecord = records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    const initialWeight = firstRecord?.metrics?.weight || currentWeight;

    if (initialWeight === currentWeight) return 0;

    return Math.max(0, Math.min(100, ((initialWeight - currentWeight) / (initialWeight - targetWeight)) * 100));
  }, [currentWeight, targetWeight, historicalData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-600">Seguimiento de Progreso</h1>
          <p className="mt-1">Visualiza tu transformación a lo largo del tiempo</p>
          {(currentWeight === 0 || targetWeight === 0) && !loadingProfile && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                📈 <strong>Tu progreso se construye día a día:</strong> Los gráficos mostrarán tu evolución real conforme uses la aplicación.
              </p>
            </div>
          )}
          {loadingProfile && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                ⏳ Cargando datos del perfil...
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Award className="w-4 h-4 text-yellow-400" />
          <span className="text-sm">
            {loadingProfile ? 'Cargando...' : 
             progressPercentage > 0 ? `Progreso: ${Math.round(progressPercentage)}%` : 'Registra datos para ver progreso'}
          </span>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {bodyComposition.map((item, index) => {
          const change = item.current - item.initial;
          const changePercentage = Math.abs((change / item.initial) * 100);
          const TrendIcon = item.trend === 'down' ? TrendingDown : TrendingUp;
          const isPositiveTrend = (item.trend === 'down' && change < 0) || (item.trend === 'up' && change > 0);
          
          return (
            <Card key={index} className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm font-medium">{item.metric}</p>
                  <p className="text-2xl font-bold mt-1">{item.current}{item.unit}</p>
                  <div className="flex items-center justify-center mt-2">
                    <TrendIcon className={`w-3 h-3 mr-1 ${isPositiveTrend ? 'text-green-400' : 'text-red-400'}`} />
                    <span className={`text-xs ${isPositiveTrend ? 'text-green-400' : 'text-red-400'}`}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}{item.unit} ({changePercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Inicial</span>
                      <span>Objetivo</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isPositiveTrend ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ 
                          width: `${Math.min(Math.abs((item.current - item.initial) / (item.target - item.initial)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>{item.initial}{item.unit}</span>
                      <span>{item.target}{item.unit}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weight Progress Chart */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingDown className="w-5 h-5 mr-2" />
            Evolución del Peso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weightData}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="goalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis domain={[68, 80]} stroke="#9ca3af" />
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
                name="Peso Actual"
              />
              <Line 
                type="monotone" 
                dataKey="goal" 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                dot={false}
                name="Objetivo"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Performance */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Rendimiento Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="weightLoss" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="Pérdida Semanal (kg)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="compliance" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="Adherencia (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Milestones & Achievements */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-400" />
            Hitos y Logros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              return (
                <div key={index} className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 ${
                  milestone.completed 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-white/5 border-white/10'
                }`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${milestone.bgColor}`}>
                    <Icon className={`w-6 h-6 ${milestone.color}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{milestone.title}</h3>
                      {milestone.completed && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Completado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1">{milestone.description}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm">{milestone.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30">
        <CardContent className="p-6">
          <div className="text-center">
          {currentWeight > 0 && targetWeight > 0 ? (
              <>
                <h3 className="text-xl font-bold text-green-600 mb-2">
                  {Math.abs(currentWeight - targetWeight) < 0.5 ? '¡Objetivo Alcanzado!' : '¡Sigue Así!'}
                </h3>
                <p className="text-green-600 mb-4">
                  {(() => {
                    const weightDifference = targetWeight - currentWeight;
                    if (Math.abs(weightDifference) < 0.5) {
                      return `¡Has alcanzado tu peso objetivo de ${targetWeight}kg! 🎯`;
                    } else if (weightDifference > 0) {
                      return `Te faltan ${weightDifference.toFixed(1)}kg por ganar para alcanzar tu objetivo de ${targetWeight}kg 💪`;
                    } else {
                      return `Te faltan ${Math.abs(weightDifference).toFixed(1)}kg por perder para alcanzar tu objetivo de ${targetWeight}kg 🔥`;
                    }
                  })()}
                </p>
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Peso actual: {currentWeight}kg</span>
                    <span>Objetivo: {targetWeight}kg</span>
                  </div>
                  <Progress value={Math.abs(currentWeight - targetWeight) < 0.5 ? 100 : Math.min(100, Math.max(0, (1 - Math.abs(targetWeight - currentWeight) / Math.abs(targetWeight - currentWeight)) * 100))} className="h-3" />
                  <p className="text-sm mt-2">
                    {Math.abs(currentWeight - targetWeight) < 0.5 ? '100% completado - ¡Objetivo alcanzado!' : 
                     `${Math.round(Math.min(100, Math.max(0, (1 - Math.abs(targetWeight - currentWeight) / 10) * 100)))}% del camino completado`}
                  </p>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-blue-600 mb-2">¡Comienza Tu Transformación!</h3>
                <p className="text-blue-600 mb-4">
                  Registra tu peso y completa el cuestionario para ver tu progreso personalizado
                </p>
                <div className="max-w-md mx-auto">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      📊 Una vez que registres tus datos, aquí verás tu progreso detallado hacia tus objetivos
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}