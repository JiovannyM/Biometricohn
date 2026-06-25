// Configuración del servidor
export const SERVER_URL = 'http://13.58.64.227:7792';
export const API_URL = `${SERVER_URL}/api`;
export const REFRESH_INTERVAL = 5000; // 5 segundos

// Estado global de la aplicación
export const state = {
    devices: [],
    persons: [],
    records: [],
    companies: [],
    buildings: [],
    classrooms: [],
    currentView: 'ubicaciones',
    autoRefreshInterval: null,
    filtersActive: false,
    autoRefreshPaused: false,
    authErrorCount: 0,  // Contador de errores de autenticación
    isLoggingOut: false // Flag para evitar múltiples redirecciones
};
