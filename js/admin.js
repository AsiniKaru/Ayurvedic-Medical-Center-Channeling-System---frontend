/**
 * Hela Osu Channeling System - Executive Admin Control Panel Controller
 * Handles Doctor CRUD, Specialization Management, Therapist Schedule Manager (Photo 2 grid with Edit Toggle), 
 * Patient Suspension, System Appointments, Channeling Fee Policy, Analytics Dashboard, and PDF Executive Reports.
 */

class AdminController {
    constructor() {
        this.activeTab = 'analytics';
        this.doctorSearch = '';
        this.doctorSpecFilter = '';
        this.doctorStatusFilter = '';
        this.specializationSearch = '';
        this.patientSearch = '';
        this.patientStatusFilter = '';
        this.appointmentSearch = '';
        this.appointmentStatusFilter = '';
        
        // Schedule Manager State (Read-Only by default per Image 2 feedback)
        this.selectedScheduleDoctorId = null;
        this.currentScheduleWeekOffset = 0; // 0 = current week
        this.isScheduleEditEnabled = false; // Must click "Enable Editing" to edit grid

        window.addEventListener('databaseSynced', () => {
            // console.log("AdminController: Re-rendering Admin dashboard with database records...");
            this.renderAdminDashboard();
        });
    }

    switchTab(tabName) {
        this.activeTab = tabName;
        
        // Update tab button UI active state
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Toggle tab view section visibility
        document.querySelectorAll('.admin-tab-view').forEach(view => {
            if (view.id === `tab-${tabName}`) {
                view.style.display = 'block';
            } else {
                view.style.display = 'none';
            }
        });

        // Render tab content
        const data = window.dbStore.get();
        this.populateSpecializationDropdowns(data);

        if (tabName === 'analytics') {
            this.renderKPIs(data);
            if (window.analyticsManager) {
                setTimeout(() => window.analyticsManager.initCharts(), 50);
            }
        } else if (tabName === 'doctors') {
            this.renderDoctorTable(data);
        } else if (tabName === 'specializations') {
            this.renderSpecializationsTable(data);
        } else if (tabName === 'schedule') {
            this.initScheduleManager(data);
        } else if (tabName === 'patients') {
            this.renderPatientTable(data);
        } else if (tabName === 'appointments') {
            this.renderAppointmentsTable(data);
        } else if (tabName === 'fees') {
            this.populateFeeSimDoctors(data);
            this.recalculateFeeSimulator();
        } else if (tabName === 'reports') {
            this.populateReportDoctorFilter(data);
            this.renderReportView();
        }
    }

    async renderAdminDashboard() {
        if (window.HelaApi) {
            try {
                await HelaApi.syncDatabase();
            } catch (e) {
                console.warn("HelaApi sync warning:", e);
            }
        }
        const data = window.dbStore.get();
        this.populateSpecializationDropdowns(data);
        this.renderKPIs(data);
        this.renderDoctorTable(data);
        this.renderSpecializationsTable(data);
        this.renderPatientTable(data);
        this.renderAppointmentsTable(data);
        this.populateFeeSimDoctors(data);
        this.populateReportDoctorFilter(data);
        
        if (window.analyticsManager) {
            setTimeout(() => {
                window.analyticsManager.initCharts();
            }, 100);
        }
    }

    renderKPIs(data) {
        const totalRev = (data.appointments || [])
            .filter(a => a.paymentStatus === 'Paid' || a.status === 'Confirmed' || a.status === 'Completed')
            .reduce((sum, a) => sum + (a.totalFee || 0), 0);

        const commissionPercent = (data.adminConfig && data.adminConfig.platformCommissionPercent) ? data.adminConfig.platformCommissionPercent : 10;
        const platformEarned = Math.round(totalRev * (commissionPercent / 100));

        const docsList = (data.doctors || []).map(d => ({ ...d, status: d.status || 'approved' }));
        const pendingDocs = docsList.filter(d => d.status === 'pending').length;
        const activeDocs = docsList.filter(d => d.status === 'approved' || d.status === 'active').length;

        const kpiRevenue = document.getElementById('kpiTotalRevenue');
        const kpiAppointments = document.getElementById('kpiTotalAppointments');
        const kpiDoctors = document.getElementById('kpiTotalDoctors');
        const kpiPatients = document.getElementById('kpiTotalPatients');
        const kpiPending = document.getElementById('kpiPendingApprovals');
        const kpiCommission = document.getElementById('kpiPlatformCommission');

        if (kpiRevenue) kpiRevenue.textContent = `Rs. ${totalRev.toLocaleString()}`;
        if (kpiAppointments) kpiAppointments.textContent = (data.appointments || []).length;
        if (kpiDoctors) kpiDoctors.textContent = activeDocs;
        if (kpiPatients) kpiPatients.textContent = (data.patients || []).length;
        if (kpiPending) kpiPending.textContent = pendingDocs;
        if (kpiCommission) kpiCommission.textContent = `Rs. ${platformEarned.toLocaleString()}`;
    }

    // =========================================================================
    // DOCTOR MANAGEMENT FUNCTIONS
    // =========================================================================

    filterDoctorsTable(val) {
        if (val !== undefined) this.doctorSearch = val.toLowerCase().trim();
        this.filterDoctorTable();
    }

    filterDoctorTable() {
        const data = window.dbStore.get();
        const searchEl = document.getElementById('doctorSearchInput');
        if (searchEl) this.doctorSearch = searchEl.value.toLowerCase().trim();
        
        const specEl = document.getElementById('doctorSpecFilter');
        const statusEl = document.getElementById('doctorStatusFilter');
        if (specEl) this.doctorSpecFilter = specEl.value;
        if (statusEl) this.doctorStatusFilter = statusEl.value;

        this.renderDoctorTable(data);
    }

    renderDoctorTable(data) {
        if (!data) data = window.dbStore.get();
        const tbody = document.getElementById('adminDoctorsTableBody');
        if (!tbody) return;

        let docs = (data.doctors || []).map(d => ({
            ...d,
            status: d.status || 'approved'
        }));

        if (this.doctorSearch) {
            docs = docs.filter(d => 
                (d.name && d.name.toLowerCase().includes(this.doctorSearch)) ||
                (d.hospital && d.hospital.toLowerCase().includes(this.doctorSearch))
            );
        }

        if (this.doctorSpecFilter) {
            docs = docs.filter(d => d.specialization && d.specialization.toLowerCase().includes(this.doctorSpecFilter.toLowerCase()));
        }

        if (this.doctorStatusFilter) {
            docs = docs.filter(d => {
                const s = (d.status || '').toLowerCase();
                const f = this.doctorStatusFilter.toLowerCase();
                if (f === 'approved' || f === 'active') {
                    return s === 'approved' || s === 'active' || s === 'approved / active';
                }
                return s === f;
            });
        }

        if (docs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">
                        <i class="fa-solid fa-user-doctor" style="font-size: 2rem; margin-bottom: 0.5rem; color: #cbd5e1;"></i>
                        <p>No Wedamahatayas found. Register a doctor using the "Add New Hela Osu Doctor" button.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = docs.map(doc => {
            const statusLabel = (doc.status === 'approved' || doc.status === 'active')
                ? `<span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: bold; background: #dcfce7; color: #15803d;">● Active</span>`
                : doc.status === 'inactive'
                ? `<span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: bold; background: #fee2e2; color: #b91c1c;">● Inactive</span>`
                : `<span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: bold; background: #fef3c7; color: #b45309;">● Pending</span>`;

            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <strong>${doc.name}</strong>
                            <button class="btn btn-sm btn-icon" onclick="adminController.openEditDoctorModal('${doc.id}')" title="Edit Doctor Details (Name, Status, Specialization)" style="background: #e0f2fe; color: #0284c7; border: none; padding: 0.2rem 0.45rem; border-radius: 6px; cursor: pointer;">
                                <i class="fa-solid fa-pen" style="font-size: 0.75rem;"></i>
                            </button>
                        </div>
                        <span style="font-size: 0.78rem; color: #64748b;">Reg: ${doc.regNo || 'N/A'}</span>
                    </td>
                    <td>
                        <span class="role-badge role-patient" style="font-size: 0.78rem;">${doc.specialization}</span><br>
                        <span style="font-size: 0.78rem; color: #64748b;">${doc.title || 'Specialist'}</span>
                    </td>
                    <td><strong style="color: #334155;">${doc.hospital}</strong></td>
                    <td><strong>Rs. ${doc.fee}</strong></td>
                    <td>${statusLabel}</td>
                    <td>
                        <div style="display: flex; gap: 0.35rem; align-items: center;">
                            <button class="btn btn-sm btn-outline" onclick="adminController.openDoctorScheduleManager('${doc.id}')" title="Manage Time Slots Schedule Grid">
                                <i class="fa-solid fa-calendar-days"></i> Schedule
                            </button>
                            ${doc.status === 'pending' 
                                ? `<button class="btn btn-sm btn-primary" onclick="adminController.approveDoctor('${doc.id}')" title="Approve Registration"><i class="fa-solid fa-check"></i> Approve</button>` 
                                : ''
                            }
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderDoctorsTable(data) {
        this.renderDoctorTable(data);
    }

    openEditDoctorModal(docId) {
        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.id === docId);
        if (!doc) return;

        const specs = data.specializations || [];
        // Value MUST be the specialization_id: the backend `doctor` table stores
        // specialization_id (FK), not the specialization name text.
        const currentSpecId = doc.specializationId != null
            ? doc.specializationId
            : (specs.find(s => s.name === doc.specialization) || {}).id;
        const specOptions = specs.map(s => `<option value="${s.id}" ${Number(currentSpecId) === Number(s.id) ? 'selected' : ''}>${s.name}</option>`).join('');

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-user-pen" style="color: #2D8181;"></i> Edit Doctor Details</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form onsubmit="event.preventDefault(); adminController.updateDoctorDetailsFromModal('${doc.id}');">
                    
                    <div style="margin-bottom: 0.85rem;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #334155; display: block; margin-bottom: 0.3rem;">Doctor Full Name</label>
                        <input type="text" id="editDocName" value="${doc.name}" required style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px; font-weight: 600;" />
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 0.85rem;">
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 700; color: #334155; display: block; margin-bottom: 0.3rem;">Specialization</label>
                            <select id="editDocSpec" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px; font-weight: 600;">
                                ${specOptions}
                            </select>
                        </div>

                        <div>
                            <label style="font-size: 0.85rem; font-weight: 700; color: #334155; display: block; margin-bottom: 0.3rem;">Account Status</label>
                            <select id="editDocStatus" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px; font-weight: 600;">
                                <option value="approved" ${doc.status === 'approved' ? 'selected' : ''}>Active / Approved</option>
                                <option value="inactive" ${doc.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                <option value="pending" ${doc.status === 'pending' ? 'selected' : ''}>Pending Approval</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 0.85rem;">
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 700; color: #334155; display: block; margin-bottom: 0.3rem;">Base Fee (LKR)</label>
                            <input type="number" id="editDocFee" value="${doc.fee}" required style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px;" />
                        </div>
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 700; color: #334155; display: block; margin-bottom: 0.3rem;">Hospital / Branch Location</label>
                            <input type="text" id="editDocHospital" value="${doc.hospital}" required style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px;" />
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; border-radius: 12px; font-weight: 700; margin-top: 0.5rem;">
                        <i class="fa-solid fa-floppy-disk"></i> Save Doctor Details
                    </button>
                </form>
            </div>
        `;

        overlay.classList.add('active');
    }

    async updateDoctorDetailsFromModal(docId) {
        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.id === docId);
        if (!doc) return;

        const selectedSpecId = parseInt(document.getElementById('editDocSpec').value, 10) || null;
        const selectedSpec = (data.specializations || []).find(s => Number(s.id) === selectedSpecId);

        doc.name = document.getElementById('editDocName').value;
        doc.specializationId = selectedSpecId;
        doc.specialization = selectedSpec ? selectedSpec.name : doc.specialization;
        doc.status = document.getElementById('editDocStatus').value;
        doc.fee = parseFloat(document.getElementById('editDocFee').value);
        doc.hospital = document.getElementById('editDocHospital').value;

        window.dbStore.save(data);

        // Update Doctor on Backend API
        try {
            if (window.HelaApi) {
                const docNumericId = doc.docId || parseInt(docId.toString().replace(/[^0-9]/g, '')) || 1;
                const nameParts = doc.name.split(' ');
                await HelaApi.doctors.update({
                    docId: docNumericId,
                    firstName: nameParts[0] || doc.name,
                    lastName: nameParts.slice(1).join(' ') || 'Specialist',
                    phoneNumber: doc.phone || '0771234567',
                    consultationFee: doc.fee,
                    bio: doc.bio || `Consultant Practitioner at ${doc.hospital}`,
                    specializationId: selectedSpecId
                });
                await HelaApi.syncDatabase();
            }
        } catch (e) {
            console.warn("Backend update doctor offline:", e);
        }

        if (window.app) {
            window.app.showToast(`Doctor profile ${doc.name} updated!`, 'success');
            window.app.closeModal();
        }
        this.renderAdminDashboard();
    }

    approveDoctor(docId) {
        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.id === docId);
        if (doc) {
            doc.status = 'approved';
            window.dbStore.save(data);
            if (window.app) window.app.showToast(`Doctor ${doc.name} approved successfully!`, 'success');
            this.renderAdminDashboard();
        }
    }

    openAddDoctorModal() {
        const data = window.dbStore.get();
        const specs = data.specializations || [];
        // Value MUST be specialization_id - the backend `doctor` table links via that FK.
        const specOptions = specs.length > 0
            ? specs.map(s => `<option value="${s.id}">${s.name}</option>`).join('')
            : '<option value="">No specializations available - add one first</option>';

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-user-plus" style="color: #2D8181;"></i> Add New Wedamahataya Doctor</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form onsubmit="event.preventDefault(); adminController.saveNewDoctorFromModal();">
                    <div style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Full Name & Title</label>
                        <input type="text" id="newDocName" placeholder="Dr. Deshabandu Wickramasinghe" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Specialization</label>
                            <select id="newDocSpec" style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;">
                                ${specOptions}
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Doctor Base Fee (LKR)</label>
                            <input type="number" id="newDocFee" placeholder="2500" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                        </div>
                    </div>

                    <div style="margin-bottom: 1.25rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Hela Osu Branch / Hospital Location</label>
                        <input type="text" id="newDocHospital" value="Hela Osu Weda Gedara - Galle Branch" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.7rem;">
                        <i class="fa-solid fa-check"></i> Register & Approve Doctor Profile
                    </button>
                </form>
            </div>
        `;

        overlay.classList.add('active');
    }

    async saveNewDoctorFromModal() {
        const name = document.getElementById('newDocName').value.trim();
        const specId = parseInt(document.getElementById('newDocSpec').value, 10) || null;
        const fee = parseFloat(document.getElementById('newDocFee').value) || 2800;
        const hospital = document.getElementById('newDocHospital').value.trim();

        const data = window.dbStore.get();
        if (!data.doctors) data.doctors = [];

        if (!specId) {
            if (window.app) window.app.showToast('Please select a specialization.', 'error');
            return;
        }
        const specObj = (data.specializations || []).find(s => Number(s.id) === specId);
        const specName = specObj ? specObj.name : 'General Practice';

        const username = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const email = `${username}@helaosu.lk`;
        const password = 'password';

        const newDoc = {
            id: 'doc-' + Math.floor(100 + Math.random() * 900),
            username: username,
            password: password,
            email: email,
            name: name,
            title: 'Ayurvedic Consultant',
            specialization: specName,
            specializationId: specId,
            hospital: hospital,
            fee: fee,
            hospitalFee: 500,
            experience: '8 Years',
            rating: 5.0,
            reviewsCount: 1,
            status: 'approved',
            bio: `Qualified practitioner registered at ${hospital}.`,
            availability: {
                workingDays: ['Monday', 'Wednesday', 'Friday'],
                timeSlots: ['09:00 AM - 12:00 PM'],
                gridSchedule: {}
            }
        };

        data.doctors.push(newDoc);
        window.dbStore.save(data);

        // Register Doctor & User in Spring Boot Backend Database
        try {
            if (window.HelaApi) {
                const nameParts = name.split(' ');
                const firstName = nameParts[0] || name;
                const lastName = nameParts.slice(1).join(' ') || 'Specialist';

                await HelaApi.doctors.register({
                    firstName: firstName,
                    lastName: lastName,
                    phoneNumber: '0771234567',
                    consultationFee: fee,
                    bio: `Qualified practitioner registered at ${hospital}`,
                    specializationId: specId
                }, username, password, email);

                await HelaApi.syncDatabase();
            }
        } catch (e) {
            console.warn("Backend doctor registration offline:", e);
        }

        if (window.app) {
            window.app.showToast(`Doctor ${newDoc.name} successfully registered and approved!`, 'success');
            window.app.closeModal();
        }
        this.renderAdminDashboard();
    }

    // =========================================================================
    // SPECIALIZATION MANAGEMENT MODULE (Delegated to SpecializationController)
    // =========================================================================

    populateSpecializationDropdowns(data) {
        if (window.specializationController) {
            window.specializationController.populateSpecializationDropdowns(data);
        }
    }

    filterSpecializationsTable(searchVal = null) {
        if (window.specializationController) {
            window.specializationController.filterSpecializationsTable(searchVal);
        }
    }

    renderSpecializationsTable(data) {
        if (window.specializationController) {
            window.specializationController.renderSpecializationsTable(data);
        }
    }

    openAddSpecializationModal() {
        if (window.specializationController) {
            window.specializationController.openAddSpecializationModal();
        }
    }

    saveNewSpecializationFromModal() {
        if (window.specializationController) {
            window.specializationController.saveNewSpecializationFromModal();
        }
    }

    openEditSpecializationModal(specId) {
        if (window.specializationController) {
            window.specializationController.openEditSpecializationModal(specId);
        }
    }

    updateSpecializationFromModal(specId) {
        if (window.specializationController) {
            window.specializationController.updateSpecializationFromModal(specId);
        }
    }

    toggleSpecializationStatus(specId) {
        if (window.specializationController) {
            window.specializationController.toggleSpecializationStatus(specId);
        }
    }

    removeSpecialization(specId) {
        if (window.specializationController) {
            window.specializationController.removeSpecialization(specId);
        }
    }

    // =========================================================================
    // THERAPIST / DOCTOR SCHEDULE MANAGER (Photo 2 Grid with Edit Mode Toggle)
    // =========================================================================

    openDoctorScheduleManager(docId) {
        this.selectedScheduleDoctorId = docId;
        this.switchTab('schedule');
    }

    toggleScheduleEditMode() {
        this.isScheduleEditEnabled = !this.isScheduleEditEnabled;
        const btn = document.getElementById('btnToggleScheduleEdit');
        const badge = document.getElementById('scheduleEditStatusBadge');

        if (this.isScheduleEditEnabled) {
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-lock"></i> Disable Editing';
                btn.style.borderColor = '#f59e0b';
                btn.style.color = '#b45309';
                btn.style.background = '#fef3c7';
            }
            if (badge) {
                badge.innerHTML = '✏️ Editing Enabled';
                badge.style.background = '#dcfce7';
                badge.style.color = '#15803d';
                badge.style.borderColor = '#86efac';
            }
            if (window.app) window.app.showToast('Schedule Grid editing ENABLED. Click cells to toggle time slots.', 'success');
        } else {
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-pen"></i> Enable Editing';
                btn.style.borderColor = '#2D8181';
                btn.style.color = '#2D8181';
                btn.style.background = 'transparent';
            }
            if (badge) {
                badge.innerHTML = '🔒 Read Only';
                badge.style.background = '#f1f5f9';
                badge.style.color = '#64748b';
                badge.style.borderColor = '#cbd5e1';
            }
            if (window.app) window.app.showToast('Schedule Grid in Read-Only mode.', 'info');
        }
    }

    initScheduleManager(data) {
        const select = document.getElementById('scheduleDoctorSelect');
        if (!select) return;

        const docs = data.doctors || [];
        select.innerHTML = docs.map(d => `
            <option value="${d.id}" ${d.id === this.selectedScheduleDoctorId ? 'selected' : ''}>${d.name} (${d.specialization})</option>
        `).join('');

        if (!this.selectedScheduleDoctorId && docs.length > 0) {
            this.selectedScheduleDoctorId = docs[0].id;
        }

        this.loadDoctorSchedule(this.selectedScheduleDoctorId);
    }

    loadDoctorSchedule(docId) {
        this.selectedScheduleDoctorId = docId;
        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.id === docId);
        
        // Setup dates display for current week
        this.updateScheduleDatesDisplay();

        // Populate schedule grid timetable body
        const tbody = document.getElementById('scheduleGridBody');
        if (!tbody || !doc) return;

        const hours = [
            '08:00', '09:00', '10:00', '11:00', '12:00', 
            '13:00', '14:00', '15:00', '16:00', '17:00'
        ];
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // Get stored gridSchedule or default pattern
        const grid = (doc.availability && doc.availability.gridSchedule) ? doc.availability.gridSchedule : {};

        tbody.innerHTML = hours.map(h => `
            <tr>
                <td class="time-label">${h}</td>
                ${days.map(d => {
                    const slotKey = `${d}_${h}`;
                    let isActive = grid[slotKey];
                    if (isActive === undefined) {
                        const defaultDays = (doc.availability && doc.availability.workingDays) ? doc.availability.workingDays : ['Monday', 'Wednesday', 'Friday'];
                        const isDefDay = defaultDays.some(day => day.substring(0,3) === d);
                        const isDefHour = (parseInt(h) >= 9 && parseInt(h) <= 12) || (parseInt(h) >= 14 && parseInt(h) <= 16);
                        isActive = isDefDay && isDefHour;
                    }

                    return `
                        <td>
                            <div class="slot-cell ${isActive ? 'active-slot' : ''}" 
                                 data-slot="${slotKey}"
                                 onclick="adminController.toggleSlotCell(this)">
                            </div>
                        </td>
                    `;
                }).join('')}
            </tr>
        `).join('');
    }

    toggleSlotCell(cellEl) {
        // Image 2 feedback: If editing is disabled, do not allow editing!
        if (!this.isScheduleEditEnabled) {
            if (window.app) window.app.showToast('Schedule grid is in Read-Only mode. Click "Enable Editing" to modify time slots.', 'warning');
            return;
        }

        cellEl.classList.toggle('active-slot');
    }

    saveScheduleChanges() {
        if (!this.selectedScheduleDoctorId) return;

        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.id === this.selectedScheduleDoctorId);
        if (!doc) return;

        const gridSchedule = {};
        const activeDaysSet = new Set();

        document.querySelectorAll('.slot-cell').forEach(cell => {
            const slotKey = cell.getAttribute('data-slot'); // e.g. Mon_09:00
            const isActive = cell.classList.contains('active-slot');
            gridSchedule[slotKey] = isActive;

            if (isActive && slotKey) {
                const dayCode = slotKey.split('_')[0];
                const dayMap = { 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday' };
                if (dayMap[dayCode]) activeDaysSet.add(dayMap[dayCode]);
            }
        });

        if (!doc.availability) doc.availability = {};
        doc.availability.gridSchedule = gridSchedule;
        doc.availability.workingDays = Array.from(activeDaysSet);

        window.dbStore.save(data);
        if (window.app) window.app.showToast(`Schedule for ${doc.name} saved successfully!`, 'success');
        this.renderDoctorTable(data);
    }

    navigateScheduleWeek(offsetDir) {
        this.currentScheduleWeekOffset += offsetDir;
        this.updateScheduleDatesDisplay();
    }

    refreshScheduleGrid() {
        if (this.selectedScheduleDoctorId) {
            this.loadDoctorSchedule(this.selectedScheduleDoctorId);
            if (window.app) window.app.showToast('Schedule grid refreshed.', 'info');
        }
    }

    updateScheduleDatesDisplay() {
        const display = document.getElementById('scheduleWeekDisplay');
        const now = new Date();
        const baseDate = new Date(now.setDate(now.getDate() + (this.currentScheduleWeekOffset * 7)));
        
        // Find Monday of the selected week
        const dayOfWeek = baseDate.getDay();
        const distanceToMon = (dayOfWeek + 6) % 7;
        const monDate = new Date(baseDate);
        monDate.setDate(baseDate.getDate() - distanceToMon);

        const sunDate = new Date(monDate);
        sunDate.setDate(monDate.getDate() + 6);

        const formatStr = d => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        if (display) display.textContent = `${formatStr(monDate)} - ${formatStr(sunDate)}`;

        // Update column headers dates
        const dayIds = ['headMon', 'headTue', 'headWed', 'headThu', 'headFri', 'headSat', 'headSun'];
        dayIds.forEach((id, idx) => {
            const hEl = document.getElementById(id);
            if (hEl) {
                const d = new Date(monDate);
                d.setDate(monDate.getDate() + idx);
                hEl.textContent = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
            }
        });
    }

    // =========================================================================
    // PATIENT MANAGEMENT FUNCTIONS (View / Suspend)
    // =========================================================================

    filterPatientsTable(searchVal = null) {
        const data = window.dbStore.get();
        if (searchVal !== null) this.patientSearch = searchVal.toLowerCase();
        const statusEl = document.getElementById('patientStatusFilter');
        if (statusEl) this.patientStatusFilter = statusEl.value;

        this.renderPatientTable(data);
    }

    renderPatientTable(data) {
        if (!data) data = window.dbStore.get();
        const tbody = document.getElementById('adminPatientsTableBody');
        if (!tbody) return;

        let pats = (data.patients || []).map(p => ({
            ...p,
            status: p.status || 'active'
        }));

        if (this.patientSearch) {
            pats = pats.filter(p => 
                (p.name && p.name.toLowerCase().includes(this.patientSearch)) ||
                (p.email && p.email.toLowerCase().includes(this.patientSearch)) ||
                (p.nic && p.nic.toLowerCase().includes(this.patientSearch))
            );
        }

        if (this.patientStatusFilter) {
            pats = pats.filter(p => (p.status || '').toLowerCase() === this.patientStatusFilter.toLowerCase());
        }

        if (pats.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #64748b;">
                        <i class="fa-solid fa-user-xmark" style="font-size: 2rem; margin-bottom: 0.5rem; color: #cbd5e1;"></i>
                        <p>No patient records found matching your filters.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pats.map(p => {
            const statusLabel = p.status === 'suspended'
                ? `<span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: bold; background: #fee2e2; color: #b91c1c;">● Suspended</span>`
                : `<span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: bold; background: #dcfce7; color: #15803d;">● Active</span>`;

            return `
                <tr>
                    <td>
                        <strong>${p.name}</strong><br>
                        <span style="font-size: 0.78rem; color: #64748b;">Username: ${p.username || 'patient'}</span>
                    </td>
                    <td>
                        <span>${p.email || 'N/A'}</span><br>
                        <span style="font-size: 0.78rem; color: #64748b;">📞 ${p.phone || 'N/A'}</span>
                    </td>
                    <td><code>${p.nic || 'N/A'}</code></td>
                    <td>${p.age || '30'} Yrs / ${p.gender || 'Not Specified'}</td>
                    <td>${p.registeredDate || new Date().toISOString().split('T')[0]}</td>
                    <td>${statusLabel}</td>
                    <td>
                        <div style="display: flex; gap: 0.35rem;">
                            <button class="btn btn-sm btn-outline" onclick="adminController.viewPatientHistoryModal('${p.id}')" title="View Patient Booking History">
                                <i class="fa-solid fa-history"></i> History
                            </button>
                            <button class="btn btn-sm ${p.status === 'suspended' ? 'btn-primary' : 'btn-outline'}" onclick="adminController.togglePatientStatus('${p.id}')" style="${p.status === 'suspended' ? '' : 'color: #dc2626; border-color: #fca5a5;'}">
                                ${p.status === 'suspended' ? 'Activate' : 'Suspend'}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderPatientsTable(data) {
        this.renderPatientTable(data);
    }

    togglePatientStatus(patId) {
        const data = window.dbStore.get();
        const pat = data.patients.find(p => p.id === patId);
        if (pat) {
            pat.status = (pat.status || 'active') === 'active' ? 'suspended' : 'active';
            window.dbStore.save(data);
            if (window.app) window.app.showToast(`Patient account ${pat.name} set to ${pat.status}.`, 'info');
            this.renderAdminDashboard();
        }
    }

    viewPatientHistoryModal(patId) {
        const data = window.dbStore.get();
        const pat = data.patients.find(p => p.id === patId);
        if (!pat) return;

        const patientApps = (data.appointments || []).filter(a => a.patientName === pat.name || a.patientPhone === pat.phone);

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-id-card" style="color: #2D8181;"></i> Patient History: ${pat.name}</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: #f8fafc; padding: 1rem; border-radius: 10px; margin-bottom: 1.25rem;">
                    <div>
                        <p><strong>Email:</strong> ${pat.email}</p>
                        <p><strong>Phone:</strong> ${pat.phone}</p>
                    </div>
                    <div>
                        <p><strong>NIC:</strong> ${pat.nic}</p>
                        <p><strong>Status:</strong> ${pat.status || 'active'}</p>
                    </div>
                </div>

                <h4 style="margin-bottom: 0.75rem; color: #1e293b;">Appointment History (${patientApps.length})</h4>
                ${patientApps.length === 0 ? '<p style="color: #64748b;">No previous bookings recorded for this patient.</p>' : `
                    <table class="custom-table" style="font-size: 0.85rem;">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Doctor</th>
                                <th>Date</th>
                                <th>Fee</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${patientApps.map(a => `
                                <tr>
                                    <td>${a.id}</td>
                                    <td>${a.doctorName}</td>
                                    <td>${a.date}</td>
                                    <td>Rs. ${a.totalFee}</td>
                                    <td>${a.status}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}
            </div>
        `;

        overlay.classList.add('active');
    }

    // =========================================================================
    // APPOINTMENTS LOG FUNCTIONS
    // =========================================================================

    filterAppointmentsTable(searchVal = null) {
        const data = window.dbStore.get();
        if (searchVal !== null) this.appointmentSearch = searchVal.toLowerCase();
        const statusEl = document.getElementById('appointmentStatusFilter');
        if (statusEl) this.appointmentStatusFilter = statusEl.value;

        this.renderAppointmentsTable(data);
    }

    renderAppointmentsTable(data) {
        const tbody = document.getElementById('adminAppointmentsTableBody');
        if (!tbody) return;

        let apps = data.appointments || [];

        if (this.appointmentSearch) {
            apps = apps.filter(a => 
                a.id.toLowerCase().includes(this.appointmentSearch) ||
                (a.patientName && a.patientName.toLowerCase().includes(this.appointmentSearch)) ||
                (a.doctorName && a.doctorName.toLowerCase().includes(this.appointmentSearch))
            );
        }

        if (this.appointmentStatusFilter) {
            apps = apps.filter(a => a.status === this.appointmentStatusFilter);
        }

        if (apps.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem; color: #64748b;">
                        <i class="fa-solid fa-calendar-xmark" style="font-size: 2rem; margin-bottom: 0.5rem; color: #cbd5e1;"></i>
                        <p>No appointment records found.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = apps.map(ap => `
            <tr>
                <td><strong>${ap.id}</strong></td>
                <td><span style="background: #e0f2fe; color: #0284c7; padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: bold;">#${ap.tokenNo || 1}</span></td>
                <td>${ap.patientName}</td>
                <td>
                    <strong>${ap.doctorName}</strong><br>
                    <span style="font-size: 0.78rem; color: #64748b;">${ap.specialization}</span>
                </td>
                <td>${ap.date} | ${ap.timeSlot}</td>
                <td><strong>Rs. ${ap.totalFee}</strong></td>
                <td>
                    <span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: bold; background: ${
                        ap.status === 'Completed' ? '#dcfce7; color: #15803d;' :
                        ap.status === 'Cancelled' ? '#fee2e2; color: #b91c1c;' : '#e0f2fe; color: #0369a1;'
                    }">
                        ${ap.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="adminController.viewReceiptModal('${ap.id}')">
                        <i class="fa-solid fa-receipt"></i> Voucher
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderAppointmentTable(data) {
        this.renderAppointmentsTable(data);
    }

    viewReceiptModal(bookingId) {
        const data = window.dbStore.get();
        const ap = data.appointments.find(a => a.id === bookingId);
        if (!ap) return;

        if (window.pdfGenerator) {
            const html = window.pdfGenerator.renderReceiptHTML(ap);
            const container = document.getElementById('modalContent');
            const overlay = document.getElementById('globalModalOverlay');

            container.innerHTML = `
                <div class="modal-header">
                    <h3><i class="fa-solid fa-receipt"></i> E-Channeling Voucher</h3>
                    <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    ${html}
                    <button class="btn btn-primary" onclick="window.print()" style="width: 100%; margin-top: 1rem;">
                        <i class="fa-solid fa-print"></i> Print Voucher
                    </button>
                </div>
            `;
            overlay.classList.add('active');
        }
    }

    exportAppointmentsCSV() {
        const data = window.dbStore.get();
        const apps = data.appointments || [];

        let csv = 'BookingID,TokenNo,PatientName,DoctorName,Specialization,Date,Fee,Status\n';
        apps.forEach(a => {
            csv += `"${a.id}","${a.tokenNo || 1}","${a.patientName}","${a.doctorName}","${a.specialization}","${a.date}","${a.totalFee}","${a.status}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hela_osu_appointments_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // =========================================================================
    // FEE MANAGEMENT FUNCTIONS
    // =========================================================================

    populateFeeSimDoctors(data) {
        const select = document.getElementById('feeSimDoctorSelect');
        if (!select) return;

        select.innerHTML = (data.doctors || []).map(d => `
            <option value="${d.id}">${d.name} (${d.specialization}) - Base: Rs. ${d.fee}</option>
        `).join('');
    }

    recalculateFeeSimulator() {
        const data = window.dbStore.get();
        const docSelect = document.getElementById('feeSimDoctorSelect');
        if (!docSelect || !docSelect.value) return;

        const doc = data.doctors.find(d => d.id === docSelect.value);
        if (!doc) return;

        const commPercent = parseFloat(document.getElementById('feeConfigCommission').value) || 10;
        const hospitalFee = parseFloat(document.getElementById('feeConfigHospitalFee').value) || 500;

        const docBaseFee = doc.fee || 2500;
        const totalFee = docBaseFee + hospitalFee;
        const platformEarned = Math.round(totalFee * (commPercent / 100));

        const simDocFee = document.getElementById('simDocFee');
        const simHospitalFee = document.getElementById('simHospitalFee');
        const simPlatformEarn = document.getElementById('simPlatformEarn');
        const simTotalCharge = document.getElementById('simTotalCharge');

        if (simDocFee) simDocFee.textContent = `Rs. ${docBaseFee.toLocaleString()}.00`;
        if (simHospitalFee) simHospitalFee.textContent = `Rs. ${hospitalFee.toLocaleString()}.00`;
        if (simPlatformEarn) simPlatformEarn.textContent = `Rs. ${platformEarned.toLocaleString()}.00`;
        if (simTotalCharge) simTotalCharge.textContent = `Rs. ${totalFee.toLocaleString()}.00`;
    }

    saveFeeConfiguration() {
        const commPercent = parseFloat(document.getElementById('feeConfigCommission').value);
        const stdHospitalFee = parseFloat(document.getElementById('feeConfigHospitalFee').value);

        const data = window.dbStore.get();
        if (!data.adminConfig) data.adminConfig = {};
        data.adminConfig.platformCommissionPercent = commPercent;
        data.adminConfig.standardHospitalFee = stdHospitalFee;

        window.dbStore.save(data);
        if (window.app) window.app.showToast('Global fee policy settings saved successfully!', 'success');
        this.renderKPIs(data);
    }

    // =========================================================================
    // EXECUTIVE REPORT GENERATOR
    // =========================================================================

    populateReportDoctorFilter(data) {
        const select = document.getElementById('reportDoctorSelect');
        if (!select) return;

        select.innerHTML = '<option value="">All Doctors</option>' + (data.doctors || []).map(d => `
            <option value="${d.id}">${d.name}</option>
        `).join('');
    }

    renderReportView() {
        const data = window.dbStore.get();
        const typeSelect = document.getElementById('reportCategorySelect');
        const dateSelect = document.getElementById('reportDateRange');
        const docSelect = document.getElementById('reportDoctorSelect');

        if (!typeSelect) return;

        const category = typeSelect.value;
        const subtitle = document.getElementById('reportSubtitle');
        const summary = document.getElementById('reportMetricsSummary');
        const thead = document.getElementById('reportTableHead');
        const tbody = document.getElementById('reportTableBody');

        let apps = data.appointments || [];

        if (docSelect && docSelect.value) {
            const doc = data.doctors.find(d => d.id === docSelect.value);
            if (doc) apps = apps.filter(a => a.doctorId === doc.id || a.doctorName === doc.name);
        }

        if (category === 'doctor-appointments') {
            subtitle.textContent = 'Appointments Log Per Doctor & Specialization';
            
            const totalBookings = apps.length;
            const totalRevenue = apps.reduce((sum, a) => sum + (a.totalFee || 0), 0);
            const avgFee = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

            summary.innerHTML = `
                <div><div style="font-size: 0.8rem; color: #64748b;">Total Channelings</div><strong style="font-size: 1.25rem;">${totalBookings}</strong></div>
                <div><div style="font-size: 0.8rem; color: #64748b;">Total Value (LKR)</div><strong style="font-size: 1.25rem; color: #10b981;">Rs. ${totalRevenue.toLocaleString()}</strong></div>
                <div><div style="font-size: 0.8rem; color: #64748b;">Average Fee</div><strong style="font-size: 1.25rem; color: #0284c7;">Rs. ${avgFee}</strong></div>
            `;

            thead.innerHTML = `
                <tr>
                    <th>Doctor Name</th>
                    <th>Specialization</th>
                    <th>Completed</th>
                    <th>Confirmed</th>
                    <th>Cancelled</th>
                    <th>Total Revenue</th>
                </tr>
            `;

            tbody.innerHTML = (data.doctors || []).map(doc => {
                const docApps = apps.filter(a => a.doctorId === doc.id || a.doctorName === doc.name);
                const completed = docApps.filter(a => a.status === 'Completed').length;
                const confirmed = docApps.filter(a => a.status === 'Confirmed').length;
                const cancelled = docApps.filter(a => a.status === 'Cancelled').length;
                const rev = docApps.reduce((sum, a) => sum + (a.totalFee || 0), 0);

                return `
                    <tr>
                        <td><strong>${doc.name}</strong></td>
                        <td>${doc.specialization}</td>
                        <td><span style="color: #15803d; font-weight: bold;">${completed}</span></td>
                        <td><span style="color: #0369a1; font-weight: bold;">${confirmed}</span></td>
                        <td><span style="color: #b91c1c; font-weight: bold;">${cancelled}</span></td>
                        <td><strong>Rs. ${rev.toLocaleString()}</strong></td>
                    </tr>
                `;
            }).join('');

        } else if (category === 'revenue-summary') {
            subtitle.textContent = 'Financial Earnings & Platform Revenue Breakdown';

            const totalRev = apps.reduce((sum, a) => sum + (a.totalFee || 0), 0);
            const platformComm = Math.round(totalRev * 0.10);
            const docPayout = totalRev - platformComm;

            summary.innerHTML = `
                <div><div style="font-size: 0.8rem; color: #64748b;">Gross Channeling Revenue</div><strong style="font-size: 1.25rem; color: #15803d;">Rs. ${totalRev.toLocaleString()}</strong></div>
                <div><div style="font-size: 0.8rem; color: #64748b;">Platform Margin (10%)</div><strong style="font-size: 1.25rem; color: #2D8181;">Rs. ${platformComm.toLocaleString()}</strong></div>
                <div><div style="font-size: 0.8rem; color: #64748b;">Doctor Payout (90%)</div><strong style="font-size: 1.25rem; color: #b45309;">Rs. ${docPayout.toLocaleString()}</strong></div>
            `;

            thead.innerHTML = `
                <tr>
                    <th>Booking ID</th>
                    <th>Patient Name</th>
                    <th>Doctor Name</th>
                    <th>Total Fee</th>
                    <th>Platform Share (10%)</th>
                    <th>Payment Method</th>
                </tr>
            `;

            tbody.innerHTML = apps.map(a => `
                <tr>
                    <td><strong>${a.id}</strong></td>
                    <td>${a.patientName}</td>
                    <td>${a.doctorName}</td>
                    <td>Rs. ${a.totalFee}</td>
                    <td><strong style="color: #0f766e;">Rs. ${Math.round((a.totalFee || 0) * 0.10)}</strong></td>
                    <td>${a.paymentMethod || 'Online Card'}</td>
                </tr>
            `).join('');

        } else if (category === 'cancellations') {
            subtitle.textContent = 'Cancellation Audit Log & Refund Claims';

            const cancelledApps = apps.filter(a => a.status === 'Cancelled');
            const totalCancelled = cancelledApps.length;
            const cancelledVal = cancelledApps.reduce((sum, a) => sum + (a.totalFee || 0), 0);

            summary.innerHTML = `
                <div><div style="font-size: 0.8rem; color: #64748b;">Total Cancellations</div><strong style="font-size: 1.25rem; color: #b91c1c;">${totalCancelled}</strong></div>
                <div><div style="font-size: 0.8rem; color: #64748b;">Refundable Value</div><strong style="font-size: 1.25rem; color: #b45309;">Rs. ${cancelledVal.toLocaleString()}</strong></div>
                <div><div style="font-size: 0.8rem; color: #64748b;">Cancellation Rate</div><strong style="font-size: 1.25rem;">${apps.length > 0 ? Math.round((totalCancelled / apps.length) * 100) : 0}%</strong></div>
            `;

            thead.innerHTML = `
                <tr>
                    <th>Booking ID</th>
                    <th>Patient Name</th>
                    <th>Doctor Name</th>
                    <th>Scheduled Date</th>
                    <th>Refund Status</th>
                </tr>
            `;

            tbody.innerHTML = cancelledApps.length === 0 
                ? `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 1.5rem;">No cancelled appointments found.</td></tr>`
                : cancelledApps.map(a => `
                    <tr>
                        <td><strong>${a.id}</strong></td>
                        <td>${a.patientName}</td>
                        <td>${a.doctorName}</td>
                        <td>${a.date}</td>
                        <td><span style="color: #10b981; font-weight: bold;">Refund Processed</span></td>
                    </tr>
                `).join('');
        }
    }

    generateReportPDF() {
        window.print();
    }
}

window.adminController = new AdminController();
