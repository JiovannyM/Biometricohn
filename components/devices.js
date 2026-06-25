import { state } from '../config.js';
import { fetchAPI } from '../api.js';
import { elements } from '../utils/dom.js';
import { formatDateTime, updateServerStatus } from '../utils/formatters.js';

// Obtener dispositivos con ubicación
export async function fetchDevices() {
    try {
        const devices = await fetchAPI('/devices?with_location=true');
        // Verificar si la respuesta es válida (no null por error 401)
        if (!devices) {
            console.warn('[Devices] No se recibieron datos (posible error de autenticación)');
            return;
        }
        state.devices = devices;
        updateDevicesUI();
        updateServerStatus(elements, true);
    } catch (error) {
        updateServerStatus(elements, false);
        elements.devicesBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty">Error al cargar dispositivos. Verifique que el servidor esté activo.</td>
            </tr>
        `;
    }
}

// Actualizar UI de dispositivos
function updateDevicesUI() {
    const total = state.devices.length;
    const connected = state.devices.filter(d => d.status === 1).length;
    const disconnected = total - connected;

    elements.totalDevices.textContent = total;
    elements.connectedDevices.textContent = connected;
    elements.disconnectedDevices.textContent = disconnected;

    if (total === 0) {
        elements.devicesBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty">No hay dispositivos registrados</td>
            </tr>
        `;
        return;
    }

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

    const canEditDevices = ['admin', 'super_admin'].includes(userRole);

    elements.devicesBody.innerHTML = state.devices.map(device => {
        // Construir ubicación
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

        // Botones de acción según permisos
        const actionsHTML = canEditDevices ? `
            <button class="btn-edit" 
                data-device-id="${device.id}" 
                data-device-sn="${device.sn}" 
                data-device-ip="${device.ip || ''}"
                data-company-id="${device.company_id || ''}"
                data-building-id="${device.building_id || ''}"
                data-classroom-id="${device.classroom_id || ''}">
                Editar
            </button>
            <button class="btn-delete btn-delete-device" data-device-id="${device.id}">Eliminar</button>
        ` : '<span style="color: #999;">🔒 Solo lectura</span>';

        return `
        <tr>
            <td>
                <span class="device-status ${device.status === 1 ? 'online' : 'offline'}">
                    ${device.status === 1 ? 'Conectado' : 'Desconectado'}
                </span>
            </td>
            <td>${device.sn}</td>
            <td>${device.ip || 'No configurada'}</td>
            <td>${location}</td>
            <td>${device.last_activity ? formatDateTime(device.last_activity) : 'Nunca'}</td>
            <td>${device.created_at ? formatDateTime(device.created_at) : 'N/A'}</td>
            <td>${actionsHTML}</td>
        </tr>
        `;
    }).join('');
}

// Crear nuevo dispositivo
export async function createDevice(deviceData) {
    try {
        await fetchAPI('/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deviceData)
        });
        await fetchDevices();
        return true;
    } catch (error) {
        throw error;
    }
}

// Actualizar dispositivo (IP y ubicación)
export async function updateDevice(deviceId, deviceData) {
    try {
        await fetchAPI(`/devices/${deviceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deviceData)
        });
        await fetchDevices();
        return true;
    } catch (error) {
        throw error;
    }
}

// Eliminar dispositivo
export async function deleteDevice(deviceId) {
    try {
        await fetchAPI(`/devices/${deviceId}`, {
            method: 'DELETE'
        });
        await fetchDevices();
        return true;
    } catch (error) {
        throw error;
    }
}

// Bulk upload de dispositivos
export async function bulkUploadDevices(devices) {
    try {
        const response = await fetchAPI('/devices/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ devices })
        });
        await fetchDevices();
        return response;
    } catch (error) {
        throw error;
    }
}
