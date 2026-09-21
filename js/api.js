/**
 * Hela Osu Weda Gedara - Spring Boot Backend API Integration Module
 * Base API URL: http://localhost:8080/api/v1
 */

const BASE_URL = "http://localhost:8080/api/v1";

async function apiRequest(endpoint, method = "GET", body = null, requireAuth = false) {
    const headers = {
        "Content-Type": "application/json"
    };

    const token = localStorage.getItem("jwt_token");
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data;
    } catch (err) {
        return null;
    }
}

const HelaApi = {
    baseUrl: BASE_URL,
    request: apiRequest,

    // 1. Users / Auth
    users: {
        login: (authDTO) => apiRequest("/users/login", "POST", authDTO, false),
        saveAdmin: (userDTO) => apiRequest("/users/saveAdmin", "POST", userDTO, true),
        getAllUsers: () => apiRequest("/users/getAllUsers", "GET", null, true),
        getUser: (userId) => apiRequest(`/users/getUser/${userId}`, "GET", null, true),
        deleteUser: (userId) => apiRequest(`/users/deleteUser/${userId}`, "DELETE", null, true)
    },

    // 2. Patients
    patients: {
        register: (patientDTO, username, password) => 
            apiRequest(`/patients/register?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, "POST", patientDTO, false),
        update: (patientDTO) => apiRequest("/patients/update", "PUT", patientDTO, true),
        getAll: () => apiRequest("/patients/getAll", "GET", null, true),
        getById: (patientId) => apiRequest(`/patients/get/${patientId}`, "GET", null, true),
        getByUserId: (userId) => apiRequest(`/patients/user/${userId}`, "GET", null, true)
    },

    // 3. Doctors
    doctors: {
        register: (doctorDTO, username, password, email) => 
            apiRequest(`/doctors/register?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&email=${encodeURIComponent(email)}`, "POST", doctorDTO, true),
        update: (doctorDTO) => apiRequest("/doctors/update", "PUT", doctorDTO, true),
        getAll: () => apiRequest("/doctors/getAll", "GET", null, false),
        getById: (docId) => apiRequest(`/doctors/get/${docId}`, "GET", null, false),
        getBySpecialization: (specId) => apiRequest(`/doctors/specialization/${specId}`, "GET", null, false)
    },

    // 4. Specializations
    specializations: {
        save: (dto) => apiRequest("/specializations/save", "POST", dto, true),
        update: (dto) => apiRequest("/specializations/update", "PUT", dto, true),
        delete: (specId) => apiRequest(`/specializations/delete/${specId}`, "DELETE", null, true),
        getAll: () => apiRequest("/specializations/getAll", "GET", null, false),
        getById: (specId) => apiRequest(`/specializations/get/${specId}`, "GET", null, false)
    },

    // 5. Clinic Sessions / Time Slots
    sessions: {
        create: (sessionDTO) => apiRequest("/sessions/create", "POST", sessionDTO, true),
        update: (sessionDTO) => apiRequest("/sessions/update", "PUT", sessionDTO, true),
        cancel: (sessionId) => apiRequest(`/sessions/cancel/${sessionId}`, "PUT", null, true),
        getAll: () => apiRequest("/sessions/getAll", "GET", null, false),
        getById: (sessionId) => apiRequest(`/sessions/get/${sessionId}`, "GET", null, false),
        getByDoctor: (doctorId) => apiRequest(`/sessions/doctor/${doctorId}`, "GET", null, false),
        getByDate: (dateStr) => apiRequest(`/sessions/by-date?date=${dateStr}`, "GET", null, false)
    },

    // 6. Appointments
    appointments: {
        book: (appointmentDTO) => apiRequest("/appointments/book", "POST", appointmentDTO, true),
        cancel: (appointmentId) => apiRequest(`/appointments/cancel/${appointmentId}`, "PUT", null, true),
        getById: (appointmentId) => apiRequest(`/appointments/get/${appointmentId}`, "GET", null, true),
        getByPatient: (patientId) => apiRequest(`/appointments/patient/${patientId}`, "GET", null, true),
        getBySession: (sessionId) => apiRequest(`/appointments/session/${sessionId}`, "GET", null, true),
        getAll: () => apiRequest("/appointments/getAll", "GET", null, true)
    },

    // 7. Doctor Availability
    availability: {
        save: (dto) => apiRequest("/doctor-availability/save", "POST", dto, true),
        update: (dto) => apiRequest("/doctor-availability/update", "PUT", dto, true),
        delete: (availabilityId) => apiRequest(`/doctor-availability/delete/${availabilityId}`, "DELETE", null, true),
        getByDoctor: (doctorId) => apiRequest(`/doctor-availability/doctor/${doctorId}`, "GET", null, true)
    },

    // 8. Doctor Leaves
    leaves: {
        apply: (dto) => apiRequest("/doctor-leaves/apply", "POST", dto, true),
        updateStatus: (leaveId, status) => apiRequest(`/doctor-leaves/status/${leaveId}?status=${status}`, "PUT", null, true),
        getByDoctor: (doctorId) => apiRequest(`/doctor-leaves/doctor/${doctorId}`, "GET", null, true),
        getAll: () => apiRequest("/doctor-leaves/getAll", "GET", null, true)
    },

    // 9. Medical Reports & Consultations
    reports: {
        upload: (dto) => apiRequest("/medical-reports/upload", "POST", dto, true),
        review: (reviewDTO) => apiRequest("/medical-reports/review", "POST", reviewDTO, true),
        getByPatient: (patientId) => apiRequest(`/medical-reports/patient/${patientId}`, "GET", null, true),
        getByDoctor: (doctorId) => apiRequest(`/medical-reports/doctor/${doctorId}`, "GET", null, true)
    },

    // 10. Rooms
    rooms: {
        save: (dto) => apiRequest("/rooms/save", "POST", dto, true),
        update: (dto) => apiRequest("/rooms/update", "PUT", dto, true),
        delete: (roomId) => apiRequest(`/rooms/delete/${roomId}`, "DELETE", null, true),
        getAll: () => apiRequest("/rooms/getAll", "GET", null, false)
    },

    // Global Database Synchronizer
    syncDatabase: async function() {
        if (!window.dbStore) return;
        try {
            const data = window.dbStore.get();
            let updated = false;

            // 1. Fetch Specializations from Database
            const specRes = await this.specializations.getAll();
            const specList = specRes ? (specRes.body || specRes.data || specRes) : null;
            if (Array.isArray(specList) && specList.length > 0) {
                data.specializations = specList.map(s => ({
                    id: s.specializationId || s.id,
                    name: s.name,
                    code: 'SPEC-' + (s.specializationId || 1),
                    category: 'Ayurvedic Clinical',
                    description: s.description || 'Traditional medical specialization',
                    status: 'active'
                }));
                updated = true;
            }

            // 2. Fetch Doctors from Database
            const docRes = await this.doctors.getAll();
            const docList = docRes ? (docRes.body || docRes.data || docRes) : null;
            if (Array.isArray(docList) && docList.length > 0) {
                const apiDocs = docList.map(d => {
                    let rawName = (d.firstName || d.lastName)
                        ? `${d.firstName || ''} ${d.lastName || ''}`.trim()
                        : (d.doctorName && !d.doctorName.includes('null') ? d.doctorName : 'Specialist');
                    if (!rawName.toLowerCase().startsWith('dr.')) {
                        rawName = `Dr. ${rawName}`;
                    }

                    const docIdStr = String(d.docId || d.id || Math.floor(Math.random() * 1000));
                    const docKey = docIdStr.startsWith('doc-') ? docIdStr : `doc-${docIdStr}`;

                    return {
                        id: docKey,
                        docId: d.docId || d.id,
                        name: rawName,
                        username: `doc_${d.docId || 1}`,
                        title: 'Consultant Ayurvedic Specialist',
                        specialization: d.specializationName || 'Ayurveda & Traditional Healing',
                        hospital: 'Hela Osu Weda Gedara - Galle Branch',
                        fee: d.consultationFee || 2800,
                        hospitalFee: 500,
                        phone: d.phoneNumber || '0771234567',
                        experience: '10 Years',
                        rating: 5.0,
                        reviewsCount: 12,
                        image: '',
                        status: 'approved',
                        bio: d.bio || 'Qualified traditional medical practitioner.',
                        availability: {
                            workingDays: ['Monday', 'Wednesday', 'Friday'],
                            timeSlots: ['09:00 AM - 12:00 PM', '03:00 PM - 06:00 PM'],
                            leaveDays: []
                        }
                    };
                });

                // Merge API doctors with local store doctors without losing local ones
                const docMap = new Map();
                (data.doctors || []).forEach(localDoc => docMap.set(localDoc.id, localDoc));
                apiDocs.forEach(apiDoc => docMap.set(apiDoc.id, apiDoc));

                data.doctors = Array.from(docMap.values());
                updated = true;
            }

            // 3. Fetch Patients from Database
            const patRes = await this.patients.getAll();
            const patList = patRes ? (patRes.body || patRes.data || patRes) : null;
            if (Array.isArray(patList) && patList.length > 0) {
                data.patients = patList.map(p => ({
                    id: p.patientId || p.id,
                    name: p.patientName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Patient Record',
                    username: `patient_${p.patientId || 1}`,
                    email: p.email || 'patient@helaosu.lk',
                    phone: p.phoneNumber || '0771234567',
                    nic: '199012345678',
                    gender: p.gender || 'Not Specified',
                    status: 'active',
                    registeredDate: p.dob || new Date().toISOString().split('T')[0]
                }));
                updated = true;
            }

            // 4. Fetch Appointments from Database
            const appRes = await this.appointments.getAll();
            const appList = appRes ? (appRes.body || appRes.data || appRes) : null;
            if (Array.isArray(appList) && appList.length > 0) {
                data.appointments = appList.map(a => ({
                    id: 'AP-' + (a.appointmentId || a.id),
                    patientId: a.patientId,
                    patientName: a.patientName || 'Patient',
                    doctorName: a.doctorName || 'Doctor',
                    specialization: 'Ayurveda & Traditional Healing',
                    hospital: 'Hela Osu Weda Gedara - Galle Branch',
                    date: a.createdAt ? a.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
                    timeSlot: '09:00 AM - 12:00 PM',
                    tokenNo: a.appointmentNumber || 1,
                    doctorFee: 2800,
                    hospitalFee: 500,
                    totalFee: 3300,
                    paymentStatus: 'Paid Online',
                    paymentMethod: 'Credit Card',
                    status: a.status === 'COMPLETED' ? 'Completed' : a.status === 'CANCELLED' ? 'Cancelled' : 'Upcoming',
                    notes: 'Channeling booking via database system',
                    createdAt: a.createdAt ? a.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
                }));
                updated = true;
            }

            if (updated) {
                window.dbStore.save(data);
                console.log("HelaApi: Successfully synchronized database data into local store!");
            }
            window.dispatchEvent(new CustomEvent('databaseSynced'));
        } catch (err) {
            console.warn("HelaApi Database sync warning:", err);
            window.dispatchEvent(new CustomEvent('databaseSynced'));
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    HelaApi.syncDatabase();
});

window.HelaApi = HelaApi;