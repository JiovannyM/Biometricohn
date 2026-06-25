// Elementos del DOM organizados por módulo
export const elements = {
    // Server status
    serverStatus: document.getElementById('serverStatus'),
    lastUpdate: document.getElementById('lastUpdate'),
    
    // Organization stats
    totalCompanies: document.getElementById('totalCompanies'),
    totalBuildings: document.getElementById('totalBuildings'),
    totalClassrooms: document.getElementById('totalClassrooms'),
    
    // Device stats
    totalDevices: document.getElementById('totalDevices'),
    connectedDevices: document.getElementById('connectedDevices'),
    disconnectedDevices: document.getElementById('disconnectedDevices'),
    devicesBody: document.getElementById('devicesBody'),
    
    // Persons
    totalPersons: document.getElementById('totalPersons'),
    personsBody: document.getElementById('personsBody'),
    
    // Records
    todayRecords: document.getElementById('todayRecords'),
    recordsBody: document.getElementById('recordsBody'),
    
    // Refresh buttons
    refreshDevices: document.getElementById('refreshDevices'),
    refreshPersons: document.getElementById('refreshPersons'),
    refreshRecords: document.getElementById('refreshRecords'),
    
    // Botones de modales - Organization
    addCompanyBtn: document.getElementById('addCompanyBtn'),
    addBuildingBtn: document.getElementById('addBuildingBtn'),
    addClassroomBtn: document.getElementById('addClassroomBtn'),
    bulkUploadBtn: document.getElementById('bulkUploadBtn'),
    
    // Botones de modales - Devices & Persons
    addDeviceBtn: document.getElementById('addDeviceBtn'),
    addPersonBtn: document.getElementById('addPersonBtn'),
    
    // Modales - Organization
    companyModal: document.getElementById('companyModal'),
    buildingModal: document.getElementById('buildingModal'),
    classroomModal: document.getElementById('classroomModal'),
    bulkUploadModal: document.getElementById('bulkUploadModal'),
    
    // Modales - Devices & Persons
    deviceModal: document.getElementById('deviceModal'),
    personModal: document.getElementById('personModal'),
    editDeviceModal: document.getElementById('editDeviceModal'),
    
    // Formularios - Organization
    companyForm: document.getElementById('companyForm'),
    buildingForm: document.getElementById('buildingForm'),
    classroomForm: document.getElementById('classroomForm'),
    
    // Formularios - Devices & Persons
    deviceForm: document.getElementById('deviceForm'),
    personForm: document.getElementById('personForm'),
    editDeviceForm: document.getElementById('editDeviceForm'),
    
    // Cerrar modales - Organization
    closeCompanyModal: document.getElementById('closeCompanyModal'),
    closeBuildingModal: document.getElementById('closeBuildingModal'),
    closeClassroomModal: document.getElementById('closeClassroomModal'),
    closeBulkUploadModal: document.getElementById('closeBulkUploadModal'),
    
    // Cerrar modales - Devices & Persons
    closeDeviceModal: document.getElementById('closeDeviceModal'),
    closePersonModal: document.getElementById('closePersonModal'),
    closeEditDeviceModal: document.getElementById('closeEditDeviceModal'),
    
    // Cancel buttons - Organization
    cancelCompany: document.getElementById('cancelCompany'),
    cancelBuilding: document.getElementById('cancelBuilding'),
    cancelClassroom: document.getElementById('cancelClassroom'),
    cancelBulkUpload: document.getElementById('cancelBulkUpload'),
    
    // Cancel buttons - Devices & Persons
    cancelDevice: document.getElementById('cancelDevice'),
    cancelPerson: document.getElementById('cancelPerson'),
    cancelEditDevice: document.getElementById('cancelEditDevice'),
    
    // Bulk upload elements
    csvFileInput: document.getElementById('csvFileInput'),
    uploadPreview: document.getElementById('uploadPreview'),
    previewCount: document.getElementById('previewCount'),
    previewTable: document.getElementById('previewTable'),
    submitBulkUpload: document.getElementById('submitBulkUpload')
};
