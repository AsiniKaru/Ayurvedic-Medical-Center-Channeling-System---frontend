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
            if (role === 'admin') window.location.href = 'admin.html';
            else if (role === 'doctor') window.location.href = 'doctor.html';
            else window.location.href = 'patient.html';
            return;
        }

        if (currentPage === 'admin.html' && role !== 'admin') {
            window.location.href = (role === 'doctor') ? 'doctor.html' : 'patient.html';
            return;
        }
        if (currentPage === 'doctor.html' && role !== 'doctor') {
            window.location.href = (role === 'admin') ? 'admin.html' : 'patient.html';
            return;
        }
        if (currentPage === 'patient.html' && role !== 'patient') {
            window.location.href = (role === 'admin') ? 'admin.html' : 'doctor.html';
            return;
        }

        const userHeaderArea = document.getElementById('userHeaderArea');
        if (userHeaderArea) {
            const portalUrl = role === 'admin' ? 'admin.html' : role === 'doctor' ? 'doctor.html' : 'patient.html';
            const portalLabel = role === 'admin' ? 'Admin Panel' : role === 'doctor' ? 'Doctor Portal' : 'My Bookings';

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

    canAccessView(viewId) {
        if (!viewId || viewId === 'view-login' || viewId === 'view-register' || viewId === 'view-home') return true;
        if (!this.session) return false;
        const role = this.session.role;
        if (viewId === 'view-admin-dashboard' && role !== 'admin') return false;
        if (viewId === 'view-doctor-queue' && role !== 'doctor') return false;
        return true;
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
            if (role === 'admin') window.location.href = 'admin.html';
            else if (role === 'doctor') window.location.href = 'doctor.html';
            else window.location.href = 'patient.html';
        }, 400);
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
        let filtered = data.doctors.filter(d => d.status === 'approved' && d.hospital.includes('Hela Osu Weda Gedara'));

        if (spec !== 'all') {
            filtered = filtered.filter(d => d.specialization.toLowerCase().includes(spec.toLowerCase()));
        }

        if (query) {
            filtered = filtered.filter(d => 
                d.name.toLowerCase().includes(query) ||
                d.specialization.toLowerCase().includes(query) ||
                d.hospital.toLowerCase().includes(query)
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
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Booking...`;
            btn.disabled = true;
        }

        setTimeout(() => {
            const data = window.dbStore.get();
            const doc = this.selectedDoctorForBooking;
            const newAp = {
                id: 'AP-' + Math.floor(1000 + Math.random() * 9000),
                patientId: this.session.id,
                patientName: this.session.name,
                patientPhone: this.session.phone,
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
                userId: this.session.id,
                title: 'Hela Osu Channeling Confirmed 🎉',
                message: `Booking #${newAp.id} reserved with ${doc.name} for ${newAp.date} (Token #${newAp.tokenNo}).`,
                time: 'Just now',
                unread: true
            });

            window.dbStore.save(data);

            this.closeModal();
            this.showToast(`Booking Successful! Token #${newAp.tokenNo} reserved.`, 'success');
            this.renderPatientBookings();
            this.updateNotificationBadge();
            this.switchView('view-bookings');
        }, 1000);
    }

    renderPatientBookings() {
        const container = document.getElementById('patientBookingsList');
        if (!container || !this.session || this.session.role !== 'patient') return;

        const data = window.dbStore.get();
        const myAps = data.appointments.filter(a => a.patientId === this.session.id);

        if (myAps.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: white; border-radius: 16px;">
                    <p style="color: #64748b;">You have no active or previous channeling appointments at Hela Osu Weda Gedara.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = myAps.map(ap => `
            <div class="glass-card" style="margin-bottom: 1.25rem;">
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1rem;">
                    <div>
                        <span style="background: #e0f2fe; color: #0284c7; padding: 0.3rem 0.6rem; border-radius: 6px; font-weight: bold; font-size: 0.85rem;">
                            VOUCHER #${ap.id}
                        </span>
                        <h3 style="margin-top: 0.4rem; font-size: 1.2rem;">${ap.doctorName}</h3>
                        <p style="color: #0d7a5f; font-size: 0.9rem; font-weight: 600;">🌿 ${ap.specialization} • ${ap.hospital}</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 1.5rem; font-weight: 800; color: #0d7a5f;">TOKEN #${ap.tokenNo}</span><br>
                        <span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; background: ${
                            ap.status === 'Completed' ? '#dcfce7; color: #15803d;' :
                            ap.status === 'Cancelled' ? '#fee2e2; color: #b91c1c;' : '#fef3c7; color: #b45309;'
                        }">${ap.status}</span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.9rem; margin-bottom: 1.25rem;">
                    <div><strong>Date & Time:</strong><br>${ap.date} (${ap.timeSlot})</div>
                    <div><strong>Total Fee:</strong><br>Rs. ${ap.totalFee.toLocaleString()} (${ap.paymentMethod})</div>
                    <div><strong>Payment Status:</strong><br>${ap.paymentStatus}</div>
                </div>

                <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                    <button class="btn btn-sm btn-primary" onclick="app.viewReceipt('${ap.id}')">
                        <i class="fa-solid fa-receipt"></i> E-Receipt & Voucher
                    </button>
                    ${ap.prescription ? `
                        <button class="btn btn-sm btn-secondary" onclick="app.viewPrescription('${ap.id}')">
                            <i class="fa-solid fa-file-prescription"></i> Digital Prescription
                        </button>
                    ` : ''}
                    ${ap.status === 'Upcoming' ? `
                        <button class="btn btn-sm" style="background: #fee2e2; color: #dc2626;" onclick="app.cancelAppointment('${ap.id}')">Cancel</button>
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

    rescheduleAppointment(apId) {
        const newDate = prompt('Enter new requested date (YYYY-MM-DD):', '2026-08-22');
        if (newDate) {
            const data = window.dbStore.get();
            const ap = data.appointments.find(a => a.id === apId);
            if (ap) {
                ap.date = newDate;
                window.dbStore.save(data);
                this.showToast(`Appointment rescheduled to ${newDate}.`, 'info');
                this.renderPatientBookings();
            }
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

    // -------------------------------------------------------------------------
    // DOCTOR PORTAL FUNCTIONS
    // -------------------------------------------------------------------------

    renderDoctorPortal() {
        if (!this.session || this.session.role !== 'doctor') return;
        const data = window.dbStore.get();
        
        // Update doctor profile header name
        const docNameElem = document.getElementById('docPortalName');
        if (docNameElem) docNameElem.textContent = this.session.name;

        // Render Session Queue Table
        const tbodyQueue = document.getElementById('doctorQueueTableBody');
        if (tbodyQueue) {
            const myQueue = data.appointments.filter(a => a.doctorId === this.session.id || a.doctorId === 'doc-101');
            tbodyQueue.innerHTML = myQueue.map(ap => `
                <tr>
                    <td><strong>Token #${ap.tokenNo}</strong></td>
                    <td>${ap.patientName}<br><span style="font-size: 0.8rem; color: #64748b;">Ph: ${ap.patientPhone}</span></td>
                    <td>${ap.date} | ${ap.timeSlot}</td>
                    <td>${ap.notes}</td>
                    <td>
                        <span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; background: ${
                            ap.status === 'Completed' ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #b45309;'
                        }">${ap.status}</span>
                    </td>
                    <td>
                        ${ap.status !== 'Completed' ? `
                            <button class="btn btn-sm btn-primary" onclick="app.openPrescriptionModal('${ap.id}')">
                                <i class="fa-solid fa-stethoscope"></i> Complete & Prescribe
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-outline" onclick="app.viewPrescription('${ap.id}')">
                                View Rx
                            </button>
                        `}
                    </td>
                </tr>
            `).join('');
        }

        // Render Received Patient Reports Inbox
        const docMsgContainer = document.getElementById('doctorReportInbox');
        if (docMsgContainer) {
            const pendingReports = data.reportConsultations.filter(c => c.doctorId === this.session.id || c.doctorId === 'doc-101');
            if (pendingReports.length === 0) {
                docMsgContainer.innerHTML = `<p style="color: #64748b;">No patient reports received yet.</p>`;
            } else {
                docMsgContainer.innerHTML = pendingReports.map(c => `
                    <div style="background: white; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 10px; margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                            <strong>Patient: ${c.patientName}</strong>
                            <span style="font-size: 0.8rem; color: #64748b;">${c.submittedAt}</span>
                        </div>
                        <p style="font-size: 0.85rem; color: #0d7a5f; font-weight: 600; margin-bottom: 0.4rem;">📄 Document: ${c.reportFileName}</p>
                        <p style="font-size: 0.9rem; color: #334155; margin-bottom: 0.5rem;">"<strong>Patient Note:</strong> ${c.patientMessage}"</p>
                        ${c.doctorReply ? `
                            <div style="background: #f1f5f9; padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; border-left: 3px solid #0d7a5f;">
                                <strong>Your Sent Advice:</strong> ${c.doctorReply}
                            </div>
                        ` : `
                            <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem;">
                                <input type="text" id="replyInput-${c.id}" placeholder="Type medical advice for patient..." style="flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;" />
                                <button class="btn btn-sm btn-primary" onclick="app.replyToReport('${c.id}')">Send Feedback</button>
                            </div>
                        `}
                    </div>
                `).join('');
            }
        }

        // Render Prescription History Table
        const tbodyRxHistory = document.getElementById('doctorPrescriptionHistoryTable');
        if (tbodyRxHistory) {
            const completedAps = data.appointments.filter(a => (a.doctorId === this.session.id || a.doctorId === 'doc-101') && a.prescription);
            if (completedAps.length === 0) {
                tbodyRxHistory.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b;">No prescription history recorded yet.</td></tr>`;
            } else {
                tbodyRxHistory.innerHTML = completedAps.map(ap => `
                    <tr>
                        <td><strong>${ap.id}</strong></td>
                        <td>${ap.patientName}</td>
                        <td>${ap.prescription.issuedDate || ap.date}</td>
                        <td>${ap.prescription.diagnosis}</td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="app.viewPrescription('${ap.id}')">
                                <i class="fa-solid fa-file-prescription"></i> View / Print Rx
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
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
