/**
 * Hela Osu Channeling System - Patient Portal Controller
 * Manages Doctor Search & Booking, E-Channeling Vouchers, Mock Payment Gateway,
 * Appointment Cancellation/Rescheduling, and Medical Report Consultation Uploads.
 */

class PatientController {
    constructor() {
        this.selectedDoctorForBooking = null;
        this.selectedSlotForBooking = null;
        this.selectedDateForBooking = null;
        this.patientSearchQuery = '';
        this.patientSpecFilter = '';

        window.addEventListener('databaseSynced', () => {
            // console.log("PatientController: Database synced, updating patient views...");
            this.renderDoctorsGrid();
            this.renderPatientBookings();
            this.renderReportConsultations();
        });
    }

    renderDoctorsGrid() {
        const grid = document.getElementById('doctorSearchGrid');
        if (!grid) return;

        const data = window.dbStore.get();
        let docs = data.doctors || [];

        const searchEl = document.getElementById('searchDoctorInput');
        const specEl = document.getElementById('filterSpecSelect');

        const query = searchEl ? searchEl.value.toLowerCase().trim() : '';
        const specFilter = specEl ? specEl.value : '';

        if (query) {
            docs = docs.filter(d => 
                (d.name && d.name.toLowerCase().includes(query)) ||
                (d.hospital && d.hospital.toLowerCase().includes(query)) ||
                (d.specialization && d.specialization.toLowerCase().includes(query))
            );
        }

        if (specFilter) {
            docs = docs.filter(d => d.specialization && d.specialization.toLowerCase().includes(specFilter.toLowerCase()));
        }

        if (docs.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: white; border-radius: 20px; border: 1px solid #e2e8f0;">
                    <i class="fa-solid fa-user-doctor" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.75rem;"></i>
                    <h4 style="color: #334155; margin-bottom: 0.25rem;">No Wedamahatayas Found</h4>
                    <p style="color: #64748b; font-size: 0.9rem;">Try adjusting your search keywords or specialization filters.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = docs.map(doc => `
            <div class="doctor-card glass-card">
                <div class="doc-header" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
                    <div class="doc-avatar" style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #1b5353, #2D8181); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.25rem;">
                        ${(doc.name || 'Dr').replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                        <h4 style="margin-bottom: 0.2rem; color: #0f172a;">${doc.name}</h4>
                        <span class="role-badge role-patient" style="font-size: 0.78rem;">${doc.specialization}</span>
                    </div>
                </div>

                <div style="margin-bottom: 1rem; font-size: 0.85rem; color: #475569;">
                    <p style="margin-bottom: 0.35rem;"><i class="fa-solid fa-clinic-medical" style="color: #2D8181; width: 18px;"></i> ${doc.hospital}</p>
                    <p style="margin-bottom: 0.35rem;"><i class="fa-solid fa-graduation-cap" style="color: #2D8181; width: 18px;"></i> ${doc.experience || '10+ Years Experience'}</p>
                    <p style="margin-bottom: 0.35rem;"><i class="fa-solid fa-phone" style="color: #2D8181; width: 18px;"></i> ${doc.phone || '0771234567'}</p>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid #f1f5f9;">
                    <div>
                        <span style="font-size: 0.75rem; color: #64748b;">Consultation Fee</span>
                        <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">Rs. ${Number(doc.fee || 2800).toLocaleString()}</div>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="app.openBookingModal('${doc.id}')">
                        <i class="fa-solid fa-calendar-check"></i> Book Slot
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPatientBookings() {
        const tbody = document.getElementById('patientBookingsTableBody');
        if (!tbody) return;

        const session = JSON.parse(localStorage.getItem('hela_osu_session') || '{}');
        const data = window.dbStore.get();
        const apps = (data.appointments || []).filter(a => a.patientId === session.id || a.patientName === session.name);

        if (apps.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2.5rem; color: #64748b;">
                        <i class="fa-solid fa-calendar-xmark" style="font-size: 2rem; margin-bottom: 0.5rem; color: #cbd5e1;"></i>
                        <p>No channeling bookings found. Search for a doctor above to book a session.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = apps.map(a => `
            <tr>
                <td><strong>${a.id}</strong></td>
                <td><span style="background: #e0f2fe; color: #0284c7; padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: bold;">#${a.tokenNo || 1}</span></td>
                <td>
                    <strong>${a.doctorName}</strong><br>
                    <span style="font-size: 0.78rem; color: #64748b;">${a.specialization}</span>
                </td>
                <td>${a.date} | ${a.timeSlot}</td>
                <td><strong>Rs. ${a.totalFee}</strong></td>
                <td>
                    <span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: bold; background: ${
                        a.status === 'Completed' ? '#dcfce7; color: #15803d;' :
                        a.status === 'Cancelled' ? '#fee2e2; color: #b91c1c;' : '#e0f2fe; color: #0369a1;'
                    }">
                        ${a.status}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.35rem;">
                        <button class="btn btn-sm btn-outline" onclick="app.downloadVoucher('${a.id}')" title="Download E-Voucher">
                            <i class="fa-solid fa-download"></i> Voucher
                        </button>
                        ${a.status !== 'Cancelled' && a.status !== 'Completed' ? `
                            <button class="btn btn-sm" style="background: #fee2e2; color: #dc2626; border: none;" onclick="patientController.cancelBooking('${a.id}')" title="Cancel Appointment">
                                <i class="fa-solid fa-xmark"></i> Cancel
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    cancelBooking(bookingId) {
        if (!confirm("Are you sure you want to cancel this channeling appointment?")) return;

        const data = window.dbStore.get();
        const ap = (data.appointments || []).find(a => a.id === bookingId);
        if (ap) {
            ap.status = 'Cancelled';
            window.dbStore.save(data);

            if (window.HelaApi) {
                const numericId = parseInt(bookingId.replace(/[^0-9]/g, '')) || 1;
                HelaApi.appointments.cancel(numericId);
            }

            if (window.app) window.app.showToast('Channeling slot cancelled successfully.', 'info');
            this.renderPatientBookings();
        }
    }

    renderReportConsultations() {
        const container = document.getElementById('patientReportConsultationsContainer');
        if (!container) return;

        const session = JSON.parse(localStorage.getItem('hela_osu_session') || '{}');
        const data = window.dbStore.get();
        const reports = (data.reportConsultations || []).filter(r => r.patientId === session.id || r.patientName === session.name);

        if (reports.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2.5rem; background: white; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <i class="fa-solid fa-file-medical" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.5rem;"></i>
                    <p style="color: #64748b;">No medical reports submitted for doctor consultation yet.</p>
                    <button class="btn btn-primary btn-sm" style="margin-top: 0.75rem;" onclick="patientController.openReportUploadModal()">
                        <i class="fa-solid fa-upload"></i> Upload Medical Report for Doctor Review
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = reports.map(r => `
            <div class="glass-card" style="margin-bottom: 1.25rem; background: white; padding: 1.25rem; border-radius: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div>
                        <h4 style="margin-bottom: 0.2rem; color: #0f172a;"><i class="fa-solid fa-file-pdf" style="color: #dc2626;"></i> ${r.title || 'Lab & Clinical Report'}</h4>
                        <span style="font-size: 0.8rem; color: #64748b;">Consulting Wedamahataya: <strong>${r.doctorName}</strong> • Submitted: ${r.date || 'Today'}</span>
                    </div>
                    <span style="padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.78rem; font-weight: bold; background: ${r.doctorFeedback ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #b45309;'}">
                        ${r.doctorFeedback ? '✓ Reviewed by Doctor' : '⏳ Awaiting Review'}
                    </span>
                </div>

                <div style="background: #f8fafc; padding: 0.85rem; border-radius: 10px; font-size: 0.88rem; margin-bottom: 0.75rem;">
                    <strong>Patient Note:</strong> ${r.notes || 'No description provided.'}
                </div>

                ${r.doctorFeedback ? `
                    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 1rem; border-radius: 12px; margin-bottom: 0.75rem;">
                        <h5 style="color: #065f46; margin-bottom: 0.35rem;"><i class="fa-solid fa-user-doctor"></i> Doctor Feedback & Instructions:</h5>
                        <p style="color: #047857; font-size: 0.9rem; margin: 0; line-height: 1.5;">${r.doctorFeedback}</p>
                    </div>
                ` : ''}

                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn btn-sm btn-outline" onclick="patientController.openReportReplyModal('${r.id}')">
                        <i class="fa-solid fa-reply"></i> Reply to Doctor
                    </button>
                </div>
            </div>
        `).join('');
    }

    openReportUploadModal() {
        const data = window.dbStore.get();
        const docs = data.doctors || [];

        const docOptions = docs.map(d => `<option value="${d.id}">${d.name} (${d.specialization})</option>`).join('');

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-file-circle-plus" style="color: #2D8181;"></i> Upload Medical Report for Consultation</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form onsubmit="event.preventDefault(); patientController.submitReportConsultation();">
                    <div style="margin-bottom: 0.85rem;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #334155;">Select Target Wedamahataya Doctor</label>
                        <select id="reportDocSelect" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px;" required>
                            ${docOptions}
                        </select>
                    </div>

                    <div style="margin-bottom: 0.85rem;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #334155;">Report Title / Test Name</label>
                        <input type="text" id="reportTitleInput" placeholder="e.g. Blood Test & Kidney Report" required style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px;" />
                    </div>

                    <div style="margin-bottom: 0.85rem;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #334155;">Upload Document / Photo (PDF, PNG, JPG)</label>
                        <input type="file" id="reportFileInput" style="width: 100%; padding: 0.5rem; border: 1px dashed #cbd5e1; border-radius: 10px;" />
                    </div>

                    <div style="margin-bottom: 1.25rem;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #334155;">Symptoms & Questions for Doctor</label>
                        <textarea id="reportNotesInput" rows="3" placeholder="Explain your symptoms or ask the doctor for advice..." style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px;"></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; border-radius: 12px; font-weight: 700;">
                        <i class="fa-solid fa-paper-plane"></i> Send Report to Wedamahataya
                    </button>
                </form>
            </div>
        `;

        overlay.classList.add('active');
    }

    submitReportConsultation() {
        const session = JSON.parse(localStorage.getItem('hela_osu_session') || '{}');
        const docId = document.getElementById('reportDocSelect').value;
        const title = document.getElementById('reportTitleInput').value;
        const notes = document.getElementById('reportNotesInput').value;

        const data = window.dbStore.get();
        const doc = (data.doctors || []).find(d => d.id === docId);

        const newReport = {
            id: 'rep-' + Date.now(),
            patientId: session.id || 1,
            patientName: session.name || 'Registered Patient',
            doctorId: docId,
            doctorName: doc ? doc.name : 'Consultant Doctor',
            title: title,
            notes: notes,
            doctorFeedback: '',
            date: new Date().toISOString().split('T')[0]
        };

        if (!data.reportConsultations) data.reportConsultations = [];
        data.reportConsultations.push(newReport);
        window.dbStore.save(data);

        if (window.HelaApi) {
            HelaApi.reports.upload({
                patientId: session.id || 1,
                doctorId: parseInt(docId.replace(/[^0-9]/g, '')) || 1,
                reportUrl: 'http://localhost/reports/' + newReport.id,
                notes: notes
            });
        }

        if (window.app) {
            window.app.showToast('Medical report submitted to doctor for consultation!', 'success');
            window.app.closeModal();
        }
        this.renderReportConsultations();
    }
}

window.patientController = new PatientController();
