/**
 * dashboard.js
 * Carga los datos de los endpoints JSON del backend y renderiza
 * los gráficos de Chart.js en el Dashboard de FinanZ.
 */

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        renderExpensesPieChart(),
        renderBalanceLineChart(),
    ]);
});


// ---------------------------------------------------------------------------
// Gráfico de Torta – Egresos por Categoría (mes actual)
// ---------------------------------------------------------------------------
async function renderExpensesPieChart() {
    const canvas = document.getElementById('expensesPieChart');
    const emptyMsg = document.getElementById('pie-empty');
    if (!canvas) return;

    try {
        const res = await fetch('/finance/api/expenses-by-category/');
        const json = await res.json();
        const data = json.data;

        if (!data || data.length === 0) {
            canvas.classList.add('d-none');
            if (emptyMsg) emptyMsg.classList.remove('d-none');
            return;
        }

        const labels = data.map(d => d.category);
        const values = data.map(d => d.total);
        const colors = generateColors(labels.length);

        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff',
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` $${Number(ctx.raw).toLocaleString('es-CO')}`
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error cargando gráfico de torta:', err);
    }
}


// ---------------------------------------------------------------------------
// Gráfico de Líneas – Evolución mensual del balance
// ---------------------------------------------------------------------------
async function renderBalanceLineChart() {
    const canvas = document.getElementById('balanceLineChart');
    const emptyMsg = document.getElementById('line-empty');
    if (!canvas) return;

    try {
        const res = await fetch('/finance/api/balance/');
        const json = await res.json();
        const data = json.data;

        if (!data || data.length === 0) {
            canvas.classList.add('d-none');
            if (emptyMsg) emptyMsg.classList.remove('d-none');
            return;
        }

        const labels = data.map(d => d.month);
        const values = data.map(d => d.balance);

        new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Balance ($)',
                    data: values,
                    borderColor: '#198754',
                    backgroundColor: 'rgba(25, 135, 84, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#198754',
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` $${Number(ctx.raw).toLocaleString('es-CO')}`
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: val => `$${Number(val).toLocaleString('es-CO')}`
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error cargando gráfico de líneas:', err);
    }
}


// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function generateColors(count) {
    const palette = [
        '#4e79a7', '#f28e2b', '#e15759', '#76b7b2',
        '#59a14f', '#edc948', '#b07aa1', '#ff9da7',
        '#9c755f', '#bab0ac', '#d37295', '#fabfd2',
        '#8cd17d', '#b6992d', '#499894', '#86bcb6',
    ];
    return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
}
