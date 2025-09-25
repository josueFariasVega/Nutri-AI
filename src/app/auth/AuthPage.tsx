import React, { useState } from 'react';
import { supabase } from '../../lib/utils/supabase/client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { ArrowLeft, Mail, Lock, User, Github, Chrome } from 'lucide-react';
import { toast } from 'sonner';

interface AuthPageProps {
  onNavigate: (page: string) => void;
}

export function AuthPage({ onNavigate }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Credenciales incorrectas. Verifica tu email y contraseña.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor confirma tu email antes de iniciar sesión.');
        } else {
          toast.error('Error al iniciar sesión: ' + error.message);
        }
      } else {
        toast.success('¡Bienvenido de vuelta!');
        // Navigation will be handled by auth state change in App.tsx
      }
    } catch (error) {
      toast.error('Error inesperado al iniciar sesión');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      // Use Supabase built-in signup instead of Edge Function
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            full_name: formData.name
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('User already registered')) {
          toast.error('Este email ya está registrado. Intenta iniciar sesión.');
          // Switch to sign in tab
          const signinTab = document.querySelector('[data-state="inactive"][value="signin"]') as HTMLElement;
          if (signinTab) {
            signinTab.click();
          }
        } else {
          toast.error('Error al crear cuenta: ' + error.message);
        }
      } else {
        if (data.user && !data.user.email_confirmed_at) {
          toast.success('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.');
        } else {
          toast.success('¡Cuenta creada exitosamente! Bienvenido a NutriAI');
        }
      }
    } catch (error) {
      toast.error('Error inesperado al crear cuenta');
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    
    // Debug: Log current URL and redirect URL
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Redirect URL will be:', `${window.location.origin}/auth`);
    
    // Additional debugging for Supabase URL
    console.log('🔍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('🔍 Expected callback URL:', `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/callback`);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error(`${provider} auth error:`, error);
        if (error.message.includes('provider is not enabled')) {
          if (provider === 'google') {
            toast.error('Google Auth no está habilitado. Configúralo en Supabase Dashboard.');
          } else {
            toast.error(`${provider} Auth no está habilitado. Configúralo en Supabase Dashboard.`);
          }
        } else {
          toast.error(`Error con ${provider}: ${error.message}`);
        }
      } else {
        console.log(`🚀 Redirecting to ${provider} OAuth...`);
        toast.success(`Redirigiendo a ${provider}...`);
        // Don't set loading to false here - let the redirect happen
        return;
      }
    } catch (error) {
      toast.error(`Error inesperado con ${provider}`);
      console.error(`${provider} auth error:`, error);
    } finally {
      // Only set loading to false if there was an error
      // Don't reset loading on successful redirect
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-emerald-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate('/')}
            className="mb-6 text-green-600 hover:text-green-700 hover:bg-green-50/80 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Volver al inicio
          </Button>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-green-700 to-emerald-600 bg-clip-text text-transparent">
                  NutriAI
                </span>
                <div className="text-xs text-gray-500 font-medium">Pro Platform</div>
              </div>
            </div>
            <p className="text-gray-600 mb-2">
              Tu transformación nutricional comienza aquí
            </p>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>IA Activa</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Análisis Avanzado</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Bienvenido</CardTitle>
            <CardDescription className="text-center">
              Inicia sesión o crea tu cuenta para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Crear Cuenta</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium text-gray-700 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-green-600" />
                      Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-green-500 focus:ring-green-500/20 pl-4"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium text-gray-700 flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-green-600" />
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-green-500 focus:ring-green-500/20 pl-4"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Iniciando sesión...
                      </div>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-medium text-gray-700 flex items-center">
                      <User className="w-4 h-4 mr-2 text-green-600" />
                      Nombre Completo
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-name"
                        name="name"
                        type="text"
                        placeholder="Tu nombre completo"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-green-500 focus:ring-green-500/20 pl-4"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-green-600" />
                      Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-green-500 focus:ring-green-500/20 pl-4"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700 flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-green-600" />
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-green-500 focus:ring-green-500/20 pl-4"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-green-600" />
                      Confirmar Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="bg-white/80 backdrop-blur-sm border-gray-200 focus:border-green-500 focus:ring-green-500/20 pl-4"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Creando cuenta...
                      </div>
                    ) : (
                      'Crear Cuenta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">O continúa con</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleSocialAuth('google')}
                disabled={isLoading}
                className="w-full bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-200"
              >
                <Chrome className="mr-2 w-4 h-4 text-blue-600" />
                Google
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialAuth('github')}
                disabled={isLoading}
                className="w-full bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                <Github className="mr-2 w-4 h-4 text-gray-700" />
                GitHub
              </Button>
            </div>

            <p className="text-xs text-center text-gray-600">
              Al crear una cuenta, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}