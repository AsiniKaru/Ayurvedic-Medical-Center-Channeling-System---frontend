/**
 * Hela Osu Channeling System - Chart.js Analytics Dashboard Manager
 */

class AnalyticsManager {
    constructor() {
        this.trendChart = null;
        this.specChart = null;
        this.revenueChart = null;
    }

    initCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js CDN not loaded yet.');
            return;
        }

        this.renderAppointmentTrends();
        this.renderSpecializationBreakdown();
        this.renderRevenuePerDoctor();
    }

    renderAppointmentTrends() {
        const ctx = document.getElementById('chartAppointmentTrends');
        if (!ctx) return;

        if (this.trendChart) this.trendChart.destroy();

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Appointments Booked',
                    data: [12, 19, 15, 22, 28, 35, 20],
                    borderColor: '#0d7a5f',
                    backgroundColor: 'rgba(13, 122, 95, 0.12)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#0d7a5f',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    renderSpecializationBreakdown() {
        const ctx = document.getElementById('chartSpecializations');
        if (!ctx) return;

        if (this.specChart) this.specChart.destroy();

        this.specChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Ayurveda & Weda Kam', 'Cardiology', 'Pediatrics', 'Neurology', 'Dermatology'],
                datasets: [{
                    data: [42, 22, 18, 10, 8],
                    backgroundColor: ['#0d7a5f', '#0284c7', '#d97706', '#8b5cf6', '#ec4899'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' }
                },
                cutout: '68%'
            }
        });
    }

    renderRevenuePerDoctor() {
        const ctx = document.getElementById('chartRevenue');
        if (!ctx) return;

        if (this.revenueChart) this.revenueChart.destroy();

        this.revenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Dr. Wickramasinghe', 'Dr. Jayawardena', 'Dr. Fernando', 'Dr. Bandara', 'Dr. Samarasinghe'],
                datasets: [{
                    label: 'Total Revenue (LKR)',
                    data: [145000, 112000, 96000, 78000, 64000],
                    backgroundColor: '#d97706',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(val) {
                                return 'Rs. ' + (val / 1000) + 'k';
                            }
                        }
                    }
                }
            }
        });
    }
}

window.analyticsManager = new AnalyticsManager();
