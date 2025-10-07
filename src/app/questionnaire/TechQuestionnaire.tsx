import React, { useState } from 'react';
import { supabase } from '../../lib/utils/supabase/client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Checkbox } from '../../components/ui/checkbox';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Target, 
  Utensils, 
  AlertTriangle, 
  Clock, 
  ChefHat,
  Brain,
  Zap,
  Activity,
  Shield,
  CheckCircle2,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchEdge } from '../../lib/utils/supabase/edge';

interface TechQuestionnaireProps {
  user: any;
  onNavigate: (page: string) => void;
  refreshQuestionnaireStatus?: () => Promise<void>;
}

export function TechQuestionnaire({ user, onNavigate, refreshQuestionnaireStatus }: TechQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState({
    personal: {
      age: '',
      gender: '',
      height: '',
      weight: '',
      targetWeight: '',
      activityLevel: '',
      goal: ''
    },
    preferences: {
      dietType: '',
      favoriteFood: [],
      dislikedFood: [],
      culturalRestrictions: ''
    },
    restrictions: {
      allergies: [],
      intolerances: [],
      medications: ''
    },
    lifestyle: {
      mealTimes: '',
      cookingFrequency: '',
      budget: '',
      prepTime: '',
      eatingOut: ''
    },
    experience: {
      previousDiets: '',
      whatWorked: '',
      whatDidntWork: '',
      cookingLevel: ''
    }
  });

  const totalSteps = 5;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const stepConfig = [
    {
      id: 'personal',
      title: 'Perfil Biométrico',
      subtitle: 'Datos fundamentales para tu análisis IA',
      icon: User,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      id: 'preferences',
      title: 'Preferencias Alimentarias',
      subtitle: 'Personalización de sabores y cultura',
      icon: Utensils,
      color: 'from-blue-500 to-purple-500',
      bgColor: 'from-blue-50 to-purple-50'
    },
    {
      id: 'restrictions',
      title: 'Restricciones Médicas',
      subtitle: 'Seguridad y consideraciones de salud',
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50'
    },
    {
      id: 'lifestyle',
      title: 'Estilo de Vida',
      subtitle: 'Adaptación a tu rutina diaria',
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50'
    },
    {
      id: 'experience',
      title: 'Experiencia Previa',
      subtitle: 'Optimización basada en historial',
      icon: TrendingUp,
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'from-teal-50 to-cyan-50'
    }
  ];

  const currentStepConfig = stepConfig[currentStep];

  const updateAnswer = (section: string, field: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateArrayAnswer = (section: string, field: string, value: string, checked: boolean) => {
    setAnswers(prev => {
      const currentArray = prev[section][field] || [];
      if (checked) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: [...currentArray, value]
          }
        };
      } else {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: currentArray.filter(item => item !== value)
          }
        };
      }
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No hay sesión activa');
        return;
      }

      const response = await fetchEdge('questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(answers)
      });

      if (response.ok) {
        const result = await response.json();
        //toast.success('¡Plan nutricional IA generado exitosamente!');
        if (refreshQuestionnaireStatus) {
          await refreshQuestionnaireStatus();
          toast.success('¡Tu plan está listo! Preparando tu dashboard...');
          // Esperar un momento para que el estado se actualice
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        onNavigate('/dashboard');
      } else {
        const error = await response.text();
        toast.error('Error al generar el plan: ' + error);
      }
    } catch (error) {
      console.error('Questionnaire submission error:', error);
      toast.error('Error inesperado al enviar el cuestionario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPersonalStep = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className={`bg-gradient-to-br ${currentStepConfig.bgColor} rounded-2xl p-6 border border-green-100`}>
        <div className="flex items-center space-x-4 mb-4">
          <div className={`bg-gradient-to-r ${currentStepConfig.color} p-3 rounded-xl shadow-lg`}>
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Análisis Biométrico IA</h3>
            <p className="text-gray-600">Datos esenciales para calcular tu metabolismo basal</p>
          </div>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-green-600" />
            Edad (años)
          </Label>
          <Input
            type="number"
            placeholder="25"
            value={answers.personal.age}
            onChange={(e) => updateAnswer('personal', 'age', e.target.value)}
            className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-green-500 focus:ring-green-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <User className="w-4 h-4 mr-2 text-green-600" />
            Género
          </Label>
          <Select value={answers.personal.gender} onValueChange={(value) => updateAnswer('personal', 'gender', value)}>
            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-green-500">
              <SelectValue placeholder="Selecciona tu género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="femenino">Femenino</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
            Altura (cm)
          </Label>
          <Input
            type="number"
            placeholder="170"
            value={answers.personal.height}
            onChange={(e) => updateAnswer('personal', 'height', e.target.value)}
            className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-blue-600" />
            Peso Actual (kg)
          </Label>
          <Input
            type="number"
            placeholder="70"
            value={answers.personal.weight}
            onChange={(e) => updateAnswer('personal', 'weight', e.target.value)}
            className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Target className="w-4 h-4 mr-2 text-purple-600" />
            Peso Objetivo (kg)
          </Label>
          <Input
            type="number"
            placeholder="65"
            value={answers.personal.targetWeight}
            onChange={(e) => updateAnswer('personal', 'targetWeight', e.target.value)}
            className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-purple-600" />
            Objetivo Principal
          </Label>
          <Select value={answers.personal.goal} onValueChange={(value) => updateAnswer('personal', 'goal', value)}>
            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-purple-500">
              <SelectValue placeholder="¿Cuál es tu meta?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="perder_peso">🔥 Perder peso</SelectItem>
              <SelectItem value="ganar_peso">💪 Ganar peso</SelectItem>
              <SelectItem value="mantener_peso">⚖️ Mantener peso</SelectItem>
              <SelectItem value="ganar_musculo">🏋️ Ganar músculo</SelectItem>
              <SelectItem value="mejorar_salud">❤️ Mejorar salud general</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activity Level */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-orange-600" />
          Nivel de Actividad Física
        </Label>
        <RadioGroup 
          value={answers.personal.activityLevel} 
          onValueChange={(value) => updateAnswer('personal', 'activityLevel', value)}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {[
            { value: 'sedentario', label: 'Sedentario', desc: 'Poco o nada de ejercicio', emoji: '🪑' },
            { value: 'ligero', label: 'Ligero', desc: '1-3 días por semana', emoji: '🚶‍♂️' },
            { value: 'moderado', label: 'Moderado', desc: '3-5 días por semana', emoji: '🏃‍♂️' },
            { value: 'activo', label: 'Activo', desc: '6-7 días por semana', emoji: '🏋️‍♂️' },
            { value: 'muy_activo', label: 'Muy Activo', desc: 'Ejercicio intenso diario', emoji: '💪' },
            { value: 'extremo', label: 'Extremo', desc: 'Trabajo físico + ejercicio', emoji: '🔥' }
          ].map((option) => (
            <div key={option.value} className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer">
              <RadioGroupItem value={option.value} id={option.value} />
              <label htmlFor={option.value} className="flex-1 cursor-pointer">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xl">{option.emoji}</span>
                  <span className="font-medium text-gray-900">{option.label}</span>
                </div>
                <p className="text-xs text-gray-600">{option.desc}</p>
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="space-y-8">
      <div className={`bg-gradient-to-br ${currentStepConfig.bgColor} rounded-2xl p-6 border border-blue-100`}>
        <div className="flex items-center space-x-4 mb-4">
          <div className={`bg-gradient-to-r ${currentStepConfig.color} p-3 rounded-xl shadow-lg`}>
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Preferencias Alimentarias</h3>
            <p className="text-gray-600">Personaliza tu plan según tus gustos</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <ChefHat className="w-4 h-4 mr-2 text-blue-600" />
            Tipo de Dieta Preferida
          </Label>
          <RadioGroup 
            value={answers.preferences.dietType} 
            onValueChange={(value) => updateAnswer('preferences', 'dietType', value)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {[
              { value: 'omnivora', label: 'Omnívora', desc: 'Todo tipo de alimentos', emoji: '🍽️' },
              { value: 'vegetariana', label: 'Vegetariana', desc: 'Sin carne ni pescado', emoji: '🥗' },
              { value: 'vegana', label: 'Vegana', desc: 'Solo alimentos vegetales', emoji: '🌱' },
              { value: 'mediterranea', label: 'Mediterránea', desc: 'Estilo mediterráneo', emoji: '🫒' },
              { value: 'keto', label: 'Ketogénica', desc: 'Baja en carbohidratos', emoji: '🥑' },
              { value: 'paleo', label: 'Paleo', desc: 'Alimentos no procesados', emoji: '🥩' }
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                <RadioGroupItem value={option.value} id={option.value} />
                <label htmlFor={option.value} className="flex-1 cursor-pointer">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xl">{option.emoji}</span>
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{option.desc}</p>
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">
            Restricciones Culturales o Religiosas
          </Label>
          <Textarea
            placeholder="Ej: Halal, Kosher, sin carne de res, etc."
            value={answers.preferences.culturalRestrictions}
            onChange={(e) => updateAnswer('preferences', 'culturalRestrictions', e.target.value)}
            className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-blue-500 min-h-[100px]"
          />
        </div>
      </div>
    </div>
  );

  const renderRestrictionsStep = () => (
    <div className="space-y-8">
      <div className={`bg-gradient-to-br ${currentStepConfig.bgColor} rounded-2xl p-6 border border-orange-100`}>
        <div className="flex items-center space-x-4 mb-4">
          <div className={`bg-gradient-to-r ${currentStepConfig.color} p-3 rounded-xl shadow-lg`}>
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Restricciones Médicas y Alergias</h3>
            <p className="text-gray-600">Información crítica para tu seguridad alimentaria</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-orange-600" />
            Alergias Alimentarias
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Frutos secos', 'Mariscos', 'Huevos', 'Lácteos', 'Gluten', 'Soja',
              'Pescado', 'Cacahuetes', 'Semillas de sésamo', 'Sulfitos'
            ].map((allergy) => (
              <div key={allergy} className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer">
                <Checkbox
                  id={allergy}
                  checked={answers.restrictions.allergies.includes(allergy)}
                  onCheckedChange={(checked) => updateArrayAnswer('restrictions', 'allergies', allergy, checked)}
                />
                <label htmlFor={allergy} className="text-sm font-medium text-gray-700 cursor-pointer">
                  {allergy}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
            Intolerancias
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Lactosa', 'Gluten', 'Fructosa', 'Histamina', 'Cafeína', 'Alcohol'
            ].map((intolerance) => (
              <div key={intolerance} className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer">
                <Checkbox
                  id={intolerance}
                  checked={answers.restrictions.intolerances.includes(intolerance)}
                  onCheckedChange={(checked) => updateArrayAnswer('restrictions', 'intolerances', intolerance, checked)}
                />
                <label htmlFor={intolerance} className="text-sm font-medium text-gray-700 cursor-pointer">
                  {intolerance}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">
            Medicamentos y Suplementos
          </Label>
          <Textarea
            placeholder="Lista cualquier medicamento, suplemento o condición médica que debamos considerar..."
            value={answers.restrictions.medications}
            onChange={(e) => updateAnswer('restrictions', 'medications', e.target.value)}
            className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-orange-500 min-h-[120px]"
          />
        </div>
      </div>
    </div>
  );

  const renderLifestyleStep = () => (
    <div className="space-y-8">
      <div className={`bg-gradient-to-br ${currentStepConfig.bgColor} rounded-2xl p-6 border border-purple-100`}>
        <div className="flex items-center space-x-4 mb-4">
          <div className={`bg-gradient-to-r ${currentStepConfig.color} p-3 rounded-xl shadow-lg`}>
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Estilo de Vida y Rutina</h3>
            <p className="text-gray-600">Adaptamos el plan a tu día a día</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-purple-600" />
            Horarios de Comida Preferidos
          </Label>
          <Select value={answers.lifestyle.mealTimes} onValueChange={(value) => updateAnswer('lifestyle', 'mealTimes', value)}>
            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-purple-500">
              <SelectValue placeholder="Selecciona horario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="temprano">🌅 Temprano (6-7 AM, 12-1 PM, 6-7 PM)</SelectItem>
              <SelectItem value="normal">☀️ Normal (7-8 AM, 1-2 PM, 7-8 PM)</SelectItem>
              <SelectItem value="tardio">🌙 Tardío (8-9 AM, 2-3 PM, 8-9 PM)</SelectItem>
              <SelectItem value="flexible">🔄 Flexible (Horarios variables)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <ChefHat className="w-4 h-4 mr-2 text-purple-600" />
            Frecuencia de Cocinar
          </Label>
          <Select value={answers.lifestyle.cookingFrequency} onValueChange={(value) => updateAnswer('lifestyle', 'cookingFrequency', value)}>
            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-purple-500">
              <SelectValue placeholder="¿Cuánto cocinas?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">👨‍🍳 Diario (Me encanta cocinar)</SelectItem>
              <SelectItem value="frecuente">🍳 Frecuente (4-5 veces por semana)</SelectItem>
              <SelectItem value="ocasional">🥘 Ocasional (2-3 veces por semana)</SelectItem>
              <SelectItem value="raro">🛒 Rara vez (Prefiero comida preparada)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Target className="w-4 h-4 mr-2 text-purple-600" />
            Presupuesto Semanal (Comida)
          </Label>
          <Select value={answers.lifestyle.budget} onValueChange={(value) => updateAnswer('lifestyle', 'budget', value)}>
            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-purple-500">
              <SelectValue placeholder="Rango de presupuesto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bajo">💰 Bajo ($30-50 USD)</SelectItem>
              <SelectItem value="medio">💳 Medio ($50-80 USD)</SelectItem>
              <SelectItem value="alto">💎 Alto ($80-120 USD)</SelectItem>
              <SelectItem value="premium">🌟 Premium ($120+ USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-purple-600" />
            Tiempo de Preparación
          </Label>
          <Select value={answers.lifestyle.prepTime} onValueChange={(value) => updateAnswer('lifestyle', 'prepTime', value)}>
            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-purple-500">
              <SelectValue placeholder="Tiempo disponible" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rapido">⚡ Rápido (10-15 min)</SelectItem>
              <SelectItem value="moderado">⏰ Moderado (15-30 min)</SelectItem>
              <SelectItem value="relajado">🧘‍♂️ Relajado (30-45 min)</SelectItem>
              <SelectItem value="gourmet">👨‍🍳 Gourmet (45+ min)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700 flex items-center">
          <Utensils className="w-4 h-4 mr-2 text-purple-600" />
          Frecuencia de Comer Fuera
        </Label>
        <RadioGroup 
          value={answers.lifestyle.eatingOut} 
          onValueChange={(value) => updateAnswer('lifestyle', 'eatingOut', value)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {[
            { value: 'nunca', label: 'Nunca', desc: 'Siempre cocino en casa', emoji: '🏠' },
            { value: 'raro', label: 'Rara vez', desc: '1-2 veces al mes', emoji: '📅' },
            { value: 'ocasional', label: 'Ocasional', desc: '1-2 veces por semana', emoji: '🍽️' },
            { value: 'frecuente', label: 'Frecuente', desc: '3-4 veces por semana', emoji: '🍕' },
            { value: 'muy_frecuente', label: 'Muy Frecuente', desc: 'Casi todos los días', emoji: '🛵' }
          ].map((option) => (
            <div key={option.value} className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer">
              <RadioGroupItem value={option.value} id={option.value} />
              <label htmlFor={option.value} className="flex-1 cursor-pointer">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xl">{option.emoji}</span>
                  <span className="font-medium text-gray-900">{option.label}</span>
                </div>
                <p className="text-xs text-gray-600">{option.desc}</p>
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );

  const renderExperienceStep = () => (
    <div className="space-y-8">
      <div className={`bg-gradient-to-br ${currentStepConfig.bgColor} rounded-2xl p-6 border border-teal-100`}>
        <div className="flex items-center space-x-4 mb-4">
          <div className={`bg-gradient-to-r ${currentStepConfig.color} p-3 rounded-xl shadow-lg`}>
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Experiencia y Objetivos</h3>
            <p className="text-gray-600">Aprendemos de tu historial para optimizar resultados</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">
            ¿Has seguido dietas anteriormente?
          </Label>
          <Textarea
            placeholder="Cuéntanos sobre tus experiencias previas con dietas, planes nutricionales o cambios de alimentación..."
            value={answers.experience.previousDiets}
            onChange={(e) => updateAnswer('experience', 'previousDiets', e.target.value)}
            className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-teal-500 min-h-[100px]"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">
            ¿Qué estrategias han funcionado para ti?
          </Label>
          <Textarea
            placeholder="Describe qué tipos de alimentos, horarios o enfoques te han dado mejores resultados..."
            value={answers.experience.whatWorked}
            onChange={(e) => updateAnswer('experience', 'whatWorked', e.target.value)}
            className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-teal-500 min-h-[100px]"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">
            ¿Qué dificultades has enfrentado?
          </Label>
          <Textarea
            placeholder="Comparte los retos o problemas que has tenido con planes anteriores para que podamos evitarlos..."
            value={answers.experience.whatDidntWork}
            onChange={(e) => updateAnswer('experience', 'whatDidntWork', e.target.value)}
            className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-teal-500 min-h-[100px]"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <ChefHat className="w-4 h-4 mr-2 text-teal-600" />
            Nivel de Experiencia Culinaria
          </Label>
          <RadioGroup 
            value={answers.experience.cookingLevel} 
            onValueChange={(value) => updateAnswer('experience', 'cookingLevel', value)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {[
              { value: 'principiante', label: 'Principiante', desc: 'Conceptos básicos, recetas simples', emoji: '🥚' },
              { value: 'intermedio', label: 'Intermedio', desc: 'Cómodo con varias técnicas', emoji: '👨‍🍳' },
              { value: 'avanzado', label: 'Avanzado', desc: 'Experiencia amplia, técnicas complejas', emoji: '🔥' },
              { value: 'experto', label: 'Experto/Chef', desc: 'Profesional o muy experimentado', emoji: '⭐' }
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer">
                <RadioGroupItem value={option.value} id={option.value} />
                <label htmlFor={option.value} className="flex-1 cursor-pointer">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xl">{option.emoji}</span>
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{option.desc}</p>
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalStep();
      case 1:
        return renderPreferencesStep();
      case 2:
        return renderRestrictionsStep();
      case 3:
        return renderLifestyleStep();
      case 4:
        return renderExperienceStep();
      default:
        return <div>Paso en desarrollo...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-emerald-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-green-700 to-emerald-600 bg-clip-text text-transparent">
              Cuestionario Inteligente
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Nuestro sistema de IA analizará tus respuestas para crear un plan nutricional 100% personalizado
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Paso {currentStep + 1} de {totalSteps}
            </span>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              {Math.round(progress)}% completo
            </Badge>
          </div>
          <Progress value={progress} className="h-3 bg-gray-200" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {stepConfig.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center space-y-2">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                    ${isActive 
                      ? `bg-gradient-to-r ${step.color} text-white shadow-lg scale-110` 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-gray-900 mb-2">
                  {currentStepConfig.title}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {currentStepConfig.subtitle}
                </CardDescription>
              </div>
              <div className={`bg-gradient-to-r ${currentStepConfig.color} p-3 rounded-xl shadow-lg`}>
                <currentStepConfig.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentStep === totalSteps - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Generando Plan IA...
                </div>
              ) : (
                <div className="flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  Generar Plan IA
                  <Sparkles className="w-4 h-4 ml-2" />
                </div>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}