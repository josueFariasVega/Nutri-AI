import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Target, Plus, Calendar, TrendingUp, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

export function DashboardGoals() {
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: 'Alcanzar 70kg',
      description: 'Perder peso de forma saludable y sostenible',
      category: 'Peso',
      target: 70,
      current: 75.2,
      unit: 'kg',
      deadline: '2024-12-31',
      priority: 'high',
      status: 'active',
      progress: 61
    },
    {
      id: 2,
      title: 'Caminar 10,000 pasos diarios',
      description: 'Mantener un estilo de vida activo',
      category: 'Actividad',
      target: 10000,
      current: 8500,
      unit: 'pasos',
      deadline: '2024-12-31',
      priority: 'medium',
      status: 'active',
      progress: 85
    },
    {
      id: 3,
      title: 'Beber 2.5L de agua diarios',
      description: 'Mejorar hidratación y salud general',
      category: 'Hidratación',
      target: 2.5,
      current: 2.1,
      unit: 'L',
      deadline: '2024-12-31',
      priority: 'medium',
      status: 'active',
      progress: 84
    },
    {
      id: 4,
      title: 'Reducir grasa corporal a 15%',
      description: 'Mejorar composición corporal',
      category: 'Composición',
      target: 15,
      current: 18.5,
      unit: '%',
      deadline: '2024-12-31',
      priority: 'high',
      status: 'active',
      progress: 45
    },
    {
      id: 5,
      title: 'Completar 30 días sin azúcar añadido',
      description: 'Eliminar azúcares procesados de la dieta',
      category: 'Nutrición',
      target: 30,
      current: 12,
      unit: 'días',
      deadline: '2024-08-15',
      priority: 'high',
      status: 'active',
      progress: 40
    },
    {
      id: 6,
      title: 'Dormir 8 horas diarias',
      description: 'Establecer un patrón de sueño saludable',
      category: 'Bienestar',
      target: 8,
      current: 7.2,
      unit: 'horas',
      deadline: '2024-12-31',
      priority: 'medium',
      status: 'completed',
      progress: 100
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: '',
    target: '',
    unit: '',
    deadline: '',
    priority: 'medium'
  });

  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Peso': return 'text-blue-400';
      case 'Actividad': return 'text-green-400';
      case 'Hidratación': return 'text-cyan-400';
      case 'Composición': return 'text-purple-400';
      case 'Nutrición': return 'text-orange-400';
      case 'Bienestar': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  const handleCreateGoal = () => {
    const goal = {
      id: goals.length + 1,
      ...newGoal,
      target: parseFloat(newGoal.target),
      current: 0,
      status: 'active',
      progress: 0
    };
    setGoals([...goals, goal]);
    setNewGoal({
      title: '',
      description: '',
      category: '',
      target: '',
      unit: '',
      deadline: '',
      priority: 'medium'
    });
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Objetivos Personales</h1>
          <p className="text-gray-400 mt-1">Define y rastrea tus metas de salud y nutrición</p>
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Objetivo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Objetivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="Ej: Perder 5kg en 3 meses"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label>Descripción</Label>
                <Input
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="Describe tu objetivo"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoría</Label>
                  <Select value={newGoal.category} onValueChange={(value) => setNewGoal({...newGoal, category: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="Peso">Peso</SelectItem>
                      <SelectItem value="Actividad">Actividad</SelectItem>
                      <SelectItem value="Hidratación">Hidratación</SelectItem>
                      <SelectItem value="Composición">Composición</SelectItem>
                      <SelectItem value="Nutrición">Nutrición</SelectItem>
                      <SelectItem value="Bienestar">Bienestar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Prioridad</Label>
                  <Select value={newGoal.priority} onValueChange={(value) => setNewGoal({...newGoal, priority: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Meta</Label>
                  <Input
                    type="number"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                    placeholder="70"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label>Unidad</Label>
                  <Input
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                    placeholder="kg, pasos, L, etc."
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label>Fecha límite</Label>
                <Input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleCreateGoal} className="flex-1 bg-green-500 hover:bg-green-600">
                  Crear Objetivo
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{activeGoals.length}</p>
            <p className="text-blue-400 text-sm">Objetivos Activos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{completedGoals.length}</p>
            <p className="text-green-400 text-sm">Completados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {Math.round(activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length)}%
            </p>
            <p className="text-purple-400 text-sm">Progreso Promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-400" />
            Objetivos Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-white font-medium">{goal.title}</h3>
                      <Badge className={getPriorityColor(goal.priority)}>
                        {goal.priority === 'high' ? 'Alta' : goal.priority === 'medium' ? 'Media' : 'Baja'}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{goal.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`${getCategoryColor(goal.category)}`}>{goal.category}</span>
                      <span className="text-gray-400">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(goal.deadline).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">
                      Progreso: {goal.current} / {goal.target} {goal.unit}
                    </span>
                    <span className="text-white font-medium">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
              Objetivos Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedGoals.map((goal) => (
                <div key={goal.id} className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-white font-medium">{goal.title}</h3>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Completado
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm">{goal.description}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}