/**
 * @fileoverview Utils Index - Utilidades generales
 * @description Funciones de utilidad comunes para la aplicación
 * @author Nutrition Platform Team
 * @version 1.0.0
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind CSS de manera inteligente
 * @param inputs - Clases CSS a combinar
 * @returns String con las clases combinadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda
 * @param amount - Cantidad a formatear
 * @param currency - Código de moneda (por defecto EUR)
 * @returns String formateado como moneda
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Formatea una fecha de manera legible
 * @param date - Fecha a formatear
 * @returns String con la fecha formateada
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Trunca un texto a una longitud específica
 * @param text - Texto a truncar
 * @param length - Longitud máxima
 * @returns Texto truncado con puntos suspensivos si es necesario
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Genera un ID único
 * @returns String con ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Valida si un email tiene formato válido
 * @param email - Email a validar
 * @returns Boolean indicando si es válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calcula el IMC (Índice de Masa Corporal)
 * @param weight - Peso en kg
 * @param height - Altura en cm
 * @returns IMC calculado
 */
export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

/**
 * Obtiene la categoría del IMC
 * @param bmi - Valor del IMC
 * @returns Categoría del IMC
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidad';
}
