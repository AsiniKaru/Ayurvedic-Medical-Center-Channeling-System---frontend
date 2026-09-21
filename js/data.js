/**
 * Hela Osu Channeling System - Database Data Store Manager
 * Stores database records synchronized with Spring Boot REST API
 */

const INITIAL_SPECIALIZATIONS = [
    { id: 1, name: 'Ayurveda & Traditional Healing', code: 'SPEC-1', category: 'Ayurvedic Clinical', description: 'General Weda Kam, Panchakarma and Holistic Healing', status: 'active' },
    { id: 2, name: 'Ayurvedic Wellness & Vitality', code: 'SPEC-2', category: 'Therapeutic Wellness', description: 'Vitality restoration and traditional herbal therapy', status: 'active' },
    { id: 3, name: 'Traditional Orthopedics (Kedum Bindum)', code: 'SPEC-3', category: 'Bone & Joint Care', description: 'Traditional Sri Lankan bone setting and oil treatment', status: 'active' },
    { id: 4, name: 'Deshiya Chikitsa (Native Medicine)', code: 'SPEC-4', category: 'Native Heritage', description: 'Ancient Hela Weda traditions and herbal oil therapy', status: 'active' }
];

const INITIAL_DOCTORS = [
    {
        id: 'doc-1',
        docId: 1,
        username: 'doc_wickramasinghe',
        name: 'Dr. Deshabandu Wickramasinghe',
        title: 'Consultant Ayurvedic Specialist',
        specialization: 'Ayurveda & Traditional Healing',
        hospital: 'Hela Osu Weda Gedara - Galle Branch',
        fee: 2800,
        hospitalFee: 500,
        phone: '0771234567',
        experience: '15 Years',
        rating: 5.0,
        reviewsCount: 24,
        image: '',
        status: 'approved',
        bio: 'Senior Ayurvedic Practitioner specializing in Panchakarma and native weda kam.',
        availability: {
            workingDays: ['Monday', 'Wednesday', 'Friday'],
            timeSlots: ['09:00 AM - 12:00 PM', '03:00 PM - 06:00 PM'],
            leaveDays: []
        }
    },
    {
        id: 'doc-2',
        docId: 2,
        username: 'doc_bandara',
        name: 'Dr. Anura Bandara',
        title: 'Senior Wedamahataya',
        specialization: 'Traditional Orthopedics (Kedum Bindum)',
        hospital: 'Hela Osu Weda Gedara - Colombo Branch',
        fee: 3200,
        hospitalFee: 500,
        phone: '0719876543',
        experience: '20 Years',
        rating: 4.9,
        reviewsCount: 18,
        image: '',
        status: 'approved',
        bio: 'Specialist in ancient Kedum Bindum weda kam and joint restoration.',
        availability: {
            workingDays: ['Tuesday', 'Thursday', 'Saturday'],
            timeSlots: ['10:00 AM - 01:00 PM', '04:00 PM - 07:00 PM'],
            leaveDays: []
        }
    }
];

const DEFAULT_DATA = {
    doctors: INITIAL_DOCTORS,
    patients: [],
    admins: [
        {
            id: 'admin-1',
            username: 'admin',
            password: 'password',
            name: 'System Admin',
            role: 'admin'
        }
    ],
    appointments: [],
    reportConsultations: [],
    reviews: [],
    notifications: [],
    adminConfig: {
        platformCommissionPercent: 10,
        standardHospitalFee: 500,
        contactEmail: 'support@helaosu.lk',
        contactHotline: '1390 / +94 11 234 5678'
    },
    specializations: INITIAL_SPECIALIZATIONS
};

class DataStore {
    constructor() {
        this.init();
    }

    init() {
        const stored = localStorage.getItem('hela_osu_db');
        if (!stored) {
            localStorage.setItem('hela_osu_db', JSON.stringify(DEFAULT_DATA));
        }
    }

    get() {
        try {
            const data = JSON.parse(localStorage.getItem('hela_osu_db')) || DEFAULT_DATA;
            if (!data.doctors || data.doctors.length === 0) data.doctors = [...INITIAL_DOCTORS];
            if (!data.patients) data.patients = [];
            if (!data.appointments) data.appointments = [];
            if (!data.specializations || data.specializations.length === 0) data.specializations = [...INITIAL_SPECIALIZATIONS];
            return data;
        } catch (e) {
            console.error('Failed to parse localStorage data', e);
            return DEFAULT_DATA;
        }
    }

    save(data) {
        localStorage.setItem('hela_osu_db', JSON.stringify(data));
    }

    resetToDefault() {
        localStorage.setItem('hela_osu_db', JSON.stringify(DEFAULT_DATA));
        return DEFAULT_DATA;
    }
}

window.dbStore = new DataStore();

