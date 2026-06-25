// Funciones de formato de fechas y datos

export function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

export function updateServerStatus(elements, isConnected) {
    if (isConnected) {
        elements.serverStatus.textContent = 'Servidor: Conectado';
        elements.serverStatus.className = 'status-badge connected';
    } else {
        elements.serverStatus.textContent = 'Servidor: Desconectado';
        elements.serverStatus.className = 'status-badge disconnected';
    }
    elements.lastUpdate.textContent = `Última actualización: ${new Date().toLocaleTimeString('es-ES')}`;
}
