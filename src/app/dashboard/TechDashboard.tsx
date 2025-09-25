import React from 'react';
import { DashboardLayout } from './DashboardLayout';

interface TechDashboardProps {
  user: any;
  onNavigate: (page: string) => void;
  onSignOut: () => void;
}

export function TechDashboard({ user, onNavigate, onSignOut }: TechDashboardProps) {
  return (
    <DashboardLayout 
      user={user} 
      onSignOut={onSignOut} 
      onNavigate={onNavigate} 
    />
  );
}