import { state } from './config.js';
import { elements } from './utils/dom.js';
import { fetchAPI } from './api.js';
import { createDevice, updateDevice, bulkUploadDevices, fetchDevices, deleteDevice } from './components/devices.js';
import { createPerson, updatePerson, fetchPersons, deletePerson } from './components/persons.js';
import { 
    createCompany, createBuilding, createClassroom,
    updateCompany, updateBuilding, updateClassroom,
    fetchCompanies, fetchBuildings, fetchClassrooms,
    loadDeviceSelectors, onDeviceCompanyChange, onDeviceBuildingChange,
    loadClassroomFormSelectors, onClassroomCompanyChange, loadBuildingFormSelectors,
    deleteCompany, deleteBuilding, deleteClassroom
} from './components/organization.js';

// Variable para almacenar los dispositivos parseados del CSV
let bulkDevicesData = [];

// Abrir/cerrar modales
export function openModal(modal) {
    modal.style.display = 'block';
}

export function closeModal(modal) {
    modal.style.display = 'none';
}

// Inicializar eventos de modales
export function initModalEvents() {
    // Eventos de modales - Dispositivo
    elements.addDeviceBtn.addEventListener('click', () => {
        loadDeviceSelectors();
        openModal(elements.deviceModal);
    });
    elements.closeDeviceModal.addEventListener('click', () => closeModal(elements.deviceModal));
    elements.cancelDevice.addEventListener('click', () => closeModal(elements.deviceModal));

    // Eventos de modales - Persona
    elements.addPersonBtn.addEventListener('click', () => openModal(elements.personModal));
    elements.closePersonModal.addEventListener('click', () => closeModal(elements.personModal));
    elements.cancelPerson.addEventListener('click', () => closeModal(elements.personModal));

    // Eventos de modales - Company
    elements.addCompanyBtn.addEventListener('click', () => openModal(elements.companyModal));
    elements.closeCompanyModal.addEventListener('click', () => closeModal(elements.companyModal));
    elements.cancelCompany.addEventListener('click', () => closeModal(elements.companyModal));

    // Eventos de modales - Building
    elements.addBuildingBtn.addEventListener('click', () => {
        loadBuildingFormSelectors();
        openModal(elements.buildingModal);
    });
    elements.closeBuildingModal.addEventListener('click', () => closeModal(elements.buildingModal));
    elements.cancelBuilding.addEventListener('click', () => closeModal(elements.buildingModal));

    // Eventos de modales - Classroom
    elements.addClassroomBtn.addEventListener('click', () => {
        loadClassroomFormSelectors();
        openModal(elements.classroomModal);
    });
    elements.closeClassroomModal.addEventListener('click', () => closeModal(elements.classroomModal));
    elements.cancelClassroom.addEventListener('click', () => closeModal(elements.classroomModal));

    // Eventos de modales - Bulk Upload
    elements.bulkUploadBtn.addEventListener('click', () => openModal(elements.bulkUploadModal));
    elements.closeBulkUploadModal.addEventListener('click', () => closeModal(elements.bulkUploadModal));
    elements.cancelBulkUpload.addEventListener('click', () => closeModal(elements.bulkUploadModal));

    // Eventos de modales - Editar Dispositivo
    elements.closeEditDeviceModal.addEventListener('click', () => closeModal(elements.editDeviceModal));
    elements.cancelEditDevice.addEventListener('click', () => closeModal(elements.editDeviceModal));

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (event) => {
        if (event.target === elements.deviceModal) closeModal(elements.deviceModal);
        if (event.target === elements.personModal) closeModal(elements.personModal);
        if (event.target === elements.editDeviceModal) closeModal(elements.editDeviceModal);
        if (event.target === elements.companyModal) closeModal(elements.companyModal);
        if (event.target === elements.buildingModal) closeModal(elements.buildingModal);
        if (event.target === elements.classroomModal) closeModal(elements.classroomModal);
        if (event.target === elements.bulkUploadModal) closeModal(elements.bulkUploadModal);
        
        // Modales de edición
        const editPersonModal = document.getElementById('editPersonModal');
        const editCompanyModal = document.getElementById('editCompanyModal');
        const editBuildingModal = document.getElementById('editBuildingModal');
        const editClassroomModal = document.getElementById('editClassroomModal');
        
        if (event.target === editPersonModal) closeModal(editPersonModal);
        if (event.target === editCompanyModal) closeModal(editCompanyModal);
        if (event.target === editBuildingModal) closeModal(editBuildingModal);
        if (event.target === editClassroomModal) closeModal(editClassroomModal);
    });

    // Eventos de cambio para selectores en cascada - Device Form
    document.getElementById('deviceCompany').addEventListener('change', onDeviceCompanyChange);
    document.getElementById('deviceBuilding').addEventListener('change', onDeviceBuildingChange);

    // Eventos de cambio para selectores en cascada - Classroom Form
    document.getElementById('classroomCompany').addEventListener('change', onClassroomCompanyChange);

    // Inicializar formularios
    initFormSubmits();
    initBulkUpload();
    // initEditDeviceButton() se llama desde initEditButtons() en app.js, no duplicar aquí
}

// Inicializar formularios
function initFormSubmits() {
    // ============= CREAR DISPOSITIVO =============
    elements.deviceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const sn = document.getElementById('deviceSN').value.trim();
        const ip = document.getElementById('deviceIP').value.trim() || null;
        const classroomId = document.getElementById('deviceClassroom').value || null;
        
        if (!sn) {
            alert('El número de serial es requerido');
            return;
        }
        
        const submitBtn = elements.deviceForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creando...';
        
        try {
            await createDevice({ 
                sn, 
                ip,
                classroom_id: classroomId ? parseInt(classroomId) : null
            });
            
            alert('Dispositivo ' + sn + ' creado exitosamente');
            closeModal(elements.deviceModal);
            elements.deviceForm.reset();
        } catch (error) {
            alert('Error al crear dispositivo: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Dispositivo';
        }
    });

    // ============= CREAR PERSONA =============
    // Habilitar/deshabilitar campos de auth según checkboxes
    const usePassword = document.getElementById('usePassword');
    const useCard = document.getElementById('useCard');
    const personPassword = document.getElementById('personPassword');
    const personCard = document.getElementById('personCard');
    
    usePassword.addEventListener('change', () => {
        personPassword.disabled = !usePassword.checked;
        if (!usePassword.checked) personPassword.value = '';
    });
    
    useCard.addEventListener('change', () => {
        personCard.disabled = !useCard.checked;
        if (!useCard.checked) personCard.value = '';
    });

    elements.personForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const idValue = document.getElementById('personID').value;
        const id = parseInt(idValue);
        const name = document.getElementById('personName').value.trim();
        const roll_id = parseInt(document.getElementById('personRole').value);
        
        // Validar que el ID sea un número válido y positivo
        if (!idValue || isNaN(id) || id < 1 || !/^[0-9]+$/.test(idValue)) {
            alert('El ID debe ser un número entero positivo (solo dígitos, sin letras)');
            return;
        }
        
        if (!name) {
            alert('El nombre es requerido');
            return;
        }
        
        // Recopilar métodos de autenticación
        const auth_methods = [];
        
        if (usePassword.checked) {
            const passwordValue = personPassword.value.trim();
            if (!passwordValue) {
                alert('Debe ingresar una contraseña/PIN si seleccionó este método');
                return;
            }
            auth_methods.push({
                type: "password",
                value: passwordValue
            });
        }
        
        if (useCard.checked) {
            const cardValue = personCard.value.trim();
            if (!cardValue) {
                alert('Debe ingresar un ID de tarjeta si seleccionó este método');
                return;
            }
            auth_methods.push({
                type: "card",
                value: cardValue
            });
        }
        
        if (document.getElementById('useFingerprint').checked) {
            auth_methods.push({
                type: "fingerprint",
                value: ""  // Requiere registro posterior
            });
        }
        
        if (document.getElementById('useFace').checked) {
            auth_methods.push({
                type: "face",
                value: ""  // Requiere captura posterior
            });
        }
        
        // Validar que haya al menos un método
        if (auth_methods.length === 0) {
            alert('Debe seleccionar al menos un método de autenticación');
            return;
        }
        
        const submitBtn = elements.personForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creando...';
        
        try {
            // Llamar al nuevo endpoint con métodos de autenticación
            await fetchAPI('/persons/with-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    name,
                    roll_id,
                    auth_methods
                })
            });
            
            // Recargar lista de personas
            await fetchPersons();
            
            const methodsText = auth_methods.map(m => {
                if (m.type === 'password') return 'Contraseña';
                if (m.type === 'card') return 'Tarjeta';
                if (m.type === 'fingerprint') return 'Huella (pendiente)';
                if (m.type === 'face') return 'Rostro (pendiente)';
            }).join(', ');
            
            alert(`Persona "${name}" creada exitosamente con ID ${id}\nMétodos: ${methodsText}`);
            closeModal(elements.personModal);
            elements.personForm.reset();
            
            // Resetear checkboxes y deshabilitar campos
            usePassword.checked = false;
            useCard.checked = false;
            document.getElementById('useFingerprint').checked = false;
            document.getElementById('useFace').checked = false;
            personPassword.disabled = true;
            personCard.disabled = true;
        } catch (error) {
            alert('Error al crear persona: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Persona';
        }
    });

    // ============= CREAR COMPANY =============
    elements.companyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('companyName').value.trim();
        const code = document.getElementById('companyCode').value.trim() || null;
        const address = document.getElementById('companyAddress').value.trim() || null;
        const phone = document.getElementById('companyPhone').value.trim() || null;
        
        if (!name) {
            alert('El nombre del centro/empresa es requerido');
            return;
        }
        
        const submitBtn = elements.companyForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creando...';
        
        try {
            await createCompany({ name, code, address, phone });
            alert('Centro/Empresa "' + name + '" creado exitosamente');
            closeModal(elements.companyModal);
            elements.companyForm.reset();
        } catch (error) {
            alert('Error al crear centro/empresa: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Centro';
        }
    });

    // ============= CREAR BUILDING =============
    elements.buildingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const company_id = parseInt(document.getElementById('buildingCompany').value);
        const name = document.getElementById('buildingName').value.trim();
        const code = document.getElementById('buildingCode').value.trim() || null;
        const floor_count = document.getElementById('buildingFloors').value 
            ? parseInt(document.getElementById('buildingFloors').value) 
            : null;
        
        if (!company_id || !name) {
            alert('Centro/Empresa y nombre del edificio son requeridos');
            return;
        }
        
        const submitBtn = elements.buildingForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creando...';
        
        try {
            await createBuilding({ company_id, name, code, floor_count });
            alert('Edificio "' + name + '" creado exitosamente');
            closeModal(elements.buildingModal);
            elements.buildingForm.reset();
        } catch (error) {
            alert('Error al crear edificio: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Edificio';
        }
    });

    // ============= CREAR CLASSROOM =============
    elements.classroomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const building_id = parseInt(document.getElementById('classroomBuilding').value);
        const name = document.getElementById('classroomName').value.trim();
        const code = document.getElementById('classroomCode').value.trim();
        const floor = document.getElementById('classroomFloor').value 
            ? parseInt(document.getElementById('classroomFloor').value) 
            : null;
        const capacity = document.getElementById('classroomCapacity').value 
            ? parseInt(document.getElementById('classroomCapacity').value) 
            : null;
        
        if (!building_id || !name || !code) {
            alert('Edificio, nombre y código del aula son requeridos');
            return;
        }
        
        const submitBtn = elements.classroomForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creando...';
        
        try {
            const classroomData = { building_id, name, code, floor, capacity };
            await createClassroom(classroomData);
            alert('Aula "' + name + '" creada exitosamente');
            closeModal(elements.classroomModal);
            elements.classroomForm.reset();
        } catch (error) {
            alert('Error al crear aula: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Aula';
        }
    });

    // ============= EDITAR IP DEL DISPOSITIVO =============
    elements.editDeviceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const deviceId = document.getElementById('editDeviceId').value;
        const ip = document.getElementById('editDeviceIP').value.trim() || null;
        const companyId = document.getElementById('editDeviceCompany').value || null;
        const buildingId = document.getElementById('editDeviceBuilding').value || null;
        const classroomId = document.getElementById('editDeviceClassroom').value || null;
        
        const submitBtn = elements.editDeviceForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Actualizando...';
        
        try {
            await updateDevice(deviceId, { 
                ip,
                classroom_id: classroomId ? parseInt(classroomId) : null
            });
            alert('Dispositivo actualizado exitosamente');
            closeModal(elements.editDeviceModal);
            elements.editDeviceForm.reset();
        } catch (error) {
            alert('Error al actualizar dispositivo: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Actualizar';
        }
    });
}

// Inicializar botón de editar dispositivo
async function initEditDeviceButton() {
    elements.devicesBody.addEventListener('click', async (e) => {
        const delBtn = e.target.closest('.btn-delete-device');
        if (delBtn) {
            const deviceId = delBtn.dataset.deviceId;
            if (!confirm('¿Confirma eliminar este dispositivo? Esta acción no se puede deshacer.')) return;
            try {
                await deleteDevice(deviceId);
                alert('Dispositivo eliminado');
            } catch (error) {
                alert('Error al eliminar dispositivo: ' + error.message);
            }
            return;
        }

        const btn = e.target.closest('.btn-edit');
        if (btn) {
            const deviceId = btn.dataset.deviceId;
            const deviceSN = btn.dataset.deviceSn;
            const currentIP = btn.dataset.deviceIp;
            const companyId = btn.dataset.companyId;
            const buildingId = btn.dataset.buildingId;
            const classroomId = btn.dataset.classroomId;
            
            document.getElementById('editDeviceId').value = deviceId;
            document.getElementById('editDeviceSN').value = deviceSN;
            document.getElementById('editDeviceIP').value = currentIP;
            
            // Cargar selectores
            await loadEditDeviceSelectors(companyId, buildingId, classroomId);
            
            openModal(elements.editDeviceModal);
        }
    });
}

async function loadEditDeviceSelectors(companyId, buildingId, classroomId) {
    const editCompany = document.getElementById('editDeviceCompany');
    const editBuilding = document.getElementById('editDeviceBuilding');
    const editClassroom = document.getElementById('editDeviceClassroom');
    
    await fetchCompanies();
    const companies = await fetchCompanies();
    editCompany.innerHTML = '<option value="">Sin asignar</option>' +
        companies.map(c => `<option value="${c.id}" ${c.id == companyId ? 'selected' : ''}>${c.name}</option>`).join('');
    
    if (companyId) {
        const buildings = await fetchBuildings(companyId);
        editBuilding.disabled = false;
        editBuilding.innerHTML = '<option value="">Seleccionar...</option>' +
            buildings.map(b => `<option value="${b.id}" ${b.id == buildingId ? 'selected' : ''}>${b.name}</option>`).join('');
        
        if (buildingId) {
            const classrooms = await fetchClassrooms(buildingId);
            editClassroom.disabled = false;
            editClassroom.innerHTML = '<option value="">Sin asignar</option>' +
                classrooms.map(c => `<option value="${c.id}" ${c.id == classroomId ? 'selected' : ''}>${c.name}</option>`).join('');
        }
    }
    
    // Event listeners para cascada
    editCompany.addEventListener('change', async () => {
        const selectedCompanyId = editCompany.value;
        if (selectedCompanyId) {
            const buildings = await fetchBuildings(selectedCompanyId);
            editBuilding.disabled = false;
            editBuilding.innerHTML = '<option value="">Seleccionar...</option>' +
                buildings.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
            editClassroom.disabled = true;
            editClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
        } else {
            editBuilding.disabled = true;
            editBuilding.innerHTML = '<option value="">Seleccione primero un centro</option>';
            editClassroom.disabled = true;
            editClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
        }
    });
    
    editBuilding.addEventListener('change', async () => {
        const selectedBuildingId = editBuilding.value;
        if (selectedBuildingId) {
            const classrooms = await fetchClassrooms(selectedBuildingId);
            editClassroom.disabled = false;
            editClassroom.innerHTML = '<option value="">Sin asignar</option>' +
                classrooms.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        } else {
            editClassroom.disabled = true;
            editClassroom.innerHTML = '<option value="">Seleccione primero un edificio</option>';
        }
    });
}

// ============= CARGA MASIVA CSV =============
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
    }
    
    // Función para parsear una línea CSV correctamente (maneja comillas y espacios)
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }
    
    const headers = parseCSVLine(lines[0]);
    const devices = [];
    
    if (!headers.includes('sn')) {
        throw new Error('El archivo CSV debe tener una columna "sn" (serial number)');
    }
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Saltar líneas vacías
        
        const values = parseCSVLine(lines[i]);
        const device = {};
        
        headers.forEach((header, index) => {
            const value = values[index];
            if (header === 'sn') {
                device.sn = value;
            } else if (header === 'ip') {
                device.ip = value || null;
            } else if (header === 'classroom_code') {
                device.classroom_code = value || null;
            }
        });
        
        if (device.sn) {
            devices.push(device);
        }
    }
    
    return devices;
}

function initBulkUpload() {
    // Event listener para selección de archivo
    elements.csvFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            bulkDevicesData = parseCSV(text);
            
            elements.previewCount.textContent = `${bulkDevicesData.length} dispositivos encontrados`;
            
            const previewHTML = `
                <table style="width: 100%; font-size: 12px;">
                    <thead>
                        <tr>
                            <th>Serial</th>
                            <th>IP</th>
                            <th>Código Aula</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bulkDevicesData.slice(0, 10).map(d => `
                            <tr>
                                <td>${d.sn}</td>
                                <td>${d.ip || 'N/A'}</td>
                                <td>${d.classroom_code || 'N/A'}</td>
                            </tr>
                        `).join('')}
                        ${bulkDevicesData.length > 10 ? `
                            <tr>
                                <td colspan="3" style="text-align: center; font-style: italic;">
                                    ... y ${bulkDevicesData.length - 10} más
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            `;
            
            elements.previewTable.innerHTML = previewHTML;
            elements.uploadPreview.style.display = 'block';
            elements.submitBulkUpload.disabled = false;
        } catch (error) {
            alert('Error al leer el archivo: ' + error.message);
            elements.uploadPreview.style.display = 'none';
            elements.submitBulkUpload.disabled = true;
        }
    });

    // Event listener para subir dispositivos
    elements.submitBulkUpload.addEventListener('click', async () => {
        if (bulkDevicesData.length === 0) {
            alert('No hay dispositivos para subir');
            return;
        }
        
        const confirmMsg = `¿Está seguro de que desea crear ${bulkDevicesData.length} dispositivos?`;
        if (!confirm(confirmMsg)) return;
        
        elements.submitBulkUpload.disabled = true;
        elements.submitBulkUpload.textContent = 'Subiendo...';
        
        try {
            const response = await bulkUploadDevices(bulkDevicesData);
            alert(`${response.count} dispositivos creados exitosamente`);
            closeModal(elements.bulkUploadModal);
            
            // Reset
            elements.csvFileInput.value = '';
            elements.uploadPreview.style.display = 'none';
            bulkDevicesData = [];
        } catch (error) {
            alert('Error al crear dispositivos: ' + error.message);
        } finally {
            elements.submitBulkUpload.disabled = false;
            elements.submitBulkUpload.textContent = 'Subir Dispositivos';
        }
    });
}

// ============= EDITAR PERSONA =============
function initEditPersonButton() {
    elements.personsBody.addEventListener('click', (e) => {
        const delBtn = e.target.closest('.btn-delete-person');
        if (delBtn) {
            const personId = delBtn.dataset.personId;
            if (!confirm('¿Confirma eliminar este usuario? Esto eliminará sus datos en el dispositivo.')) return;
            deletePerson(personId).then(() => {
                alert('Usuario eliminado');
            }).catch(err => {
                alert('Error al eliminar usuario: ' + err.message);
            });
            return;
        }

        const btn = e.target.closest('.btn-edit-person');
        if (btn) {
            const personId = btn.dataset.personId;
            const personName = btn.dataset.personName;
            const personRoll = btn.dataset.personRoll;
            
            document.getElementById('editPersonId').value = personId;
            document.getElementById('editPersonName').value = personName;
            document.getElementById('editPersonRole').value = personRoll;
            
            openModal(document.getElementById('editPersonModal'));
        }
    });
    
    const editPersonForm = document.getElementById('editPersonForm');
    if (editPersonForm) {
        editPersonForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const personId = document.getElementById('editPersonId').value;
            const name = document.getElementById('editPersonName').value.trim();
            const roll_id = parseInt(document.getElementById('editPersonRole').value);
            
            const submitBtn = editPersonForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Actualizando...';
            
            try {
                await updatePerson(personId, { name, roll_id });
                alert('Usuario actualizado exitosamente');
                closeModal(document.getElementById('editPersonModal'));
            } catch (error) {
                alert('Error al actualizar usuario: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Actualizar';
            }
        });
    }
    
    const closeEditPersonModal = document.getElementById('closeEditPersonModal');
    const cancelEditPerson = document.getElementById('cancelEditPerson');
    if (closeEditPersonModal) closeEditPersonModal.addEventListener('click', () => closeModal(document.getElementById('editPersonModal')));
    if (cancelEditPerson) cancelEditPerson.addEventListener('click', () => closeModal(document.getElementById('editPersonModal')));
}

// ============= EDITAR CENTRO =============
function initEditCompanyButton() {
    const companiesTableBody = document.getElementById('companiesTableBody');
    if (companiesTableBody) {
        companiesTableBody.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.btn-delete-company');
            if (delBtn) {
                const companyId = delBtn.dataset.id;
                if (!confirm('¿Confirma eliminar este centro? Esta acción puede afectar dispositivos asignados.')) return;
                deleteCompany(companyId).then(() => alert('Centro eliminado')).catch(err => alert('Error al eliminar centro: ' + err.message));
                return;
            }

            const btn = e.target.closest('.btn-edit-company');
            if (btn) {
                const companyId = btn.dataset.id;
                const companyName = btn.dataset.name;
                
                document.getElementById('editCompanyId').value = companyId;
                document.getElementById('editCompanyName').value = companyName;
                
                openModal(document.getElementById('editCompanyModal'));
            }
        });
    }
    
    const editCompanyForm = document.getElementById('editCompanyForm');
    if (editCompanyForm) {
        editCompanyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const companyId = document.getElementById('editCompanyId').value;
            const name = document.getElementById('editCompanyName').value.trim();
            
            const submitBtn = editCompanyForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Actualizando...';
            
            try {
                await updateCompany(companyId, { name });
                alert('Centro actualizado exitosamente');
                closeModal(document.getElementById('editCompanyModal'));
            } catch (error) {
                alert('Error al actualizar centro: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Actualizar';
            }
        });
    }
    
    const closeEditCompanyModal = document.getElementById('closeEditCompanyModal');
    const cancelEditCompany = document.getElementById('cancelEditCompany');
    if (closeEditCompanyModal) closeEditCompanyModal.addEventListener('click', () => closeModal(document.getElementById('editCompanyModal')));
    if (cancelEditCompany) cancelEditCompany.addEventListener('click', () => closeModal(document.getElementById('editCompanyModal')));
}

// ============= EDITAR EDIFICIO =============
function initEditBuildingButton() {
    const buildingsTableBody = document.getElementById('buildingsTableBody');
    if (buildingsTableBody) {
        buildingsTableBody.addEventListener('click', async (e) => {
            const delBtn = e.target.closest('.btn-delete-building');
            if (delBtn) {
                const buildingId = delBtn.dataset.id;
                if (!confirm('¿Confirma eliminar este edificio?')) return;
                deleteBuilding(buildingId).then(() => alert('Edificio eliminado')).catch(err => alert('Error al eliminar edificio: ' + err.message));
                return;
            }

            const btn = e.target.closest('.btn-edit-building');
            if (btn) {
                const buildingId = btn.dataset.id;
                const buildingName = btn.dataset.name;
                const companyId = btn.dataset.companyId;
                
                document.getElementById('editBuildingId').value = buildingId;
                document.getElementById('editBuildingName').value = buildingName;
                
                await fetchCompanies();
                const editBuildingCompany = document.getElementById('editBuildingCompany');
                editBuildingCompany.innerHTML = '<option value="">Seleccionar...</option>' +
                    state.companies.map(c => `<option value="${c.id}" ${c.id == companyId ? 'selected' : ''}>${c.name}</option>`).join('');
                
                openModal(document.getElementById('editBuildingModal'));
            }
        });
    }
    
    const editBuildingForm = document.getElementById('editBuildingForm');
    if (editBuildingForm) {
        editBuildingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const buildingId = document.getElementById('editBuildingId').value;
            const name = document.getElementById('editBuildingName').value.trim();
            const company_id = parseInt(document.getElementById('editBuildingCompany').value);
            
            const submitBtn = editBuildingForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Actualizando...';
            
            try {
                await updateBuilding(buildingId, { name, company_id });
                alert('Edificio actualizado exitosamente');
                closeModal(document.getElementById('editBuildingModal'));
            } catch (error) {
                alert('Error al actualizar edificio: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Actualizar';
            }
        });
    }
    
    const closeEditBuildingModal = document.getElementById('closeEditBuildingModal');
    const cancelEditBuilding = document.getElementById('cancelEditBuilding');
    if (closeEditBuildingModal) closeEditBuildingModal.addEventListener('click', () => closeModal(document.getElementById('editBuildingModal')));
    if (cancelEditBuilding) cancelEditBuilding.addEventListener('click', () => closeModal(document.getElementById('editBuildingModal')));
}

// ============= EDITAR AULA =============
function initEditClassroomButton() {
    const classroomsTableBody = document.getElementById('classroomsTableBody');
    if (classroomsTableBody) {
        classroomsTableBody.addEventListener('click', async (e) => {
            const delBtn = e.target.closest('.btn-delete-classroom');
            if (delBtn) {
                const classroomId = delBtn.dataset.id;
                if (!confirm('¿Confirma eliminar esta aula?')) return;
                deleteClassroom(classroomId).then(() => alert('Aula eliminada')).catch(err => alert('Error al eliminar aula: ' + err.message));
                return;
            }

            const btn = e.target.closest('.btn-edit-classroom');
            if (btn) {
                const classroomId = btn.dataset.id;
                const classroomName = btn.dataset.name;
                const classroomCode = btn.dataset.code;
                const buildingId = btn.dataset.buildingId;
                
                document.getElementById('editClassroomOriginalId').value = classroomId;
                document.getElementById('editClassroomCode').value = classroomCode || '';
                document.getElementById('editClassroomName').value = classroomName;
                
                await fetchBuildings();
                const editClassroomBuilding = document.getElementById('editClassroomBuilding');
                editClassroomBuilding.innerHTML = '<option value="">Seleccionar...</option>' +
                    state.buildings.map(b => `<option value="${b.id}" ${b.id == buildingId ? 'selected' : ''}>${b.name}</option>`).join('');
                
                openModal(document.getElementById('editClassroomModal'));
            }
        });
    }
    
    const editClassroomForm = document.getElementById('editClassroomForm');
    if (editClassroomForm) {
        editClassroomForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const originalId = document.getElementById('editClassroomOriginalId').value;
            const code = document.getElementById('editClassroomCode').value.trim();
            const name = document.getElementById('editClassroomName').value.trim();
            const building_id = parseInt(document.getElementById('editClassroomBuilding').value);
            
            const submitBtn = editClassroomForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Actualizando...';
            
            try {
                const updateData = { name, code, building_id };
                await updateClassroom(originalId, updateData);
                alert('Aula actualizada exitosamente');
                closeModal(document.getElementById('editClassroomModal'));
            } catch (error) {
                alert('Error al actualizar aula: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Actualizar';
            }
        });
    }
    
    const closeEditClassroomModal = document.getElementById('closeEditClassroomModal');
    const cancelEditClassroom = document.getElementById('cancelEditClassroom');
    if (closeEditClassroomModal) closeEditClassroomModal.addEventListener('click', () => closeModal(document.getElementById('editClassroomModal')));
    if (cancelEditClassroom) cancelEditClassroom.addEventListener('click', () => closeModal(document.getElementById('editClassroomModal')));
}

// Inicializar todos los botones de edición
export function initEditButtons() {
    initEditDeviceButton();
    initEditPersonButton();
    initEditCompanyButton();
    initEditBuildingButton();
    initEditClassroomButton();
}
