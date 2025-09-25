import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Activity, Clock, Flame, Heart, Play, CheckCircle, Plus, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';

export function DashboardWorkouts() {
  const todayWorkout = {
    name: 'Rutina de Cardio y Fuerza',
    duration: 45,
    calories: 320,
    exercises: [
      { name: 'Calentamiento', duration: 5, completed: true },
      { name: 'Burpees', sets: '3x10', completed: true },
      { name: 'Sentadillas', sets: '3x15', completed: true },
      { name: 'Flexiones', sets: '3x12', completed: false },
      { name: 'Mountain Climbers', duration: '3x30seg', completed: false },
      { name: 'Estiramientos', duration: 5, completed: false }
    ]
  };

  const weeklyStats = [
    { day: 'Lun', completed: true, duration: 30, calories: 240 },
    { day: 'Mar', completed: true, duration: 45, calories: 320 },
    { day: 'Mié', completed: false, duration: 0, calories: 0 },
    { day: 'Jue', completed: true, duration: 35, calories: 280 },
    { day: 'Vie', completed: true, duration: 40, calories: 300 },
    { day: 'Sáb', completed: false, duration: 0, calories: 0 },
    { day: 'Dom', completed: false, duration: 25, calories: 180 }
  ];

  const workoutPlans = [
    {
      id: 1,
      name: 'Cardio Intenso',
      duration: 30,
      difficulty: 'Alto',
      calories: 400,
      type: 'Cardio',
      description: 'Rutina de alta intensidad para quemar grasa',
      exercises: ['HIIT', 'Burpees', 'Jump Squats', 'Mountain Climbers']
    },
    {
      id: 2,
      name: 'Fuerza y Tonificación',
      duration: 45,
      difficulty: 'Medio',
      calories: 300,
      type: 'Fuerza',
      description: 'Ejercicios para fortalecer y tonificar músculos',
      exercises: ['Flexiones', 'Sentadillas', 'Planchas', 'Zancadas']
    },
    {
      id: 3,
      name: 'Yoga Relajante',
      duration: 25,
      difficulty: 'Bajo',
      calories: 150,
      type: 'Flexibilidad',
      description: 'Sesión de yoga para relajación y flexibilidad',
      exercises: ['Saludos al Sol', 'Posturas de Equilibrio', 'Respiración', 'Meditación']
    },
    {
      id: 4,
      name: 'Entrenamiento Funcional',
      duration: 35,
      difficulty: 'Medio',
      calories: 280,
      type: 'Funcional',
      description: 'Movimientos que mejoran la funcionalidad diaria',
      exercises: ['Deadlifts', 'Thrusters', 'Kettlebell Swings', 'Box Steps']
    }
  ];

  const monthlyProgress = {
    workoutsCompleted: 18,
    workoutsPlanned: 24,
    totalCalories: 4320,
    totalDuration: 540,
    averageIntensity: 7.5
  };

  const completedExercises = todayWorkout.exercises.filter(ex => ex.completed).length;
  const totalExercises = todayWorkout.exercises.length;
  const workoutProgress = (completedExercises / totalExercises) * 100;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Alto': return 'bg-red-500/20 text-red-400';
      case 'Medio': return 'bg-yellow-500/20 text-yellow-400';
      case 'Bajo': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Cardio': return 'text-red-400';
      case 'Fuerza': return 'text-blue-400';
      case 'Flexibilidad': return 'text-green-400';
      case 'Funcional': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ejercicios y Actividad</h1>
          <p className="text-gray-400 mt-1">Mantente activo con rutinas personalizadas</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Rutina
        </Button>
      </div>

      {/* Monthly Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Entrenamientos</p>
                <p className="text-2xl font-bold text-white">{monthlyProgress.workoutsCompleted}</p>
                <p className="text-xs text-purple-300">/ {monthlyProgress.workoutsPlanned} este mes</p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm font-medium">Calorías Quemadas</p>
                <p className="text-2xl font-bold text-white">{monthlyProgress.totalCalories.toLocaleString()}</p>
                <p className="text-xs text-red-300">este mes</p>
              </div>
              <Flame className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Tiempo Total</p>
                <p className="text-2xl font-bold text-white">{Math.round(monthlyProgress.totalDuration / 60)}h</p>
                <p className="text-xs text-blue-300">{monthlyProgress.totalDuration % 60}m este mes</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Intensidad Media</p>
                <p className="text-2xl font-bold text-white">{monthlyProgress.averageIntensity}/10</p>
                <p className="text-xs text-green-300">nivel promedio</p>
              </div>
              <Heart className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Play className="w-5 h-5 mr-2 text-green-400" />
              Entrenamiento de Hoy
            </div>
            <Badge className="bg-blue-500/20 text-blue-400">
              {completedExercises}/{totalExercises} completados
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-white">{todayWorkout.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {todayWorkout.duration} min
                </span>
                <span className="flex items-center">
                  <Flame className="w-4 h-4 mr-1" />
                  ~{todayWorkout.calories} kcal
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Progreso del entrenamiento</span>
                <span>{Math.round(workoutProgress)}%</span>
              </div>
              <Progress value={workoutProgress} className="h-2" />
            </div>
          </div>

          <div className="space-y-3">
            {todayWorkout.exercises.map((exercise, index) => (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                exercise.completed 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    exercise.completed ? 'bg-green-500' : 'bg-gray-600'
                  }`}>
                    {exercise.completed ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-white text-sm">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{exercise.name}</p>
                    <p className="text-gray-400 text-sm">
                      {exercise.sets || `${exercise.duration} min`}
                    </p>
                  </div>
                </div>
                
                {!exercise.completed && (
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                    Marcar
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex space-x-3">
            <Button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
              <Play className="w-4 h-4 mr-2" />
              Continuar Entrenamiento
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Pausar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Activity */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
            Actividad Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weeklyStats.map((day, index) => (
              <div key={index} className="text-center">
                <p className="text-gray-400 text-xs mb-2">{day.day}</p>
                <div className={`w-full h-20 rounded-lg flex flex-col justify-end p-2 transition-all duration-200 ${
                  day.completed 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-gray-700/50 border border-gray-600'
                }`}>
                  {day.completed ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                      <p className="text-xs text-green-400 mt-1">{day.duration}min</p>
                    </>
                  ) : day.duration > 0 ? (
                    <>
                      <Clock className="w-4 h-4 text-gray-400 mx-auto" />
                      <p className="text-xs text-gray-400 mt-1">{day.duration}min</p>
                    </>
                  ) : (
                    <div className="w-4 h-4 bg-gray-600 rounded-full mx-auto"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workout Plans */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-400" />
            Planes de Entrenamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workoutPlans.map((plan) => (
              <div key={plan.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-white font-medium">{plan.name}</h3>
                      <Badge className={getDifficultyColor(plan.difficulty)}>
                        {plan.difficulty}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{plan.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={getTypeColor(plan.type)}>{plan.type}</span>
                      <span className="text-gray-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {plan.duration} min
                      </span>
                      <span className="text-gray-400">
                        <Flame className="w-3 h-3 inline mr-1" />
                        ~{plan.calories} kcal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2">Ejercicios incluidos:</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.exercises.map((exercise, i) => (
                      <Badge key={i} className="bg-gray-700 text-gray-300 text-xs">
                        {exercise}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Entrenamiento
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}