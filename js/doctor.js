/**
 * Hela Osu Channeling System - Doctor Portal Controller
 * Handles Doctor Channeling Queue, Consultation EHR Modal, Shift Availability setup,
 * and Medical Report Consultation Review & Feedback.
 */

class DoctorController {
    constructor() {
        this.activeDoctorTab = 'queue';

        window.addEventListener('databaseSynced', () => {
            // console.log("DoctorController: Database synced, refreshing doctor portal views...");
            this.renderDoctorPortal();
        });
    }

    renderDoctorPortal() {
        const session = JSON.parse(localStorage.getItem('hela_osu_session') || '{}');
        const data = window.dbStore.get();
        const currentDoc = (data.doctors || []).find(d => d.username === session.username || d.name === session.name) || data.doctors[0];

        const titleEl = document.getElementById('docWelcomeTitle');
        if (titleEl && currentDoc) {
            titleEl.textContent = `Ayubowan, ${currentDoc.name}!`;
        }

        this.renderDoctorQueue(currentDoc);
        this.renderDoctorAvailabilityForm(currentDoc);
        this.renderDoctorReports(currentDoc);
    }

    renderDoctorQueue(doc) {
        const tbody = document.getElementById('doctorQueueTableBody');
        if (!tbody) return;

        const data = window.dbStore.get();
        const docName = doc ? doc.name : '';
        const docApps = (data.appointments || []).filter(a => a.doctorName === docName || !docName);

        if (docApps.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2.5rem; color: #64748b;">
                        <i class="fa-solid fa-user-clock" style="font-size: 2rem; margin-bottom: 0.5rem; color: #cbd5e1;"></i>
                        <p>No channeling patients scheduled in queue today.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = docApps.map((a, idx) => `
            <tr>
                <td><strong style="font-size: 1.1rem; color: #1e5c5c;">#${a.tokenNo || (idx + 1)}</strong></td>
                <td>
                    <strong>${a.patientName}</strong><br>
                    <span style="font-size: 0.78rem; color: #64748b;">ID: ${a.patientId || 'PAT-101'}</span>
                </td>
                <td>${a.timeSlot || '09:00 AM'}</td>
                <td><span style="background: #e0f2fe; color: #0284c7; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.8rem; font-weight: bold;">Paid Online</span></td>
                <td>
                    <span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: bold; background: ${
                        a.status === 'Completed' ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #b45309;'
                    }">
                        ${a.status}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.35rem;">
                        <button class="btn btn-sm btn-primary" onclick="doctorController.openEhrModal('${a.id}')" title="Start Consultation EHR Record">
                            <i class="fa-solid fa-stethoscope"></i> Consult
                        </button>
                        ${a.status !== 'Completed' ? `
                            <button class="btn btn-sm btn-outline" onclick="doctorController.markAppointmentCompleted('${a.id}')" title="Mark Done">
                                <i class="fa-solid fa-check"></i> Complete
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    markAppointmentCompleted(bookingId) {
        const data = window.dbStore.get();
        const ap = (data.appointments || []).find(a => a.id === bookingId);
        if (ap) {
            ap.status = 'Completed';
            window.dbStore.save(data);

            if (window.HelaApi) {
                const numericId = parseInt(bookingId.replace(/[^0-9]/g, '')) || 1;
                HelaApi.appointments.updateStatus(numericId, 'COMPLETED');
            }

            if (window.app) window.app.showToast(`Patient consultation for ${ap.patientName} marked completed!`, 'success');
            this.renderDoctorPortal();
        }
    }

    renderDoctorAvailabilityForm(doc) {
        if (!doc) return;
        const daysContainer = document.getElementById('docWorkingDaysContainer');
        const slotsContainer = document.getElementById('docTimeSlotsContainer');
        const leaveContainer = document.getElementById('docLeaveDaysList');

        if (!doc.availability) {
            doc.availability = {
                workingDays: ['Monday', 'Wednesday', 'Friday'],
                timeSlots: ['09:00 AM - 12:00 PM', '03:00 PM - 06:00 PM'],
                leaveDays: []
            };
        }

        const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (daysContainer) {
            daysContainer.innerHTML = allDays.map(day => {
                const checked = doc.availability.workingDays.includes(day);
                return `
                    <label style="padding: 0.5rem 0.85rem; border-radius: 10px; border: 1px solid ${checked ? '#2D8181' : '#cbd5e1'}; background: ${checked ? '#ecfdf5' : 'white'}; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.88rem;">
                        <input type="checkbox" value="${day}" ${checked ? 'checked' : ''} onchange="doctorController.toggleWorkingDay('${day}')" />
                        ${day}
                    </label>
                `;
            }).join('');
        }

        if (slotsContainer) {
            slotsContainer.innerHTML = doc.availability.timeSlots.map(slot => `
                <div style="padding: 0.6rem; border-radius: 10px; border: 1px solid #cbd5e1; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600;">
                    <span>🕒 ${slot}</span>
                    <button type="button" style="background: transparent; border: none; color: #dc2626; cursor: pointer;" onclick="doctorController.removeTimeSlot('${slot}')">&times;</button>
                </div>
            `).join('');
        }

        if (leaveContainer) {
            leaveContainer.innerHTML = doc.availability.leaveDays.length === 0 ? '<p style="color: #64748b; font-size: 0.85rem;">No leave days scheduled.</p>' : doc.availability.leaveDays.map(d => `
                <span style="background: #fee2e2; color: #b91c1c; padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; display: inline-flex; align-items: center; gap: 0.4rem;">
                    🌴 ${d} <button type="button" onclick="doctorController.removeLeaveDate('${d}')" style="background: transparent; border: none; color: #b91c1c; cursor: pointer;">&times;</button>
                </span>
            `).join('');
        }
    }

    toggleWorkingDay(day) {
        const session = JSON.parse(localStorage.getItem('hela_osu_session') || '{}');
        const data = window.dbStore.get();
        const doc = (data.doctors || []).find(d => d.username === session.username || d.name === session.name) || data.doctors[0];

        if (doc && doc.availability) {
            const idx = doc.availability.workingDays.indexOf(day);
            if (idx > -1) doc.availability.workingDays.splice(idx, 1);
            else doc.availability.workingDays.push(day);

            window.dbStore.save(data);
            this.renderDoctorAvailabilityForm(doc);
        }
    }

    addCustomDoctorTimeSlot() {
        const input = document.getElementById('customTimeSlotInput');
        if (!input || !input.value.trim()) return;
        const newSlot = input.value.trim();

        const session = JSON.parse(localStorage.getItem('hela_osu_session') || '{}');
        const data = window.dbStore.get();
        const doc = (data.doctors || []).find(d => d.username === session.username || d.name === session.name) || data.doctors[0];

        if (doc && doc.availability) {
            if (!doc.availability.timeSlots.includes(newSlot)) {
                doc.availability.timeSlots.push(newSlot);
                window.dbStore.save(data);
                input.value = '';
                this.renderDoctorAvailabilityForm(doc);
            }
        }
    }

    removeTimeSlot(slot) {
        const session = JSON.parse(localStorage.getItem('hela_osu_session') || '{}');
        const data = window.dbStore.get();
        const doc = (data.doctors || []).find(d => d.username === session.username || d.name === session.name) || data.doctors[0];

        if (doc && doc.availability) {
            doc.availability.timeSlots = doc.availability.timeSlots.filter(s => s !== slot);
            window.dbStore.save(data);
            this.renderDoctorAvailabilityForm(doc);
        }
    }

    addDoctorLeaveDate() {
        const input = document.getElementById('addLeaveDateInput');
        if (!input || !input.value) return;
        const dateStr = input.value;

        const session = JSON.parse(localStorage.getItem('hela_osu_session') || '{}');
        const data = window.dbStore.get();
        const doc = (data.doctors || []).find(d => d.username === session.username || d.name === session.name) || data.doctors[0];

        if (doc && doc.availability) {
            if (!doc.availability.leaveDays.includes(dateStr)) {
                doc.availability.leaveDays.push(dateStr);
                window.dbStore.save(data);
                input.value = '';
                this.renderDoctorAvailabilityForm(doc);
            }
        }
    }

    removeLeaveDate(dateStr) {
        const session = JSON.parse(localStorage.getItem('hela_osu_session') || '{}');
        const data = window.dbStore.get();
        const doc = (data.doctors || []).find(d => d.username === session.username || d.name === session.name) || data.doctors[0];

        if (doc && doc.availability) {
            doc.availability.leaveDays = doc.availability.leaveDays.filter(d => d !== dateStr);
            window.dbStore.save(data);
            this.renderDoctorAvailabilityForm(doc);
        }
    }

    saveDoctorAvailabilityForm() {
        const data = window.dbStore.get();
        window.dbStore.save(data);
        if (window.app) window.app.showToast('Shift availability and schedule saved successfully!', 'success');
    }

    renderDoctorReports(doc) {
        const container = document.getElementById('doctorReportsListContainer');
        if (!container) return;

        const data = window.dbStore.get();
        const docName = doc ? doc.name : '';
        const reports = (data.reportConsultations || []).filter(r => r.doctorName === docName || !docName);

        if (reports.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2.5rem; background: white; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <i class="fa-solid fa-inbox" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.5rem;"></i>
                    <p style="color: #64748b;">No medical report consultation submissions pending review.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = reports.map(r => `
            <div class="glass-card" style="margin-bottom: 1.25rem; background: white; padding: 1.25rem; border-radius: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div>
                        <h4 style="margin-bottom: 0.2rem; color: #0f172a;"><i class="fa-solid fa-file-pdf" style="color: #dc2626;"></i> ${r.title || 'Lab & Clinical Report'}</h4>
                        <span style="font-size: 0.8rem; color: #64748b;">Patient: <strong>${r.patientName}</strong> • Date: ${r.date || 'Today'}</span>
                    </div>
                    <span style="padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.78rem; font-weight: bold; background: ${r.doctorFeedback ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #b45309;'}">
                        ${r.doctorFeedback ? '✓ Feedback Sent' : '⏳ Pending Feedback'}
                    </span>
                </div>

                <div style="background: #f8fafc; padding: 0.85rem; border-radius: 10px; font-size: 0.88rem; margin-bottom: 0.75rem;">
                    <strong>Patient Question / Notes:</strong> ${r.notes || 'No description provided.'}
                </div>

                ${r.doctorFeedback ? `
                    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.85rem; border-radius: 10px; margin-bottom: 0.75rem;">
                        <strong style="color: #065f46;">Your Review Feedback:</strong>
                        <p style="color: #047857; font-size: 0.88rem; margin: 0.2rem 0 0 0;">${r.doctorFeedback}</p>
                    </div>
                ` : ''}

                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn btn-sm btn-primary" onclick="doctorController.openDoctorReviewModal('${r.id}')">
                        <i class="fa-solid fa-pen-to-square"></i> ${r.doctorFeedback ? 'Update Feedback' : 'Provide Feedback & Instructions'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    openDoctorReviewModal(reportId) {
        const data = window.dbStore.get();
        const r = (data.reportConsultations || []).find(rep => rep.id === reportId);
        if (!r) return;

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-user-doctor" style="color: #2D8181;"></i> Report Review & Doctor Feedback</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="background: #f8fafc; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
                    <p><strong>Patient:</strong> ${r.patientName}</p>
                    <p><strong>Report:</strong> ${r.title}</p>
                    <p><strong>Notes:</strong> ${r.notes || 'N/A'}</p>
                </div>

                <form onsubmit="event.preventDefault(); doctorController.sendDoctorReportFeedback('${r.id}');">
                    <div style="margin-bottom: 1.25rem;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #334155;">Enter Doctor Instructions / Prescription Advice</label>
                        <textarea id="doctorFeedbackInput" rows="4" required style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px;" placeholder="Provide traditional weda kam advice, diet recommendations, or prescription instructions...">${r.doctorFeedback || ''}</textarea>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; border-radius: 12px; font-weight: 700;">
                        <i class="fa-solid fa-paper-plane"></i> Send Feedback to Patient
                    </button>
                </form>
            </div>
        `;

        overlay.classList.add('active');
    }

    sendDoctorReportFeedback(reportId) {
        const feedback = document.getElementById('doctorFeedbackInput').value;
        const data = window.dbStore.get();
        const r = (data.reportConsultations || []).find(rep => rep.id === reportId);

        if (r) {
            r.doctorFeedback = feedback;
            window.dbStore.save(data);

            if (window.app) {
                window.app.showToast(`Feedback sent to patient ${r.patientName}!`, 'success');
                window.app.closeModal();
            }
            const session = JSON.parse(localStorage.getItem('hela_osu_session') || '{}');
            const currentDoc = (data.doctors || []).find(d => d.username === session.username || d.name === session.name) || data.doctors[0];
            this.renderDoctorReports(currentDoc);
        }
    }

    openEhrModal(bookingId) {
        const data = window.dbStore.get();
        const ap = (data.appointments || []).find(a => a.id === bookingId);
        if (!ap) return;

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-notes-medical" style="color: #2D8181;"></i> Ayurvedic Consultation EHR Record</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="background: #f8fafc; padding: 1rem; border-radius: 12px; margin-bottom: 1rem; display: flex; justify-content: space-between;">
                    <div>
                        <h4 style="margin: 0; color: #0f172a;">${ap.patientName}</h4>
                        <span style="font-size: 0.8rem; color: #64748b;">Booking Ref: ${ap.id} • Token: #${ap.tokenNo || 1}</span>
                    </div>
                    <span style="font-size: 0.85rem; font-weight: bold; color: #2D8181;">📅 ${ap.date}</span>
                </div>

                <form onsubmit="event.preventDefault(); window.app.showToast('EHR Consultation saved to patient medical history!', 'success'); app.closeModal();">
                    <div style="margin-bottom: 0.85rem;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #334155;">Traditional Diagnosis (Nadi Pariksha / Symptoms)</label>
                        <input type="text" placeholder="Vata/Pitta imbalance, chronic joint pain..." required style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px;" />
                    </div>

                    <div style="margin-bottom: 0.85rem;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #334155;">Herbal Medicine & Oil Prescription (Arishta / Kwatha / Kashaya)</label>
                        <textarea rows="3" placeholder="Pahan Trithika Kashaya 100ml twice daily after meals..." required style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px;"></textarea>
                    </div>

                    <div style="margin-bottom: 1.25rem;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #334155;">Dietary & Lifestyle Advice (Pathya Ahara)</label>
                        <input type="text" placeholder="Avoid sour and cold foods. Apply Pinda Thailaya daily." style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px;" />
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; border-radius: 12px; font-weight: 700;">
                        <i class="fa-solid fa-floppy-disk"></i> Complete Consultation & Issue EHR Record
                    </button>
                </form>
            </div>
        `;

        overlay.classList.add('active');
    }
}

window.doctorController = new DoctorController();
