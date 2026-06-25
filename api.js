import { API_URL } from './config.js';
import { state } from './config.js';

// Función para hacer peticiones a la API con autenticación JWT
export async function fetchAPI(endpoint, options = {}) {
    try {
        const url = `${API_URL}${endpoint}`;
        console.log(`Fetching: ${url}`);
        
        // Agregar token JWT automáticamente si existe
        const token = localStorage.getItem('access_token');
        const headers = {
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // Si el token es inválido (401), manejar con cuidado
        if (response.status === 401) {
            state.authErrorCount++;
            console.warn(`Token inválido o expirado (intento ${state.authErrorCount})`);
            
            // Solo redirigir después de 3 intentos fallidos consecutivos
            if (state.authErrorCount >= 3 && !state.isLoggingOut) {
                state.isLoggingOut = true;
                
                // Detener auto-refresh para evitar múltiples redirecciones
                if (state.autoRefreshInterval) {
                    clearInterval(state.autoRefreshInterval);
                    state.autoRefreshInterval = null;
                }
                
                // Mostrar mensaje al usuario
                alert('⚠️ Sesión expirada. Serás redirigido al login.');
                
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_info');
                window.location.href = 'login.html';
            }
            
            // No lanzar error, retornar null para que el flujo continúe
            return null;
        }
        
        // Si la petición fue exitosa, resetear contador de errores
        state.authErrorCount = 0;
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Success: ${endpoint}`, data);
        return data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        
        // Verificar si es un error de red
        if (error instanceof TypeError && error.message.includes('fetch')) {
            console.error('Error de conexión: No se puede conectar al servidor');
            console.error(`Intentando conectar a: ${API_URL}${endpoint}`);
        }
        
        throw error;
    }
}
