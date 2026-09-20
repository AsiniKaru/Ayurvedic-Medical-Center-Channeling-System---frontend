/**
 * Hela Osu Channeling System - Core Application Controller, Auth & Router
 * Exclusively for Hela Osu Weda Gedara Centers with Role-Based Navigation Tabs
 */

class AppController {
    constructor() {
        this.session = JSON.parse(localStorage.getItem('hela_osu_session')) || null;
        this.currentLoginRole = 'patient';
        this.selectedDoctorForBooking = null;
        this.selectedSlotForBooking = null;
        this.selectedDateForBooking = null;
        this.selectedPaymentMethod = 'card';

        this.init();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link[data-view]');
            if (navLink) {
                const viewId = navLink.getAttribute('data-view');
                if (viewId) {
                    e.preventDefault();
                    this.switchView(viewId);
                }
            }
        });
    }

    canAccessView(viewId) {
        if (!viewId || viewId === 'view-login' || viewId === 'view-register' || viewId === 'view-home') return true;
        if (!this.session) return false;
        const role = this.session.role;
        if (viewId.startsWith('view-admin') && role !== 'admin') return false;
        if (viewId.startsWith('view-doctor') && role !== 'doctor') return false;
        return true;
    }

    init() {
        window.addEventListener('DOMContentLoaded', () => {
            this.bindEvents();
            window.i18n.applyTranslations();
            
            const currentPage = this.getCurrentPageName();
            if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
                this.renderDoctorsGrid();
                this.renderDashboardStats();
                this.initGalleMap();
            }

            if (this.session) {
                this.applySessionPermissions();
            } else {
                if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
                    this.renderHeaderGuestArea();
                } else if (currentPage !== 'login.html') {
                    window.location.href = 'login.html';
                } else {
                    this.setLoginRole('patient');
                }
            }

            this.updateNotificationBadge();
        });

        window.addEventListener('languageChanged', () => {
            this.renderDoctorsGrid();
            if (this.session && this.session.role === 'patient') {
                this.renderPatientBookings();
            }
        });
    }

    getCurrentPageName() {
        const path = window.location.pathname;
        return path.split('/').pop() || 'index.html';
    }

    renderHeaderGuestArea() {
        const userHeaderArea = document.getElementById('userHeaderArea');
        if (userHeaderArea) {
            userHeaderArea.innerHTML = `
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn btn-primary btn-sm" style="border-radius: 24px; padding: 0.45rem 1.2rem; font-weight: 700; font-size: 0.88rem; background: linear-gradient(135deg, #1e5c5c, #2D8181); border: none; color: white; box-shadow: 0 4px 12px rgba(45, 129, 129, 0.35);" onclick="window.location.href='login.html'">
                        <i class="fa-solid fa-right-to-bracket"></i> Login / Sign Up
                    </button>
                </div>
            `;
        }
    }

    renderDashboardStats() {
        const data = window.dbStore.get();
        const statDocs = document.getElementById('statTotalDoctors');
        const statApps = document.getElementById('statTotalAppointments');
        const statPatients = document.getElementById('statTotalPatients');
        
        if (statDocs && data.doctors) statDocs.textContent = `${data.doctors.length}+`;
        if (statApps && data.appointments) statApps.textContent = `${data.appointments.length + 120}+`;
        if (statPatients && data.patients) statPatients.textContent = `${data.patients.length + 450}+`;
    }

    openQuickLoginModal(role = 'patient') {
        const overlay = document.getElementById('globalModalOverlay');
        const container = document.getElementById('modalContent');
        if (!overlay || !container) return;

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-right-to-bracket" style="color: var(--primary);"></i> Sign In to Hela Osu Portal</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="width: 56px; height: 56px; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; border-radius: 16px; margin: 0 auto 0.75rem auto; display: flex; align-items: center; justify-content: center; font-size: 1.6rem;">
                        ${role === 'admin' ? '⚙️' : role === 'doctor' ? '🩺' : '👤'}
                    </div>
                    <h4 style="font-size: 1.2rem; color: var(--dark);">${role === 'admin' ? 'System Admin Portal' : role === 'doctor' ? 'Doctor (Wedamahataya) Login' : 'Patient Account Sign In'}</h4>
                    <p style="color: #64748b; font-size: 0.85rem; margin-top: 0.25rem;">Channel specialists, manage appointments & medical records</p>
                </div>

                <form onsubmit="event.preventDefault(); const u = document.getElementById('quickUsername').value; const p = document.getElementById('quickPassword').value; app.login(u, p, '${role}');">
                    <div style="margin-bottom: 1rem;">
                        <label style="font-weight: 600; font-size: 0.85rem; color: #475569;">Username</label>
                        <input type="text" id="quickUsername" placeholder="${role === 'admin' ? 'admin' : role === 'doctor' ? 'dr_wickramasinghe' : 'saman'}" required style="width: 100%; padding: 0.7rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>

                    <div style="margin-bottom: 1.25rem;">
                        <label style="font-weight: 600; font-size: 0.85rem; color: #475569;">Password</label>
                        <input type="password" id="quickPassword" value="password" required style="width: 100%; padding: 0.7rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; font-size: 1.05rem;">
                        <i class="fa-solid fa-right-to-bracket"></i> Sign In to Portal
                    </button>
                </form>

                <div style="margin-top: 1.5rem; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 1rem;">
                    <p style="font-size: 0.85rem; color: #64748b;">
                        New patient? <a href="login.html" style="color: var(--primary); font-weight: 700;">Register Account Here</a>
                    </p>
                </div>
            </div>
        `;

        overlay.classList.add('active');
    }

    closeModal() {
        const overlay = document.getElementById('globalModalOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    applySessionPermissions() {
        const session = this.session;
        const currentPage = this.getCurrentPageName();

        if (!session) {
            this.renderHeaderGuestArea();
            if (currentPage !== 'index.html' && currentPage !== '' && currentPage !== '/' && currentPage !== 'login.html') {
                window.location.href = 'login.html';
            }
            return;
        }

        const role = session.role;

        // Redirect if on login.html while already authenticated
        if (currentPage === 'login.html') {
            if (role === 'admin') window.location.href = 'adminDashboard.html';
            else if (role === 'doctor') window.location.href = 'doctor.html';
            else window.location.href = 'patient.html';
            return;
        }

        if ((currentPage === 'admin.html' || currentPage === 'adminDashboard.html') && role !== 'admin') {
            window.location.href = (role === 'doctor') ? 'doctor.html' : 'patient.html';
            return;
        }
        if (currentPage === 'doctor.html' && role !== 'doctor') {
            window.location.href = (role === 'admin') ? 'adminDashboard.html' : 'patient.html';
            return;
        }
        if (currentPage === 'patient.html' && role !== 'patient') {
            window.location.href = (role === 'admin') ? 'adminDashboard.html' : 'doctor.html';
            return;
        }

        const userHeaderArea = document.getElementById('userHeaderArea');
        if (userHeaderArea) {
            const portalUrl = role === 'admin' ? 'adminDashboard.html' : role === 'doctor' ? 'doctor.html' : 'patient.html';
            const portalLabel = role === 'admin' ? 'Admin Control Center' : role === 'doctor' ? 'Doctor Portal' : 'My Bookings';

            userHeaderArea.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <a href="${portalUrl}" class="btn btn-sm btn-primary" style="font-size: 0.85rem;">
                        <i class="fa-solid fa-gauge"></i> ${portalLabel}
                    </a>
                    <span class="role-badge role-${role}">
                        <i class="fa-solid fa-user"></i> ${session.name}
                    </span>
                    <button class="btn btn-outline btn-sm" onclick="app.logout()">
                        <i class="fa-solid fa-right-from-bracket"></i> Logout
                    </button>
                </div>
            `;
        }

        // Render portal views
        if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
            this.renderDoctorsGrid();
            this.renderDashboardStats();
        } else if (role === 'admin') {
            if (window.adminController) window.adminController.renderAdminDashboard();
        } else if (role === 'doctor') {
            this.renderDoctorPortal();
        } else {
            const patientWelcomeTitle = document.getElementById('patientWelcomeTitle');
            const patientActiveCountBadge = document.getElementById('patientActiveCountBadge');
            if (patientWelcomeTitle && session.name) {
                patientWelcomeTitle.textContent = `Welcome back, ${session.name}!`;
            }
            if (patientActiveCountBadge && role === 'patient') {
                const data = window.dbStore.get();
                const activeCount = data.appointments.filter(a => a.patientId === session.id && (a.status === 'Upcoming' || a.status === 'Rescheduled')).length;
                patientActiveCountBadge.textContent = activeCount;
            }

            this.renderDoctorsGrid();
            this.renderPatientBookings();
            this.renderReportConsultations();
        }
    }

    setLoginRole(role) {
        this.currentLoginRole = role;
        const roleInput = document.getElementById('loginRoleInput');
        const titleText = document.getElementById('loginTitleText');
        const iconContainer = document.getElementById('loginRoleIcon');
        const usernameInput = document.getElementById('loginUsername');

        if (roleInput) roleInput.value = role;

        if (role === 'doctor') {
            if (titleText) titleText.textContent = 'Wedamahataya Doctor Login';
            if (iconContainer) iconContainer.innerHTML = '🩺';
            if (usernameInput) usernameInput.placeholder = 'Enter doctor username (e.g. dr_wickramasinghe)';
        } else if (role === 'admin') {
            if (titleText) titleText.textContent = 'Admin Control Login';
            if (iconContainer) iconContainer.innerHTML = '⚙️';
            if (usernameInput) usernameInput.placeholder = 'Enter admin username (e.g. admin)';
        } else {
            if (titleText) titleText.textContent = 'Patient Login';
            if (iconContainer) iconContainer.innerHTML = '👤';
            if (usernameInput) usernameInput.placeholder = 'Enter username (e.g. saman_k)';
        }

        const roleSwitchButtons = document.getElementById('loginRoleSwitchButtons');
        if (roleSwitchButtons) {
            const btns = roleSwitchButtons.querySelectorAll('button');
            btns.forEach(btn => {
                const text = btn.textContent.toLowerCase();
                if ((role === 'doctor' && text.includes('doctor')) ||
                    (role === 'admin' && text.includes('admin')) ||
                    (role === 'patient' && text.includes('patient'))) {
                    btn.style.background = '#2D8181';
                    btn.style.color = '#ffffff';
                } else {
                    btn.style.background = 'transparent';
                    btn.style.color = '#2D8181';
                }
            });
        }
    }

    switchView(viewId) {
        if (!this.canAccessView(viewId)) {
            this.showToast('Access denied! Please log in with valid credentials.', 'danger');
            return;
        }

        document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active-view'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        const target = document.getElementById(viewId);
        if (target) {
            target.classList.add('active-view');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        const activeLink = document.querySelector(`.nav-link[data-view="${viewId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        if (viewId.startsWith('view-admin')) {
            if (window.adminController) window.adminController.renderAdminDashboard();
        } else if (viewId.startsWith('view-doctor')) {
            this.renderDoctorPortal();
        }
    }

    performLocalLogin(username, password) {
        const data = window.dbStore.get();
        let role = this.currentLoginRole || 'patient';
        let userObj = null;

        if (username === 'admin' || role === 'admin') {
            role = 'admin';
            userObj = { id: 'admin-1', username: username || 'admin', name: 'System Administrator', role: 'admin' };
        } else {
            const doc = data.doctors ? data.doctors.find(d => d.username === username || d.email === username) : null;
            if (doc) {
                role = 'doctor';
                userObj = { id: doc.id, username: doc.username, name: doc.name, role: 'doctor' };
            } else {
                const pat = (data.patients || []).find(p => p.username === username || p.email === username);
                if (pat) {
                    role = 'patient';
                    userObj = { id: pat.id, username: pat.username, name: pat.name, role: 'patient' };
                } else {
                    userObj = { id: 'user-' + Date.now(), username: username, name: username, role: role };
                }
            }
        }

        this.session = userObj;
        localStorage.setItem('hela_osu_session', JSON.stringify(userObj));
        this.showToast(`Welcome back, ${userObj.name}!`, 'success');

        setTimeout(() => {
            if (role === 'admin') window.location.href = 'adminDashboard.html';
            else if (role === 'doctor') window.location.href = 'doctor.html';
            else window.location.href = 'patient.html';
        }, 400);
    }

    logout() {
        this.session = null;
        localStorage.removeItem('hela_osu_session');
        this.showToast('Logged out successfully.', 'info');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 300);
    }

    // -------------------------------------------------------------------------
    // PATIENT PORTAL FUNCTIONS
    // -------------------------------------------------------------------------

    renderDoctorsGrid(filteredList = null) {
        const grid = document.getElementById('doctorsGrid');
        if (!grid) return;

        const data = window.dbStore.get();
        const helaOsuDocs = data.doctors.filter(d => d.status === 'approved' && d.hospital.includes('Hela Osu Weda Gedara'));
        const docs = filteredList || helaOsuDocs;

        if (docs.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: white; border-radius: 16px;">
                    <h3>No Hela Osu Doctors Found</h3>
                    <p style="color: #64748b;">Try adjusting your search criteria or specialization filter.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = docs.map(doc => `
            <div class="doctor-card">
                <div class="doctor-card-header">
                    <div class="doctor-info">
                        <h3 class="doctor-name">${doc.name}</h3>
                        <p class="doctor-spec">${doc.specialization}</p>
                        <p class="doctor-hospital"><i class="fa-solid fa-clinic-medical" style="color: #2D8181;"></i> ${doc.hospital}</p>
                    </div>
                </div>
                <div class="doctor-card-body">
                    <p style="font-size: 0.875rem; color: #475569; line-height: 1.4;">${doc.bio}</p>
                    <div class="doctor-stats">
                        <span class="rating-badge"><i class="fa-solid fa-star"></i> ${doc.rating} (${doc.reviewsCount})</span>
                        <span><i class="fa-solid fa-briefcase"></i> ${doc.experience}</span>
                    </div>
                </div>
                <div class="doctor-card-footer">
                    <button class="btn btn-primary" onclick="app.openBookingModal('${doc.id}')">
                        <i class="fa-solid fa-calendar-check"></i> Book Session
                    </button>
                    <button class="btn btn-outline" onclick="app.openDoctorDetailsModal('${doc.id}')">
                        <i class="fa-solid fa-circle-info"></i> View Profile
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterDoctors() {
        const searchInput = document.getElementById('heroSearchInput');
        const specSelect = document.getElementById('heroSpecSelect');

        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const spec = specSelect ? specSelect.value : 'all';

        const data = window.dbStore.get();
        let filtered = data.doctors.filter(d => d.status === 'approved');

        if (spec !== 'all') {
            filtered = filtered.filter(d => d.specialization.toLowerCase().includes(spec.toLowerCase()));
        }

        if (query) {
            filtered = filtered.filter(d => 
                d.name.toLowerCase().includes(query) ||
                d.specialization.toLowerCase().includes(query) ||
                d.hospital.toLowerCase().includes(query) ||
                (d.availability && d.availability.workingDays && d.availability.workingDays.some(day => day.toLowerCase().includes(query)))
            );
        }

        this.renderDoctorsGrid(filtered);
    }

    initGalleMap() {
        const mapContainer = document.getElementById('galleBranchMap');
        if (!mapContainer) return;

        const galleLat = 6.0535;
        const galleLng = 80.2210;
        let loadedLeaflet = false;

        if (typeof L !== 'undefined') {
            try {
                const map = L.map('galleBranchMap', {
                    scrollWheelZoom: false,
                    zoomControl: true
                }).setView([galleLat, galleLng], 15);

                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);

                const customIcon = L.divIcon({
                    className: 'custom-galle-pin',
                    html: `<div style="background: #2D8181; color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(45, 129, 129, 0.4); border: 3px solid white; font-size: 1.25rem;">🌿</div>`,
                    iconSize: [44, 44],
                    iconAnchor: [22, 44],
                    popupAnchor: [0, -42]
                });

                const marker = L.marker([galleLat, galleLng], { icon: customIcon }).addTo(map);
                marker.bindPopup(`
                    <div style="font-family: 'Plus Jakarta Sans', sans-serif; text-align: center; padding: 6px; min-width: 180px;">
                        <strong style="color: #2D8181; font-size: 1.05rem;">🌿 Hela Osu Weda Gedara</strong><br/>
                        <span style="font-weight: 700; color: #0f172a; font-size: 0.95rem;">Galle Medical Center</span><br/>
                        <small style="color: #64748b;">No. 88, Main Street, Galle</small><br/>
                        <span style="display: inline-block; margin-top: 6px; background: #ecfdf5; color: #047857; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">Open 24/7 OPD</span>
                    </div>
                `).openPopup();

                setTimeout(() => { map.invalidateSize(); }, 100);
                setTimeout(() => { map.invalidateSize(); }, 500);
                setTimeout(() => { map.invalidateSize(); }, 1200);
                loadedLeaflet = true;
            } catch (e) {
                console.error('Error initializing Leaflet map:', e);
            }
        }
    }

    openDoctorDetailsModal(docId) {
        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.id === docId);
        if (!doc) return;

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-user-doctor" style="color: var(--primary);"></i> Wedamahataya Specialist Profile</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: flex; gap: 1.25rem; align-items: flex-start; margin-bottom: 1.5rem; background: #f8fafc; padding: 1.25rem; border-radius: 16px;">
                    <div>
                        <h3 style="margin-bottom: 0.25rem;">${doc.name}</h3>
                        <p style="color: var(--primary); font-weight: 700; font-size: 0.95rem;">${doc.title || doc.specialization}</p>
                        <p style="color: #64748b; font-size: 0.85rem; margin-top: 0.2rem;"><i class="fa-solid fa-clinic-medical"></i> ${doc.hospital} • Reg: ${doc.regNo || 'SLMC-7890'}</p>
                        <span class="rating-badge" style="margin-top: 0.4rem; display: inline-flex;"><i class="fa-solid fa-star"></i> ${doc.rating} (${doc.reviewsCount} reviews)</span>
                    </div>
                </div>

                <div style="margin-bottom: 1.25rem;">
                    <h5 style="font-weight: 700; margin-bottom: 0.4rem; color: #334155;">About Wedamahataya</h5>
                    <p style="color: #475569; font-size: 0.9rem; line-height: 1.5;">${doc.bio}</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; background: #ecfdf5; padding: 1rem; border-radius: 12px; border: 1px solid #a7f3d0;">
                    <div>
                        <span style="font-size: 0.8rem; color: #047857; font-weight: 600;">Experience</span>
                        <p style="font-size: 1.1rem; font-weight: 800; color: #065f46;">${doc.experience}</p>
                    </div>
                    <div>
                        <span style="font-size: 0.8rem; color: #047857; font-weight: 600;">Consultation Fee</span>
                        <p style="font-size: 1.1rem; font-weight: 800; color: #065f46;">Rs. ${doc.fee.toLocaleString()}</p>
                    </div>
                </div>

                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="app.closeModal(); app.openBookingModal('${doc.id}')">
                        <i class="fa-solid fa-calendar-check"></i> Book Session Now
                    </button>
                    <button class="btn btn-outline" style="flex: 1;" onclick="app.closeModal()">
                        Close Profile
                    </button>
                </div>
            </div>
        `;
        overlay.classList.add('active');
    }

    openBookingModal(docId) {
        if (!this.session || this.session.role !== 'patient') {
            this.showToast('Please sign in as a Patient to book channeling appointments.', 'warning');
            this.openQuickLoginModal('patient');
            return;
        }

        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.id === docId);
        if (!doc) return;

        this.selectedDoctorForBooking = doc;
        this.selectedSlotForBooking = doc.availability.timeSlots[0];
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.selectedDateForBooking = tomorrow.toISOString().split('T')[0];

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        const total = doc.fee + doc.hospitalFee;

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-calendar-plus" style="color: #0d7a5f;"></i> Book Channeling Slot</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; background: #f8fafc; padding: 1rem; border-radius: 12px;">
                    <div>
                        <h4 style="margin-bottom: 0.2rem;">${doc.name}</h4>
                        <p style="color: #2D8181; font-weight: 600; font-size: 0.85rem;">${doc.specialization}</p>
                        <p style="color: #64748b; font-size: 0.8rem;">🏢 ${doc.hospital}</p>
                    </div>
                </div>

                <div style="margin-bottom: 1.25rem;">
                    <label style="font-weight: 600; display: block; margin-bottom: 0.4rem;">Select Consultation Date</label>
                    <input type="date" id="bookingDateInput" value="${this.selectedDateForBooking}" min="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                </div>

                <div style="margin-bottom: 1.25rem;">
                    <label style="font-weight: 600; display: block; margin-bottom: 0.4rem;">Available Sessions</label>
                    <div class="slots-grid">
                        ${doc.availability.timeSlots.map((slot, idx) => `
                            <div class="slot-btn ${idx === 0 ? 'selected' : ''}" onclick="app.selectSlot('${slot}', this)">
                                ${slot}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
                        <span>Doctor Fee:</span>
                        <strong>Rs. ${doc.fee.toLocaleString()}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
                        <span>Hela Osu Clinic Facility Fee:</span>
                        <strong>Rs. ${doc.hospitalFee.toLocaleString()}</strong>
                    </div>
                    <hr style="border: none; border-top: 1px solid #a7f3d0; margin: 0.5rem 0;">
                    <div style="display: flex; justify-content: space-between; font-size: 1.1rem; color: #065f46; font-weight: 800;">
                        <span>Total Amount:</span>
                        <span>Rs. ${total.toLocaleString()}</span>
                    </div>
                </div>

                <button class="btn btn-primary" style="width: 100%; font-size: 1.05rem;" onclick="app.openPaymentStep()">
                    <i class="fa-solid fa-lock"></i> Proceed to Checkout
                </button>
            </div>
        `;

        overlay.classList.add('active');

        document.getElementById('bookingDateInput').addEventListener('change', (e) => {
            this.selectedDateForBooking = e.target.value;
        });
    }

    selectSlot(slot, element) {
        this.selectedSlotForBooking = slot;
        document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
        element.classList.add('selected');
    }

    openPaymentStep() {
        const container = document.getElementById('modalContent');
        const doc = this.selectedDoctorForBooking;
        const total = doc.fee + doc.hospitalFee;

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-credit-card" style="color: #0d7a5f;"></i> Hela Pay Secure Checkout</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1rem;">Select your preferred payment method:</p>

                <div class="payment-methods">
                    <div class="payment-method-card ${this.selectedPaymentMethod === 'card' ? 'selected' : ''}" onclick="app.selectPaymentMethod('card', this)">
                        <i class="fa-solid fa-credit-card" style="font-size: 1.5rem; margin-bottom: 0.3rem;"></i><br>
                        Credit / Debit Card
                    </div>
                    <div class="payment-method-card ${this.selectedPaymentMethod === 'counter' ? 'selected' : ''}" onclick="app.selectPaymentMethod('counter', this)">
                        <i class="fa-solid fa-hospital-user" style="font-size: 1.5rem; margin-bottom: 0.3rem;"></i><br>
                        Pay at Hela Osu Clinic Counter
                    </div>
                </div>

                <div id="paymentDetailsForm">
                    <div style="margin-bottom: 1rem;">
                        <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Card Number</label>
                        <input type="text" value="4532 •••• •••• 8892" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Expiry Date</label>
                            <input type="text" value="12/28" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                        </div>
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">CVV</label>
                            <input type="password" value="882" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                        </div>
                    </div>
                </div>

                <button class="btn btn-primary" id="btnPayConfirm" style="width: 100%; font-size: 1.05rem;" onclick="app.processPayment()">
                    Confirm & Pay Rs. ${total.toLocaleString()}
                </button>
            </div>
        `;
    }

    selectPaymentMethod(method, element) {
        this.selectedPaymentMethod = method;
        document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
        element.classList.add('selected');

        const form = document.getElementById('paymentDetailsForm');
        if (method === 'counter') {
            form.innerHTML = `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 10px; text-align: center; margin-bottom: 1rem;">
                    <i class="fa-solid fa-hospital-user" style="font-size: 2rem; color: #0d7a5f; margin-bottom: 0.5rem;"></i>
                    <p style="font-size: 0.9rem; color: #334155; font-weight: 600;">Pay Cash or Card at Hela Osu Reception Counter</p>
                    <p style="font-size: 0.8rem; color: #64748b;">Token voucher will be reserved immediately. Present token at reception 15 minutes before session.</p>
                </div>
            `;
        } else {
            form.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Card Number</label>
                    <input type="text" value="4532 •••• •••• 8892" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Expiry Date</label>
                        <input type="text" value="12/28" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>
                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">CVV</label>
                        <input type="password" value="882" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>
                </div>
            `;
        }
    }

    processPayment() {
        const btn = document.getElementById('btnPayConfirm');
        if (btn) {
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authorizing Payment...`;
            btn.disabled = true;
        }

        setTimeout(async () => {
            const data = window.dbStore.get();
            const doc = this.selectedDoctorForBooking;
            const newAp = {
                id: 'AP-' + Math.floor(1000 + Math.random() * 9000),
                patientId: this.session ? this.session.id : 1,
                patientName: this.session ? this.session.name : 'Patient',
                patientEmail: (this.session && this.session.email) ? this.session.email : 'patient@helaosu.lk',
                patientPhone: (this.session && this.session.phone) ? this.session.phone : '0771234567',
                doctorId: doc.id,
                doctorName: doc.name,
                specialization: doc.specialization,
                hospital: doc.hospital,
                date: this.selectedDateForBooking,
                timeSlot: this.selectedSlotForBooking,
                tokenNo: Math.floor(Math.random() * 15) + 1,
                doctorFee: doc.fee,
                hospitalFee: doc.hospitalFee,
                totalFee: doc.fee + doc.hospitalFee,
                paymentStatus: this.selectedPaymentMethod === 'counter' ? 'Pending Counter Payment' : 'Paid Online',
                paymentMethod: this.selectedPaymentMethod === 'counter' ? 'Clinic Counter' : 'Credit Card',
                status: 'Upcoming',
                notes: 'Self appointment booking via Hela Osu web platform',
                prescription: null,
                createdAt: new Date().toISOString().split('T')[0]
            };

            data.appointments.unshift(newAp);

            data.notifications.unshift({
                id: 'NOTIF-' + Date.now(),
                userId: this.session ? this.session.id : 1,
                title: 'Hela Osu Channeling Confirmed 🎉',
                message: `Booking #${newAp.id} reserved with ${doc.name} for ${newAp.date} (Token #${newAp.tokenNo}). E-Voucher sent to email.`,
                time: 'Just now',
                unread: true
            });

            window.dbStore.save(data);

            // Connect to Spring Boot backend
            try {
                if (window.HelaApi) {
                    await HelaApi.appointments.book({
                        patientId: 1,
                        sessionId: 1,
                        queueNumber: newAp.tokenNo,
                        status: 'BOOKED',
                        paymentStatus: newAp.paymentStatus
                    });
                }
            } catch (e) {
                console.warn("Backend appointment booking offline:", e);
            }

            this.closeModal();
            this.showToast(`🎉 Booking Successful! Token #${newAp.tokenNo} reserved. E-Channeling Voucher sent to email!`, 'success');
            this.renderPatientBookings();
            this.updateNotificationBadge();
            this.switchView('view-bookings');
        }, 800);
    }

    renderPatientBookings() {
        const container = document.getElementById('patientBookingsList');
        if (!container || !this.session || this.session.role !== 'patient') return;

        const data = window.dbStore.get();
        const myAps = data.appointments.filter(a => a.patientId === this.session.id);

        if (myAps.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: white; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <i class="fa-solid fa-calendar-xmark" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.75rem;"></i>
                    <h3 style="color: #0f172a; margin-bottom: 0.3rem;">No Active Bookings</h3>
                    <p style="color: #64748b;">You have no active or previous channeling appointments at Hela Osu Weda Gedara.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = myAps.map(ap => `
            <div class="glass-card" style="margin-bottom: 1.25rem;">
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1rem;">
                    <div>
                        <span style="background: #e0f2fe; color: #0284c7; padding: 0.3rem 0.65rem; border-radius: 6px; font-weight: bold; font-size: 0.85rem;">
                            VOUCHER #${ap.id}
                        </span>
                        <h3 style="margin-top: 0.4rem; font-size: 1.2rem; color: #0f172a;">${ap.doctorName}</h3>
                        <p style="color: #0d7a5f; font-size: 0.9rem; font-weight: 600;">🌿 ${ap.specialization} • ${ap.hospital}</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 1.5rem; font-weight: 800; color: #0d7a5f;">TOKEN #${ap.tokenNo}</span><br>
                        <span style="padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; background: ${
                            ap.status === 'Completed' ? '#dcfce7; color: #15803d;' :
                            ap.status === 'Cancelled' ? '#fee2e2; color: #b91c1c;' :
                            ap.status === 'Rescheduled' ? '#e0f2fe; color: #0369a1;' : '#fef3c7; color: #b45309;'
                        }">${ap.status}</span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.9rem; margin-bottom: 1.25rem;">
                    <div><strong>Date & Time:</strong><br>${ap.date} (${ap.timeSlot})</div>
                    <div><strong>Total Fee:</strong><br>Rs. ${ap.totalFee.toLocaleString()} (${ap.paymentMethod})</div>
                    <div><strong>Payment Status:</strong><br><span style="color: ${ap.paymentStatus === 'Paid Online' ? '#15803d' : '#b45309'}; font-weight: 700;">${ap.paymentStatus}</span></div>
                </div>

                <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                    <button class="btn btn-sm btn-primary" onclick="app.viewReceipt('${ap.id}')">
                        <i class="fa-solid fa-receipt"></i> E-Receipt & Voucher PDF
                    </button>
                    ${ap.prescription ? `
                        <button class="btn btn-sm btn-secondary" onclick="app.viewPrescription('${ap.id}')">
                            <i class="fa-solid fa-file-prescription"></i> Digital Prescription
                        </button>
                    ` : ''}
                    ${ap.status === 'Upcoming' || ap.status === 'Rescheduled' ? `
                        <button class="btn btn-sm btn-outline" style="border-color: #2D8181; color: #2D8181; font-weight: 600;" onclick="app.openRescheduleModal('${ap.id}')">
                            <i class="fa-solid fa-calendar-days"></i> Reschedule
                        </button>
                        <button class="btn btn-sm" style="background: #fee2e2; color: #dc2626; border: none; font-weight: 600;" onclick="app.cancelAppointment('${ap.id}')">
                            <i class="fa-solid fa-xmark"></i> Cancel
                        </button>
                    ` : ''}
                    ${ap.status === 'Completed' ? `
                        <button class="btn btn-sm btn-outline" onclick="app.openRatingModal('${ap.doctorId}')">
                            <i class="fa-solid fa-star"></i> Rate Doctor
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    viewReceipt(apId) {
        const data = window.dbStore.get();
        const ap = data.appointments.find(a => a.id === apId);
        if (!ap) return;

        const html = window.pdfGen.renderReceiptHTML(ap);
        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-receipt"></i> E-Channeling Receipt</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                ${html}
                <div style="margin-top: 1.5rem; text-align: right;">
                    <button class="btn btn-primary" onclick="window.pdfGen.printDocument('receipt-doc')">
                        <i class="fa-solid fa-print"></i> Print Voucher PDF
                    </button>
                </div>
            </div>
        `;
        overlay.classList.add('active');
    }

    viewPrescription(apId) {
        const data = window.dbStore.get();
        const ap = data.appointments.find(a => a.id === apId);
        if (!ap) return;

        const html = window.pdfGen.renderPrescriptionHTML(ap);
        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-file-prescription"></i> Digital Prescription</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                ${html}
                <div style="margin-top: 1.5rem; text-align: right;">
                    <button class="btn btn-primary" onclick="window.pdfGen.printDocument('prescription-doc')">
                        <i class="fa-solid fa-print"></i> Print Prescription PDF
                    </button>
                </div>
            </div>
        `;
        overlay.classList.add('active');
    }

    cancelAppointment(apId) {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        const data = window.dbStore.get();
        const ap = data.appointments.find(a => a.id === apId);
        if (ap) {
            ap.status = 'Cancelled';
            window.dbStore.save(data);
            this.showToast('Appointment cancelled.', 'warning');
            this.renderPatientBookings();
        }
    }

    openRescheduleModal(apId) {
        const data = window.dbStore.get();
        const ap = data.appointments.find(a => a.id === apId);
        if (!ap) return;

        const doc = data.doctors.find(d => d.id === ap.doctorId) || { availability: { timeSlots: ['09:00 AM - 12:00 PM', '03:00 PM - 06:00 PM'] } };

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-calendar-days" style="color: #2D8181;"></i> Reschedule Channeling Appointment</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="background: #f8fafc; padding: 1rem; border-radius: 12px; margin-bottom: 1.25rem; border: 1px solid #e2e8f0;">
                    <p style="font-weight: 700; color: #0f172a; margin-bottom: 0.2rem;">VOUCHER #${ap.id} • ${ap.doctorName}</p>
                    <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Current Schedule: ${ap.date} (${ap.timeSlot})</p>
                </div>

                <div style="margin-bottom: 1.25rem;">
                    <label style="font-weight: 600; display: block; margin-bottom: 0.4rem; font-size: 0.9rem;">Select New Date</label>
                    <input type="date" id="rescheduleDateInput" value="${minDate}" min="${minDate}" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="font-weight: 600; display: block; margin-bottom: 0.4rem; font-size: 0.9rem;">Select New Time Slot</label>
                    <select id="rescheduleSlotSelect" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;">
                        ${doc.availability.timeSlots.map(slot => `<option value="${slot}">${slot}</option>`).join('')}
                    </select>
                </div>

                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="app.confirmReschedule('${ap.id}')">
                        <i class="fa-solid fa-check"></i> Confirm Reschedule
                    </button>
                    <button class="btn btn-outline" style="flex: 1;" onclick="app.closeModal()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        overlay.classList.add('active');
    }

    confirmReschedule(apId) {
        const newDate = document.getElementById('rescheduleDateInput').value;
        const newSlot = document.getElementById('rescheduleSlotSelect').value;

        if (!newDate) {
            this.showToast('Please select a valid date.', 'warning');
            return;
        }

        const data = window.dbStore.get();
        const ap = data.appointments.find(a => a.id === apId);
        if (ap) {
            ap.date = newDate;
            ap.timeSlot = newSlot;
            ap.status = 'Rescheduled';

            data.notifications.unshift({
                id: 'NOTIF-' + Date.now(),
                userId: this.session.id,
                title: 'Appointment Rescheduled 📅',
                message: `Booking #${ap.id} with ${ap.doctorName} moved to ${newDate} (${newSlot}).`,
                time: 'Just now',
                unread: true
            });

            window.dbStore.save(data);
            this.closeModal();
            this.showToast(`Appointment #${ap.id} rescheduled to ${newDate}!`, 'info');
            this.renderPatientBookings();
        }
    }

    renderReportConsultations() {
        const container = document.getElementById('reportConsultationsList');
        if (!container || !this.session || this.session.role !== 'patient') return;

        const data = window.dbStore.get();
        const consultations = data.reportConsultations.filter(c => c.patientId === this.session.id);

        if (consultations.length === 0) {
            container.innerHTML = `<p style="color: #64748b;">No report consultations submitted yet.</p>`;
            return;
        }

        container.innerHTML = consultations.map(c => `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <strong>${c.reportTitle}</strong>
                    <span style="padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8rem; font-weight: bold; background: ${c.status === 'Replied' ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #b45309;'}">${c.status}</span>
                </div>
                <p style="font-size: 0.85rem; color: #0d7a5f; font-weight: 600;">Doctor: ${c.doctorName}</p>
                <p style="font-size: 0.9rem; margin: 0.5rem 0; color: #334155;"><strong>Your Note:</strong> "${c.patientMessage}"</p>
                ${c.doctorReply ? `
                    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 0.75rem; border-radius: 6px; margin-top: 0.75rem; font-size: 0.9rem;">
                        <strong>Doctor Feedback (${c.repliedAt}):</strong><br>
                        ${c.doctorReply}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    submitReportConsultation(formData) {
        if (!this.session || this.session.role !== 'patient') return;

        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.id === formData.doctorId);

        const newConsultation = {
            id: 'RC-' + Math.floor(500 + Math.random() * 500),
            patientId: this.session.id,
            patientName: this.session.name,
            doctorId: doc ? doc.id : 'doc-101',
            doctorName: doc ? doc.name : 'Dr. Deshabandu Wickramasinghe',
            reportTitle: formData.reportTitle,
            reportFileName: formData.fileName || 'Diagnostic_Report.pdf',
            patientMessage: formData.message,
            doctorReply: null,
            repliedAt: null,
            status: 'Pending',
            submittedAt: new Date().toLocaleString()
        };

        data.reportConsultations.unshift(newConsultation);
        window.dbStore.save(data);

        this.showToast('Report uploaded & sent to Hela Osu doctor!', 'success');
        this.renderReportConsultations();
    }

    setRegisterRole(role) {
        const regRoleInput = document.getElementById('regRoleInput');
        const regFormTitle = document.getElementById('regFormTitle');
        const regFormSubtitle = document.getElementById('regFormSubtitle');
        const patientRegFields = document.getElementById('patientRegFields');
        const doctorRegFields = document.getElementById('doctorRegFields');
        const regSubmitBtn = document.getElementById('regSubmitBtn');
        const patBtn = document.getElementById('regTypePatientBtn');
        const docBtn = document.getElementById('regTypeDoctorBtn');

        if (regRoleInput) regRoleInput.value = role;

        if (role === 'doctor') {
            if (regFormTitle) regFormTitle.textContent = 'Register Doctor Account';
            if (regFormSubtitle) regFormSubtitle.textContent = 'Submit practitioner registration for Admin approval';
            if (patientRegFields) patientRegFields.style.display = 'none';
            if (doctorRegFields) doctorRegFields.style.display = 'block';
            if (regSubmitBtn) regSubmitBtn.innerHTML = '<i class="fa-solid fa-user-doctor"></i> Submit Doctor Registration';
            if (patBtn) { patBtn.style.background = 'transparent'; patBtn.style.color = '#475569'; }
            if (docBtn) { docBtn.style.background = '#1b5353'; docBtn.style.color = 'white'; }
        } else {
            if (regFormTitle) regFormTitle.textContent = 'Register Patient Account';
            if (regFormSubtitle) regFormSubtitle.textContent = 'Join Hela Osu Weda Gedara Channeling Network';
            if (patientRegFields) patientRegFields.style.display = 'block';
            if (doctorRegFields) doctorRegFields.style.display = 'none';
            if (regSubmitBtn) regSubmitBtn.innerHTML = '<i class="fa-solid fa-user-check"></i> Register Patient Account';
            if (patBtn) { patBtn.style.background = '#1b5353'; patBtn.style.color = 'white'; }
            if (docBtn) { docBtn.style.background = 'transparent'; docBtn.style.color = '#475569'; }
        }
    }

    // -------------------------------------------------------------------------
    // DOCTOR PORTAL FUNCTIONS
    // -------------------------------------------------------------------------

    renderDoctorPortal() {
        if (!this.session || this.session.role !== 'doctor') return;
        const data = window.dbStore.get();
        
        // Find doctor object matching logged in session or default to doc-101
        const doc = data.doctors.find(d => d.username === this.session.username || d.id === this.session.id) || data.doctors[0];
        this.currentDoctorObj = doc;

        // Pending Approval Check
        const pendingAlert = document.getElementById('doctorPendingAlert');
        const pendingRegNo = document.getElementById('docPendingRegNo');
        const docStatusBadge = document.getElementById('docStatusBadge');

        if (doc && doc.status === 'pending') {
            if (pendingAlert) pendingAlert.style.display = 'block';
            if (pendingRegNo) pendingRegNo.textContent = doc.regNo || 'SL-AYU-XXXX';
            if (docStatusBadge) {
                docStatusBadge.textContent = 'PENDING APPROVAL';
                docStatusBadge.style.background = '#f59e0b';
            }
        } else {
            if (pendingAlert) pendingAlert.style.display = 'none';
            if (docStatusBadge) {
                docStatusBadge.textContent = 'VERIFIED';
                docStatusBadge.style.background = 'rgba(255, 255, 255, 0.2)';
            }
        }

        // Update Doctor Hero Header
        const docNameElem = document.getElementById('docPortalName');
        const docSpecElem = document.getElementById('docPortalSpec');
        const docHospElem = document.getElementById('docPortalHospital');
        if (docNameElem && doc) docNameElem.textContent = doc.name;
        if (docSpecElem && doc) docSpecElem.textContent = `${doc.specialization} • ${doc.regNo || 'SL-AYU-4029'}`;
        if (docHospElem && doc) docHospElem.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${doc.hospital || 'Hela Osu Weda Gedara - Galle Branch'}`;

        // Get all appointments for this doctor (or doc-101)
        const myAppointments = data.appointments.filter(a => a.doctorId === doc.id || a.doctorId === 'doc-101');
        const myReports = data.reportConsultations.filter(c => c.doctorId === doc.id || c.doctorId === 'doc-101');

        // Update KPI Stats Cards
        const todayStr = new Date().toISOString().split('T')[0];
        const todayCount = myAppointments.filter(a => a.date === todayStr).length;
        const upcomingCount = myAppointments.filter(a => a.status === 'Upcoming').length;
        const completedCount = myAppointments.filter(a => a.status === 'Completed').length;
        const unrepliedReports = myReports.filter(c => c.status !== 'Replied').length;

        const statToday = document.getElementById('statDocTodayCount');
        const statUpcoming = document.getElementById('statDocUpcomingCount');
        const statCompleted = document.getElementById('statDocCompletedCount');
        const statReports = document.getElementById('statDocReportsCount');
        const unreadBadge = document.getElementById('unreadReportBadge');

        if (statToday) statToday.textContent = todayCount;
        if (statUpcoming) statUpcoming.textContent = upcomingCount;
        if (statCompleted) statCompleted.textContent = completedCount;
        if (statReports) statReports.textContent = myReports.length;
        if (unreadBadge) unreadBadge.textContent = unrepliedReports;

        // Render Session Queue Table
        const tbodyQueue = document.getElementById('doctorQueueTableBody');
        const searchInput = document.getElementById('docQueueSearch');
        const statusFilter = document.getElementById('docQueueStatusFilter');
        const totalLabel = document.getElementById('docQueueTotalLabel');

        if (tbodyQueue) {
            let filteredQueue = [...myAppointments];

            const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const statusVal = statusFilter ? statusFilter.value : 'All';

            if (searchQuery) {
                filteredQueue = filteredQueue.filter(a => 
                    a.patientName.toLowerCase().includes(searchQuery) ||
                    (a.tokenNo && a.tokenNo.toString().includes(searchQuery)) ||
                    (a.patientPhone && a.patientPhone.includes(searchQuery))
                );
            }

            if (statusVal !== 'All') {
                filteredQueue = filteredQueue.filter(a => a.status === statusVal);
            }

            if (totalLabel) totalLabel.textContent = `Showing ${filteredQueue.length} Session Tokens`;

            if (filteredQueue.length === 0) {
                tbodyQueue.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 2rem;">No session appointments match your search filter.</td></tr>`;
            } else {
                tbodyQueue.innerHTML = filteredQueue.map(ap => `
                    <tr>
                        <td>
                            <div style="width: 38px; height: 38px; background: #e0f2fe; color: #0284c7; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem;">
                                #${ap.tokenNo || 1}
                            </div>
                        </td>
                        <td>
                            <strong style="color: #0f172a; font-size: 0.95rem;">${ap.patientName}</strong><br>
                            <span style="font-size: 0.8rem; color: #64748b;"><i class="fa-solid fa-phone"></i> ${ap.patientPhone || '0771234567'}</span>
                        </td>
                        <td>
                            <div style="font-weight: 600; color: #334155; font-size: 0.88rem;"><i class="fa-solid fa-calendar-day" style="color: #2D8181;"></i> ${ap.date}</div>
                            <div style="font-size: 0.8rem; color: #64748b;"><i class="fa-solid fa-clock"></i> ${ap.timeSlot}</div>
                        </td>
                        <td style="max-width: 220px;">
                            <span style="font-size: 0.85rem; color: #475569; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${ap.notes || 'Routine channeling consultation'}">
                                ${ap.notes || 'Routine channeling consultation.'}
                            </span>
                        </td>
                        <td>
                            <span style="padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.78rem; font-weight: 700; display: inline-block; background: ${
                                ap.status === 'Completed' ? '#dcfce7; color: #15803d;' :
                                ap.status === 'Cancelled' ? '#fee2e2; color: #b91c1c;' : '#fef3c7; color: #b45309;'
                            }">${ap.status}</span>
                        </td>
                        <td style="text-align: right;">
                            <div style="display: flex; gap: 0.4rem; justify-content: flex-end; flex-wrap: wrap;">
                                <button class="btn btn-sm btn-outline" title="View Patient Medical EHR History" onclick="app.openPatientHistoryModal('${ap.patientId}')" style="padding: 0.35rem 0.6rem;">
                                    <i class="fa-solid fa-file-medical"></i> EHR
                                </button>
                                ${ap.status !== 'Completed' && ap.status !== 'Cancelled' ? `
                                    <button class="btn btn-sm btn-primary" onclick="app.openPrescriptionModal('${ap.id}')" style="padding: 0.35rem 0.65rem;">
                                        <i class="fa-solid fa-stethoscope"></i> Complete & Prescribe
                                    </button>
                                    <button class="btn btn-sm btn-outline" title="Reschedule Slot" onclick="app.openDoctorRescheduleModal('${ap.id}')" style="padding: 0.35rem 0.5rem; color: #2563eb; border-color: #93c5fd;">
                                        <i class="fa-solid fa-calendar-days"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline" title="Cancel Slot" onclick="app.cancelAppointmentByDoctor('${ap.id}')" style="padding: 0.35rem 0.5rem; color: #dc2626; border-color: #fca5a5;">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                ` : `
                                    <button class="btn btn-sm btn-secondary" onclick="app.viewPrescription('${ap.id}')" style="padding: 0.35rem 0.65rem;">
                                        <i class="fa-solid fa-file-prescription"></i> View Rx
                                    </button>
                                `}
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Render Doctor Availability Settings Tab
        this.renderDoctorAvailabilityForm(doc);

        // Render Received Patient Reports Inbox
        const docMsgContainer = document.getElementById('doctorReportInbox');
        if (docMsgContainer) {
            if (myReports.length === 0) {
                docMsgContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem; background: white; border-radius: 16px; border: 1px solid #e2e8f0;">
                        <div style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 0.5rem;">📩</div>
                        <h4 style="color: #475569;">No Patient Diagnostic Reports Received Yet</h4>
                        <p style="color: #94a3b8; font-size: 0.85rem;">Uploaded patient reports (X-Rays, Scans) will appear here for online doctor feedback.</p>
                    </div>
                `;
            } else {
                docMsgContainer.innerHTML = myReports.map(c => `
                    <div style="background: white; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 16px; margin-bottom: 1.25rem; box-shadow: 0 4px 14px rgba(0,0,0,0.03);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 0.6rem;">
                                    <h4 style="margin: 0; color: #0f172a; font-weight: 700;">👤 ${c.patientName}</h4>
                                    <span style="font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 12px; font-weight: 700; background: ${c.status === 'Replied' ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #b45309;'}">${c.status}</span>
                                </div>
                                <div style="font-size: 0.82rem; color: #0d7a5f; font-weight: 600; margin-top: 0.25rem;">
                                    📋 Report Subject: ${c.reportTitle}
                                </div>
                            </div>
                            <span style="font-size: 0.8rem; color: #64748b; background: #f8fafc; padding: 0.25rem 0.6rem; border-radius: 8px;"><i class="fa-solid fa-clock"></i> ${c.submittedAt}</span>
                        </div>

                        <!-- Attached Report Document -->
                        <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <span style="font-size: 1.5rem;">📄</span>
                                <div>
                                    <strong style="font-size: 0.88rem; color: #1e293b;">${c.reportFileName}</strong>
                                    <div style="font-size: 0.78rem; color: #64748b;">Uploaded PDF / Image Scan</div>
                                </div>
                            </div>
                            <a href="#" onclick="alert('Viewing document: ${c.reportFileName}'); return false;" class="btn btn-sm btn-outline" style="font-size: 0.8rem; padding: 0.3rem 0.75rem;">
                                <i class="fa-solid fa-eye"></i> View Attachment
                            </a>
                        </div>

                        <!-- Patient Note -->
                        <div style="background: #fffbe6; border-left: 4px solid #f59e0b; padding: 0.85rem 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <div style="font-size: 0.78rem; font-weight: 700; color: #b45309; text-transform: uppercase; margin-bottom: 0.25rem;">Patient Question / Symptoms Note:</div>
                            <p style="font-size: 0.9rem; color: #334155; margin: 0; line-height: 1.5;">"${c.patientMessage}"</p>
                        </div>

                        <!-- Doctor Message Feedback Box -->
                        ${c.doctorReply ? `
                            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 1rem; border-radius: 10px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                                    <strong style="color: #15803d; font-size: 0.88rem;"><i class="fa-solid fa-reply"></i> Your Clinical Feedback & Recommendation:</strong>
                                    <span style="font-size: 0.78rem; color: #15803d;">${c.repliedAt}</span>
                                </div>
                                <p style="margin: 0; font-size: 0.9rem; color: #1e293b; line-height: 1.5; font-weight: 500;">${c.doctorReply}</p>
                            </div>
                        ` : `
                            <div style="background: #ffffff; border: 1.5px solid #2D8181; border-radius: 12px; padding: 1rem; margin-top: 0.5rem;">
                                <label style="font-weight: 700; font-size: 0.85rem; color: #1b5353; display: block; margin-bottom: 0.5rem;">
                                    💬 Doctor Consultation Message Feedback Box:
                                </label>

                                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.6rem;">
                                    <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; align-self: center;">Quick Replies:</span>
                                    <button type="button" class="btn btn-sm btn-outline" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;" onclick="app.setQuickReply('${c.id}', 'Report reviewed. Continue current herbal oils & revisit in 2 weeks.')">Continue Treatment</button>
                                    <button type="button" class="btn btn-sm btn-outline" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;" onclick="app.setQuickReply('${c.id}', 'Lab values show improvement. Drink warm coriander water daily.')">Good Progress</button>
                                    <button type="button" class="btn btn-sm btn-outline" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;" onclick="app.setQuickReply('${c.id}', 'Please schedule an in-person session at Hela Osu Weda Gedara for physical examination.')">In-Person Visit Needed</button>
                                </div>

                                <textarea id="replyInput-${c.id}" rows="3" placeholder="Type your expert medical feedback, diagnosis assessment, and prescription guidance here..." style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-family: inherit; margin-bottom: 0.75rem; resize: vertical;"></textarea>

                                <div style="text-align: right;">
                                    <button class="btn btn-primary" onclick="app.replyToReport('${c.id}')" style="border-radius: 10px; font-weight: 700; padding: 0.5rem 1.25rem;">
                                        <i class="fa-solid fa-paper-plane"></i> Send Feedback to Patient
                                    </button>
                                </div>
                            </div>
                        `}
                    </div>
                `).join('');
            }
        }

        // Render Prescription History Table
        const tbodyRxHistory = document.getElementById('doctorPrescriptionHistoryTable');
        if (tbodyRxHistory) {
            const completedAps = myAppointments.filter(a => a.prescription);
            if (completedAps.length === 0) {
                tbodyRxHistory.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 2rem;">No clinical prescription records found. Complete consultations in your queue to generate e-Prescriptions.</td></tr>`;
            } else {
                tbodyRxHistory.innerHTML = completedAps.map(ap => `
                    <tr>
                        <td><strong style="color: #0f172a;">${ap.id}</strong></td>
                        <td><strong>${ap.patientName}</strong></td>
                        <td>${ap.prescription.issuedDate || ap.date}</td>
                        <td><span style="font-weight: 600; color: #0d7a5f;">${ap.prescription.diagnosis}</span></td>
                        <td style="max-width: 250px;">
                            <span style="font-size: 0.85rem; color: #475569;">
                                ${ap.prescription.medicines ? ap.prescription.medicines.map(m => m.name).join(', ') : 'Herbal Treatment'}
                            </span>
                        </td>
                        <td style="text-align: right;">
                            <button class="btn btn-sm btn-secondary" onclick="app.viewPrescription('${ap.id}')" style="padding: 0.35rem 0.75rem;">
                                <i class="fa-solid fa-file-prescription"></i> View / Print Rx PDF
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
    }

    setQuickReply(reportId, text) {
        const input = document.getElementById(`replyInput-${reportId}`);
        if (input) input.value = text;
    }

    renderDoctorAvailabilityForm(doc) {
        if (!doc) return;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const slots = ['08:30 AM - 11:30 AM', '09:00 AM - 12:00 PM', '02:00 PM - 05:00 PM', '03:00 PM - 06:00 PM', '05:00 PM - 08:00 PM'];
        
        const currentAvail = doc.availability || { workingDays: ['Monday', 'Wednesday', 'Friday'], timeSlots: ['09:00 AM - 12:00 PM'], leaveDays: [] };
        if (!currentAvail.leaveDays) currentAvail.leaveDays = [];
        if (!currentAvail.timeSlots) currentAvail.timeSlots = slots.slice(0, 2);

        // Render Working Days Checkboxes
        const daysContainer = document.getElementById('docWorkingDaysContainer');
        if (daysContainer) {
            daysContainer.innerHTML = days.map(day => {
                const isChecked = currentAvail.workingDays.includes(day);
                return `
                    <label style="display: flex; align-items: center; gap: 0.5rem; background: ${isChecked ? '#e0f2fe' : '#f8fafc'}; border: 1.5px solid ${isChecked ? '#0284c7' : '#cbd5e1'}; padding: 0.5rem 0.9rem; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.88rem; color: ${isChecked ? '#0369a1' : '#475569'};">
                        <input type="checkbox" name="docWorkingDay" value="${day}" ${isChecked ? 'checked' : ''} onchange="this.parentElement.style.background = this.checked ? '#e0f2fe' : '#f8fafc'; this.parentElement.style.borderColor = this.checked ? '#0284c7' : '#cbd5e1';" />
                        ${day}
                    </label>
                `;
            }).join('');
        }

        // Render Time Slots Checkboxes
        const slotsContainer = document.getElementById('docTimeSlotsContainer');
        if (slotsContainer) {
            const allSlots = Array.from(new Set([...slots, ...currentAvail.timeSlots]));
            slotsContainer.innerHTML = allSlots.map(slot => {
                const isChecked = currentAvail.timeSlots.includes(slot);
                return `
                    <label style="display: flex; align-items: center; gap: 0.5rem; background: ${isChecked ? '#ecfdf5' : '#f8fafc'}; border: 1.5px solid ${isChecked ? '#10b981' : '#cbd5e1'}; padding: 0.6rem 0.9rem; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.85rem; color: ${isChecked ? '#047857' : '#475569'};">
                        <input type="checkbox" name="docTimeSlot" value="${slot}" ${isChecked ? 'checked' : ''} onchange="this.parentElement.style.background = this.checked ? '#ecfdf5' : '#f8fafc'; this.parentElement.style.borderColor = this.checked ? '#10b981' : '#cbd5e1';" />
                        🕒 ${slot}
                    </label>
                `;
            }).join('');
        }

        // Render Leave Days Chips
        const leaveContainer = document.getElementById('docLeaveDaysList');
        if (leaveContainer) {
            if (currentAvail.leaveDays.length === 0) {
                leaveContainer.innerHTML = `<span style="font-size: 0.85rem; color: #94a3b8;">No blocked leave dates added yet.</span>`;
            } else {
                leaveContainer.innerHTML = currentAvail.leaveDays.map(ld => `
                    <div style="background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
                        📅 ${ld}
                        <button type="button" style="background: transparent; border: none; color: #991b1b; font-weight: bold; cursor: pointer; font-size: 1rem;" onclick="app.removeDoctorLeaveDate('${ld}')">&times;</button>
                    </div>
                `).join('');
            }
        }
    }

    addCustomDoctorTimeSlot() {
        const input = document.getElementById('customTimeSlotInput');
        if (!input || !input.value.trim()) return;

        const newSlot = input.value.trim();
        const doc = this.currentDoctorObj || window.dbStore.get().doctors[0];
        if (!doc.availability) doc.availability = { workingDays: [], timeSlots: [], leaveDays: [] };
        if (!doc.availability.timeSlots) doc.availability.timeSlots = [];
        
        if (!doc.availability.timeSlots.includes(newSlot)) {
            doc.availability.timeSlots.push(newSlot);
        }

        input.value = '';
        this.renderDoctorAvailabilityForm(doc);
        this.showToast(`Custom slot "${newSlot}" added!`, 'info');
    }

    addDoctorLeaveDate() {
        const input = document.getElementById('addLeaveDateInput');
        if (!input || !input.value) return;

        const leaveDate = input.value;
        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.username === this.session.username || d.id === this.session.id) || data.doctors[0];
        if (!doc.availability) doc.availability = { workingDays: [], timeSlots: [], leaveDays: [] };
        if (!doc.availability.leaveDays) doc.availability.leaveDays = [];

        if (!doc.availability.leaveDays.includes(leaveDate)) {
            doc.availability.leaveDays.push(leaveDate);
            window.dbStore.save(data);
            this.showToast(`Leave date ${leaveDate} blocked on schedule!`, 'success');
        }

        input.value = '';
        this.renderDoctorPortal();
    }

    removeDoctorLeaveDate(leaveDate) {
        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.username === this.session.username || d.id === this.session.id) || data.doctors[0];
        if (doc && doc.availability && doc.availability.leaveDays) {
            doc.availability.leaveDays = doc.availability.leaveDays.filter(d => d !== leaveDate);
            window.dbStore.save(data);
            this.showToast(`Leave date ${leaveDate} removed.`, 'info');
            this.renderDoctorPortal();
        }
    }

    saveDoctorAvailabilityForm() {
        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.username === this.session.username || d.id === this.session.id) || data.doctors[0];
        if (!doc) return;

        const workingDayInputs = document.querySelectorAll('input[name="docWorkingDay"]:checked');
        const selectedDays = Array.from(workingDayInputs).map(i => i.value);

        const timeSlotInputs = document.querySelectorAll('input[name="docTimeSlot"]:checked');
        const selectedSlots = Array.from(timeSlotInputs).map(i => i.value);

        if (!doc.availability) doc.availability = {};
        doc.availability.workingDays = selectedDays;
        doc.availability.timeSlots = selectedSlots;

        window.dbStore.save(data);
        this.showToast('Doctor consultation availability updated successfully!', 'success');
        this.renderDoctorPortal();
    }

    openPatientHistoryModal(patientId) {
        const data = window.dbStore.get();
        const patient = data.patients.find(p => p.id === patientId || p.phone === patientId) || { name: 'Patient Record', phone: patientId, nic: 'N/A' };
        const historyAps = data.appointments.filter(a => a.patientId === patientId || a.patientName === patient.name);
        const historyReports = data.reportConsultations.filter(c => c.patientId === patientId || c.patientName === patient.name);

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-file-medical" style="color: var(--primary);"></i> Patient EHR Medical History</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="background: #f8fafc; padding: 1rem; border-radius: 12px; margin-bottom: 1.25rem; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; color: #0f172a;">${patient.name}</h4>
                        <p style="margin: 0.2rem 0 0 0; font-size: 0.85rem; color: #64748b;">Phone: ${patient.phone || 'N/A'} • NIC: ${patient.nic || 'N/A'}</p>
                    </div>
                    <span style="background: #e0f2fe; color: #0369a1; padding: 0.25rem 0.65rem; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">
                        ${historyAps.length} Total Visits
                    </span>
                </div>

                <h4 style="font-size: 0.95rem; color: #1b5353; margin-bottom: 0.75rem;">📋 Consultation & Prescription History</h4>
                ${historyAps.length === 0 ? `<p style="color: #64748b; font-size: 0.85rem;">No past consultations found.</p>` : `
                    <div style="max-height: 250px; overflow-y: auto; margin-bottom: 1.25rem;">
                        ${historyAps.map(ap => `
                            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0.85rem; margin-bottom: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.35rem;">
                                    <strong>${ap.date} (${ap.timeSlot})</strong>
                                    <span style="color: #0d7a5f; font-weight: 700;">${ap.status}</span>
                                </div>
                                <div style="font-size: 0.85rem; color: #475569;"><strong>Chief Complaint:</strong> ${ap.notes || 'N/A'}</div>
                                ${ap.prescription ? `
                                    <div style="background: #f0fdf4; padding: 0.5rem; border-radius: 6px; margin-top: 0.4rem; font-size: 0.82rem;">
                                        <strong>Diagnosis:</strong> ${ap.prescription.diagnosis}<br>
                                        <strong>Remedies:</strong> ${ap.prescription.medicines ? ap.prescription.medicines.map(m => m.name).join(', ') : 'N/A'}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `}

                <h4 style="font-size: 0.95rem; color: #1b5353; margin-bottom: 0.75rem;">📁 Uploaded Diagnostic Reports</h4>
                ${historyReports.length === 0 ? `<p style="color: #64748b; font-size: 0.85rem;">No uploaded lab reports on file.</p>` : `
                    <div>
                        ${historyReports.map(r => `
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.65rem 0.85rem; border-radius: 8px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                                <span>📄 <strong>${r.reportTitle}</strong> (${r.reportFileName})</span>
                                <span style="color: #64748b; font-size: 0.78rem;">${r.submittedAt}</span>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;

        overlay.classList.add('active');
    }

    openDoctorRescheduleModal(apId) {
        const data = window.dbStore.get();
        const ap = data.appointments.find(a => a.id === apId);
        if (!ap) return;

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-calendar-days" style="color: #2563eb;"></i> Reschedule Patient Appointment</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 1rem;">Rescheduling slot for <strong>${ap.patientName}</strong> (Token #${ap.tokenNo})</p>

                <div style="margin-bottom: 1rem;">
                    <label style="font-weight: 600; font-size: 0.88rem;">Select New Date</label>
                    <input type="date" id="docRescheduleDate" value="${ap.date}" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                </div>

                <div style="margin-bottom: 1.25rem;">
                    <label style="font-weight: 600; font-size: 0.88rem;">Select Shift Time Slot</label>
                    <select id="docRescheduleSlot" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;">
                        <option value="08:30 AM - 11:30 AM" ${ap.timeSlot === '08:30 AM - 11:30 AM' ? 'selected' : ''}>08:30 AM - 11:30 AM</option>
                        <option value="09:00 AM - 12:00 PM" ${ap.timeSlot === '09:00 AM - 12:00 PM' ? 'selected' : ''}>09:00 AM - 12:00 PM</option>
                        <option value="02:00 PM - 05:00 PM" ${ap.timeSlot === '02:00 PM - 05:00 PM' ? 'selected' : ''}>02:00 PM - 05:00 PM</option>
                        <option value="03:00 PM - 06:00 PM" ${ap.timeSlot === '03:00 PM - 06:00 PM' ? 'selected' : ''}>03:00 PM - 06:00 PM</option>
                        <option value="05:00 PM - 08:00 PM" ${ap.timeSlot === '05:00 PM - 08:00 PM' ? 'selected' : ''}>05:00 PM - 08:00 PM</option>
                    </select>
                </div>

                <button class="btn btn-primary" style="width: 100%;" onclick="app.saveDoctorReschedule('${ap.id}')">
                    Confirm Reschedule Slot
                </button>
            </div>
        `;

        overlay.classList.add('active');
    }

    saveDoctorReschedule(apId) {
        const newDate = document.getElementById('docRescheduleDate').value;
        const newSlot = document.getElementById('docRescheduleSlot').value;

        const data = window.dbStore.get();
        const ap = data.appointments.find(a => a.id === apId);
        if (ap) {
            ap.date = newDate;
            ap.timeSlot = newSlot;
            ap.notes = (ap.notes || '') + ` (Rescheduled by Doctor to ${newDate})`;

            // Add notification for patient
            if (!data.notifications) data.notifications = [];
            data.notifications.unshift({
                id: 'NOTIF-' + Date.now(),
                userId: ap.patientId,
                title: 'Appointment Rescheduled 📅',
                message: `Dr. ${ap.doctorName} rescheduled your appointment #${ap.id} to ${newDate} (${newSlot}).`,
                time: 'Just now',
                unread: true
            });

            window.dbStore.save(data);
            this.showToast('Appointment rescheduled and patient notified!', 'success');
            this.closeModal();
            this.renderDoctorPortal();
        }
    }

    cancelAppointmentByDoctor(apId) {
        const data = window.dbStore.get();
        const ap = data.appointments.find(a => a.id === apId);
        if (!ap) return;

        if (confirm(`Are you sure you want to cancel appointment #${ap.id} for ${ap.patientName}?`)) {
            ap.status = 'Cancelled';
            
            if (!data.notifications) data.notifications = [];
            data.notifications.unshift({
                id: 'NOTIF-' + Date.now(),
                userId: ap.patientId,
                title: 'Appointment Cancelled ❌',
                message: `Your appointment #${ap.id} with ${ap.doctorName} on ${ap.date} was cancelled. Please contact reception.`,
                time: 'Just now',
                unread: true
            });

            window.dbStore.save(data);
            this.showToast('Appointment cancelled.', 'info');
            this.renderDoctorPortal();
        }
    }

    replyToReport(reportId) {
        const input = document.getElementById(`replyInput-${reportId}`);
        if (!input || !input.value.trim()) return;

        const data = window.dbStore.get();
        const consultation = data.reportConsultations.find(c => c.id === reportId);
        if (consultation) {
            consultation.doctorReply = input.value.trim();
            consultation.repliedAt = new Date().toLocaleString();
            consultation.status = 'Replied';
            window.dbStore.save(data);
            this.showToast('Feedback sent to patient!', 'success');
            this.renderDoctorPortal();
        }
    }

    openPrescriptionModal(apId) {
        const data = window.dbStore.get();
        const ap = data.appointments.find(a => a.id === apId);
        if (!ap) return;

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-prescription"></i> Issue Digital Clinical Prescription</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 1rem;"><strong>Patient:</strong> ${ap.patientName} (Token #${ap.tokenNo})</p>

                <div style="margin-bottom: 1rem;">
                    <label style="font-weight: 600; font-size: 0.9rem;">Clinical Diagnosis</label>
                    <input type="text" id="rxDiagnosis" value="Mild Lumbar Strain & Herbal Rejuvenation" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                </div>

                <div style="margin-bottom: 1rem;">
                    <label style="font-weight: 600; font-size: 0.9rem;">Prescribed Medicines (Format: Name | Dosage | Duration)</label>
                    <textarea id="rxMedicines" rows="3" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;">Arandhi Oil Massage | Twice daily | 14 Days&#10;Maharasnadi Kashaya | 30ml after meal | 7 Days</textarea>
                </div>

                <div style="margin-bottom: 1.25rem;">
                    <label style="font-weight: 600; font-size: 0.9rem;">Doctor Special Advice</label>
                    <input type="text" id="rxNotes" value="Avoid heavy lifting. Continue warm compresses." style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                </div>

                <button class="btn btn-primary" style="width: 100%;" onclick="app.savePrescription('${ap.id}')">
                    Complete Appointment & Issue Rx
                </button>
            </div>
        `;

        overlay.classList.add('active');
    }

    savePrescription(apId) {
        const diagnosis = document.getElementById('rxDiagnosis').value;
        const medsRaw = document.getElementById('rxMedicines').value;
        const notes = document.getElementById('rxNotes').value;

        const medsList = medsRaw.split('\n').filter(line => line.trim()).map(line => {
            const parts = line.split('|');
            return {
                name: parts[0] ? parts[0].trim() : 'Herbal Recipe',
                dosage: parts[1] ? parts[1].trim() : 'As directed',
                duration: parts[2] ? parts[2].trim() : '7 Days'
            };
        });

        const data = window.dbStore.get();
        const ap = data.appointments.find(a => a.id === apId);
        if (ap) {
            ap.status = 'Completed';
            ap.prescription = {
                diagnosis: diagnosis,
                medicines: medsList,
                doctorNotes: notes,
                issuedDate: new Date().toISOString().split('T')[0]
            };
            window.dbStore.save(data);
            this.showToast('Prescription issued!', 'success');
            this.closeModal();
            this.renderDoctorPortal();
        }
    }

    openRatingModal(docId) {
        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-star" style="color: #d97706;"></i> Rate & Review Doctor</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body" style="text-align: center;">
                <p>How was your experience at Hela Osu Weda Gedara?</p>
                <div style="font-size: 2rem; color: #d97706; margin: 1rem 0; cursor: pointer;">
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                </div>
                <textarea id="reviewComment" placeholder="Write your feedback..." style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 1rem;"></textarea>
                <button class="btn btn-primary" style="width: 100%;" onclick="app.submitReview('${docId}')">Submit Review</button>
            </div>
        `;

        overlay.classList.add('active');
    }

    submitReview(docId) {
        const comment = document.getElementById('reviewComment').value;
        const data = window.dbStore.get();
        data.reviews.unshift({
            id: 'REV-' + Date.now(),
            doctorId: docId,
            patientName: this.session ? this.session.name : 'Patient',
            rating: 5,
            comment: comment || 'Excellent Ayurvedic care at Hela Osu!',
            date: new Date().toISOString().split('T')[0]
        });
        window.dbStore.save(data);
        this.showToast('Thank you for rating!', 'success');
        this.closeModal();
    }

    openDoctorDetailsModal(docId) {
        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.id === docId);
        if (!doc) return;

        const docReviews = data.reviews.filter(r => r.doctorId === docId);

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-user-doctor" style="color: #0d7a5f;"></i> Hela Osu Doctor Profile</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: flex; gap: 1.25rem; align-items: center; margin-bottom: 1.5rem; background: #f8fafc; padding: 1.25rem; border-radius: 12px;">
                    <div>
                        <h3 style="margin-bottom: 0.2rem;">${doc.name}</h3>
                        <p style="color: #2D8181; font-weight: 600;">${doc.specialization}</p>
                        <p style="color: #64748b; font-size: 0.85rem;"><i class="fa-solid fa-clinic-medical"></i> ${doc.hospital} • Reg: ${doc.regNo}</p>
                        <span style="color: #d97706; font-weight: bold; font-size: 0.9rem;"><i class="fa-solid fa-star"></i> ${doc.rating} (${doc.reviewsCount} reviews)</span>
                    </div>
                </div>

                <div style="margin-bottom: 1.25rem;">
                    <h4 style="color: #1e293b; margin-bottom: 0.4rem;">About & Practice</h4>
                    <p style="color: #475569; font-size: 0.95rem; line-height: 1.5;">${doc.bio}</p>
                </div>

                <div style="margin-bottom: 1.25rem; background: #ecfdf5; padding: 1rem; border-radius: 10px;">
                    <h4 style="color: #065f46; margin-bottom: 0.4rem;"><i class="fa-solid fa-calendar-week"></i> Schedule & Working Days</h4>
                    <p style="font-size: 0.9rem; color: #047857;"><strong>Working Days:</strong> ${doc.availability.workingDays.join(', ')}</p>
                    <p style="font-size: 0.9rem; color: #047857;"><strong>Available Sessions:</strong> ${doc.availability.timeSlots.join(' | ')}</p>
                </div>

                <div>
                    <h4 style="color: #1e293b; margin-bottom: 0.5rem;"><i class="fa-solid fa-comments"></i> Patient Reviews</h4>
                    ${docReviews.length === 0 ? `<p style="font-size: 0.85rem; color: #94a3b8;">No patient reviews submitted yet.</p>` : 
                        docReviews.map(r => `
                            <div style="background: white; border: 1px solid #e2e8f0; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem; font-size: 0.85rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                                    <strong>${r.patientName}</strong>
                                    <span style="color: #d97706;">★ ${r.rating}.0</span>
                                </div>
                                <p style="color: #475569;">"${r.comment}"</p>
                            </div>
                        `).join('')
                    }
                </div>

                <div style="margin-top: 1.5rem; text-align: right;">
                    <button class="btn btn-primary" onclick="app.openBookingModal('${doc.id}')">
                        <i class="fa-solid fa-calendar-check"></i> Book Session Now
                    </button>
                </div>
            </div>
        `;

        overlay.classList.add('active');
    }

    closeModal() {
        const overlay = document.getElementById('globalModalOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    updateNotificationBadge() {
        if (!this.session) return;
        const data = window.dbStore.get();
        const unreadCount = data.notifications.filter(n => n.userId === this.session.id && n.unread).length;
        const badge = document.getElementById('notifBadge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
        }
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const iconClass = type === 'success' 
            ? 'fa-circle-check' 
            : (type === 'danger' || type === 'error') 
                ? 'fa-circle-xmark' 
                : 'fa-circle-info';

        const iconColor = type === 'success' ? '#0d7a5f' : '#ef4444';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass}" style="color: ${iconColor};"></i>
            <div>
                <strong>System Notice</strong><br>
                <span style="font-size: 0.85rem;">${message}</span>
            </div>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3500);
    }
}

window.app = new AppController();
