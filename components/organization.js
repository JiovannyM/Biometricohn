import { state } from '../config.js';
import { fetchAPI } from '../api.js';
import { elements } from '../utils/dom.js';
import { formatDateTime } from '../utils/formatters.js';

// ==================== COMPANIES ====================

export async function fetchCompanies() {
    try {
        const companies = await fetchAPI('/companies');
        // Verificar si la respuesta es válida (no null por error 401)
        if (!companies) {
            console.warn('[Companies] No se recibieron datos (posible error de autenticación)');
            return [];
        }
        state.companies = companies;
        updateOrganizationUI();
        return companies;
    } catch (error) {
        console.error('Error al cargar centros/empresas:', error);
        return [];
    }
}

// ==================== DELETE HELPERS ====================

export async function deleteCompany(id) {
    try {
        await fetchAPI(`/companies/${id}`, { method: 'DELETE' });
        await fetchCompanies();
        return true;
    } catch (error) {
        throw error;
    }
}

export async function deleteBuilding(id) {
    try {
        await fetchAPI(`/buildings/${id}`, { method: 'DELETE' });
        await fetchBuildings();
        return true;
    } catch (error) {
        throw error;
    }
}

export async function deleteClassroom(id) {
    try {
        await fetchAPI(`/classrooms/${id}`, { method: 'DELETE' });
        await fetchClassrooms();
        return true;
    } catch (error) {
        throw error;
    }
}

export async function createCompany(companyData) {
    try {
        await fetchAPI('/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyData)
        });
        await fetchCompanies();
        return true;
    } catch (error) {
        throw error;
    }
}

export async function updateCompany(id, companyData) {
    try {
        await fetchAPI(`/companies/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyData)
        });
        await fetchCompanies();
        return true;
    } catch (error) {
        throw error;
    }
}

// ==================== BUILDINGS ====================

export async function fetchBuildings(companyId = null) {
    try {
        const endpoint = companyId ? `/buildings?company_id=${companyId}` : '/buildings';
        const buildings = await fetchAPI(endpoint);
        // Verificar si la respuesta es válida (no null por error 401)
        if (!buildings) {
            console.warn('[Buildings] No se recibieron datos (posible error de autenticación)');
            return [];
        }
        state.buildings = buildings;
        updateOrganizationUI();
        return buildings;
    } catch (error) {
        console.error('Error al cargar edificios:', error);
        return [];
    }
}

export async function createBuilding(buildingData) {
    try {
        await fetchAPI('/buildings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildingData)
        });
        await fetchBuildings();
        return true;
    } catch (error) {
        throw error;
    }
}

export async function updateBuilding(id, buildingData) {
    try {
        await fetchAPI(`/buildings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildingData)
        });
        await fetchBuildings();
        return true;
    } catch (error) {
        throw error;
    }
}

// ==================== CLASSROOMS ====================

export async function fetchClassrooms(buildingId = null) {
    try {
        const endpoint = buildingId ? `/classrooms?building_id=${buildingId}` : '/classrooms';
        const classrooms = await fetchAPI(endpoint);
        // Verificar si la respuesta es válida (no null por error 401)
        if (!classrooms) {
            console.warn('[Classrooms] No se recibieron datos (posible error de autenticación)');
            return [];
        }
        state.classrooms = classrooms;
        updateOrganizationUI();
        return classrooms;
    } catch (error) {
        console.error('Error al cargar aulas:', error);
        return [];
    }
}

export async function createClassroom(classroomData) {
    try {
        await fetchAPI('/classrooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(classroomData)
        });
        await fetchClassrooms();
        return true;
    } catch (error) {
        throw error;
    }
}

export async function updateClassroom(id, classroomData) {
    try {
        await fetchAPI(`/classrooms/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(classroomData)
        });
        await fetchClassrooms();
        return true;
    } catch (error) {
        throw error;
    }
}

// ==================== UI UPDATE ====================

function updateOrganizationUI() {
    elements.totalCompanies.textContent = state.companies.length;
    elements.totalBuildings.textContent = state.buildings.length;
    elements.totalClassrooms.textContent = state.classrooms.length;
    
    // Obtener rol del usuario actual
    let userRole = 'viewer';
    try {
        const userInfo = localStorage.getItem('user_info');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            userRole = user.role;
        }
    } catch (error) {
        console.error('Error obteniendo rol del usuario:', error);
    }

    const canEditLocations = ['operator', 'admin', 'super_admin'].includes(userRole);
    
    // Renderizar tabla de centros
    const companiesTableBody = document.getElementById('companiesTableBody');
    if (companiesTableBody) {
        if (state.companies.length === 0) {
            companiesTableBody.innerHTML = '<tr><td colspan="4" class="empty">No hay centros registrados</td></tr>';
        } else {
            companiesTableBody.innerHTML = state.companies.map(company => `
                <tr>
                    <td>${company.id}</td>
                    <td><strong>${company.name}</strong></td>
                    <td>${formatDateTime(company.created_at)}</td>
                    <td>
                        ${canEditLocations ? `
                            <button class="btn-edit-location btn-edit-company" data-id="${company.id}" data-name="${company.name}">
                                 Editar
                            </button>
                            <button class="btn-delete btn-delete-company" data-id="${company.id}">Eliminar</button>
                        ` : '<span style="color: #999;">🔒 Solo lectura</span>'}
                    </td>
                </tr>
            `).join('');
        }
    }
    
    // Renderizar tabla de edificios
    const buildingsTableBody = document.getElementById('buildingsTableBody');
    if (buildingsTableBody) {
        if (state.buildings.length === 0) {
            buildingsTableBody.innerHTML = '<tr><td colspan="5" class="empty">No hay edificios registrados</td></tr>';
        } else {
            buildingsTableBody.innerHTML = state.buildings.map(building => {
                const company = state.companies.find(c => c.id === building.company_id);
                return `
                    <tr>
                        <td>${building.id}</td>
                        <td><strong>${building.name}</strong></td>
                        <td>${company ? company.name : 'N/A'}</td>
                        <td>${formatDateTime(building.created_at)}</td>
                        <td>
                            ${canEditLocations ? `
                                <button class="btn-edit-location btn-edit-building" 
                                    data-id="${building.id}" 
                                    data-name="${building.name}" 
                                    data-company-id="${building.company_id}">
                                     Editar
                                </button>
                                <button class="btn-delete btn-delete-building" data-id="${building.id}">Eliminar</button>
                            ` : '<span style="color: #999;">🔒 Solo lectura</span>'}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
    
    // Renderizar tabla de aulas
    const classroomsTableBody = document.getElementById('classroomsTableBody');
    if (classroomsTableBody) {
        if (state.classrooms.length === 0) {
            classroomsTableBody.innerHTML = '<tr><td colspan="6" class="empty">No hay aulas registradas</td></tr>';
        } else {
            classroomsTableBody.innerHTML = state.classrooms.map(classroom => {
                const building = state.buildings.find(b => b.id === classroom.building_id);
                const company = building ? state.companies.find(c => c.id === building.company_id) : null;
                return `
                    <tr>
                        <td>${classroom.code || 'N/A'}</td>
                        <td><strong>${classroom.name}</strong></td>
                        <td>${building ? building.name : 'N/A'}</td>
                        <td>${company ? company.name : 'N/A'}</td>
                        <td>${formatDateTime(classroom.created_at)}</td>
                        <td>
                            ${canEditLocations ? `
                                <button class="btn-edit-location btn-edit-classroom" 
                                    data-id="${classroom.id}" 
                                    data-name="${classroom.name}"
                                    data-code="${classroom.code || ''}" 
                                    data-building-id="${classroom.building_id}">
                                     Editar
                                </button>
                                <button class="btn-delete btn-delete-classroom" data-id="${classroom.id}">Eliminar</button>
                            ` : '<span style="color: #999;">🔒 Solo lectura</span>'}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Si hay filtros activos en Gestión de Ubicaciones, reaplicarlos
    // para evitar que un refresh en vuelo sobrescriba la vista filtrada.
    reapplyLocationFiltersIfActive();
}

function reapplyLocationFiltersIfActive() {
    const activeView = document.querySelector('.view-section.active')?.id?.replace('view-', '') || state.currentView;
    if (activeView !== 'ubicaciones') {
        return;
    }

    const searchCompany = document.getElementById('searchCompany');
    const searchBuilding = document.getElementById('searchBuilding');
    const filterBuildingCompany = document.getElementById('filterBuildingCompany');
    const searchClassroom = document.getElementById('searchClassroom');
    const filterClassroomCompany = document.getElementById('filterClassroomCompany');
    const filterClassroomBuilding = document.getElementById('filterClassroomBuilding');

    if (searchCompany && searchCompany.value.trim()) {
        searchCompany.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if ((filterBuildingCompany && filterBuildingCompany.value) || (searchBuilding && searchBuilding.value.trim())) {
        if (filterBuildingCompany && filterBuildingCompany.value) {
            filterBuildingCompany.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (searchBuilding && searchBuilding.value.trim()) {
            searchBuilding.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    if (
        (filterClassroomCompany && filterClassroomCompany.value) ||
        (filterClassroomBuilding && filterClassroomBuilding.value) ||
        (searchClassroom && searchClassroom.value.trim())
    ) {
        if (filterClassroomCompany && filterClassroomCompany.value) {
            filterClassroomCompany.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (filterClassroomBuilding && filterClassroomBuilding.value) {
            filterClassroomBuilding.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (searchClassroom && searchClassroom.value.trim()) {
            searchClassroom.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
}

// ==================== SELECTORS CASCADE ====================

export async function loadDeviceSelectors() {
    const deviceCompany = document.getElementById('deviceCompany');
    const deviceBuilding = document.getElementById('deviceBuilding');
    const deviceClassroom = document.getElementById('deviceClassroom');

    await fetchCompanies();
    deviceCompany.innerHTML = '<option value="">Sin asignar</option>' +
        state.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

export async function onDeviceCompanyChange() {
    const deviceCompany = document.getElementById('deviceCompany');
    const deviceBuilding = document.getElementById('deviceBuilding');
    const deviceClassroom = document.getElementById('deviceClassroom');
    
    const companyId = deviceCompany.value;
    
    if (!companyId) {
        deviceBuilding.disabled = true;
        deviceBuilding.innerHTML = '<option value="">Seleccione primero un centro</option>';
        deviceClassroom.disabled = true;
        deviceClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
        return;
    }
    
    const buildings = await fetchBuildings(companyId);
    deviceBuilding.disabled = false;
    deviceBuilding.innerHTML = '<option value="">Seleccionar...</option>' +
        buildings.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    
    deviceClassroom.disabled = true;
    deviceClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
}

export async function onDeviceBuildingChange() {
    const deviceBuilding = document.getElementById('deviceBuilding');
    const deviceClassroom = document.getElementById('deviceClassroom');
    
    const buildingId = deviceBuilding.value;
    
    if (!buildingId) {
        deviceClassroom.disabled = true;
        deviceClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
        return;
    }
    
    const classrooms = await fetchClassrooms(buildingId);
    deviceClassroom.disabled = false;
    deviceClassroom.innerHTML = '<option value="">Sin asignar</option>' +
        classrooms.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

export async function loadClassroomFormSelectors() {
    const classroomCompany = document.getElementById('classroomCompany');
    const classroomBuilding = document.getElementById('classroomBuilding');
    
    await fetchCompanies();
    classroomCompany.innerHTML = '<option value="">Seleccionar...</option>' +
        state.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

export async function onClassroomCompanyChange() {
    const classroomCompany = document.getElementById('classroomCompany');
    const classroomBuilding = document.getElementById('classroomBuilding');
    
    const companyId = classroomCompany.value;
    
    if (!companyId) {
        classroomBuilding.disabled = true;
        classroomBuilding.innerHTML = '<option value="">Seleccione primero un centro</option>';
        return;
    }
    
    const buildings = await fetchBuildings(companyId);
    classroomBuilding.disabled = false;
    classroomBuilding.innerHTML = '<option value="">Seleccionar...</option>' +
        buildings.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
}

export async function loadBuildingFormSelectors() {
    const buildingCompany = document.getElementById('buildingCompany');
    
    await fetchCompanies();
    buildingCompany.innerHTML = '<option value="">Seleccionar...</option>' +
        state.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}
