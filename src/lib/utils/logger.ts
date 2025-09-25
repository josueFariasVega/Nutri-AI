/**
 * Logger utility que solo emite mensajes en modo desarrollo
 * En producción, los logs se silencian automáticamente
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Logs de depuración - solo en desarrollo
   */
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },

  /**
   * Logs informativos - solo en desarrollo
   */
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },

  /**
   * Logs generales - solo en desarrollo
   */
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  /**
   * Advertencias - siempre visibles (importantes para debugging en producción)
   */
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  /**
   * Errores - siempre visibles (críticos para debugging en producción)
   */
  error: (...args: unknown[]) => {
    console.error(...args);
  },

  /**
   * Logs de grupo - solo en desarrollo
   */
  group: (label: string) => {
    if (isDev) console.group(label);
  },

  /**
   * Cerrar grupo de logs - solo en desarrollo
   */
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },

  /**
   * Logs con tabla - solo en desarrollo
   */
  table: (data: unknown) => {
    if (isDev) console.table(data);
  },

  /**
   * Logs con tiempo - solo en desarrollo
   */
  time: (label: string) => {
    if (isDev) console.time(label);
  },

  /**
   * Finalizar tiempo - solo en desarrollo
   */
  timeEnd: (label: string) => {
    if (isDev) console.timeEnd(label);
  }
};

/**
 * Helper para logs condicionales más complejos
 */
export const devOnly = (callback: () => void) => {
  if (isDev) {
    callback();
  }
};

/**
 * Helper para logs de producción (solo errores críticos)
 */
export const prodLog = {
  error: (...args: unknown[]) => {
    console.error('[PROD ERROR]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[PROD WARNING]', ...args);
  }
};
