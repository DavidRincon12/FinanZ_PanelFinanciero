/**
 * FinanZ – JavaScript Principal
 * Inicialización global y utilidades compartidas.
 */

'use strict';

// ---- Inicialización de tooltips Bootstrap ----
document.addEventListener('DOMContentLoaded', () => {
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(el => new bootstrap.Tooltip(el));

    // Auto-cerrar alertas después de 5 segundos
    document.querySelectorAll('.alert.alert-success, .alert.alert-info').forEach(alert => {
        setTimeout(() => {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
            bsAlert.close();
        }, 5000);
    });
});

/**
 * Formatea un número como moneda colombiana (COP).
 * @param {number} amount
 * @returns {string} Ej: "$1.500.000,00"
 */
function formatCOP(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Realiza una petición fetch a un endpoint JSON de FinanZ.
 * @param {string} url
 * @returns {Promise<object>}
 */
async function fetchJSON(url) {
    const response = await fetch(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}
