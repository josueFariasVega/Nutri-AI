import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { 
  Target, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  ChevronDown,
  Activity,
  Zap,
  Shield
} from 'lucide-react';
import { NotificationCenter } from '../../components/ui/NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';

interface SimpleNavigationProps {
  user?: any;
  onNavigate: (page: string) => void;
  onSignOut: () => void;
}

export function SimpleNavigation({ user, onNavigate, onSignOut }: SimpleNavigationProps) {
  const { noLeidas } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-green-100 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Brand */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => onNavigate('/')}
              className="flex items-center space-x-3 hover:bg-green-50 rounded-xl px-3 py-2 transition-all duration-200"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  NutriAI
                </div>
                <div className="text-xs text-gray-500">Pro Platform</div>
              </div>
            </Button>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {user ? (
              // Authenticated User Section
              <>
                {/* Dashboard Button */}
                <Button
                  onClick={() => {
                    console.log('SimpleNavigation: Navigate to dashboard');
                    onNavigate('/dashboard');
                  }}
                  className="hidden md:flex bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:from-green-600 hover:to-emerald-600 px-4 py-2 rounded-xl transition-all duration-200"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>

                {/* AI Status Badge */}
                <Badge className="hidden lg:flex bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-3 py-1">
                  <Zap className="w-3 h-3 mr-1" />
                  IA Activa
                </Badge>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 rounded-xl hover:bg-green-50 transition-colors duration-200"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {noLeidas > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {noLeidas}
                    </div>
                  )}
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center space-x-3 p-2 rounded-xl hover:bg-green-50 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8 border-2 border-green-200">
                          <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium">
                            {(user?.user_metadata?.name || user?.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden sm:block text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            Plan Premium
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-64 bg-white/95 backdrop-blur-lg border border-green-100 shadow-xl rounded-xl"
                  >
                    <div className="p-4 border-b border-green-100">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12 border-2 border-green-200">
                          <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-lg">
                            {(user?.user_metadata?.name || user?.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario'}
                          </div>
                          <div className="text-sm text-gray-500">{user?.email}</div>
                          <Badge className="mt-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs">
                            Premium Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenuItem 
                      onClick={() => onNavigate('/profile')}
                      className="flex items-center space-x-3 p-3 hover:bg-green-50 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-green-600" />
                      <span>Mi Perfil</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => onNavigate('/dashboard')}
                      className="flex items-center space-x-3 p-3 hover:bg-green-50 cursor-pointer md:hidden"
                    >
                      <Activity className="w-4 h-4 text-green-600" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => {
                        console.log('SimpleNavigation: Navigate to settings');
                        onNavigate('/settings');
                      }}
                      className="flex items-center space-x-3 p-3 hover:bg-green-50 cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span>Configuración</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="bg-green-100" />
                    
                    <DropdownMenuItem 
                      onClick={onSignOut}
                      className="flex items-center space-x-3 p-3 hover:bg-red-50 text-red-600 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Non-authenticated Section
              <Button
                onClick={() => onNavigate('/auth')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-green-500/25"
              >
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNavigate={onNavigate}
        user={user}
      />
    </nav>
  );
}