/**
 * Hela Osu Channeling System - Admin Management Portal Controller
 */

class AdminController {
    constructor() {
        this.activeTab = 'doctors';
    }

    renderAdminDashboard() {
        const data = window.dbStore.get();
        this.renderKPIs(data);
        this.renderDoctorTable(data);
        this.renderPatientTable(data);
        this.renderAppointmentsTable(data);
        
        if (window.analyticsManager) {
            setTimeout(() => {
                window.analyticsManager.initCharts();
            }, 100);
        }
    }

    renderKPIs(data) {
        const totalRev = data.appointments
            .filter(a => a.paymentStatus === 'Paid')
            .reduce((sum, a) => sum + (a.totalFee || 0), 0);

        const pendingDocs = data.doctors.filter(d => d.status === 'pending').length;

        const kpiRevenue = document.getElementById('kpiTotalRevenue');
        const kpiAppointments = document.getElementById('kpiTotalAppointments');
        const kpiDoctors = document.getElementById('kpiTotalDoctors');
        const kpiPending = document.getElementById('kpiPendingApprovals');

        if (kpiRevenue) kpiRevenue.textContent = `Rs. ${totalRev.toLocaleString()}`;
        if (kpiAppointments) kpiAppointments.textContent = data.appointments.length;
        if (kpiDoctors) kpiDoctors.textContent = data.doctors.length;
        if (kpiPending) kpiPending.textContent = pendingDocs;
    }

    renderDoctorTable(data) {
        const tbody = document.getElementById('adminDoctorsTableBody');
        if (!tbody) return;

        tbody.innerHTML = data.doctors.map(doc => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <img src="${doc.image}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
                        <div>
                            <strong>${doc.name}</strong><br>
                            <span style="font-size: 0.8rem; color: #64748b;">${doc.regNo}</span>
                        </div>
                    </div>
                </td>
                <td><span class="role-badge role-patient">${doc.specialization}</span></td>
                <td>${doc.hospital}</td>
                <td>Rs. ${doc.fee}</td>
                <td>
                    ${doc.status === 'approved' 
                        ? `<span style="color: #10b981; font-weight: bold;">● Active</span>`
                        : `<span style="color: #f59e0b; font-weight: bold;">● Pending Approval</span>`
                    }
                </td>
                <td>
                    <div style="display: flex; gap: 0.4rem;">
                        ${doc.status === 'pending' 
                            ? `<button class="btn btn-sm btn-primary" onclick="adminController.approveDoctor('${doc.id}')">Approve</button>` 
                            : ''
                        }
                        <button class="btn btn-sm btn-outline" onclick="adminController.openEditDoctorModal('${doc.id}')">Edit</button>
                        <button class="btn btn-sm" style="background: #fee2e2; color: #dc2626;" onclick="adminController.removeDoctor('${doc.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPatientTable(data) {
        const tbody = document.getElementById('adminPatientsTableBody');
        if (!tbody) return;

        tbody.innerHTML = data.patients.map(pat => `
            <tr>
                <td><strong>${pat.name}</strong></td>
                <td>${pat.email}<br><span style="font-size: 0.8rem; color: #64748b;">${pat.phone}</span></td>
                <td>${pat.nic}</td>
                <td>${pat.age} yrs (${pat.gender})</td>
                <td>
                    ${pat.status === 'active' 
                        ? `<span style="color: #10b981; font-weight: bold;">Active</span>`
                        : `<span style="color: #ef4444; font-weight: bold;">Suspended</span>`
                    }
                </td>
                <td>
                    <button class="btn btn-sm ${pat.status === 'active' ? 'btn-outline' : 'btn-primary'}" 
                            onclick="adminController.togglePatientStatus('${pat.id}')">
                        ${pat.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderAppointmentsTable(data) {
        const tbody = document.getElementById('adminAppointmentsTableBody');
        if (!tbody) return;

        tbody.innerHTML = data.appointments.map(ap => `
            <tr>
                <td><strong>${ap.id}</strong></td>
                <td>${ap.patientName}</td>
                <td>${ap.doctorName}</td>
                <td>${ap.date} | ${ap.timeSlot}</td>
                <td><strong>Rs. ${ap.totalFee}</strong></td>
                <td>
                    <span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; background: ${
                        ap.status === 'Completed' ? '#dcfce7; color: #15803d;' :
                        ap.status === 'Cancelled' ? '#fee2e2; color: #b91c1c;' : '#e0f2fe; color: #0369a1;'
                    }">
                        ${ap.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    approveDoctor(docId) {
        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.id === docId);
        if (doc) {
            doc.status = 'approved';
            window.dbStore.save(data);
            window.app.showToast(`Doctor ${doc.name} approved successfully!`, 'success');
            this.renderAdminDashboard();
        }
    }

    removeDoctor(docId) {
        if (!confirm('Are you sure you want to remove this doctor profile?')) return;
        const data = window.dbStore.get();
        data.doctors = data.doctors.filter(d => d.id !== docId);
        window.dbStore.save(data);
        window.app.showToast('Doctor deleted from system.', 'warning');
        this.renderAdminDashboard();
    }

    togglePatientStatus(patId) {
        const data = window.dbStore.get();
        const pat = data.patients.find(p => p.id === patId);
        if (pat) {
            pat.status = pat.status === 'active' ? 'suspended' : 'active';
            window.dbStore.save(data);
            window.app.showToast(`Patient account status updated to ${pat.status}.`, 'info');
            this.renderAdminDashboard();
        }
    }

    openAddDoctorModal() {
        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-user-plus" style="color: #0d7a5f;"></i> Add New Doctor</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form onsubmit="event.preventDefault(); adminController.saveNewDoctor({
                    name: document.getElementById('newDocName').value,
                    title: document.getElementById('newDocTitle').value,
                    specialization: document.getElementById('newDocSpec').value,
                    regNo: document.getElementById('newDocReg').value,
                    hospital: document.getElementById('newDocHospital').value,
                    fee: document.getElementById('newDocFee').value,
                    bio: document.getElementById('newDocBio').value
                }); app.closeModal();">
                    <div style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Full Name</label>
                        <input type="text" id="newDocName" placeholder="Dr. First Last" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Title / Rank</label>
                        <input type="text" id="newDocTitle" placeholder="Consultant Cardiologist / Wedamahataya" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Specialization</label>
                        <select id="newDocSpec" style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;">
                            <option value="Ayurveda & Traditional Healing">Ayurveda & Traditional Healing</option>
                            <option value="Cardiology">Cardiology</option>
                            <option value="Pediatrics & Child Health">Pediatrics & Child Health</option>
                            <option value="Neurology">Neurology</option>
                            <option value="Dermatology & Skin Care">Dermatology & Skin Care</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Medical Reg No</label>
                            <input type="text" id="newDocReg" placeholder="SLMC-9999" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                        </div>
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Channeling Fee (LKR)</label>
                            <input type="number" id="newDocFee" placeholder="3000" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                        </div>
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Hospital / Practice Location</label>
                        <input type="text" id="newDocHospital" placeholder="Hela Osu Weda Gedara - Kandy" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>
                    <div style="margin-bottom: 1.25rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Bio / Summary</label>
                        <textarea id="newDocBio" rows="2" placeholder="Brief description..." style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Save & Approve Doctor</button>
                </form>
            </div>
        `;

        overlay.classList.add('active');
    }

    openEditDoctorModal(docId) {
        const data = window.dbStore.get();
        const doc = data.doctors.find(d => d.id === docId);
        if (!doc) return;

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-pen" style="color: #0d7a5f;"></i> Edit Doctor Details</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form onsubmit="event.preventDefault(); 
                    doc.name = document.getElementById('editDocName').value;
                    doc.fee = parseFloat(document.getElementById('editDocFee').value);
                    doc.hospital = document.getElementById('editDocHospital').value;
                    window.dbStore.save(data);
                    window.app.showToast('Doctor details updated!', 'success');
                    adminController.renderAdminDashboard();
                    app.closeModal();">
                    <div style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Doctor Name</label>
                        <input type="text" id="editDocName" value="${doc.name}" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Channeling Fee (LKR)</label>
                        <input type="number" id="editDocFee" value="${doc.fee}" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>
                    <div style="margin-bottom: 1.25rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Hospital</label>
                        <input type="text" id="editDocHospital" value="${doc.hospital}" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Update Doctor</button>
                </form>
            </div>
        `;

        overlay.classList.add('active');
    }

    saveNewDoctor(formData) {
        const data = window.dbStore.get();
        const newDoc = {
            id: 'doc-' + Math.floor(1000 + Math.random() * 9000),
            name: formData.name,
            title: formData.title,
            specialization: formData.specialization,
            regNo: formData.regNo,
            hospital: formData.hospital,
            fee: parseFloat(formData.fee),
            hospitalFee: 500,
            experience: formData.experience || '5 Years',
            rating: 5.0,
            reviewsCount: 1,
            image: formData.image || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
            status: 'approved',
            bio: formData.bio || 'Qualified medical practitioner.',
            availability: {
                workingDays: ['Monday', 'Wednesday', 'Friday'],
                timeSlots: ['09:00 AM - 12:00 PM', '04:00 PM - 07:00 PM'],
                leaveDays: []
            }
        };

        data.doctors.push(newDoc);
        window.dbStore.save(data);
        window.app.showToast(`Doctor ${newDoc.name} created successfully!`, 'success');
        this.renderAdminDashboard();
    }

    updateChannelingFees(platformPercent, stdHospitalFee) {
        const data = window.dbStore.get();
        data.adminConfig.platformCommissionPercent = parseFloat(platformPercent);
        data.adminConfig.standardHospitalFee = parseFloat(stdHospitalFee);
        window.dbStore.save(data);
        window.app.showToast('Platform fees updated!', 'success');
    }
}

window.adminController = new AdminController();

