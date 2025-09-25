import React from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  CheckCircle,
  Target,
  TrendingUp,
  Users,
  ArrowRight,
  Play,
  Zap,
  Brain,
  Shield,
  Sparkles,
} from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { logger } from "../../lib/utils/logger";

"use client";
import { SparklesCore } from "../../components/ui/sparkles";

interface LandingPageProps {
  onNavigate: (page: string) => void;
  hasCompletedQuestionnaire?: boolean | null | undefined;
}

export function LandingPage({ onNavigate, hasCompletedQuestionnaire }: LandingPageProps) {
  logger.log('🎨 LandingPage rendered with hasCompletedQuestionnaire:', hasCompletedQuestionnaire);
  
  return (
    <div className="min-h-screen">
      {/* Header */}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-24 overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-emerald-300 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-teal-200 rounded-full opacity-25 animate-pulse"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex items-center space-x-3">
                {hasCompletedQuestionnaire ? (
                  <>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-4 py-2">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Plan IA Activo
                    </Badge>
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-2">
                      <Target className="w-4 h-4 mr-2" />
                      Dashboard Listo
                    </Badge>
                  </>
                ) : (
                  <>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-4 py-2">
                      <Sparkles className="w-4 h-4 mr-2" />
                      IA de Última Generación
                    </Badge>
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-2">
                      <Zap className="w-4 h-4 mr-2" />
                      100% Personalizado
                    </Badge>
                  </>
                )}
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                {hasCompletedQuestionnaire ? (
                  <>
                    Tu{" "}
                    <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Dashboard
                    </span>
                    <br />
                    Nutricional
                    <br />
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                      Te Espera
                    </span>
                  </>
                ) : (
                  <>
                    Tu{" "}
                    <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Revolución
                    </span>
                    <br />
                    Nutricional
                    <br />
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                      Comienza Aquí
                    </span>
                  </>
                )}
              </h1>

              <p className="text-2xl text-gray-700 leading-relaxed">
                <strong>NutriAI</strong> combina inteligencia
                artificial avanzada con ciencia nutricional para
                crear el plan alimenticio perfecto que se adapta
                a tu ADN metabólico único.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white text-lg px-10 py-7 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  onClick={() => {
                    if (hasCompletedQuestionnaire) {
                      logger.log("Hero: Ir al Dashboard clicked - navigating to /dashboard");
                      onNavigate("/dashboard");
                    } else {
                      logger.log("Hero: Descubrir Mi Plan IA clicked - navigating to /questionnaire");
                      onNavigate("/questionnaire");
                    }
                  }}
                >
                  <Brain className="mr-3 w-6 h-6" />
                  {hasCompletedQuestionnaire ? "Ir a Mi Dashboard" : "Descubrir Mi Plan IA"}
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-green-600 text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-lg px-10 py-7 hover:shadow-lg transition-all duration-300"
                  onClick={() => {
                    logger.log(
                      "LandingPage: Demo Interactivo clicked",
                    );
                    alert(
                      "Demo interactivo próximamente disponible. ¡Regístrate para ser el primero en probarlo!",
                    );
                  }}
                >
                  <Play className="mr-3 w-6 h-6" />
                  Demo Interactivo
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    99.3%
                  </div>
                  <div className="text-sm text-gray-600">
                    Precisión IA
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    &lt; 5min
                  </div>
                  <div className="text-sm text-gray-600">
                    Plan Completo
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    24/7
                  </div>
                  <div className="text-sm text-gray-600">
                    Optimización
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Floating Cards Animation */}
              <div className="absolute -top-4 -left-4 bg-white rounded-xl p-4 shadow-lg transform rotate-12 animate-pulse">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    Plan Generado
                  </span>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl p-4 shadow-lg transform -rotate-12 animate-bounce">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    IA Activa
                  </span>
                </div>
              </div>

              <div className="relative bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-3xl transform rotate-3 p-1 shadow-2xl">
                <div className="bg-white rounded-3xl p-3">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1638328740227-1c4b1627614d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwbnV0cml0aW9uJTIwY29sb3JmdWwlMjB2ZWdldGFibGVzfGVufDF8fHx8MTc1NzM4MTM3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Nutrición saludable y colorida"
                    className="w-full h-96 object-cover rounded-3xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 animate-pulse"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-6 py-3">
              <Brain className="w-5 h-5 mr-2" />
              Tecnología de Vanguardia
            </Badge>
            <h2 className="text-5xl font-bold text-white mb-6">
              El Poder de la{" "}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Inteligencia Artificial
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Nuestro motor de IA procesa más de 10,000
              variables nutricionales para crear tu plan
              perfecto en tiempo real
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-3xl p-1">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwZGF0YSUyMHZpc3VhbGl6YXRpb258ZW58MXx8fHwxNzU3MzgxMzc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Visualización de datos de IA"
                  className="w-full h-80 object-cover rounded-3xl"
                />
              </div>

              {/* Floating Stats */}
              <div className="absolute -top-6 -right-6 bg-white rounded-xl p-4 shadow-xl animate-bounce">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    98.7%
                  </div>
                  <div className="text-xs text-gray-600">
                    Precisión
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl animate-pulse">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    &lt; 3s
                  </div>
                  <div className="text-xs text-gray-600">
                    Respuesta
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Análisis Profundo
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Procesamos tu perfil metabólico,
                    preferencias alimentarias, alergias y
                    objetivos usando algoritmos de machine
                    learning avanzados.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-3">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Optimización Continua
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Tu plan se ajusta automáticamente basado en
                    tu progreso real, adherencia y cambios en tu
                    estilo de vida.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Ciencia Validada
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Basado en más de 50,000 estudios
                    nutricionales y validado por nutricionistas
                    certificados y especialistas en IA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              <span className="text-green-600">3 Pasos</span>{" "}
              Hacia tu Transformación
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un proceso simple pero poderoso que combina la
              última tecnología con la ciencia nutricional más
              avanzada
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="relative text-center p-10 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105 bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                1
              </div>
              <CardContent>
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Análisis Inteligente
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Nuestro cuestionario adaptativo utiliza IA
                  para entender tu metabolismo, preferencias y
                  objetivos únicos.
                </p>
                <Badge className="bg-green-500 text-white px-4 py-2">
                  &lt; 5 minutos
                </Badge>
              </CardContent>
            </Card>

            <Card className="relative text-center p-10 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                2
              </div>
              <CardContent>
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Generación Instantánea
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  La IA procesa tu información y crea un plan
                  nutricional completo con recetas, horarios y
                  lista de compras.
                </p>
                <Badge className="bg-blue-500 text-white px-4 py-2">
                  Tiempo real
                </Badge>
              </CardContent>
            </Card>

            <Card className="relative text-center p-10 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                3
              </div>
              <CardContent>
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Evolución Continua
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Tu plan se adapta automáticamente basado en tu
                  progreso, garantizando resultados óptimos y
                  sostenibles.
                </p>
                <Badge className="bg-purple-500 text-white px-4 py-2">
                  24/7 activo
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 px-6 py-3">
              <Sparkles className="w-5 h-5 mr-2" />
              Ventajas Revolucionarias
            </Badge>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              ¿Por Qué{" "}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                NutriAI
              </span>{" "}
              es Diferente?
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              La convergencia perfecta entre inteligencia
              artificial, ciencia nutricional y experiencia
              personalizada
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105 border border-green-100">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Personalización 360°
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Más de 10,000 parámetros analizados: genética,
                metabolismo, preferencias, alergias, horarios y
                objetivos únicos.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105 border border-blue-100">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Ciencia Validada
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Algoritmos respaldados por 50,000+ estudios
                científicos y validados por nutricionistas
                certificados internacionalmente.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105 border border-purple-100">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Evolución Inteligente
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Dashboard predictivo con métricas avanzadas que
                anticipa y optimiza tu progreso antes de que lo
                notes.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105 border border-orange-100">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Adaptabilidad Total
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Tu plan evoluciona contigo: vacaciones, estrés,
                cambios de rutina - la IA se adapta
                automáticamente en tiempo real.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-20 bg-white rounded-3xl p-12 shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  10,000+
                </div>
                <div className="text-gray-600">
                  Variables Analizadas
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  99.3%
                </div>
                <div className="text-gray-600">
                  Precisión IA
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  &lt; 3s
                </div>
                <div className="text-gray-600">
                  Tiempo Respuesta
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  24/7
                </div>
                <div className="text-gray-600">
                  Optimización Activa
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Innovation Showcase */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-green-500/5 to-blue-500/5"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-6 py-3">
              <Sparkles className="w-5 h-5 mr-2" />
              Innovación Constante
            </Badge>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              El Futuro de la{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Nutrición
              </span>{" "}
              es Hoy
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Tecnologías emergentes que están redefiniendo cómo
              entendemos y optimizamos la nutrición
              personalizada
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-100">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Machine Learning Avanzado
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Algoritmos que aprenden de tu comportamiento
                  alimentario y predicen qué ajustes necesitas
                  antes de que los necesites.
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Análisis Predictivo
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Modelos predictivos que anticipan plateaus,
                  deficiencias nutricionales y oportunidades de
                  optimización metabólica.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 border border-blue-100">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Optimización en Tiempo Real
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Ajustes instantáneos basados en tu actividad
                  diaria, sueño, estrés y hasta el clima para
                  maximizar tu energía y bienestar.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-blue-400/20 rounded-3xl p-1 shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1713428856240-100df77350bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwaGVhbHRoJTIwYXBwfGVufDF8fHx8MTc1NzM4MTM3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Tecnología moderna de salud"
                  className="w-full h-96 object-cover rounded-3xl"
                />
              </div>

              {/* Floating Innovation Cards */}
              <div className="absolute -top-6 -left-6 bg-white rounded-xl p-4 shadow-xl transform rotate-12 animate-pulse">
                <div className="text-center">
                  <div className="text-sm font-bold text-purple-600">
                    IA v3.0
                  </div>
                  <div className="text-xs text-gray-600">
                    Próximamente
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl p-4 shadow-xl transform -rotate-12 animate-bounce">
                <div className="text-center">
                  <div className="text-sm font-bold text-green-600">
                    API Neural
                  </div>
                  <div className="text-xs text-gray-600">
                    Activa
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-40 h-40 bg-green-500/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-emerald-500/10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500/5 rounded-full animate-pulse"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <div className="mb-8">
            <Badge className="bg-gradient-to-r from-green-400 to-emerald-400 text-gray-900 border-0 px-6 py-3 text-lg">
              <Sparkles className="w-5 h-5 mr-2" />
              Tu Transformación Comienza Ahora
            </Badge>
          </div>

          <h2 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
            El Momento es{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              AHORA
            </span>
          </h2>

          <p className="text-2xl text-gray-200 mb-12 leading-relaxed max-w-4xl mx-auto">
            No esperes más para descubrir el poder de la
            nutrición personalizada.
            <br />
            <strong className="text-green-300">
              Tu cuerpo único merece un plan único.
            </strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white text-xl px-12 py-8 shadow-2xl hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-300"
              onClick={() => {
                if (hasCompletedQuestionnaire) {
                  logger.log("CTA: Acceder a Mi Dashboard clicked - navigating to /dashboard");
                  onNavigate("/dashboard");
                } else {
                  logger.log("CTA: Iniciar Mi Revolución Nutricional clicked - navigating to /questionnaire");
                  onNavigate("/questionnaire");
                }
              }}
            >
              <Brain className="mr-3 w-7 h-7" />
              {hasCompletedQuestionnaire ? "Acceder a Mi Dashboard" : "Iniciar Mi Revolución Nutricional"}
              <ArrowRight className="ml-3 w-7 h-7" />
            </Button>

            <div className="text-center">
              <div className="text-green-300 font-bold text-lg">
                100% GRATIS
              </div>
              <div className="text-gray-400 text-sm">
                Sin tarjeta de crédito
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-green-400 mb-2">
                &lt; 5min
              </div>
              <div className="text-white text-lg">
                Tu plan listo
              </div>
              <div className="text-gray-300 text-sm">
                Más rápido que hacer café
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                0€
              </div>
              <div className="text-white text-lg">
                Costo inicial
              </div>
              <div className="text-gray-300 text-sm">
                Sin letra pequeña
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-teal-400 mb-2">
                ∞
              </div>
              <div className="text-white text-lg">
                Posibilidades
              </div>
              <div className="text-gray-300 text-sm">
                Tu potencial es ilimitado
              </div>
            </div>
          </div>

          <p className="text-green-200 text-lg mt-12 opacity-80">
            ✨ Únete a la revolución nutricional del futuro • IA
            personalizada • Resultados garantizados
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              NutriAI
            </span>
          </div>
          <div className="text-center">
            <p className="mb-4">
              © 2025 NutriAI. Transformando vidas a través de
              la nutrición personalizada.
            </p>
            <p className="text-sm">
              Nutrición basada en ciencia • IA avanzada •
              Resultados garantizados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}