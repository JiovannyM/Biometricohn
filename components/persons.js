import { state } from '../config.js';
import { fetchAPI } from '../api.js';
import { elements } from '../utils/dom.js';
import { formatDateTime } from '../utils/formatters.js';

// Obtener usuarios
export async function fetchPersons() {
    try {
        const persons = await fetchAPI('/persons');
        // Verificar si la respuesta es válida (no null por error 401)
        if (!persons) {
            console.warn('[Persons] No se recibieron datos (posible error de autenticación)');
            return;
        }
        state.persons = persons;
        updatePersonsUI();
    } catch (error) {
        elements.personsBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">Error al cargar usuarios</td>
            </tr>
        `;
    }
}

// Actualizar UI de usuarios
function updatePersonsUI() {
    elements.totalPersons.textContent = state.persons.length;

    if (state.persons.length === 0) {
        elements.personsBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">No hay usuarios registrados</td>
            </tr>
        `;
        return;
    }

    // Obtener rol del usuario actual
    let userRole = 'viewer'; // Por defecto viewer (más restrictivo)
    try {
        const userInfo = localStorage.getItem('user_info');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            userRole = user.role;
        }
    } catch (error) {
        console.error('Error obteniendo rol del usuario:', error);
    }

    const canEdit = ['operator', 'admin', 'super_admin'].includes(userRole);

    elements.personsBody.innerHTML = state.persons.map(person => {
        const roleName = person.roll_id === 0 ? 'Usuario' : 'Administrador';
        const locationsHTML = '<button class="btn-secondary btn-view-locations" data-person-id="' + person.id + '">Ver ubicaciones</button>';
        
        // Botones de acción según permisos
        const actionsHTML = canEdit ? `
            <button class="btn-edit btn-edit-person" 
                data-person-id="${person.id}" 
                data-person-name="${person.name}" 
                data-person-roll="${person.roll_id}">
                Editar
            </button>
            <button class="btn-delete btn-delete-person" data-person-id="${person.id}">
                Eliminar
            </button>
        ` : '<span style="color: #999;">🔒 Solo lectura</span>';
        
        return `
            <tr>
                <td><strong>${person.id}</strong></td>
                <td>${person.name}</td>
                <td>${roleName}</td>
                <td>${locationsHTML}</td>
                <td>${formatDateTime(person.created_at)}</td>
                <td>${actionsHTML}</td>
            </tr>
        `;
    }).join('');
}

// Crear nueva persona
export async function createPerson(personData) {
    try {
        await fetchAPI('/persons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(personData)
        });
        await fetchPersons();
        return true;
    } catch (error) {
        throw error;
    }
}

// Actualizar persona
export async function updatePerson(personId, personData) {
    try {
        await fetchAPI(`/persons/${personId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(personData)
        });
        await fetchPersons();
        return true;
    } catch (error) {
        throw error;
    }
}

// Eliminar persona por ID
export async function deletePerson(personId) {
    try {
        await fetchAPI(`/persons/${personId}`, {
            method: 'DELETE'
        });
        await fetchPersons();
        return true;
    } catch (error) {
        throw error;
    }
}
