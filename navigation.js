import { state } from './config.js';
import { fetchDevices } from './components/devices.js';
import { fetchPersons } from './components/persons.js';
import { fetchRecords } from './components/records.js';
import { fetchCompanies, fetchBuildings, fetchClassrooms } from './components/organization.js';
import { updateCommandsData } from './components/commands.js';

// Sistema de navegación entre vistas
export function initNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = item.getAttribute('data-view');
            switchView(viewName);
        });
    });
}

export function switchView(viewName) {
    state.currentView = viewName;
    
    // Limpiar cualquier filtro activo y reanudar actualización automática al cambiar de pestaña
    if (state.filtersActive || state.autoRefreshPaused) {
        console.log('[Navegación] Limpiando filtros y reanudando actualización al cambiar a:', viewName);
        state.autoRefreshPaused = false;
        state.filtersActive = false;
        
        // Ocultar indicador de filtros
        const indicator = document.getElementById('filterActiveIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    // Actualizar menú activo
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        }
    });
    
    // Mostrar vista correspondiente
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const activeView = document.getElementById(`view-${viewName}`);
    if (activeView) {
        activeView.classList.add('active');
    }
    
    // Cargar datos de la vista actual
    loadViewData(viewName);
}

async function loadViewData(viewName) {
    switch(viewName) {
        case 'ubicaciones':
            await Promise.all([
                fetchCompanies(),
                fetchBuildings(),
                fetchClassrooms()
            ]);
            break;
        case 'dispositivos':
            await fetchDevices();
            break;
        case 'usuarios':
            await fetchPersons();
            break;
        case 'registros':
            // Cargar usuarios primero, luego registros
            await fetchPersons();
            await fetchRecords();
            break;
        case 'comandos':
            // Cargar dispositivos y usuarios para los comandos
            await Promise.all([
                fetchDevices(),
                fetchPersons()
            ]);
            updateCommandsData(state.devices, state.persons);
            break;
    }
}
