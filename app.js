// Punto de entrada principal de la aplicación
import { SERVER_URL, REFRESH_INTERVAL, state } from './config.js';
import { elements } from './utils/dom.js';
import { initNavigation } from './navigation.js';
import { initModalEvents, initEditButtons } from './modals.js';
import { fetchDevices } from './components/devices.js';
import { fetchPersons } from './components/persons.js';
import { fetchRecords } from './components/records.js';
import { fetchCompanies, fetchBuildings, fetchClassrooms } from './components/organization.js';
import { initCommands, updateCommandsData, updateFilters } from './components/commands.js';
import { initDeviceFilters, initUserFilters, initRecordFilters, initLocationFilters, showFilterIndicator, hideFilterIndicator } from './utils/filters.js';

function getActiveViewNameFromDOM() {
    const activeMenuItem = document.querySelector('.menu-item.active');
    const activeMenuView = activeMenuItem?.getAttribute('data-view');
    if (activeMenuView) {
        return activeMenuView;
    }

    const activeSection = document.querySelector('.view-section.active');
    if (!activeSection?.id) return state.currentView;

    const viewName = activeSection.id.replace('view-', '');
    return viewName || state.currentView;
}

function hasActiveLocationFiltersFromDOM() {
    const activeView = getActiveViewNameFromDOM();
    if (activeView !== 'ubicaciones') return false;

    const searchCompany = document.getElementById('searchCompany')?.value?.trim();
    const searchBuilding = document.getElementById('searchBuilding')?.value?.trim();
    const searchClassroom = document.getElementById('searchClassroom')?.value?.trim();
    const filterBuildingCompany = document.getElementById('filterBuildingCompany')?.value;
    const filterClassroomCompany = document.getElementById('filterClassroomCompany')?.value;
    const filterClassroomBuilding = document.getElementById('filterClassroomBuilding')?.value;

    return !!(
        searchCompany ||
        searchBuilding ||
        searchClassroom ||
        filterBuildingCompany ||
        filterClassroomCompany ||
        filterClassroomBuilding
    );
}

function hasActiveCommandFiltersFromDOM() {
    const activeView = getActiveViewNameFromDOM();
    if (activeView !== 'comandos') return false;

    const searchText = document.getElementById('filterDeviceSearch')?.value?.trim();
    const companyId = document.getElementById('filterCommandCompany')?.value;
    const buildingId = document.getElementById('filterCommandBuilding')?.value;
    const classroomId = document.getElementById('filterCommandClassroom')?.value;
    const onlyConnected = document.getElementById('filterOnlyConnected')?.checked;

    return !!(searchText || companyId || buildingId || classroomId || onlyConnected === false);
}

function resumeAutoRefreshFromManualAction(source) {
    if (state.autoRefreshPaused || state.filtersActive) {
        console.log(`[Refresh] Reanudando actualización automática desde ${source}`);
        state.autoRefreshPaused = false;
        state.filtersActive = false;
        hideFilterIndicator();
    }
}

// Actualizar todos los datos
async function refreshAll() {
    // Mantener sincronizado el estado con la vista activa real del DOM.
    state.currentView = getActiveViewNameFromDOM();

    const hasDomFilters = hasActiveLocationFiltersFromDOM() || hasActiveCommandFiltersFromDOM();
    if (hasDomFilters) {
        state.autoRefreshPaused = true;
        state.filtersActive = true;
        showFilterIndicator();
    }

    // Si hay filtros activos, pausar la actualización automática completa
    if (state.autoRefreshPaused) {
        console.log('[Auto-Refresh] Pausado - Filtros activos. Sincronización automática detenida.');
        return;
    }
    
    // Actualización completa cuando no hay filtros activos
    console.log('[Auto-Refresh] Actualizando todos los datos...');
    await Promise.all([
        fetchDevices(),
        fetchCompanies(),
        fetchBuildings(),
        fetchClassrooms()
    ]).catch(error => {
        console.error('[Auto-Refresh] Error actualizando datos organizacionales:', error);
    });
    
    // Actualizar filtros jerárquicos (después de cargar organizaciones)
    updateFilters();
    
    // Cargar usuarios primero, luego registros (para evitar race conditions)
    await fetchPersons().catch(error => console.error('[Auto-Refresh] Error en personas:', error));
    await fetchRecords().catch(error => console.error('[Auto-Refresh] Error en registros:', error));
    
    // Actualizar datos en componente de comandos
    updateCommandsData(state.devices, state.persons);
}

// Event listeners para botones de refresh
function initRefreshButtons() {
    elements.refreshDevices.addEventListener('click', () => {
        resumeAutoRefreshFromManualAction('botón de dispositivos');
        fetchDevices();
    });
    
    elements.refreshPersons.addEventListener('click', () => {
        resumeAutoRefreshFromManualAction('botón de usuarios');
        fetchPersons();
    });
    
    elements.refreshRecords.addEventListener('click', async () => {
        resumeAutoRefreshFromManualAction('botón de registros');
        // Recargar usuarios primero, luego registros
        await fetchPersons();
        await fetchRecords();
    });

    const refreshLocations = document.getElementById('refreshLocations');
    refreshLocations?.addEventListener('click', async () => {
        resumeAutoRefreshFromManualAction('botón de ubicaciones');
        await Promise.all([
            fetchCompanies(),
            fetchBuildings(),
            fetchClassrooms()
        ]);
    });

    const refreshCommands = document.getElementById('refreshCommands');
    refreshCommands?.addEventListener('click', async () => {
        resumeAutoRefreshFromManualAction('botón de comandos');
        await Promise.all([
            fetchDevices(),
            fetchPersons(),
            fetchCompanies(),
            fetchBuildings(),
            fetchClassrooms()
        ]);
        updateFilters();
        updateCommandsData(state.devices, state.persons);
    });
}

// Iniciar actualización automática
function startAutoRefresh() {
    // Cargar datos iniciales
    refreshAll();
    
    // Configurar actualización automática
    state.autoRefreshInterval = setInterval(refreshAll, REFRESH_INTERVAL);
}

// Detener actualización automática
function stopAutoRefresh() {
    if (state.autoRefreshInterval) {
        clearInterval(state.autoRefreshInterval);
        state.autoRefreshInterval = null;
    }
}

// Manejar visibilidad de la página
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAutoRefresh();
    } else {
        startAutoRefresh();
    }
});

// Iniciar la aplicación
function initApp() {
    console.log('Iniciando aplicación de monitoreo...');
    console.log(`Servidor: ${SERVER_URL}`);
    console.log(`Actualización automática cada ${REFRESH_INTERVAL/1000} segundos`);

    // Inicializar navegación
    initNavigation();
    
    // Inicializar eventos de modales y formularios
    initModalEvents();
    
    // Inicializar botones de edición
    initEditButtons();
    
    // Inicializar botones de refresh
    initRefreshButtons();
    
    // Inicializar filtros
   setTimeout(() => {
        initDeviceFilters();
        initUserFilters();
        initRecordFilters();
        initLocationFilters();
    }, 500); // Esperar a que los datos se carguen
    
    // Inicializar comandos remotos
    setTimeout(() => {
        initCommands(state.devices, state.persons);
    }, 1000); // Esperar a que los datos se carguen

    // Iniciar auto-refresh
    startAutoRefresh();
}

// Verificar autenticación antes de iniciar la aplicación
async function checkAuth() {
    const token = localStorage.getItem('access_token');
    
    // Si no hay token, redirigir a login
    if (!token) {
        console.log('No hay token de autenticación. Redirigiendo a login...');
        window.location.href = 'login.html';
        return false;
    }
    
    // Verificar si el token es válido
    try {
        const response = await fetch(`${SERVER_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.log('Token inválido o expirado. Redirigiendo a login...');
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_info');
            window.location.href = 'login.html';
            return false;
        }
        
        const userData = await response.json();
        console.log('Usuario autenticado:', userData.username);
        return true;
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        // Si hay error de red, permitir acceso offline con token almacenado
        return true;
    }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
            initApp();
        }
    });
} else {
    checkAuth().then(isAuthenticated => {
        if (isAuthenticated) {
            initApp();
        }
    });
}
