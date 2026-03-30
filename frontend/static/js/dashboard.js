/**
 * FinanZ – Dashboard Charts
 * Inicializa los gráficos Chart.js consumiendo los endpoints JSON de Django.
 */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        initExpensesPieChart(),
        initBalanceLineChart(),
    ]);
});

/**
 * Gráfico de torta: distribución de gastos por categoría.
 */
async function initExpensesPieChart() {
    const canvas = document.getElementById('expensesPieChart');
    if (!canvas) return;

    try {
        const { data } = await fetchJSON('/finance/api/expenses-by-category/');
        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.category),
                datasets: [{
                    data: data.map(d => d.total),
                    backgroundColor: [
                        '#10b981', '#3b82f6', '#f59e0b',
                        '#ef4444', '#8b5cf6', '#06b6d4',
                    ],
                    borderWidth: 2,
                    borderColor: '#fff',
                }],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${formatCOP(ctx.raw)}`,
                        },
                    },
                },
            },
        });
    } catch (err) {
        console.warn('No se pudo cargar el gráfico de gastos:', err);
    }
}

/**
 * Gráfico de líneas: tendencia de balance mensual.
 */
async function initBalanceLineChart() {
    const canvas = document.getElementById('balanceLineChart');
    if (!canvas) return;

    try {
        const { data } = await fetchJSON('/finance/api/balance/');
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.map(d => d.month),
                datasets: [{
                    label: 'Balance',
                    data: data.map(d => d.balance),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#10b981',
                    pointRadius: 4,
                }],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${formatCOP(ctx.raw)}`,
                        },
                    },
                },
                scales: {
                    y: {
                        ticks: {
                            callback: value => formatCOP(value),
                        },
                    },
                },
            },
        });
    } catch (err) {
        console.warn('No se pudo cargar el gráfico de balance:', err);
    }
}
