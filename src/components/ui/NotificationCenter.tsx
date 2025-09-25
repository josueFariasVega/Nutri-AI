/**
 * Centro de notificaciones unificado con datos reales del usuario
 */
import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { X, Bell, Clock, CheckCircle, AlertTriangle, Info, Target } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { toast } from 'sonner@2.0.3';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  user?: any;
}

export function NotificationCenter({ isOpen, onClose, onNavigate, user }: NotificationCenterProps) {
  const { 
    notificaciones, 
    noLeidas, 
    marcarComoLeida, 
    marcarTodasComoLeidas, 
    eliminarNotificacion 
  } = useNotifications();

  if (!isOpen) return null;

  const obtenerIcono = (tipo: string) => {
    switch (tipo) {
      case 'exito':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'advertencia':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleAction = (notificacion: any) => {
    if (notificacion.onAction) {
      notificacion.onAction();
      toast.success('Acción ejecutada');
    }
    if (notificacion.accion) {
      onNavigate(notificacion.accion.ruta);
      onClose();
    }
  };

  const handleMarkAsRead = (id: string) => {
    marcarComoLeida(id);
    toast.success('Notificación marcada como leída');
  };

  const handleDelete = (id: string) => {
    eliminarNotificacion(id);
    toast.success('Notificación eliminada');
  };

  const handleMarkAllAsRead = () => {
    marcarTodasComoLeidas();
    toast.success('Todas las notificaciones marcadas como leídas');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="fixed right-4 top-20 w-96 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Card className=" backdrop-blur-lg border border-slate-700 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Bell className="w-5 h-5 text-green-600" />
              <span>Notificaciones</span>
              {noLeidas > 0 && (
                <Badge className="bg-red-500 text-white border-red-500/30">
                  {noLeidas}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-slate-700 text-slate-400"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                <p>No tienes notificaciones</p>
                <p className="text-slate-500 text-sm mt-1">
                  Las notificaciones aparecerán basadas en tu progreso nutricional
                </p>
              </div>
            ) : (
              notificaciones.map((notificacion) => (
                <div
                  key={notificacion.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notificacion.leida
                      ? 'bg-slate-800/50 border-slate-700'
                      : 'bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {obtenerIcono(notificacion.tipo)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium truncate ${
                          notificacion.leida ? 'text-slate-300' : 'text-white'
                        }`}>
                          {notificacion.titulo}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{notificacion.tiempo}</span>
                        </div>
                      </div>
                      <p className={`text-sm mt-1 ${
                        notificacion.leida ? 'text-slate-400' : 'text-slate-300'
                      }`}>
                        {notificacion.mensaje}
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-3">
                        {(notificacion.accion || notificacion.actionable) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(notificacion)}
                            className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            {notificacion.actionable ? (
                              <Target className="w-3 h-3 mr-1" />
                            ) : null}
                            {notificacion.accion?.texto || 'Acción'}
                          </Button>
                        )}
                        
                        {!notificacion.leida && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notificacion.id)}
                            className="text-blue-400 hover:bg-blue-500/10"
                          >
                            Marcar leída
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notificacion.id)}
                          className="text-red-400 hover:bg-red-500/10"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
          
          {notificaciones.length > 0 && (
            <div className="p-4 border-t border-slate-700 space-y-2">
              {noLeidas > 0 && (
                <Button
                  variant="ghost"
                  className="w-full text-blue-400 hover:bg-blue-500/10"
                  onClick={handleMarkAllAsRead}
                >
                  Marcar todas como leídas
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => {
                  onNavigate('/dashboard?section=notifications');
                  onClose();
                }}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
