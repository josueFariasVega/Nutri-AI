import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { InternalNavigation } from './InternalNavigation';
import { DashboardOverview } from '../../sections/overview/DashboardOverview';
import { DashboardAnalytics } from '../../sections/analytics/DashboardAnalytics';
import { DashboardNutrition } from '../../sections/nutrition/DashboardNutrition';
import { DashboardProgress } from '../../sections/progress/DashboardProgress';
import { DashboardGoals } from '../../sections/goals/DashboardGoals';
import { DashboardWorkouts } from '../../sections/workouts/DashboardWorkouts';
import { DashboardNotifications } from '../../sections/notifications/DashboardNotifications';
import {
  LayoutDashboard,
  BarChart3,
  Apple,
  TrendingUp,
  Target,
  Dumbbell,
  Bell,
  Settings,
  LogOut,
  User,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils/index';

interface DashboardLayoutProps {
  user: any;
  onSignOut: () => void;
  onNavigate: (route: string) => void;
}

// Configuración de navegación interna para cada sección
const sectionNavigationConfig = {
  overview: [
    { id: 'dashboard', label: 'Panel Principal', icon: 'LayoutDashboard' },
    { id: 'quick-actions', label: 'Acciones Rápidas', icon: 'Zap' }
  ],
  analytics: [
    { id: 'reports', label: 'Reportes', icon: 'BarChart3' },
  ],
  nutrition: [
    { id: 'meal-plan', label: 'Plan de Comidas', icon: 'Utensils' },
    { id: 'recipes', label: 'Recetas', icon: 'ChefHat' },
    { id: 'preferences', label: 'Preferencias', icon: 'Settings' },
  ],
  progress: [
    { id: 'weight', label: 'Peso', icon: 'Scale' },
  ],
  goals: [
    { id: 'current', label: 'Objetivos Actuales', icon: 'Target' },
    { id: 'completed', label: 'Completados', icon: 'CheckCircle' },
  ],
  workouts: [
    { id: 'routines', label: 'Rutinas', icon: 'Dumbbell' },
    { id: 'exercises', label: 'Ejercicios', icon: 'Activity' },
    { id: 'calendar', label: 'Calendario', icon: 'Calendar' },
    { id: 'progress', label: 'Progreso', icon: 'TrendingUp' }
  ],
  notifications: [
  ]
};

export function DashboardLayout({ user, onSignOut, onNavigate }: DashboardLayoutProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Estado persistente para subsecciones de cada sección
  const [sectionSubsections, setSectionSubsections] = useState<Record<string, string>>({
    overview: 'dashboard',
    analytics: 'reports',
    nutrition: 'meal-plan',
    progress: 'weight',
    goals: 'current',
    workouts: 'routines',
    notifications: 'all'
  });

  // Hook para detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

  const handleSubsectionChange = useCallback((subsection: string) => {
    setSectionSubsections(prev => ({
      ...prev,
      [activeSection]: subsection
    }));
  }, [activeSection]);

  const getCurrentSubsection = () => {
    return sectionSubsections[activeSection] || sectionNavigationConfig[activeSection as keyof typeof sectionNavigationConfig]?.[0]?.id || '';
  };

  const getUserInitials = () => {
    if (!user?.user_metadata?.name && !user?.email) return 'U';

    const name = user.user_metadata?.name || user.email;
    return name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserName = () => {
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario';
  };

  const navigationItems = [
    {
      id: 'overview',
      label: 'Panel Principal',
      icon: LayoutDashboard,
      description: 'Información general'
    },
    {
      id: 'analytics',
      label: 'Análisis',
      icon: BarChart3,
      description: 'Estadísticas y reportes'
    },
    {
      id: 'nutrition',
      label: 'Nutrición',
      icon: Apple,
      description: 'Plan de comidas y recetas'
    },
    {
      id: 'progress',
      label: 'Progreso',
      icon: TrendingUp,
      description: 'Seguimiento de peso y medidas'
    },/*
    {
      id: 'goals',
      label: 'Objetivos',
      icon: Target,
      description: 'Objetivos actuales y completados'
    },/*
    {
      id: 'workouts',
      label: 'Entrenamientos',
      icon: Dumbbell,
      description: 'Rutinas y ejercicios'
    },*/
    {
      id: 'notifications',
      label: 'Notificaciones',
      icon: Bell,
      description: 'Notificaciones y alertas'
    },
  ];

  const renderContent = () => {
    const currentSubsection = getCurrentSubsection();

    switch (activeSection) {
      case 'overview':
        return <DashboardOverview user={user} activeSubsection={currentSubsection} />;
      case 'analytics':
        return <DashboardAnalytics activeSubsection={currentSubsection} />;
        case 'nutrition':
          return <DashboardNutrition activeSubsection={currentSubsection} />;
      case 'progress':
        return <DashboardProgress activeSubsection={currentSubsection} />;
      case 'goals':
        return <DashboardGoals activeSubsection={currentSubsection} />;
      case 'workouts':
        return <DashboardWorkouts activeSubsection={currentSubsection} />;
      case 'notifications':
        return <DashboardNotifications activeSubsection={currentSubsection} />;
      default:
        return <DashboardOverview user={user} activeSubsection="dashboard" />;
    }
  };

  return (
    <div className="flex bg-gray-50 h-screen overflow-hidden">
      {/* Sidebar Desktop - Solo pantallas grandes */}
      {isDesktop && (
        <aside className="w-64 bg-gradient-to-b from-green-50 to-emerald-50/50 border-r border-green-200/50 flex flex-col flex-shrink-0 h-full shadow-xl backdrop-blur-sm">
          {/* Header */}
          <div className="p-6 border-b border-green-200/30 flex flex-col items-center space-y-4 flex-shrink-0 bg-white/50 backdrop-blur-sm">
            <Button
              variant="ghost"
              onClick={() => onNavigate ? onNavigate('/') : window.location.href = '/'}
              className="flex items-center space-x-3 hover:bg-white/80 rounded-2xl p-3 "
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                <Apple className="w-6 h-6 text-white drop-shadow-sm " />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text">NutriAI</span>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-green-300/50 scrollbar-track-transparent">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    "w-full justify-start h-14 px-4 text-left transition-all duration-300 rounded-2xl group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transform scale-105"
                      : "hover:bg-white/80 hover:shadow-md hover:scale-102 text-gray-700"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-2xl blur-xl"></div>
                  )}
                  <div className="relative flex items-center w-full">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-all duration-300",
                      isActive 
                        ? "bg-white/20 backdrop-blur-sm shadow-inner" 
                        : "bg-green-100/50 group-hover:bg-green-200/50"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5 transition-all duration-300",
                        isActive ? "text-white drop-shadow-sm" : "text-green-600 group-hover:text-green-700"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "font-semibold text-sm transition-all duration-300",
                        isActive ? "text-white" : "text-gray-800 group-hover:text-gray-900"
                      )}>
                        {item.label}
                      </div>
                      <div className={cn(
                        "text-xs mt-0.5 transition-all duration-300",
                        isActive ? "text-green-100" : "text-gray-500 group-hover:text-gray-600"
                      )}>
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-white/80 drop-shadow-sm animate-pulse" />
                    )}
                  </div>
                </Button>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-green-200/30 space-y-3 flex-shrink-0 bg-white/30 backdrop-blur-sm">
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
              <Avatar className="w-12 h-12 ring-2 ring-green-200/50 shadow-lg">
                <AvatarImage
                  src={user?.user_metadata?.avatar_url}
                  alt={getUserName()}
                />
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-sm shadow-inner">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-gray-800">
                  {getUserName()}
                </p>
                <p className="text-xs truncate text-gray-500">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <Button
                variant="ghost"
                onClick={() => onNavigate('/profile')}
                className="w-full justify-start hover:bg-white/60 rounded-xl h-10 text-gray-700 hover:text-green-700 transition-all duration-300 hover:scale-102"
              >
                <User className="w-4 h-4 mr-3" />
                <span className="font-medium">Perfil</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => onNavigate('/settings')}
                className="w-full justify-start hover:bg-white/60 rounded-xl h-10 text-gray-700 hover:text-green-700 transition-all duration-300 hover:scale-102"
              >
                <Settings className="w-4 h-4 mr-3" />
                <span className="font-medium">Configuración</span>
              </Button>

              <Button
                variant="ghost"
                onClick={onSignOut}
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl h-10 transition-all duration-300 hover:scale-102"
              >
                <LogOut className="w-4 h-4 mr-3" />
                <span className="font-medium">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navegación Interna - Visible en todas las pantallas */}
        <div className="flex-shrink-0">
          <InternalNavigation
            sectionId={activeSection}
            navigationItems={sectionNavigationConfig[activeSection as keyof typeof sectionNavigationConfig] || []}
            activeSubsection={getCurrentSubsection()}
            onSubsectionChange={handleSubsectionChange}
          />
        </div>

        {/* Contenido de la Sección con Scroll Independiente */}
        <div className="flex-1 overflow-y-auto">
          <div className={cn(
            "p-6",
            isDesktop ? "pb-6" : "pb-24"
          )}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Mobile - SOLO móviles */}
      {!isDesktop && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-2xl z-50">
          <div className="flex justify-around items-center py-3 px-2">
            {navigationItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 h-16 min-w-0 flex-1 rounded-2xl transition-all duration-300 transform",
                    isActive 
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg scale-105" 
                      : "text-gray-500 hover:text-green-600 hover:bg-green-50/50 hover:scale-105"
                  )}
                >
                  <div className={cn(
                    "relative mb-1 transition-all duration-300",
                    isActive ? "transform -translate-y-0.5" : ""
                  )}>
                    <Icon className={cn(
                      "w-6 h-6 transition-all duration-300",
                      isActive ? "text-white drop-shadow-sm" : "text-gray-500"
                    )} />
                    {isActive && (
                      <div className="absolute -inset-1 bg-white/20 rounded-full blur-sm"></div>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-semibold truncate transition-all duration-300",
                    isActive 
                      ? "text-white drop-shadow-sm" 
                      : "text-gray-500 group-hover:text-green-600"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-sm"></div>
                  )}
                </Button>
              );
            })}

            {/* Menu Button - Diseño mejorado */}
            <Button
              variant="ghost"
              onClick={() => setIsMenuOpen(true)}
              className="flex flex-col items-center justify-center p-3 h-16 min-w-0 flex-1 text-gray-500 hover:text-green-600 hover:bg-green-50/50 rounded-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="relative mb-1">
                <Menu className="w-6 h-6 transition-all duration-300" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-sm"></div>
              </div>
              <span className="text-xs font-semibold">Más</span>
            </Button>
          </div>
          
          {/* Indicador de navegación */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 opacity-20"></div>
        </div>
      )}

      {/* Modal Menu Móvil Simple - SOLO móviles */}
      {isMenuOpen && !isDesktop && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed bottom-20 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-6 space-y-4">
              {/* Indicador de arrastre */}
              <div className="flex justify-center">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
              </div>
              
              {/* Título */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Más opciones</h3>
                <p className="text-sm text-gray-500">Explora todas las funciones</p>
              </div>

              {/* Secciones adicionales */}
              <div className="grid grid-cols-2 gap-3">
                {navigationItems.slice(4).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => {
                        handleSectionChange(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 h-20 rounded-2xl transition-all duration-300 transform hover:scale-105",
                        isActive
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg"
                          : "bg-gray-50/80 hover:bg-green-50 text-gray-700 hover:text-green-700 hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-all duration-300",
                        isActive 
                          ? "bg-white/20 backdrop-blur-sm shadow-inner" 
                          : "bg-white/50"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5 transition-all duration-300",
                          isActive ? "text-white" : "text-green-600"
                        )} />
                      </div>
                      <div className="text-center">
                        <div className={cn(
                          "font-semibold text-xs mb-0.5",
                          isActive ? "text-white" : "text-gray-800"
                        )}>
                          {item.label}
                        </div>
                        <div className={cn(
                          "text-xs leading-tight",
                          isActive ? "text-green-100" : "text-gray-500"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>

              {/* Separador */}
              <div className="border-t border-gray-200/50 pt-4">
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onNavigate('/profile');
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-start p-4 h-12 rounded-2xl bg-gray-50/80 hover:bg-green-50 text-gray-700 hover:text-green-700 transition-all duration-300 hover:scale-102"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm">Perfil</div>
                      <div className="text-xs text-gray-500">Gestiona tu cuenta</div>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      onNavigate('/settings');
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-start p-4 h-12 rounded-2xl bg-gray-50/80 hover:bg-green-50 text-gray-700 hover:text-green-700 transition-all duration-300 hover:scale-102"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center mr-3">
                      <Settings className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm">Configuración</div>
                      <div className="text-xs text-gray-500">Ajustes de la app</div>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      onSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-start p-4 h-12 rounded-2xl bg-red-50/80 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-300 hover:scale-102"
                  >
                    <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center mr-3">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm">Cerrar Sesión</div>
                      <div className="text-xs text-red-400">Salir de la cuenta</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}