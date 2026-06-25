import { state } from '../config.js';
import { fetchAPI } from '../api.js';
import { elements } from '../utils/dom.js';
import { formatDateTime } from '../utils/formatters.js';
import { fetchPersons } from './persons.js';
import { reapplyRecordFilters } from '../utils/filters.js';

// Obtener registros recientes
export async function fetchRecords() {
    try {
        // Aumentar límite para obtener más registros (especialmente útil con el filtro del mes)
        const records = await fetchAPI('/records?limit=500');
        // Verificar si la respuesta es válida (no null por error 401)
        if (!records) {
            console.warn('[Records] No se recibieron datos (posible error de autenticación)');
            return;
        }
        state.records = records;
        console.log('[Records] Registros cargados:', records.length);
        
        // Siempre aplicar filtros (incluido el filtro del mes por defecto)
        // La función reapplyRecordFilters verificará si hay filtros activos
        reapplyRecordFilters();
    } catch (error) {
        console.error('[Records] Error al cargar registros:', error);
        elements.recordsBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">Error al cargar registros</td>
            </tr>
        `;
    }
}

// Actualizar UI de registros
function updateRecordsUI() {
    // Verificar que personsData esté disponible
    if (!state.persons || state.persons.length === 0) {
        console.warn('Esperando datos de usuarios...');
        // Intentar cargar usuarios si no están disponibles
        fetchPersons().then(() => {
            if (state.records.length > 0) {
                updateRecordsUI();
            }
        });
        elements.recordsBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading">Cargando información de usuarios...</td>
            </tr>
        `;
        return;
    }

    // Actualizar contador con el total de registros mostrados
    elements.todayRecords.textContent = state.records.length;

    if (state.records.length === 0) {
        elements.recordsBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">No hay registros de asistencia</td>
            </tr>
        `;
        return;
    }

    elements.recordsBody.innerHTML = state.records.map(record => {
        const inoutText = record.inout === 0 ? 'Entrada' : 'Salida';
        const inoutClass = record.inout === 0 ? 'entrada' : 'salida';
        
        // Buscar nombre de la persona
        const person = state.persons.find(p => p.id === record.enroll_id);
        const userName = person ? person.name : `ID: ${record.enroll_id}`;
        
        // Buscar ubicación del dispositivo
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
            tempHtml = `
                <span class="temperature ${isHigh ? 'high' : 'normal'}">
                    ${record.temperature}°C ${isHigh ? 'Alto' : 'OK'}
                </span>
            `;
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
