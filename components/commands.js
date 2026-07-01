// ============================================================================
// COMPONENTE: COMANDOS REMOTOS
// Gestiona el envío de comandos remotos a los dispositivos biométricos
// ============================================================================

import { API_URL, state } from '../config.js';
import { fetchAPI } from '../api.js';
import { showFilterIndicator, hideFilterIndicator } from '../utils/filters.js';

// Estado local del componente
let devices = [];
let persons = [];

// Estado de filtros
let filters = {
    onlyConnected: true,
    searchText: '',
    companyId: '',
    buildingId: '',
    classroomId: ''
};

function setCommandFilterPauseState() {
    // Evitar que este componente sobrescriba el estado global cuando no está activo.
    if (state.currentView !== 'comandos') {
        return;
    }

    const hasActiveFilters = !!(
        filters.searchText ||
        filters.companyId ||
        filters.buildingId ||
        filters.classroomId ||
        !filters.onlyConnected
    );

    if (hasActiveFilters) {
        state.autoRefreshPaused = true;
        state.filtersActive = true;
        showFilterIndicator();
    } else {
        state.autoRefreshPaused = false;
        state.filtersActive = false;
        hideFilterIndicator();
    }
}

/**
 * Inicializa el componente de comandos remotos
 */
export function initCommands(appDevices, appPersons) {
    devices = appDevices;
    persons = appPersons;
    
    // Poblar filtros jerárquicos
    populateFilterSelectors();
    
    // Poblar selectores
    populateDeviceSelectors();
    populateUserSelectors();
    
    // Event listeners
    setupEventListeners();
    setupFilterListeners();
    
    // Mostrar contador inicial
    updateFilterResultCount();
    
    console.log('[Comandos] Componente inicializado');
}

/**
 * Poblar todos los selectores de dispositivos
 */
function populateDeviceSelectors() {
    // APLICAR FILTROS
    const filteredDevices = applyFilters();
    
    console.log('[Comandos] Poblando selectores:', filteredDevices.length, 'de', devices.length, 'dispositivos');
    
    const selectors = [
        'cmdGetUserDevice',
        'cmdAddUserDevice',
        'cmdRemoveAccessDevice',
        'cmdDeleteUserDevice'
    ];
    
    selectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (!select) {
            console.warn(`[Comandos] Selector ${selectorId} no encontrado`);
            return;
        }
        
        // GUARDAR selección actual antes de limpiar
        const currentValue = select.value;
        
        // Limpiar opciones existentes
        select.innerHTML = '<option value="">Seleccionar dispositivo...</option>';
        
        // Agregar dispositivos FILTRADOS
        filteredDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.sn;
            option.textContent = `${device.sn} - ${getDeviceLocation(device)}`;
            select.appendChild(option);
        });
        
        // RESTAURAR selección si el dispositivo todavía existe en los filtrados
        if (currentValue && filteredDevices.find(d => d.sn === currentValue)) {
            select.value = currentValue;
            console.log(`[Comandos] Selección restaurada: ${currentValue}`);
        }
    });
    
    // Actualizar contador
    updateFilterResultCount();
}

/**
 * Poblar todos los selectores de usuarios
 */
function populateUserSelectors() {
    const selectors = [
        'cmdAddUserId',
        'cmdRemoveAccessUserId',
        'cmdDeleteUserId'
    ];
    
    selectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (!select) return;
        
        // GUARDAR selección actual antes de limpiar
        const currentValue = select.value;
        
        // Limpiar opciones existentes
        select.innerHTML = '<option value="">Seleccionar usuario...</option>';
        
        // Agregar usuarios
        persons.forEach(person => {
            const option = document.createElement('option');
            option.value = person.id;
            option.textContent = `${person.id} - ${person.name || 'Sin nombre'}`;
            select.appendChild(option);
        });
        
        // RESTAURAR selección si el usuario todavía existe
        if (currentValue && persons.find(p => p.id == currentValue)) {
            select.value = currentValue;
        }
    });
}

/**
 * Obtener ubicación del dispositivo
 */
function getDeviceLocation(device) {
    // El backend devuelve campos planos (classroom_name, building_name, company_name)
    if (device.classroom_name) {
        return device.classroom_name;
    }
    if (device.building_name) {
        return device.building_name;
    }
    if (device.company_name) {
        return device.company_name;
    }
    return 'Sin ubicación';
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
    // Botón: Obtener Lista de Usuarios
    document.getElementById('btnGetUserList')?.addEventListener('click', handleGetUserList);
    
    // Botón: Agregar Usuario
    document.getElementById('btnAddUser')?.addEventListener('click', handleAddUser);
    
    // Botón: Quitar Acceso
    document.getElementById('btnRemoveAccess')?.addEventListener('click', handleRemoveAccess);
    
    // Botón: Eliminar Completamente
    document.getElementById('btnDeleteUserCompletely')?.addEventListener('click', handleDeleteUserCompletely);
}

/**
 * Configurar event listeners para filtros
 */
function setupFilterListeners() {
    // Checkbox: Solo conectados
    const onlyConnectedCheckbox = document.getElementById('filterOnlyConnected');
    onlyConnectedCheckbox?.addEventListener('change', (e) => {
        filters.onlyConnected = e.target.checked;
        if (state.currentView === 'comandos') {
            setCommandFilterPauseState();
        }
        populateDeviceSelectors();
        console.log('[Filtros] Solo conectados:', filters.onlyConnected);
    });
    
    // Input: Búsqueda por texto
    const searchInput = document.getElementById('filterDeviceSearch');
    searchInput?.addEventListener('input', (e) => {
        filters.searchText = e.target.value.toLowerCase().trim();
        if (state.currentView === 'comandos' && filters.searchText) {
            state.autoRefreshPaused = true;
            state.filtersActive = true;
            showFilterIndicator();
        }
        populateDeviceSelectors();
        console.log('[Filtros] Búsqueda:', filters.searchText);
    });
    
    // Select: Centro
    const companySelect = document.getElementById('filterCommandCompany');
    companySelect?.addEventListener('change', (e) => {
        filters.companyId = e.target.value;
        filters.buildingId = ''; // Reset cascada
        filters.classroomId = '';
        
        // Actualizar selectores en cascada
        updateBuildingFilter();
        updateClassroomFilter();
        
        if (state.currentView === 'comandos') {
            setCommandFilterPauseState();
        }
        populateDeviceSelectors();
        console.log('[Filtros] Centro:', filters.companyId);
    });
    
    // Select: Edificio
    const buildingSelect = document.getElementById('filterCommandBuilding');
    buildingSelect?.addEventListener('change', (e) => {
        filters.buildingId = e.target.value;
        filters.classroomId = ''; // Reset cascada
        
        updateClassroomFilter();
        if (state.currentView === 'comandos') {
            setCommandFilterPauseState();
        }
        populateDeviceSelectors();
        console.log('[Filtros] Edificio:', filters.buildingId);
    });
    
    // Select: Aula
    const classroomSelect = document.getElementById('filterCommandClassroom');
    classroomSelect?.addEventListener('change', (e) => {
        filters.classroomId = e.target.value;
        if (state.currentView === 'comandos') {
            setCommandFilterPauseState();
        }
        populateDeviceSelectors();
        console.log('[Filtros] Aula:', filters.classroomId);
    });
    
    // Botón: Limpiar filtros
    document.getElementById('clearCommandFilters')?.addEventListener('click', clearFilters);
}

/**
 * Handler: Obtener Lista de Usuarios
 */
async function handleGetUserList() {
    const deviceSN = document.getElementById('cmdGetUserDevice').value;
    const statusDiv = document.getElementById('getUserStatus');
    
    console.log('[Obtener Lista] Dispositivos disponibles:', devices.length);
    console.log('[Obtener Lista] Device SN seleccionado:', deviceSN);
    console.log('[Obtener Lista] Dispositivos:', devices.map(d => `${d.sn} (ID: ${d.id})`));
    
    if (!deviceSN) {
        showStatus(statusDiv, 'error', 'Por favor seleccione un dispositivo');
        return;
    }
    
    try {
        showStatus(statusDiv, 'info', '⏳ Enviando comando...');
        
        const data = await fetchAPI(`/commands/getuserlist/${deviceSN}`, {
            method: 'POST'
        });

        if (!data) {
            throw new Error('No autenticado o sesión inválida. Por favor inicia sesión de nuevo.');
        }

        showStatus(statusDiv, 'success', `✅ Comando enviado. ID: ${data.command_id}`);
        
    } catch (error) {
        console.error('Error al obtener lista de usuarios:', error);
        showStatus(statusDiv, 'error', `❌ Error: ${error.message}`);
    }
}

/**
 * Handler: Agregar Usuario
 */
async function handleAddUser() {
    const deviceSN = document.getElementById('cmdAddUserDevice').value;
    const personId = document.getElementById('cmdAddUserId').value;
    const statusDiv = document.getElementById('addUserStatus');
    
    if (!deviceSN) {
        showStatus(statusDiv, 'error', 'Por favor seleccione un dispositivo');
        return;
    }
    
    if (!personId) {
        showStatus(statusDiv, 'error', 'Por favor seleccione un usuario');
        return;
    }
    
    try {
        showStatus(statusDiv, 'info', '⏳ Enviando usuario al dispositivo...');
        
        const data = await fetchAPI(`/commands/setuserinfo/${deviceSN}/${personId}`, {
            method: 'POST'
        });
        
        if (!data) {
            throw new Error('No autenticado o sesión inválida. Por favor inicia sesión de nuevo.');
        }
        
        showStatus(statusDiv, 'success', `✅ ${data.message}`);
        
    } catch (error) {
        console.error('Error al agregar usuario:', error);
        showStatus(statusDiv, 'error', `❌ Error: ${error.message}`);
    }
}

/**
 * Handler: Quitar Acceso
 */
async function handleRemoveAccess() {
    const deviceSN = document.getElementById('cmdRemoveAccessDevice').value;
    const personId = document.getElementById('cmdRemoveAccessUserId').value;
    const statusDiv = document.getElementById('removeAccessStatus');
    
    if (!deviceSN) {
        showStatus(statusDiv, 'error', 'Por favor seleccione un dispositivo');
        return;
    }
    
    if (!personId) {
        showStatus(statusDiv, 'error', 'Por favor seleccione un usuario');
        return;
    }
    
    try {
        showStatus(statusDiv, 'info', '⏳ Quitando acceso...');
        
        const data = await fetchAPI(`/commands/deleteuser-complete/${deviceSN}/${personId}`, {
            method: 'POST'
        });

        if (!data) {
            throw new Error('No autenticado o sesión inválida. Por favor inicia sesión de nuevo.');
        }

        showStatus(statusDiv, 'success', `✅ ${data.message}`);
        
    } catch (error) {
        console.error('Error al quitar acceso:', error);
        showStatus(statusDiv, 'error', `❌ Error: ${error.message}`);
    }
}

/**
 * Handler: Eliminar Usuario Completamente
 */
async function handleDeleteUserCompletely() {
    const deviceSN = document.getElementById('cmdDeleteUserDevice').value;
    const personId = document.getElementById('cmdDeleteUserId').value;
    const statusDiv = document.getElementById('deleteUserStatus');
    
    if (!deviceSN) {
        showStatus(statusDiv, 'error', 'Por favor seleccione un dispositivo');
        return;
    }
    
    if (!personId) {
        showStatus(statusDiv, 'error', 'Por favor seleccione un usuario');
        return;
    }
    
    // Confirmación de seguridad
    const person = persons.find(p => p.id == personId);
    const personName = person ? person.name : `ID ${personId}`;
    
    const confirmed = confirm(
        `⚠️ ADVERTENCIA ⚠️\n\n` +
        `Está a punto de ELIMINAR COMPLETAMENTE al usuario:\n` +
        `${personName} (${personId})\n\n` +
        `Esto eliminará TODOS sus registros biométricos (huellas, rostro, tarjeta, etc.) del dispositivo.\n\n` +
        `¿Está seguro de continuar?`
    );
    
    if (!confirmed) {
        showStatus(statusDiv, 'info', 'Operación cancelada');
        return;
    }
    
    try {
        showStatus(statusDiv, 'info', '⏳ Eliminando usuario completamente...');
        
        const data = await fetchAPI(`/commands/deleteuser/${deviceSN}/${personId}`, {
            method: 'POST'
        });

        if (!data) {
            throw new Error('No autenticado o sesión inválida. Por favor inicia sesión de nuevo.');
        }

        showStatus(statusDiv, 'success', 
            `✅ ${data.message}\n` +
            `Usuario: ${data.person_name}`
        );
        
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        showStatus(statusDiv, 'error', `❌ Error: ${error.message}`);
    }
}

/**
 * Mostrar mensaje de estado
 */
function showStatus(element, type, message) {
    element.className = `command-status ${type}`;
    element.textContent = message;
    element.style.display = 'block';
    
    // Auto-ocultar después de 10 segundos
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 10000);
    }
}

// ============================================================================
// FILTROS DE DISPOSITIVOS
// ============================================================================

/**
 * Aplicar filtros al array de dispositivos
 */
function applyFilters() {
    setCommandFilterPauseState();

    let filtered = [...devices];
    
    // Filtro: Solo conectados
    if (filters.onlyConnected) {
        filtered = filtered.filter(d => d.status === 1);
    }
    
    // Filtro: Búsqueda por texto (SN, IP, ubicación)
    if (filters.searchText) {
        filtered = filtered.filter(d => {
            const sn = (d.sn || '').toLowerCase();
            const ip = (d.ip || '').toLowerCase();
            const location = getDeviceLocation(d).toLowerCase();
            
            return sn.includes(filters.searchText) || 
                   ip.includes(filters.searchText) || 
                   location.includes(filters.searchText);
        });
    }
    
    // Filtro: Centro
    if (filters.companyId) {
        filtered = filtered.filter(d => d.company_id == filters.companyId);
    }
    
    // Filtro: Edificio
    if (filters.buildingId) {
        filtered = filtered.filter(d => d.building_id == filters.buildingId);
    }
    
    // Filtro: Aula
    if (filters.classroomId) {
        filtered = filtered.filter(d => d.classroom_id == filters.classroomId);
    }
    
    return filtered;
}

/**
 * Poblar selectores de filtros jerárquicos
 */
function populateFilterSelectors() {
    // Poblar centros
    const companySelect = document.getElementById('filterCommandCompany');
    if (companySelect && state.companies) {
        companySelect.innerHTML = '<option value="">Todos los centros</option>';
        state.companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            companySelect.appendChild(option);
        });
    }
    
    // Inicialmente, edificios y aulas deshabilitados
    updateBuildingFilter();
    updateClassroomFilter();
}

/**
 * Actualizar selector de edificios según centro seleccionado
 */
function updateBuildingFilter() {
    const buildingSelect = document.getElementById('filterCommandBuilding');
    if (!buildingSelect) return;
    
    buildingSelect.innerHTML = '<option value="">Todos los edificios</option>';
    
    if (filters.companyId && state.buildings) {
        const filteredBuildings = state.buildings.filter(b => b.company_id == filters.companyId);
        
        if (filteredBuildings.length > 0) {
            buildingSelect.disabled = false;
            filteredBuildings.forEach(building => {
                const option = document.createElement('option');
                option.value = building.id;
                option.textContent = building.name;
                buildingSelect.appendChild(option);
            });
        } else {
            buildingSelect.disabled = true;
        }
    } else {
        buildingSelect.disabled = true;
    }
}

/**
 * Actualizar selector de aulas según edificio seleccionado
 */
function updateClassroomFilter() {
    const classroomSelect = document.getElementById('filterCommandClassroom');
    if (!classroomSelect) return;
    
    classroomSelect.innerHTML = '<option value="">Todas las aulas</option>';
    
    if (filters.buildingId && state.classrooms) {
        const filteredClassrooms = state.classrooms.filter(c => c.building_id == filters.buildingId);
        
        if (filteredClassrooms.length > 0) {
            classroomSelect.disabled = false;
            filteredClassrooms.forEach(classroom => {
                const option = document.createElement('option');
                option.value = classroom.id;
                option.textContent = classroom.name;
                classroomSelect.appendChild(option);
            });
        } else {
            classroomSelect.disabled = true;
        }
    } else {
        classroomSelect.disabled = true;
    }
}

/**
 * Actualizar contador de resultados filtrados
 */
function updateFilterResultCount() {
    const countDiv = document.getElementById('filterResultCount');
    if (!countDiv) return;
    
    const filteredCount = applyFilters().length;
    const totalCount = devices.length;
    
    if (filteredCount === totalCount) {
        countDiv.textContent = ` Mostrando ${totalCount} dispositivo(s)`;
        countDiv.style.color = '#6c757d';
    } else {
        countDiv.textContent = ` Mostrando ${filteredCount} de ${totalCount} dispositivo(s)`;
        countDiv.style.color = '#0066cc';
        countDiv.style.fontWeight = 'bold';
    }
}

/**
 * Limpiar todos los filtros
 */
function clearFilters() {
    // Resetear estado
    filters = {
        onlyConnected: true,
        searchText: '',
        companyId: '',
        buildingId: '',
        classroomId: ''
    };
    
    // Resetear UI
    const onlyConnectedCheckbox = document.getElementById('filterOnlyConnected');
    if (onlyConnectedCheckbox) onlyConnectedCheckbox.checked = true;
    
    const searchInput = document.getElementById('filterDeviceSearch');
    if (searchInput) searchInput.value = '';
    
    const companySelect = document.getElementById('filterCommandCompany');
    if (companySelect) companySelect.value = '';
    
    const buildingSelect = document.getElementById('filterCommandBuilding');
    if (buildingSelect) {
        buildingSelect.value = '';
        buildingSelect.disabled = true;
        buildingSelect.innerHTML = '<option value="">Todos los edificios</option>';
    }
    
    const classroomSelect = document.getElementById('filterCommandClassroom');
    if (classroomSelect) {
        classroomSelect.value = '';
        classroomSelect.disabled = true;
        classroomSelect.innerHTML = '<option value="">Todas las aulas</option>';
    }

    // Reanudar actualización automática al limpiar filtros
    state.autoRefreshPaused = false;
    state.filtersActive = false;
    hideFilterIndicator();
    
    // Refrescar selectores
    populateDeviceSelectors();
    
    console.log('[Filtros] Filtros limpiados');
}

/**
 * Actualizar filtros jerárquicos cuando se actualiza la organización
 * (Llamado desde afuera cuando se cargan/actualizan centros, edificios, aulas)
 */
export function updateFilters() {
    populateFilterSelectors();
    console.log('[Filtros] Filtros jerárquicos actualizados');
}

/**
 * Actualizar datos cuando se refresca la aplicación
 */
export function updateCommandsData(newDevices, newPersons) {
    devices = newDevices;
    persons = newPersons;
    
    populateDeviceSelectors();
    populateUserSelectors();
}
