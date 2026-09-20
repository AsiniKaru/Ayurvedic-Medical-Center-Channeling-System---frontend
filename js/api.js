/**
 * Hela Osu Weda Gedara - Spring Boot Backend API Integration Module
 * Base API URL: http://localhost:8080/api/v1
 */

const BASE_URL = "http://localhost:8080/api/v1";

async function apiRequest(endpoint, method = "GET", body = null, requireAuth = true) {
    const headers = {
        "Content-Type": "application/json"
    };

    if (requireAuth) {
        const token = localStorage.getItem("jwt_token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);

        if (response.status === 401 || response.status === 403) {
            console.warn("API Auth Warning: 401/403 on", endpoint);
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.warn("Connection warning to backend server (localhost:8080):", err);
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
    }
};

window.HelaApi = HelaApi;