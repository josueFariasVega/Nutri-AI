/**
 * @fileoverview Store Index - Estado global de la aplicación
 * @description Configuración principal del store con Zustand
 * @author Nutrition Platform Team
 * @version 1.0.0
 */

export * from './auth';
export * from './nutrition';
export * from './settings';
export * from './dashboard';

// Store types
export interface RootState {
  auth: AuthState;
  nutrition: NutritionState;
  settings: SettingsState;
  dashboard: DashboardState;
}

// Store actions
export interface StoreActions {
  // Auth actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Nutrition actions
  setNutritionPlan: (plan: NutritionPlan | null) => void;
  updateDailyMetrics: (metrics: Partial<DailyMetrics>) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<UserSettings>) => void;
  
  // Dashboard actions
  setDashboardData: (data: DashboardData) => void;
  addNotification: (notification: NotificationItem) => void;
  markNotificationAsRead: (id: string) => void;
}

import type { User, Session } from '../types/auth';
import type { NutritionPlan, DailyMetrics } from '../types/nutrition';
import type { UserSettings } from '../types/user';
import type { DashboardData, NotificationItem } from '../types/dashboard';
import type { AuthState, NutritionState, SettingsState, DashboardState } from './types';
