import { state } from '../config.js';
import { fetchBuildings, fetchClassrooms } from '../components/organization.js';
import { fetchDevices } from '../components/devices.js';
import { fetchRecords } from '../components/records.js';
import { formatDateTime } from './formatters.js';

// ==================== DEVICE FILTERS ====================

let deviceFilters = {
    companyId: '',
    buildingId: ''
};

export function initDeviceFilters() {
    const filterCompany = document.getElementById('filterDeviceCompany');
    const filterBuilding = document.getElementById('filterDeviceBuilding');
    const clearButton = document.getElementById('clearDeviceFilters');
    
    // Cargar centros
    if (filterCompany) {
        filterCompany.innerHTML = '<option value="">Todos</option>' +
            state.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    
    // Evento de cambio de centro
    if (filterCompany) {
        filterCompany.addEventListener('change', async (e) => {
            deviceFilters.companyId = e.target.value;
            deviceFilters.buildingId = '';
            
            if (deviceFilters.companyId) {
                const buildings = await fetchBuildings(deviceFilters.companyId);
                filterBuilding.disabled = false;
                filterBuilding.innerHTML = '<option value="">Todos</option>' +
                    buildings.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
            } else {
                filterBuilding.disabled = true;
                filterBuilding.innerHTML = '<option value="">Seleccione primero un centro</option>';
            }
            
            applyDeviceFilters();
        });
    }
    
    // Evento de cambio de edificio
    if (filterBuilding) {
        filterBuilding.addEventListener('change', (e) => {
            deviceFilters.buildingId = e.target.value;
            applyDeviceFilters();
        });
    }
    
    // Limpiar filtros
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            deviceFilters = { companyId: '', buildingId: '' };
            filterCompany.value = '';
            filterBuilding.disabled = true;
            filterBuilding.innerHTML = '<option value="">Seleccione primero un centro</option>';
            
            // Reactivar actualización automática
            state.autoRefreshPaused = false;
            state.filtersActive = false;
            hideFilterIndicator();
            
            applyDeviceFilters();
        });
    }
}

function applyDeviceFilters() {
    const devicesBody = document.getElementById('devicesBody');
    if (!devicesBody) return;
    
    let filteredDevices = state.devices;
    
    // Verificar si hay filtros activos
    const hasActiveFilters = deviceFilters.companyId || deviceFilters.buildingId;
    
    if (hasActiveFilters) {
        state.autoRefreshPaused = true;
        state.filtersActive = true;
        showFilterIndicator();
    } else {
        state.autoRefreshPaused = false;
        state.filtersActive = false;
        hideFilterIndicator();
    }
    
    if (deviceFilters.companyId) {
        filteredDevices = filteredDevices.filter(d => d.company_id == deviceFilters.companyId);
    }
    
    if (deviceFilters.buildingId) {
        filteredDevices = filteredDevices.filter(d => d.building_id == deviceFilters.buildingId);
    }
    
    // Actualizar la tabla (replicar la lógica de updateDevicesUI pero con filteredDevices)
    renderFilteredDevices(filteredDevices);
}

function renderFilteredDevices(filteredDevices) {
    const devicesBody = document.getElementById('devicesBody');
    
    if (filteredDevices.length === 0) {
        devicesBody.innerHTML = '<tr><td colspan="7" class="empty">No se encontraron dispositivos con los filtros aplicados</td></tr>';
        return;
    }
    
    devicesBody.innerHTML = filteredDevices.map(device => {
        let location = 'Sin asignar';
        if (device.company_name) {
            location = `<strong>${device.company_name}</strong>`;
            if (device.building_name) {
                location += `<br><small>${device.building_name}`;
                if (device.classroom_name) {
                    location += ` - ${device.classroom_name}`;
                }
                location += `</small>`;
            }
        }

        return `
        <tr>
            <td>
                <span class="device-status ${device.status === 1 ? 'online' : 'offline'}">
                    ${device.status === 1 ? 'Conectado' : 'Desconectado'}
                </span>
            </td>
            <td><strong>${device.sn}</strong></td>
            <td>${device.ip || 'N/A'}</td>
            <td>${location}</td>
            <td>${formatDateTime(device.last_activity)}</td>
            <td>${formatDateTime(device.created_at)}</td>
            <td>
                <button class="btn-edit" 
                    data-device-id="${device.id}" 
                    data-device-sn="${device.sn}" 
                    data-device-ip="${device.ip || ''}"
                    data-company-id="${device.company_id || ''}"
                    data-building-id="${device.building_id || ''}"
                    data-classroom-id="${device.classroom_id || ''}">
                    Editar
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// ==================== USER FILTERS ====================

let userFilters = {
    companyId: '',
    buildingId: '',
    classroomId: ''
};

export function initUserFilters() {
    const filterCompany = document.getElementById('filterUserCompany');
    const filterBuilding = document.getElementById('filterUserBuilding');
    const filterClassroom = document.getElementById('filterUserClassroom');
    const clearButton = document.getElementById('clearUserFilters');
    
    // Cargar centros
    if (filterCompany) {
        filterCompany.innerHTML = '<option value="">Todos</option>' +
            state.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    
    // Evento de cambio de centro
    if (filterCompany) {
        filterCompany.addEventListener('change', async (e) => {
            userFilters.companyId = e.target.value;
            userFilters.buildingId = '';
            userFilters.classroomId = '';
            
            if (userFilters.companyId) {
                const buildings = await fetchBuildings(userFilters.companyId);
                filterBuilding.disabled = false;
                filterBuilding.innerHTML = '<option value="">Todos</option>' +
                    buildings.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
                filterClassroom.disabled = true;
                filterClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
            } else {
                filterBuilding.disabled = true;
                filterBuilding.innerHTML = '<option value="">Seleccione primero un centro</option>';
                filterClassroom.disabled = true;
                filterClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
            }
            
            applyUserFilters();
        });
    }
    
    // Evento de cambio de edificio
    if (filterBuilding) {
        filterBuilding.addEventListener('change', async (e) => {
            userFilters.buildingId = e.target.value;
            userFilters.classroomId = '';
            
            if (userFilters.buildingId) {
                const classrooms = await fetchClassrooms(userFilters.buildingId);
                filterClassroom.disabled = false;
                filterClassroom.innerHTML = '<option value="">Todos</option>' +
                    classrooms.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            } else {
                filterClassroom.disabled = true;
                filterClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
            }
            
            applyUserFilters();
        });
    }
    
    // Evento de cambio de aula
    if (filterClassroom) {
        filterClassroom.addEventListener('change', (e) => {
            userFilters.classroomId = e.target.value;
            applyUserFilters();
        });
    }
    
    // Limpiar filtros
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            userFilters = { companyId: '', buildingId: '', classroomId: '' };
            filterCompany.value = '';
            filterBuilding.disabled = true;
            filterBuilding.innerHTML = '<option value="">Seleccione primero un centro</option>';
            filterClassroom.disabled = true;
            filterClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
            
            // Reactivar actualización automática
            state.autoRefreshPaused = false;
            state.filtersActive = false;
            hideFilterIndicator();
            
            applyUserFilters();
        });
    }
}

function applyUserFilters() {
    // Verificar si hay filtros activos
    const hasActiveFilters = userFilters.companyId || userFilters.buildingId || userFilters.classroomId;
    
    if (hasActiveFilters) {
        state.autoRefreshPaused = true;
        state.filtersActive = true;
        showFilterIndicator();
    } else {
        state.autoRefreshPaused = false;
        state.filtersActive = false;
        hideFilterIndicator();
    }
    
    // Por ahora, filtrar solo muestra todos los usuarios ya que no tenemos relación directa
    // En un futuro, esto debería consultar UserTemp para ver en qué dispositivos está cada usuario
    console.log('User filters:', userFilters);
}

// ==================== RECORD FILTERS ====================

let recordFilters = {
    companyId: '',
    buildingId: '',
    classroomId: '',
    period: 'month',
    dateFrom: null,
    dateTo: null
};

let currentFilteredRecords = [];

export function reapplyRecordFilters() {
    // Siempre aplicar filtros, incluso si son solo los filtros por defecto (mes)
    // Esto asegura que los datos se filtren correctamente al cargar
    applyRecordFilters();
}

export function initRecordFilters() {
    const filterCompany = document.getElementById('filterRecordCompany');
    const filterBuilding = document.getElementById('filterRecordBuilding');
    const filterClassroom = document.getElementById('filterRecordClassroom');
    const clearButton = document.getElementById('clearRecordFilters');
    const filterPeriod = document.getElementById('filterRecordPeriod');
    const dateFrom = document.getElementById('filterDateFrom');
    const dateTo = document.getElementById('filterDateTo');
    
    // Cargar centros
    if (filterCompany) {
        filterCompany.innerHTML = '<option value="">Todos</option>' +
            state.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    
    // Aplicar filtro inicial del mes al cargar
    console.log('[Filtros] Aplicando filtro inicial del mes...');
    setTimeout(() => {
        applyRecordFilters();
    }, 100);
    
    // Evento de cambio de período - Aplicar automáticamente
    if (filterPeriod) {
        filterPeriod.addEventListener('change', (e) => {
            recordFilters.period = e.target.value;
            recordFilters.dateFrom = null;
            recordFilters.dateTo = null;
            
            // Limpiar campos de fecha al seleccionar un período predefinido
            if (dateFrom) dateFrom.value = '';
            if (dateTo) dateTo.value = '';
            
            // Aplicar filtro inmediatamente
            applyRecordFilters();
        });
    }
    
    // Aplicar filtro automáticamente al cambiar fecha "Desde"
    if (dateFrom) {
        dateFrom.addEventListener('change', () => {
            console.log('[Filtros] Fecha Desde cambiada:', dateFrom.value);
            if (dateFrom.value) {
                if (!dateTo.value) {
                    // Si solo hay fecha "desde", establecer "hasta" como hoy
                    const today = new Date().toISOString().split('T')[0];
                    dateTo.value = today;
                }
                recordFilters.period = 'custom';
                recordFilters.dateFrom = dateFrom.value;
                recordFilters.dateTo = dateTo.value;
                if (filterPeriod) filterPeriod.value = 'all';
                console.log('[Filtros] Aplicando filtro personalizado:', recordFilters.dateFrom, 'a', recordFilters.dateTo);
                applyRecordFilters();
            }
        });
    }
    
    // Aplicar filtro automáticamente al cambiar fecha "Hasta"
    if (dateTo) {
        dateTo.addEventListener('change', () => {
            console.log('[Filtros] Fecha Hasta cambiada:', dateTo.value);
            if (dateTo.value) {
                if (!dateFrom.value) {
                    // Si solo hay fecha "hasta", establecer "desde" como 7 días antes
                    const toDate = new Date(dateTo.value);
                    toDate.setDate(toDate.getDate() - 7);
                    dateFrom.value = toDate.toISOString().split('T')[0];
                }
                recordFilters.period = 'custom';
                recordFilters.dateFrom = dateFrom.value;
                recordFilters.dateTo = dateTo.value;
                if (filterPeriod) filterPeriod.value = 'all';
                console.log('[Filtros] Aplicando filtro personalizado:', recordFilters.dateFrom, 'a', recordFilters.dateTo);
                applyRecordFilters();
            }
        });
    }
    
    // Hacer que todo el label de fecha abra el calendario al hacer clic
    const labelDateFrom = document.getElementById('labelDateFrom');
    const labelDateTo = document.getElementById('labelDateTo');
    
    if (labelDateFrom && dateFrom) {
        // Clic en cualquier parte del label (incluido el span)
        labelDateFrom.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Intentar usar showPicker() si está disponible
            if (typeof dateFrom.showPicker === 'function') {
                try {
                    dateFrom.showPicker();
                } catch (err) {
                    dateFrom.focus();
                }
            } else {
                dateFrom.focus();
            }
        });
        
        // Clic directo en el input (área dd/mm/aaaa)
        dateFrom.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof dateFrom.showPicker === 'function') {
                try {
                    dateFrom.showPicker();
                } catch (err) {
                    // El calendario se abrirá por comportamiento nativo
                }
            }
        });
    }
    
    if (labelDateTo && dateTo) {
        // Clic en cualquier parte del label (incluido el span)
        labelDateTo.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Intentar usar showPicker() si está disponible
            if (typeof dateTo.showPicker === 'function') {
                try {
                    dateTo.showPicker();
                } catch (err) {
                    dateTo.focus();
                }
            } else {
                dateTo.focus();
            }
        });
        
        // Clic directo en el input (área dd/mm/aaaa)
        dateTo.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof dateTo.showPicker === 'function') {
                try {
                    dateTo.showPicker();
                } catch (err) {
                    // El calendario se abrirá por comportamiento nativo
                }
            }
        });
    }
    
    // Descargar registros
    const downloadBtn = document.getElementById('downloadRecords');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            downloadFilteredRecords();
        });
    }
    
    // Evento de cambio de centro
    if (filterCompany) {
        filterCompany.addEventListener('change', async (e) => {
            recordFilters.companyId = e.target.value;
            recordFilters.buildingId = '';
            recordFilters.classroomId = '';
            
            console.log('[Filtros] Centro seleccionado:', recordFilters.companyId);
            
            if (recordFilters.companyId) {
                const buildings = await fetchBuildings(recordFilters.companyId);
                console.log('[Filtros] Edificios cargados:', buildings.length);
                filterBuilding.disabled = false;
                filterBuilding.innerHTML = '<option value="">Todos</option>' +
                    buildings.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
                filterClassroom.disabled = true;
                filterClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
            } else {
                filterBuilding.disabled = true;
                filterBuilding.innerHTML = '<option value="">Seleccione primero un centro</option>';
                filterClassroom.disabled = true;
                filterClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
            }
            
            applyRecordFilters();
        });
    }
    
    // Evento de cambio de edificio
    if (filterBuilding) {
        filterBuilding.addEventListener('change', async (e) => {
            recordFilters.buildingId = e.target.value;
            recordFilters.classroomId = '';
            
            console.log('[Filtros] Edificio seleccionado:', recordFilters.buildingId);
            
            if (recordFilters.buildingId) {
                const classrooms = await fetchClassrooms(recordFilters.buildingId);
                console.log('[Filtros] Aulas cargadas:', classrooms.length);
                filterClassroom.disabled = false;
                filterClassroom.innerHTML = '<option value="">Todos</option>' +
                    classrooms.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            } else {
                filterClassroom.disabled = true;
                filterClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
            }
            
            applyRecordFilters();
        });
    }
    
    // Evento de cambio de aula
    if (filterClassroom) {
        filterClassroom.addEventListener('change', (e) => {
            recordFilters.classroomId = e.target.value;
            console.log('[Filtros] Aula seleccionada:', recordFilters.classroomId);
            applyRecordFilters();
        });
    }
    
    // Limpiar filtros
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            console.log('[Filtros] Limpiando todos los filtros...');
            recordFilters = { companyId: '', buildingId: '', classroomId: '', period: 'month', dateFrom: null, dateTo: null };
            filterCompany.value = '';
            filterBuilding.disabled = true;
            filterBuilding.innerHTML = '<option value="">Seleccione primero un centro</option>';
            filterClassroom.disabled = true;
            filterClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
            
            if (filterPeriod) filterPeriod.value = 'month';
            if (dateFrom) dateFrom.value = '';
            if (dateTo) dateTo.value = '';
            
            // Reactivar actualización automática
            state.autoRefreshPaused = false;
            state.filtersActive = false;
            
            // Ocultar indicador de filtros activos
            hideFilterIndicator();
            
            applyRecordFilters();
        });
    }
}

async function applyRecordFilters() {
    const recordsBody = document.getElementById('recordsBody');
    if (!recordsBody) return;
    
    console.log('[Filtros] Aplicando filtros de registros...');
    console.log('[Filtros] Filtros actuales:', {
        period: recordFilters.period,
        companyId: recordFilters.companyId,
        buildingId: recordFilters.buildingId,
        classroomId: recordFilters.classroomId
    });
    console.log('[Filtros] Total de registros disponibles:', state.records.length);
    console.log('[Filtros] Total de dispositivos:', state.devices.length);
    
    // Mostrar algunos devices de ejemplo para debug
    if (state.devices.length > 0) {
        console.log('[Filtros] Ejemplo de device:', {
            sn: state.devices[0].sn,
            company_id: state.devices[0].company_id,
            company_name: state.devices[0].company_name,
            building_id: state.devices[0].building_id,
            building_name: state.devices[0].building_name,
            classroom_id: state.devices[0].classroom_id,
            classroom_name: state.devices[0].classroom_name
        });
    }
    
    // Pausar actualización automática cuando hay filtros activos diferentes al período por defecto
    // 'month' es el período por defecto, otros períodos o filtros de ubicación pausan el auto-refresh
    const hasActiveFilters = (recordFilters.companyId && recordFilters.companyId !== '') || 
                            (recordFilters.buildingId && recordFilters.buildingId !== '') || 
                            (recordFilters.classroomId && recordFilters.classroomId !== '') || 
                            (recordFilters.period !== 'month') ||
                            recordFilters.dateFrom || 
                            recordFilters.dateTo;
    
    console.log('[Filtros] Tiene filtros activos?', hasActiveFilters);
    
    // Solo la vista de registros debe controlar el estado global de auto-refresh.
    // Evita que este filtro pise el estado cuando el usuario está en otras pestañas.
    if (state.currentView === 'registros') {
        if (hasActiveFilters) {
            state.autoRefreshPaused = true;
            state.filtersActive = true;
            showFilterIndicator(); // Mostrar indicador visual
        } else {
            // Si no hay filtros activos (período en 'all' y sin otros filtros), reactivar actualización
            state.autoRefreshPaused = false;
            state.filtersActive = false;
            hideFilterIndicator(); // Ocultar indicador
        }
    }
    
    let filteredRecords = state.records;
    
    // Filtrar por fecha
    if (recordFilters.period !== 'all') {
        console.log('[Filtros] Aplicando filtro de período:', recordFilters.period);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        console.log('[Filtros] Fecha actual:', now.toISOString());
        console.log('[Filtros] Registros antes de filtrar por fecha:', filteredRecords.length);
        
        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.records_time);
            const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
            
            switch (recordFilters.period) {
                case 'today':
                    return recordDay.getTime() === today.getTime();
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    return recordDay.getTime() === yesterday.getTime();
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return recordDay >= weekAgo;
                case 'month':
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    return recordDay >= monthStart;
                case 'custom':
                    if (recordFilters.dateFrom && recordFilters.dateTo) {
                        const fromDate = new Date(recordFilters.dateFrom + 'T00:00:00');
                        const toDate = new Date(recordFilters.dateTo + 'T23:59:59');
                        const isInRange = recordDate >= fromDate && recordDate <= toDate;
                        if (!isInRange) {
                            console.log('[Filtros] Registro fuera de rango:', {
                                recordDate: recordDate.toISOString(),
                                fromDate: fromDate.toISOString(),
                                toDate: toDate.toISOString()
                            });
                        }
                        return isInRange;
                    }
                    console.log('[Filtros] Período custom pero faltan fechas:', recordFilters);
                    return true;
                default:
                    return true;
            }
        });
        
        console.log('[Filtros] Registros después de filtrar por fecha:', filteredRecords.length);
    }
    
    // Filtrar por ubicación del dispositivo
    if (recordFilters.companyId || recordFilters.buildingId || recordFilters.classroomId) {
        console.log('[Filtros] Filtrando por ubicación:', {
            companyId: recordFilters.companyId,
            buildingId: recordFilters.buildingId,
            classroomId: recordFilters.classroomId
        });
        console.log('[Filtros] Registros antes de filtrar por ubicación:', filteredRecords.length);
        
        // Contar cuántos devices tienen el company_id buscado
        if (recordFilters.companyId) {
            const matchingDevices = state.devices.filter(d => 
                String(d.company_id) === String(recordFilters.companyId)
            );
            console.log(`[Filtros] Dispositivos con company_id ${recordFilters.companyId}:`, matchingDevices.length);
            if (matchingDevices.length > 0) {
                console.log('[Filtros] Ejemplo de device que coincide:', {
                    sn: matchingDevices[0].sn,
                    company_id: matchingDevices[0].company_id,
                    company_name: matchingDevices[0].company_name,
                    building_id: matchingDevices[0].building_id,
                    building_name: matchingDevices[0].building_name
                });
            }
        }
        
        filteredRecords = filteredRecords.filter(record => {
            const device = state.devices.find(d => d.sn === record.device_serial_num);
            
            if (!device) {
                console.log('[Filtros] Dispositivo no encontrado para serial:', record.device_serial_num);
                return false;
            }
            
            // Filtrar por centro (solo si está seleccionado un centro)
            if (recordFilters.companyId && recordFilters.companyId !== '') {
                const deviceCompanyId = device.company_id ? String(device.company_id) : '';
                const filterCompanyId = String(recordFilters.companyId);
                
                if (deviceCompanyId !== filterCompanyId) {
                    return false;
                }
            }
            
            // Filtrar por edificio (solo si está seleccionado un edificio)
            if (recordFilters.buildingId && recordFilters.buildingId !== '') {
                const deviceBuildingId = device.building_id ? String(device.building_id) : '';
                const filterBuildingId = String(recordFilters.buildingId);
                
                if (deviceBuildingId !== filterBuildingId) {
                    return false;
                }
            }
            
            // Filtrar por aula (solo si está seleccionada un aula)
            if (recordFilters.classroomId && recordFilters.classroomId !== '') {
                const deviceClassroomId = device.classroom_id ? String(device.classroom_id) : '';
                const filterClassroomId = String(recordFilters.classroomId);
                
                if (deviceClassroomId !== filterClassroomId) {
                    return false;
                }
            }
            
            return true;
        });
        
        console.log('[Filtros] Registros después de filtrar por ubicación:', filteredRecords.length);
    }
    
    // Guardar registros filtrados para descarga
    currentFilteredRecords = filteredRecords;
    
    console.log('[Filtros] ===== RESUMEN DE FILTRADO =====');
    console.log('[Filtros] Registros totales:', state.records.length);
    console.log('[Filtros] Registros finales mostrados:', filteredRecords.length);
    console.log('[Filtros] Filtros aplicados:', {
        periodo: recordFilters.period,
        centro: recordFilters.companyId || 'Todos',
        edificio: recordFilters.buildingId || 'Todos',
        aula: recordFilters.classroomId || 'Todos'
    });
    console.log('[Filtros] ================================');
    
    // Actualizar contador de registros
    const todayRecordsElement = document.getElementById('todayRecords');
    if (todayRecordsElement) {
        todayRecordsElement.textContent = filteredRecords.length;
    }
    
    // Actualizar la tabla
    renderFilteredRecords(filteredRecords);
}

async function renderFilteredRecords(filteredRecords) {
    const recordsBody = document.getElementById('recordsBody');
    
    if (filteredRecords.length === 0) {
        recordsBody.innerHTML = '<tr><td colspan="6" class="empty">No se encontraron registros con los filtros aplicados</td></tr>';
        return;
    }
    
    recordsBody.innerHTML = filteredRecords.map(record => {
        const inoutText = record.inout === 0 ? 'Entrada' : 'Salida';
        const inoutClass = record.inout === 0 ? 'entrada' : 'salida';
        
        const person = state.persons.find(p => p.id === record.enroll_id);
        const userName = person ? person.name : `ID: ${record.enroll_id}`;
        
        const device = state.devices.find(d => d.sn === record.device_serial_num);
        let deviceLocation = 'N/A';
        if (device && device.company_name) {
            deviceLocation = device.company_name;
            if (device.building_name) {
                deviceLocation += ` / ${device.building_name}`;
                if (device.classroom_name) {
                    deviceLocation += ` / ${device.classroom_name}`;
                }
            }
        }
        
        let tempHtml = 'N/A';
        if (record.temperature) {
            const isHigh = record.temperature >= 37.5;
            tempHtml = `<span class="temperature ${isHigh ? 'high' : 'normal'}">${record.temperature}°C ${isHigh ? 'Alto' : 'OK'}</span>`;
        }

        return `
            <tr>
                <td>${formatDateTime(record.records_time)}</td>
                <td><strong>${userName}</strong></td>
                <td>${record.device_serial_num}</td>
                <td><small>${deviceLocation}</small></td>
                <td><span class="record-type ${inoutClass}">${inoutText}</span></td>
                <td>${tempHtml}</td>
            </tr>
        `;
    }).join('');
}

// ==================== FILTER INDICATOR ====================

export function showFilterIndicator() {
    // Buscar o crear el indicador
    let indicator = document.getElementById('filterActiveIndicator');
    
    if (!indicator) {
        // Crear el indicador si no existe
        indicator = document.createElement('div');
        indicator.id = 'filterActiveIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
            z-index: 9999;
            font-weight: 600;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease-out;
        `;
        indicator.innerHTML = `
            <span style="font-size: 18px;">⏸️</span>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <span>Filtros activos</span>
                <small style="opacity: 0.9; font-size: 11px; font-weight: 400;">Actualización automática pausada</small>
            </div>
        `;
        
        // Agregar animación CSS si no existe
        if (!document.getElementById('filterIndicatorStyles')) {
            const style = document.createElement('style');
            style.id = 'filterIndicatorStyles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(indicator);
    }
    
    indicator.style.display = 'flex';
}

export function hideFilterIndicator() {
    const indicator = document.getElementById('filterActiveIndicator');
    if (indicator) {
        indicator.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            indicator.style.display = 'none';
            indicator.style.animation = 'slideInRight 0.3s ease-out';
        }, 300);
    }
}

// ==================== LOCATION FILTERS ====================

let buildingFilters = {
    companyId: '',
    searchTerm: ''
};

let classroomFilters = {
    companyId: '',
    buildingId: '',
    searchTerm: ''
};

let companySearchTerm = '';

export function initLocationFilters() {
    initNavigationButtons();
    initSearchInputs();
    initClearFilters();
    initBuildingFilters();
    initClassroomLocationFilters();
}

function initNavigationButtons() {
    const navButtons = document.querySelectorAll('.btn-nav');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover clase active de todos los botones
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar clase active al botón clickeado
            button.classList.add('active');
            
            // Obtener la sección a mostrar
            const sectionName = button.dataset.section;
            
            // Ocultar todas las secciones
            document.querySelectorAll('.location-section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Mostrar la sección seleccionada
            const selectedSection = document.getElementById(`section-${sectionName}`);
            if (selectedSection) {
                selectedSection.classList.remove('hidden');
            }
        });
    });
}

function initSearchInputs() {
    // Búsqueda de centros
    const searchCompany = document.getElementById('searchCompany');
    if (searchCompany) {
        searchCompany.addEventListener('input', (e) => {
            companySearchTerm = e.target.value.toLowerCase();
            if (companySearchTerm) {
                state.autoRefreshPaused = true;
                state.filtersActive = true;
                showFilterIndicator();
            } else {
                applyCompanySearch();
                return;
            }
            applyCompanySearch();
        });
    }
    
    // Búsqueda de edificios
    const searchBuilding = document.getElementById('searchBuilding');
    if (searchBuilding) {
        searchBuilding.addEventListener('input', (e) => {
            buildingFilters.searchTerm = e.target.value.toLowerCase();
            if (buildingFilters.companyId || buildingFilters.searchTerm) {
                state.autoRefreshPaused = true;
                state.filtersActive = true;
                showFilterIndicator();
            }
            applyBuildingFilters();
        });
    }
    
    // Búsqueda de aulas
    const searchClassroom = document.getElementById('searchClassroom');
    if (searchClassroom) {
        searchClassroom.addEventListener('input', (e) => {
            classroomFilters.searchTerm = e.target.value.toLowerCase();
            if (classroomFilters.companyId || classroomFilters.buildingId || classroomFilters.searchTerm) {
                state.autoRefreshPaused = true;
                state.filtersActive = true;
                showFilterIndicator();
            }
            applyClassroomLocationFilters();
        });
    }
}

function initClearFilters() {
    // Limpiar filtros de centros
    const clearCompany = document.getElementById('clearCompanyFilters');
    if (clearCompany) {
        clearCompany.addEventListener('click', () => {
            companySearchTerm = '';

            const searchCompany = document.getElementById('searchCompany');
            if (searchCompany) searchCompany.value = '';

            // Reactivar actualización automática
            state.autoRefreshPaused = false;
            state.filtersActive = false;
            hideFilterIndicator();

            applyCompanySearch();
        });
    }

    // Limpiar filtros de edificios
    const clearBuilding = document.getElementById('clearBuildingFilters');
    if (clearBuilding) {
        clearBuilding.addEventListener('click', () => {
            buildingFilters.companyId = '';
            buildingFilters.searchTerm = '';
            
            const filterCompany = document.getElementById('filterBuildingCompany');
            const searchBuilding = document.getElementById('searchBuilding');
            
            if (filterCompany) filterCompany.value = '';
            if (searchBuilding) searchBuilding.value = '';

            // Reactivar actualización automática
            state.autoRefreshPaused = false;
            state.filtersActive = false;
            hideFilterIndicator();
            
            applyBuildingFilters();
        });
    }
    
    // Limpiar filtros de aulas
    const clearClassroom = document.getElementById('clearClassroomFilters');
    if (clearClassroom) {
        clearClassroom.addEventListener('click', () => {
            classroomFilters.companyId = '';
            classroomFilters.buildingId = '';
            classroomFilters.searchTerm = '';
            
            const filterCompany = document.getElementById('filterClassroomCompany');
            const filterBuilding = document.getElementById('filterClassroomBuilding');
            const searchClassroom = document.getElementById('searchClassroom');
            
            if (filterCompany) filterCompany.value = '';
            if (filterBuilding) {
                filterBuilding.value = '';
                filterBuilding.disabled = true;
                filterBuilding.innerHTML = '<option value="">Seleccione primero un centro</option>';
            }
            if (searchClassroom) searchClassroom.value = '';

            // Reactivar actualización automática
            state.autoRefreshPaused = false;
            state.filtersActive = false;
            hideFilterIndicator();
            
            applyClassroomLocationFilters();
        });
    }
}

function applyCompanySearch() {
    const companiesTableBody = document.getElementById('companiesTableBody');
    if (!companiesTableBody) return;

    const hasActiveFilters = !!companySearchTerm;
    if (hasActiveFilters) {
        state.autoRefreshPaused = true;
        state.filtersActive = true;
        showFilterIndicator();
    } else {
        state.autoRefreshPaused = false;
        state.filtersActive = false;
        hideFilterIndicator();
    }
    
    let filteredCompanies = state.companies;
    
    if (companySearchTerm) {
        filteredCompanies = filteredCompanies.filter(company =>
            company.name.toLowerCase().includes(companySearchTerm)
        );
    }
    
    if (filteredCompanies.length === 0) {
        companiesTableBody.innerHTML = '<tr><td colspan="4" class="empty">No se encontraron centros</td></tr>';
        return;
    }
    
    companiesTableBody.innerHTML = filteredCompanies.map(company => `
        <tr>
            <td>${company.id}</td>
            <td><strong>${company.name}</strong></td>
            <td>${formatDateTime(company.created_at)}</td>
            <td>
                <button class="btn-edit-location btn-edit-company" data-id="${company.id}" data-name="${company.name}">
                     Editar
                </button>
            </td>
        </tr>
    `).join('');
}

function initBuildingFilters() {
    const filterCompany = document.getElementById('filterBuildingCompany');
    
    if (!filterCompany) return;
    
    // Cargar centros
    filterCompany.innerHTML = '<option value="">Todos los centros</option>' +
        state.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    // Evento de cambio
    filterCompany.addEventListener('change', (e) => {
        buildingFilters.companyId = e.target.value;
        applyBuildingFilters();
    });
}

function applyBuildingFilters() {
    const buildingsTableBody = document.getElementById('buildingsTableBody');
    if (!buildingsTableBody) return;

    const hasActiveFilters = !!(buildingFilters.companyId || buildingFilters.searchTerm);
    if (hasActiveFilters) {
        state.autoRefreshPaused = true;
        state.filtersActive = true;
        showFilterIndicator();
    } else {
        state.autoRefreshPaused = false;
        state.filtersActive = false;
        hideFilterIndicator();
    }
    
    let filteredBuildings = state.buildings;
    
    if (buildingFilters.companyId) {
        filteredBuildings = filteredBuildings.filter(building => 
            building.company_id == buildingFilters.companyId
        );
    }
    
    if (buildingFilters.searchTerm) {
        filteredBuildings = filteredBuildings.filter(building =>
            building.name.toLowerCase().includes(buildingFilters.searchTerm)
        );
    }
    
    renderFilteredBuildings(filteredBuildings);
}

function renderFilteredBuildings(filteredBuildings) {
    const buildingsTableBody = document.getElementById('buildingsTableBody');
    
    if (filteredBuildings.length === 0) {
        buildingsTableBody.innerHTML = '<tr><td colspan="5" class="empty">No se encontraron edificios con los filtros aplicados</td></tr>';
        return;
    }
    
    buildingsTableBody.innerHTML = filteredBuildings.map(building => {
        const company = state.companies.find(c => c.id === building.company_id);
        return `
            <tr>
                <td>${building.id}</td>
                <td><strong>${building.name}</strong></td>
                <td>${company ? company.name : 'N/A'}</td>
                <td>${formatDateTime(building.created_at)}</td>
                <td>
                    <button class="btn-edit-location btn-edit-building" 
                        data-id="${building.id}" 
                        data-name="${building.name}" 
                        data-company-id="${building.company_id}">
                         Editar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function initClassroomLocationFilters() {
    const filterCompany = document.getElementById('filterClassroomCompany');
    const filterBuilding = document.getElementById('filterClassroomBuilding');
    
    if (!filterCompany || !filterBuilding) return;
    
    // Cargar centros
    filterCompany.innerHTML = '<option value="">Todos los centros</option>' +
        state.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    // Evento de cambio de centro
    filterCompany.addEventListener('change', async (e) => {
        classroomFilters.companyId = e.target.value;
        classroomFilters.buildingId = '';
        
        if (classroomFilters.companyId) {
            const buildings = state.buildings.filter(b => b.company_id == classroomFilters.companyId);
            filterBuilding.disabled = false;
            filterBuilding.innerHTML = '<option value="">Todos los edificios</option>' +
                buildings.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
        } else {
            filterBuilding.disabled = true;
            filterBuilding.innerHTML = '<option value="">Seleccione primero un centro</option>';
        }
        
        applyClassroomLocationFilters();
    });
    
    // Evento de cambio de edificio
    filterBuilding.addEventListener('change', (e) => {
        classroomFilters.buildingId = e.target.value;
        applyClassroomLocationFilters();
    });
}

function applyClassroomLocationFilters() {
    const classroomsTableBody = document.getElementById('classroomsTableBody');
    if (!classroomsTableBody) return;

    const hasActiveFilters = !!(classroomFilters.companyId || classroomFilters.buildingId || classroomFilters.searchTerm);
    if (hasActiveFilters) {
        state.autoRefreshPaused = true;
        state.filtersActive = true;
        showFilterIndicator();
    } else {
        state.autoRefreshPaused = false;
        state.filtersActive = false;
        hideFilterIndicator();
    }
    
    let filteredClassrooms = state.classrooms;
    
    if (classroomFilters.companyId || classroomFilters.buildingId) {
        filteredClassrooms = filteredClassrooms.filter(classroom => {
            const building = state.buildings.find(b => b.id === classroom.building_id);
            if (!building) return false;
            
            if (classroomFilters.companyId && building.company_id != classroomFilters.companyId) return false;
            if (classroomFilters.buildingId && classroom.building_id != classroomFilters.buildingId) return false;
            
            return true;
        });
    }
    
    if (classroomFilters.searchTerm) {
        filteredClassrooms = filteredClassrooms.filter(classroom =>
            classroom.name.toLowerCase().includes(classroomFilters.searchTerm)
        );
    }
    
    renderFilteredClassrooms(filteredClassrooms);
}

function renderFilteredClassrooms(filteredClassrooms) {
    const classroomsTableBody = document.getElementById('classroomsTableBody');
    
    if (filteredClassrooms.length === 0) {
        classroomsTableBody.innerHTML = '<tr><td colspan="6" class="empty">No se encontraron aulas con los filtros aplicados</td></tr>';
        return;
    }
    
    classroomsTableBody.innerHTML = filteredClassrooms.map(classroom => {
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
                    <button class="btn-edit-location btn-edit-classroom" 
                        data-id="${classroom.id}" 
                        data-name="${classroom.name}"
                        data-code="${classroom.code || ''}" 
                        data-building-id="${classroom.building_id}">
                         Editar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}
// ==================== DOWNLOAD RECORDS ====================

function downloadFilteredRecords() {
    if (currentFilteredRecords.length === 0) {
        alert('No hay registros para descargar con los filtros actuales');
        return;
    }
    
    // Crear cabeceras CSV
    const headers = ['Fecha y Hora', 'Usuario', 'Dispositivo', 'Centro', 'Edificio', 'Aula', 'Tipo', 'Temperatura'];
    
    // Convertir registros a filas CSV
    const rows = currentFilteredRecords.map(record => {
        const person = state.persons.find(p => p.id === record.enroll_id);
        const userName = person ? person.name : `ID: ${record.enroll_id}`;
        
        const device = state.devices.find(d => d.sn === record.device_serial_num);
        const classroom = device ? state.classrooms.find(c => c.id === device.classroom_id) : null;
        const building = classroom ? state.buildings.find(b => b.id === classroom.building_id) : null;
        const company = building ? state.companies.find(c => c.id === building.company_id) : null;
        
        const inoutText = record.inout === 0 ? 'Entrada' : 'Salida';
        const tempText = record.temperature ? `${record.temperature}°C` : 'N/A';
        
        return [
            formatDateTime(record.records_time),
            userName,
            record.device_serial_num,
            company ? company.name : 'N/A',
            building ? building.name : 'N/A',
            classroom ? classroom.name : 'N/A',
            inoutText,
            tempText
        ];
    });
    
    // Crear contenido CSV con saltos de línea correctos
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
            // Escapar comillas dobles y envolver en comillas
            const cellStr = String(cell).replace(/"/g, '""');
            return `"${cellStr}"`;
        }).join(','))
    ].join('\r\n'); // Usar CRLF para compatibilidad con Windows/Excel
    
    // Crear Blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `registros_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Se han descargado ${currentFilteredRecords.length} registros`);
    
    // Limpiar filtros y reactivar actualización automática después de descargar
    console.log('[Download] Reanudando actualización automática después de descargar reporte');
    recordFilters = { companyId: '', buildingId: '', classroomId: '', period: 'month', dateFrom: null, dateTo: null };
    
    const filterCompany = document.getElementById('filterRecordCompany');
    const filterBuilding = document.getElementById('filterRecordBuilding');
    const filterClassroom = document.getElementById('filterRecordClassroom');
    const filterPeriod = document.getElementById('filterRecordPeriod');
    const dateFrom = document.getElementById('filterDateFrom');
    const dateTo = document.getElementById('filterDateTo');
    
    if (filterCompany) filterCompany.value = '';
    if (filterBuilding) {
        filterBuilding.disabled = true;
        filterBuilding.innerHTML = '<option value="">Seleccione primero un centro</option>';
    }
    if (filterClassroom) {
        filterClassroom.disabled = true;
        filterClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
    }
    if (filterPeriod) filterPeriod.value = 'month';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    // Reanudar actualización automática
    state.autoRefreshPaused = false;
    state.filtersActive = false;
    hideFilterIndicator();
    
    applyRecordFilters();
}