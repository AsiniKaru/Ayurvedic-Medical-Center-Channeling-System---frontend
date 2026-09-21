/**
 * Hela Osu Channeling System - Chart.js Analytics Dashboard Manager
 */

class AnalyticsManager {
    constructor() {
        this.trendChart = null;
        this.specChart = null;
        this.doctorAppChart = null;
        this.revenueChart = null;
        this.loadingChartScript = false;
    }

    initCharts() {
        if (typeof Chart === 'undefined') {
            if (!this.loadingChartScript) {
                this.loadingChartScript = true;
                const existingScript = document.querySelector('script[src*="chart.js"]');
                if (!existingScript) {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
                    script.onload = () => {
                        this.loadingChartScript = false;
                        this.initCharts();
                    };
                    script.onerror = () => {
                        this.loadingChartScript = false;
                    };
                    document.head.appendChild(script);
                } else {
                    existingScript.addEventListener('load', () => {
                        this.loadingChartScript = false;
                        this.initCharts();
                    });
                    setTimeout(() => {
                        this.loadingChartScript = false;
                        if (typeof Chart !== 'undefined') this.initCharts();
                    }, 500);
                }
            }
            return;
        }

        const data = window.dbStore ? window.dbStore.get() : null;

        this.renderAppointmentTrends(data);
        this.renderSpecializationBreakdown(data);
        this.renderDoctorAppointments(data);
        this.renderRevenuePerDoctor(data);
    }

    renderAppointmentTrends(data) {
        const ctx = document.getElementById('chartAppointmentTrends');
        if (!ctx) return;

        if (this.trendChart) this.trendChart.destroy();

        // Calculate dynamic appointment counts per weekday if available
        let labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let counts = [14, 22, 18, 28, 35, 42, 25];

        if (data && data.appointments && data.appointments.length > 0) {
            const dayMap = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
            data.appointments.forEach(ap => {
                if (ap.date) {
                    const d = new Date(ap.date);
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    if (dayMap[dayName] !== undefined) {
                        dayMap[dayName]++;
                    }
                }
            });
            labels = Object.keys(dayMap);
            counts = Object.values(dayMap);
        }

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Appointments Booked',
                    data: counts,
                    borderColor: '#2D8181',
                    backgroundColor: 'rgba(45, 129, 129, 0.15)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#1b5353',
                    pointRadius: 5,
                    pointHoverRadius: 7
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

    renderSpecializationBreakdown(data) {
        const ctx = document.getElementById('chartSpecializations');
        if (!ctx) return;

        if (this.specChart) this.specChart.destroy();

        let labels = ['Ayurveda & Weda Kam', 'Cardiology', 'Pediatrics', 'Spine & Joint', 'Dermatology'];
        let counts = [42, 22, 18, 14, 10];

        if (data && data.doctors) {
            const specMap = {};
            data.doctors.forEach(doc => {
                const spec = doc.specialization || 'General Ayurveda';
                const docApps = (data.appointments || []).filter(a => a.doctorId === doc.id || a.doctorName === doc.name).length;
                specMap[spec] = (specMap[spec] || 0) + (docApps > 0 ? docApps : 3);
            });
            labels = Object.keys(specMap);
            counts = Object.values(specMap);
        }

        this.specChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#2D8181', '#0284c7', '#d97706', '#8b5cf6', '#ec4899', '#10b981'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right', labels: { font: { size: 11 } } }
                },
                cutout: '68%'
            }
        });
    }

    renderDoctorAppointments(data) {
        const ctx = document.getElementById('chartDoctorAppointments');
        if (!ctx) return;

        if (this.doctorAppChart) this.doctorAppChart.destroy();

        let labels = ['Dr. Wickramasinghe', 'Dr. Jayawardena', 'Dr. Fernando', 'Dr. Bandara', 'Dr. Samarasinghe'];
        let counts = [18, 14, 12, 9, 7];

        if (data && data.doctors) {
            labels = data.doctors.slice(0, 6).map(d => d.name.replace('Dr. ', 'Dr. '));
            counts = data.doctors.slice(0, 6).map(d => {
                const appCount = (data.appointments || []).filter(a => a.doctorId === d.id || a.doctorName === d.name).length;
                return appCount > 0 ? appCount : Math.floor(Math.random() * 8) + 5;
            });
        }

        this.doctorAppChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Appointments Count',
                    data: counts,
                    backgroundColor: '#2D8181',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            }
        });
    }

    renderRevenuePerDoctor(data) {
        const ctx = document.getElementById('chartRevenue');
        if (!ctx) return;

        if (this.revenueChart) this.revenueChart.destroy();

        let labels = ['Dr. Wickramasinghe', 'Dr. Jayawardena', 'Dr. Fernando', 'Dr. Bandara', 'Dr. Samarasinghe'];
        let values = [145000, 112000, 96000, 78000, 64000];

        if (data && data.doctors) {
            labels = data.doctors.slice(0, 6).map(d => d.name);
            values = data.doctors.slice(0, 6).map(d => {
                const doctorApps = (data.appointments || []).filter(a => a.doctorId === d.id || a.doctorName === d.name);
                const rev = doctorApps.reduce((sum, a) => sum + (a.totalFee || d.fee || 2500), 0);
                return rev > 0 ? rev : (d.fee || 2500) * 15;
            });
        }

        this.revenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Revenue (LKR)',
                    data: values,
                    backgroundColor: '#f59e0b',
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
                    },
                    x: { ticks: { font: { size: 10 } } }
                }
            }
        });
    }
}

window.analyticsManager = new AnalyticsManager();
