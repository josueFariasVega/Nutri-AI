import React from 'react';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { Target, Heart, Shield, Zap, Mail, MapPin } from 'lucide-react';
import { useRouter } from '../common/Router';

interface FooterProps {
  onNavigate?: (route: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { currentRoute } = useRouter();

  // Don't show footer on auth page
  if (currentRoute.includes('/auth')) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  NutriAI
                </div>
                <div className="text-xs text-gray-400">Pro Platform</div>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Transformamos tu vida con nutrición personalizada impulsada por inteligencia artificial avanzada.
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-blue-400" />
                <span>IA Activa</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-green-400" />
                <span>Seguro</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3 text-red-400" />
                <span>Efectivo</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Enlaces Rápidos</h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => onNavigate ? onNavigate('/') : window.location.href = '/'}
                className="w-full justify-start p-0 h-auto text-gray-300 hover:text-green-400 transition-colors duration-200"
              >
                Inicio
              </Button>
              <Button
                variant="ghost"
                onClick={() => onNavigate ? onNavigate('/dashboard') : window.location.href = '/dashboard'}
                className="w-full justify-start p-0 h-auto text-gray-300 hover:text-green-400 transition-colors duration-200"
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => onNavigate ? onNavigate('/profile') : window.location.href = '/profile'}
                className="w-full justify-start p-0 h-auto text-gray-300 hover:text-green-400 transition-colors duration-200"
              >
                Mi Perfil
              </Button>
              <Button
                variant="ghost"
                onClick={() => onNavigate ? onNavigate('/questionnaire') : window.location.href = '/questionnaire'}
                className="w-full justify-start p-0 h-auto text-gray-300 hover:text-green-400 transition-colors duration-200"
              >
                Actualizar Plan
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Características</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-green-400" />
                <span>Planes Personalizados</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <span>IA Avanzada</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span>Seguimiento en Tiempo Real</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Datos Seguros</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Contacto</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-green-400" />
                <span>soporte@nutriai.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <span>Madrid, España</span>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-xs text-gray-400 leading-relaxed">
                Disponible 24/7 para ayudarte en tu viaje nutricional.
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-400">
            © {currentYear} NutriAI Pro Platform. Todos los derechos reservados.
          </div>
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <Button
              variant="ghost"
              className="p-0 h-auto text-gray-400 hover:text-green-400 transition-colors duration-200"
            >
              Términos de Servicio
            </Button>
            <Button
              variant="ghost"
              className="p-0 h-auto text-gray-400 hover:text-green-400 transition-colors duration-200"
            >
              Política de Privacidad
            </Button>
            <Button
              variant="ghost"
              className="p-0 h-auto text-gray-400 hover:text-green-400 transition-colors duration-200"
            >
              Cookies
            </Button>
          </div>
        </div>

        {/* AI Status Indicator */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Sistema IA Operativo</span>
            </div>
            <span className="text-xs text-gray-500">•</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Análisis en Tiempo Real</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}