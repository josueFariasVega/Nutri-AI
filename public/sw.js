// ✅ Service Worker COMPLETO con TODAS las mejoras
// Ubicación: public/sw.js

const CACHE_NAME = 'nutriai-v1.0.1';
const DB_NAME = 'NutriAI_ServiceWorker';
const DB_VERSION = 1;
const STORE_NAME = 'flags';

const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// ✅ Variables globales para manejo de estado
let dailyResetTimeout = null;
let dbConnection = null;

// ✅ Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando versión', CACHE_NAME);
  
  event.waitUntil(
    Promise.all([
      // Inicializar cache
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('📦 Service Worker: Cache inicializado');
          return cache.addAll(urlsToCache);
        }),
      // Inicializar IndexedDB
      initializeDatabase()
    ]).catch((error) => {
      console.error('❌ Service Worker: Error en instalación:', error);
    })
  );
  
  // Forzar activación inmediata
  self.skipWaiting();
});

// ✅ Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activando versión', CACHE_NAME);
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Tomar control inmediato de todas las páginas
      self.clients.claim(),
      // ✅ NUEVA MEJORA: Verificar resets pendientes al activarse
      checkPendingResets()
    ])
  );
});

// ✅ Manejo de fetch requests con cache inteligente
self.addEventListener('fetch', (event) => {
  // ✅ MEJORA: Filtrar requests problemáticos
  const url = new URL(event.request.url);
  
  // Ignorar chrome-extension, moz-extension, etc.
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' || 
      url.protocol === 'safari-extension:' ||
      event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si está en cache, devolverlo
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Si no, hacer fetch y cachear
        return fetch(event.request)
          .then((response) => {
            // Solo cachear respuestas válidas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // ✅ MEJORA: Verificar que la URL sea cacheable
            const responseUrl = new URL(response.url);
            if (responseUrl.protocol === 'http:' || responseUrl.protocol === 'https:') {
              // Clonar respuesta para cache
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch((error) => {
                  console.log('ℹ️ No se pudo cachear:', event.request.url, error);
                });
            }
            
            return response;
          });
      })
      .catch((error) => {
        console.log('ℹ️ Error en fetch:', event.request.url, error);
        // Fallback para páginas offline
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// ✅ FUNCIONALIDAD PRINCIPAL: Gestión de mensajes mejorada
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker: Mensaje recibido:', event.data);
  
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SCHEDULE_DAILY_RESET':
      console.log('⏰ Service Worker: Programando reset diario automático...');
      scheduleDailyReset();
      break;
      
    case 'PERFORM_DAILY_RESET':
      console.log('🌅 Service Worker: Ejecutando reset diario manual...');
      performDailyReset();
      break;
      
    case 'CHECK_STATUS':
      // Responder con estado del Service Worker
      event.ports[0]?.postMessage({
        type: 'STATUS_RESPONSE',
        data: {
          active: true,
          version: CACHE_NAME,
          timestamp: new Date().toISOString(),
          nextReset: getNextResetTime()
        }
      });
      break;
      
    case 'CANCEL_RESET':
      console.log('🚫 Service Worker: Cancelando reset programado...');
      cancelDailyReset();
      break;
      
    default:
      console.log('⚠️ Service Worker: Tipo de mensaje no reconocido:', type);
  }
});

/**
 * ✅ MEJORA: Inicializar base de datos IndexedDB
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('🗄️ Service Worker: IndexedDB store creado');
      }
    };
    
    request.onsuccess = (event) => {
      dbConnection = event.target.result;
      console.log('✅ Service Worker: IndexedDB inicializado');
      resolve(dbConnection);
    };
    
    request.onerror = (error) => {
      console.error('❌ Service Worker: Error inicializando IndexedDB:', error);
      reject(error);
    };
  });
}

/**
 * ✅ MEJORA: Verificar resets pendientes al activarse
 */
async function checkPendingResets() {
  try {
    if (!dbConnection) {
      await initializeDatabase();
    }
    
    const resetFlag = await getResetFlag('daily_reset');
    
    if (resetFlag && resetFlag.resetPending) {
      console.log('🔄 Service Worker: Reset pendiente encontrado, ejecutando...');
      await performDailyReset();
      await deleteResetFlag('daily_reset');
    }
    
  } catch (error) {
    console.error('❌ Service Worker: Error verificando resets pendientes:', error);
  }
}

/**
 * ✅ MEJORA: Programa el próximo reset con Alarm API como fallback
 */
function scheduleDailyReset() {
  // Cancelar timeout anterior si existe
  cancelDailyReset();
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Medianoche exacta
  
  const timeUntilReset = tomorrow.getTime() - now.getTime();
  const hoursUntilReset = Math.round(timeUntilReset / 1000 / 60 / 60);
  
  console.log(`⏰ Service Worker: Reset programado en ${hoursUntilReset} horas (${tomorrow.toLocaleString()})`);
  
  // ✅ MEJORA: Intentar usar Alarm API si está disponible (Chrome)
  if ('chrome' in self && chrome.alarms) {
    chrome.alarms.create('dailyReset', {
      when: tomorrow.getTime()
    });
    console.log('⏰ Service Worker: Usando Chrome Alarm API');
  } else {
    // Fallback con setTimeout
    dailyResetTimeout = setTimeout(() => {
      console.log('🌅 Service Worker: ¡Es medianoche! Ejecutando reset diario automático...');
      performDailyReset();
      
      // ✅ MEJORA: Reprogramar automáticamente
      scheduleDailyReset();
    }, timeUntilReset);
  }
}

/**
 * ✅ MEJORA: Cancelar reset programado
 */
function cancelDailyReset() {
  if (dailyResetTimeout) {
    clearTimeout(dailyResetTimeout);
    dailyResetTimeout = null;
    console.log('🚫 Service Worker: Timeout cancelado');
  }
  
  if ('chrome' in self && chrome.alarms) {
    chrome.alarms.clear('dailyReset');
    console.log('🚫 Service Worker: Chrome Alarm cancelado');
  }
}

/**
 * ✅ MEJORA: Obtener tiempo del próximo reset
 */
function getNextResetTime() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Ejecuta el reset diario notificando a la aplicación principal
 * ✅ MEJORADO: Manejo más robusto de clientes y persistencia
 */
async function performDailyReset() {
  try {
    console.log('🔄 Service Worker: Iniciando proceso de reset diario...');
    
    // ✅ SOLUCIÓN: Notificar a TODAS las ventanas/tabs abiertas
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    console.log(`📤 Service Worker: Notificando reset a ${clients.length} cliente(s)...`);
    
    let resetHandled = false;
    
    if (clients.length > 0) {
      // Enviar mensaje a todos los clientes
      const promises = clients.map((client, index) => {
        return new Promise((resolve) => {
          client.postMessage({
            type: 'DAILY_RESET_REQUESTED',
            data: {
              timestamp: new Date().toISOString(),
              source: 'service_worker_midnight',
              clientIndex: index
            }
          });
          
          // Timeout para considerar que el cliente respondió
          setTimeout(() => resolve(true), 1000);
        });
      });
      
      await Promise.all(promises);
      resetHandled = true;
      
    } else {
      // ✅ MEJORA: Si no hay clientes, guardar flag más detallado
      console.log('📱 Service Worker: No hay clientes activos, guardando flag de reset pendiente...');
      
      const resetFlag = {
        resetPending: true,
        timestamp: new Date().toISOString(),
        reason: 'midnight_reset_no_active_clients',
        scheduledFor: new Date().toISOString(),
        attempts: 1
      };
      
      await saveResetFlag('daily_reset', resetFlag);
    }
    
    // ✅ Mostrar notificación push si tiene permisos
    await showDailyResetNotification();
    
    console.log('✅ Service Worker: Reset diario procesado exitosamente');
    
  } catch (error) {
    console.error('❌ Service Worker: Error durante reset diario:', error);
    
    // ✅ MEJORA: Guardar error para debugging
    await saveResetFlag('daily_reset_error', {
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack
    }).catch(() => {
      // Si no se puede guardar, al menos loggearlo
      console.error('❌ Service Worker: No se pudo guardar error en IndexedDB');
    });
    
    // Notificar error a los clientes
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'DAILY_RESET_ERROR',
        data: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    });
  }
}

/**
 * ✅ MEJORA: Muestra notificación push mejorada
 */
async function showDailyResetNotification() {
  // Verificar permisos de notificación
  if (Notification.permission === 'granted') {
    console.log('🔔 Service Worker: Mostrando notificación de reset diario...');
    
    await self.registration.showNotification('NutriAI - ¡Nuevo Día Nutricional!', {
      body: '🌅 Tu plan nutricional se ha renovado para hoy. ¡Comienza tu día saludable!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'daily-reset',
      requireInteraction: false,
      silent: false,
      timestamp: Date.now(),
      vibrate: [200, 100, 200], // Vibración en móviles
      actions: [
        {
          action: 'open_app',
          title: '📱 Abrir NutriAI',
          icon: '/favicon.ico'
        },
        {
          action: 'dismiss',
          title: '✕ Cerrar',
          icon: '/favicon.ico'
        }
      ],
      data: {
        type: 'daily_reset',
        timestamp: new Date().toISOString(),
        url: '/'
      }
    });
  } else {
    console.log('🔕 Service Worker: Sin permisos de notificación');
  }
}

/**
 * ✅ MEJORA: Guardar flag en IndexedDB con manejo de errores
 */
async function saveResetFlag(id, resetFlag) {
  try {
    if (!dbConnection) {
      await initializeDatabase();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = dbConnection.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({
        id,
        ...resetFlag,
        savedAt: new Date().toISOString()
      });
      
      request.onsuccess = () => {
        console.log(`💾 Service Worker: Flag '${id}' guardado en IndexedDB`);
        resolve(true);
      };
      
      request.onerror = (error) => {
        console.error(`❌ Service Worker: Error guardando flag '${id}':`, error);
        reject(error);
      };
    });
    
  } catch (error) {
    console.error('❌ Service Worker: Error en saveResetFlag:', error);
    throw error;
  }
}

/**
 * ✅ NUEVA: Leer flag de IndexedDB
 */
async function getResetFlag(id) {
  try {
    if (!dbConnection) {
      await initializeDatabase();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = dbConnection.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        const result = request.result;
        console.log(`📖 Service Worker: Flag '${id}' leído:`, result);
        resolve(result);
      };
      
      request.onerror = (error) => {
        console.error(`❌ Service Worker: Error leyendo flag '${id}':`, error);
        reject(error);
      };
    });
    
  } catch (error) {
    console.error('❌ Service Worker: Error en getResetFlag:', error);
    return null;
  }
}

/**
 * ✅ NUEVA: Eliminar flag de IndexedDB
 */
async function deleteResetFlag(id) {
  try {
    if (!dbConnection) {
      await initializeDatabase();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = dbConnection.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log(`🗑️ Service Worker: Flag '${id}' eliminado de IndexedDB`);
        resolve(true);
      };
      
      request.onerror = (error) => {
        console.error(`❌ Service Worker: Error eliminando flag '${id}':`, error);
        reject(error);
      };
    });
    
  } catch (error) {
    console.error('❌ Service Worker: Error en deleteResetFlag:', error);
  }
}

// ✅ MEJORA: Manejo de Chrome Alarms
if ('chrome' in self && chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyReset') {
      console.log('⏰ Service Worker: Chrome Alarm disparado para reset diario');
      performDailyReset();
      scheduleDailyReset(); // Reprogramar
    }
  });
}

// ✅ Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notificación clickeada:', event.notification.tag, event.action);
  
  event.notification.close();
  
  if (event.action === 'open_app' || !event.action) {
    // Abrir o enfocar la aplicación
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        // Buscar si ya hay una ventana abierta
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('🎯 Service Worker: Enfocando ventana existente');
            return client.focus();
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (self.clients.openWindow) {
          console.log('🆕 Service Worker: Abriendo nueva ventana');
          return self.clients.openWindow('/');
        }
      })
    );
  }
  // Si es 'dismiss', no hacer nada (ya se cerró la notificación)
});

// ✅ Manejo de errores globales mejorado
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker: Error global:', event.error);
  
  // Guardar error en IndexedDB para debugging
  saveResetFlag('global_error', {
    error: event.error?.message || 'Unknown error',
    timestamp: new Date().toISOString(),
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  }).catch(() => {
    // Si no se puede guardar, al menos loggearlo
    console.error('❌ Service Worker: No se pudo guardar error en IndexedDB');
  });
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker: Promise rechazada:', event.reason);
  
  // Guardar promise rejection en IndexedDB
  saveResetFlag('unhandled_rejection', {
    reason: event.reason?.toString() || 'Unknown rejection',
    timestamp: new Date().toISOString()
  }).catch(() => {
    console.error('❌ Service Worker: No se pudo guardar rejection en IndexedDB');
  });
});

console.log('🚀 Service Worker: Completamente cargado y operativo con TODAS las mejoras');