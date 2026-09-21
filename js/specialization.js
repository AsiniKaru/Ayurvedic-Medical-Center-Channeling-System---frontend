/**
 * Hela Osu Channeling System - Specialization Management Controller
 * Manages Specialization CRUD, table filters, status toggling, and DB synchronization.
 */

class SpecializationController {
    constructor() {
        this.specializationSearch = '';

        window.addEventListener('databaseSynced', () => {
            const data = window.dbStore ? window.dbStore.get() : null;
            if (data) {
                this.populateSpecializationDropdowns(data);
                this.renderSpecializationsTable(data);
            }
        });
    }

    populateSpecializationDropdowns(data) {
        if (!data) data = window.dbStore ? window.dbStore.get() : {};
        const specs = data.specializations || [];

        // Admin "filter doctors by specialization" dropdown - keyed by name, unaffected.
        const filterSelect = document.getElementById('doctorSpecFilter');
        if (filterSelect) {
            const currentVal = filterSelect.value;
            filterSelect.innerHTML = '<option value="">All Specializations</option>' + specs.map(s => `
                <option value="${s.name}" ${currentVal === s.name ? 'selected' : ''}>${s.name}</option>
            `).join('');
        }

        // Doctor registration form dropdown - MUST be keyed by specialization ID,
        // because the backend `doctor` table stores specialization_id (FK), not the name.
        const regSelect = document.getElementById('regDocSpec');
        if (regSelect && specs.length > 0) {
            const currentRegVal = regSelect.value;
            regSelect.innerHTML = specs.map(s => `
                <option value="${s.id}" ${String(currentRegVal) === String(s.id) ? 'selected' : ''}>${s.name}</option>
            `).join('');
        }
    }

    filterSpecializationsTable(searchVal = null) {
        const data = window.dbStore ? window.dbStore.get() : {};
        if (searchVal !== null) this.specializationSearch = searchVal.toLowerCase();
        this.renderSpecializationsTable(data);
    }

    renderSpecializationsTable(data) {
        if (!data) data = window.dbStore ? window.dbStore.get() : {};
        const tbody = document.getElementById('adminSpecializationsTableBody');
        if (!tbody) return;

        let specs = data.specializations || [];

        if (this.specializationSearch) {
            specs = specs.filter(s => 
                (s.name && s.name.toLowerCase().includes(this.specializationSearch)) ||
                (s.category && s.category.toLowerCase().includes(this.specializationSearch)) ||
                (s.code && s.code.toLowerCase().includes(this.specializationSearch))
            );
        }

        if (specs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">
                        <i class="fa-solid fa-tags" style="font-size: 2rem; margin-bottom: 0.5rem; color: #cbd5e1;"></i>
                        <p>No specializations found matching your search.</p>
                    </td>
                </tr>
            `;
            return;
        }

        const doctors = data.doctors || [];

        tbody.innerHTML = specs.map(spec => {
            const assignedDocCount = doctors.filter(d => d.specialization === spec.name).length;
            const statusLabel = spec.status === 'active' 
                ? `<span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: bold; background: #dcfce7; color: #15803d;">Active</span>`
                : `<span style="padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: bold; background: #fee2e2; color: #b91c1c;">Inactive</span>`;

            return `
                <tr>
                    <td>
                        <strong>${spec.name}</strong><br>
                        <code style="font-size: 0.75rem; background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; color: #0284c7;">${spec.code || 'SPEC-00'}</code>
                    </td>
                    <td><span class="role-badge role-patient">${spec.category || 'General'}</span></td>
                    <td style="max-width: 280px; font-size: 0.85rem; color: #475569;">${spec.description || 'N/A'}</td>
                    <td><strong style="color: #2D8181;">${assignedDocCount} Doctors</strong></td>
                    <td>${statusLabel}</td>
                    <td>
                        <div style="display: flex; gap: 0.35rem; align-items: center;">
                            <button class="btn btn-sm btn-outline" onclick="specializationController.openEditSpecializationModal('${spec.id}')" title="Edit Specialization">
                                <i class="fa-solid fa-pen"></i> Edit
                            </button>
                            <button class="btn btn-sm ${spec.status === 'active' ? 'btn-outline' : 'btn-primary'}" onclick="specializationController.toggleSpecializationStatus('${spec.id}')">
                                ${spec.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button class="btn btn-sm" style="background: #fee2e2; color: #dc2626; border: none;" onclick="specializationController.removeSpecialization('${spec.id}')" title="Delete Specialization">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    openAddSpecializationModal() {
        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');
        if (!container || !overlay) return;

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-tags" style="color: #2D8181;"></i> Add New Specialization</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form onsubmit="event.preventDefault(); specializationController.saveNewSpecializationFromModal();">
                    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Specialization Name</label>
                            <input type="text" id="newSpecName" placeholder="Neurology & Brain Health" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                        </div>
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Code / Ref ID</label>
                            <input type="text" id="newSpecCode" placeholder="NEURO-06" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                        </div>
                    </div>

                    <div style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Department Category</label>
                        <select id="newSpecCategory" style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;">
                            <option value="Traditional Medicine">Traditional Medicine</option>
                            <option value="Wellness & Prevention">Wellness & Prevention</option>
                            <option value="Pediatrics">Pediatrics</option>
                            <option value="Orthopedics & Spine">Orthopedics & Spine</option>
                            <option value="Dermatology">Dermatology</option>
                            <option value="Neurology">Neurology</option>
                            <option value="General Clinical">General Clinical</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 1.25rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Clinical Scope Description</label>
                        <textarea id="newSpecDesc" rows="3" placeholder="Brief description of clinical treatments and scope..." style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;"></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.7rem;">
                        <i class="fa-solid fa-plus"></i> Save New Specialization
                    </button>
                </form>
            </div>
        `;

        overlay.classList.add('active');
    }

    async saveNewSpecializationFromModal() {
        const nameInput = document.getElementById('newSpecName');
        const codeInput = document.getElementById('newSpecCode');
        const catInput = document.getElementById('newSpecCategory');
        const descInput = document.getElementById('newSpecDesc');

        if (!nameInput || !codeInput) return;

        const name = nameInput.value;
        const code = codeInput.value;
        const category = catInput ? catInput.value : 'General Clinical';
        const desc = descInput ? descInput.value : '';

        const data = window.dbStore ? window.dbStore.get() : {};
        if (!data.specializations) data.specializations = [];

        const newSpec = {
            id: 'spec-' + Date.now(),
            name: name,
            code: code,
            category: category,
            description: desc || 'Ayurvedic specialist treatments and consultations.',
            status: 'active'
        };

        data.specializations.push(newSpec);
        if (window.dbStore) window.dbStore.save(data);

        try {
            if (window.HelaApi && window.HelaApi.specializations) {
                await HelaApi.specializations.save({
                    name: name,
                    description: desc || 'Ayurvedic specialist treatments'
                });
            }
        } catch (e) {
            console.warn("Backend save specialization offline:", e);
        }

        if (window.app) {
            window.app.showToast(`Specialization ${newSpec.name} added!`, 'success');
            window.app.closeModal();
        }
        this.renderSpecializationsTable(data);
        this.populateSpecializationDropdowns(data);
    }

    openEditSpecializationModal(specId) {
        const data = window.dbStore ? window.dbStore.get() : {};
        const spec = (data.specializations || []).find(s => s.id === specId);
        if (!spec) return;

        const container = document.getElementById('modalContent');
        const overlay = document.getElementById('globalModalOverlay');
        if (!container || !overlay) return;

        container.innerHTML = `
            <div class="modal-header">
                <h3><i class="fa-solid fa-pen" style="color: #2D8181;"></i> Edit Specialization</h3>
                <button class="modal-close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form onsubmit="event.preventDefault(); specializationController.updateSpecializationFromModal('${spec.id}');">
                    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Specialization Name</label>
                            <input type="text" id="editSpecName" value="${spec.name}" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                        </div>
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Code / Ref ID</label>
                            <input type="text" id="editSpecCode" value="${spec.code || ''}" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                        </div>
                    </div>

                    <div style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Department Category</label>
                        <input type="text" id="editSpecCategory" value="${spec.category || ''}" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;" />
                    </div>

                    <div style="margin-bottom: 1.25rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Description</label>
                        <textarea id="editSpecDesc" rows="3" style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px;">${spec.description || ''}</textarea>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.7rem;">
                        <i class="fa-solid fa-floppy-disk"></i> Update Specialization Details
                    </button>
                </form>
            </div>
        `;

        overlay.classList.add('active');
    }

    updateSpecializationFromModal(specId) {
        const data = window.dbStore ? window.dbStore.get() : {};
        const spec = (data.specializations || []).find(s => s.id === specId);
        if (!spec) return;

        const nameInput = document.getElementById('editSpecName');
        const codeInput = document.getElementById('editSpecCode');
        const catInput = document.getElementById('editSpecCategory');
        const descInput = document.getElementById('editSpecDesc');

        if (nameInput) spec.name = nameInput.value;
        if (codeInput) spec.code = codeInput.value;
        if (catInput) spec.category = catInput.value;
        if (descInput) spec.description = descInput.value;

        if (window.dbStore) window.dbStore.save(data);

        if (window.app) {
            window.app.showToast(`Specialization ${spec.name} updated!`, 'success');
            window.app.closeModal();
        }
        this.renderSpecializationsTable(data);
        this.populateSpecializationDropdowns(data);
    }

    toggleSpecializationStatus(specId) {
        const data = window.dbStore ? window.dbStore.get() : {};
        const spec = (data.specializations || []).find(s => s.id === specId);
        if (spec) {
            spec.status = spec.status === 'active' ? 'inactive' : 'active';
            if (window.dbStore) window.dbStore.save(data);
            if (window.app) window.app.showToast(`Specialization status changed to ${spec.status}.`, 'info');
            this.renderSpecializationsTable(data);
        }
    }

    removeSpecialization(specId) {
        if (!confirm('Are you sure you want to remove this specialization?')) return;
        const data = window.dbStore ? window.dbStore.get() : {};
        data.specializations = (data.specializations || []).filter(s => s.id !== specId);
        if (window.dbStore) window.dbStore.save(data);
        if (window.app) window.app.showToast('Specialization deleted.', 'warning');
        this.renderSpecializationsTable(data);
    }
}

window.specializationController = new SpecializationController();
