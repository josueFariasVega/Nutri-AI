/**
 * @fileoverview Internal Navigation - Navegación interna dinámica para cada sección
 * @description Barra de navegación que cambia según la sección principal activa
 * @author Nutrition Platform Team
 * @version 1.0.0
 */

import React from 'react';
import { Button } from '../../components/ui/button';
import { 
  LayoutDashboard, 
  PieChart, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  GitCompare,
  Utensils,
  ChefHat,
  Activity,
  Pill,
  Scale,
  Ruler,
  Camera,
  Award,
  Target,
  CheckCircle,
  Plus,
  Dumbbell,
  Calendar,
  Bell,
  BellRing,
  Settings
} from 'lucide-react';
import { cn } from '../../lib/utils/index';

/**
 * Mapeo de iconos por nombre de string
 */
const iconMap = {
  LayoutDashboard,
  PieChart,
  Zap,
  BarChart3,
  TrendingUp,
  GitCompare,
  Utensils,
  ChefHat,
  Activity,
  Pill,
  Scale,
  Ruler,
  Camera,
  Award,
  Target,
  CheckCircle,
  Plus,
  Dumbbell,
  Calendar,
  Bell,
  BellRing,
  Settings
};

/**
 * Interfaz para elementos de navegación interna
 */
interface NavigationItem {
  id: string;
  label: string;
  icon: string;
}

/**
 * Props para el componente InternalNavigation
 */
interface InternalNavigationProps {
  /** ID de la sección actual */
  sectionId: string;
  /** Elementos de navegación para la sección actual */
  navigationItems: NavigationItem[];
  /** Subsección activa actual */
  activeSubsection: string;
  /** Función para cambiar de subsección */
  onSubsectionChange: (subsection: string) => void;
}

/**
 * Mapeo de títulos de sección
 */
const sectionTitles: Record<string, string> = {
  overview: 'Resumen General',
  analytics: 'Análisis y Métricas',
  nutrition: 'Nutrición',
  progress: 'Progreso',
  goals: 'Objetivos',
  workouts: 'Ejercicios',
  notifications: 'Notificaciones'
};

/**
 * Componente de navegación interna dinámica
 * @component InternalNavigation
 * @param {InternalNavigationProps} props - Props del componente
 * @returns {JSX.Element} Barra de navegación interna
 */
export function InternalNavigation({
  sectionId,
  navigationItems,
  activeSubsection,
  onSubsectionChange
}: InternalNavigationProps) {
  
  /**
   * Obtiene el componente de icono por nombre
   * @param iconName - Nombre del icono
   * @returns Componente de icono
   */
  const getIcon = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || LayoutDashboard;
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30 py-2">
      <div className="px-4 lg:px-6">
        {/* Título de la Sección y Navegación Interna en una sola fila */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Título de la Sección */}
          <div className="flex-shrink-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              {sectionTitles[sectionId] || 'Dashboard'}
            </h1>
          </div>

          {/* Navegación Interna - Responsiva */}
          {navigationItems.length > 0 && (
            <nav className="flex space-x-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent sm:overflow-x-visible">
              {navigationItems.map((item) => {
                const Icon = getIcon(item.icon);
                const isActive = activeSubsection === item.id;

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => onSubsectionChange(item.id)}
                    className={cn(
                      "flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-all duration-200 whitespace-nowrap min-w-fit text-xs sm:text-sm",
                      isActive
                        ? "bg-green-50 text-green-700 border border-green-200 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <Icon className={cn(
                      "w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0",
                      isActive ? "text-green-600" : "text-gray-500"
                    )} />
                    <span className="font-medium hidden xs:inline sm:inline">{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
