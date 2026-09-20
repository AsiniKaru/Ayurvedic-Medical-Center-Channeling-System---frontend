/**
 * Hela Osu Channeling System - Initial Seed Data & LocalStorage Manager
 * Exclusively for Hela Osu Weda Gedara Centers with Username/Password Auth
 */

const DEFAULT_DATA = {
    doctors: [
        {
            id: 'doc-101',
            username: 'dr_wickramasinghe',
            password: 'password',
            email: 'doctor@helaosu.lk',
            name: 'Dr. Deshabandu Wickramasinghe',
            title: 'Wedamahataya (Senior Ayurvedic Specialist)',
            specialization: 'Ayurveda & Traditional Healing',
            regNo: 'SL-AYU-4029',
            hospital: 'Hela Osu Weda Gedara - Galle Branch',
            fee: 2500,
            hospitalFee: 500,
            experience: '18 Years',
            rating: 4.9,
            reviewsCount: 48,
            image: '',
            status: 'approved',
            bio: 'Senior practitioner in traditional Sri Lankan Weda Kam & Panchakarma therapy with over 18 years of holistic healing experience at Hela Osu Weda Gedara Galle.',
            availability: {
                workingDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
                timeSlots: ['09:00 AM - 12:00 PM', '03:00 PM - 06:00 PM'],
                leaveDays: ['2026-08-25']
            }
        },
        {
            id: 'doc-102',
            username: 'dr_jayawardena',
            password: 'password',
            email: 'galle.doc2@helaosu.lk',
            name: 'Dr. Anura Jayawardena',
            title: 'Consultant Ayurvedic Physician',
            specialization: 'Ayurvedic Wellness & Vitality',
            regNo: 'SL-AYU-1849',
            hospital: 'Hela Osu Weda Gedara - Galle Branch',
            fee: 3000,
            hospitalFee: 500,
            experience: '15 Years',
            rating: 4.8,
            reviewsCount: 36,
            image: '',
            status: 'approved',
            bio: 'Specialist in herbal cardiac care, hypertension management, and preventive Ayurvedic living at Hela Osu Galle center.',
            availability: {
                workingDays: ['Tuesday', 'Thursday', 'Saturday'],
                timeSlots: ['04:00 PM - 08:00 PM'],
                leaveDays: []
            }
        },
        {
            id: 'doc-103',
            username: 'dr_fernando',
            password: 'password',
            email: 'galle.doc@helaosu.lk',
            name: 'Dr. Nilmini Fernando',
            title: 'Ayurvedic Pediatrician (Bala Roga Weda)',
            specialization: 'Pediatrics & Child Health',
            regNo: 'SL-AYU-2291',
            hospital: 'Hela Osu Weda Gedara - Galle Branch',
            fee: 2600,
            hospitalFee: 500,
            experience: '12 Years',
            rating: 4.95,
            reviewsCount: 64,
            image: '',
            status: 'approved',
            bio: 'Compassionate traditional specialist in child herbal immunizations, digestive wellness, and pediatric care at Hela Osu Galle.',
            availability: {
                workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                timeSlots: ['08:30 AM - 11:30 AM'],
                leaveDays: []
            }
        },
        {
            id: 'doc-104',
            username: 'dr_bandara',
            password: 'password',
            email: 'galle.doc3@helaosu.lk',
            name: 'Dr. Chaminda Bandara',
            title: 'Spine & Joint Specialist (Kadu Wedamahataya)',
            specialization: 'Spine & Joint Rehabilitation',
            regNo: 'SL-AYU-1502',
            hospital: 'Hela Osu Weda Gedara - Galle Branch',
            fee: 3200,
            hospitalFee: 500,
            experience: '20 Years',
            rating: 4.75,
            reviewsCount: 29,
            image: '',
            status: 'approved',
            bio: 'Expert in traditional joint adjustments, vertebral realignment, and chronic arthritis herbal oil therapies at Hela Osu Galle.',
            availability: {
                workingDays: ['Wednesday', 'Saturday', 'Sunday'],
                timeSlots: ['02:00 PM - 05:00 PM'],
                leaveDays: []
            }
        },
        {
            id: 'doc-105',
            username: 'dr_samarasinghe',
            password: 'password',
            email: 'galle.doc4@helaosu.lk',
            name: 'Dr. Sanduni Samarasinghe',
            title: 'Ayurvedic Skin & Cosmetic Specialist',
            specialization: 'Dermatology & Skin Care',
            regNo: 'SL-AYU-3104',
            hospital: 'Hela Osu Weda Gedara - Galle Branch',
            fee: 2800,
            hospitalFee: 500,
            experience: '9 Years',
            rating: 4.85,
            reviewsCount: 42,
            image: '',
            status: 'approved',
            bio: 'Expert in clinical Ayurvedic dermatology, acne treatments, herbal skin restoration, and complexion wellness.',
            availability: {
                workingDays: ['Monday', 'Thursday', 'Friday'],
                timeSlots: ['05:00 PM - 08:00 PM'],
                leaveDays: []
            }
        }
    ],

    patients: [
        {
            id: 'pat-201',
            username: 'saman',
            password: 'password',
            name: 'Saman Kumara',
            email: 'saman@gmail.com',
            phone: '0771234567',
            nic: '199238402910',
            age: 34,
            gender: 'Male',
            status: 'active',
            registeredDate: '2026-01-15'
        },
        {
            id: 'pat-202',
            username: 'malkanthi',
            password: 'password',
            name: 'Malkanthi Perera',
            email: 'malkanthi@gmail.com',
            phone: '0719876543',
            nic: '198572019482',
            age: 41,
            gender: 'Female',
            status: 'active',
            registeredDate: '2026-02-01'
        }
    ],

    admins: [
        {
            id: 'admin-1',
            username: 'admin',
            password: 'password',
            name: 'System Admin',
            role: 'admin'
        }
    ],

    appointments: [
        {
            id: 'AP-1001',
            patientId: 'pat-201',
            patientName: 'Saman Kumara',
            patientPhone: '0771234567',
            doctorId: 'doc-101',
            doctorName: 'Dr. Deshabandu Wickramasinghe',
            specialization: 'Ayurveda & Traditional Healing',
            hospital: 'Hela Osu Weda Gedara - Galle Branch',
            date: '2026-08-15',
            timeSlot: '09:00 AM - 12:00 PM',
            tokenNo: 4,
            doctorFee: 2500,
            hospitalFee: 500,
            totalFee: 3000,
            paymentStatus: 'Paid',
            paymentMethod: 'Credit Card',
            status: 'Upcoming',
            notes: 'Experiencing chronic lower back stiffness for 3 weeks.',
            prescription: null,
            createdAt: '2026-08-10'
        },
        {
            id: 'AP-1000',
            patientId: 'pat-201',
            patientName: 'Saman Kumara',
            patientPhone: '0771234567',
            doctorId: 'doc-103',
            doctorName: 'Dr. Nilmini Fernando',
            specialization: 'Pediatrics & Child Health',
            hospital: 'Hela Osu Weda Gedara - Galle Branch',
            date: '2026-07-20',
            timeSlot: '08:30 AM - 11:30 AM',
            tokenNo: 2,
            doctorFee: 2600,
            hospitalFee: 500,
            totalFee: 3100,
            paymentStatus: 'Paid',
            paymentMethod: 'Cash',
            status: 'Completed',
            notes: 'Child digestive wellness consultation.',
            prescription: {
                id: 'RX-9081',
                diagnosis: 'Mild Ajeerna (Indigestion) & Digestive Heat',
                medicines: [
                    { name: 'Siddharthaka Thailaya', dosage: '5ml daily before meals', duration: '14 Days' },
                    { name: 'Asokarishtaya', dosage: '10ml after meals', duration: '14 Days' }
                ],
                dietaryAdvice: 'Avoid cold beverages and fried food. Drink warm coriander water.',
                issuedDate: '2026-07-20'
            },
            createdAt: '2026-07-15'
        }
    ],

    reportConsultations: [
        {
            id: 'RC-501',
            patientId: 'pat-201',
            patientName: 'Saman Kumara',
            doctorId: 'doc-101',
            doctorName: 'Dr. Deshabandu Wickramasinghe',
            reportTitle: 'Spine X-Ray Scan',
            reportFileName: 'Lumbosacral_XRay_Report.pdf',
            patientMessage: 'Ayubowan Doctor, I have uploaded my recent Spine X-Ray. Please advise if I should continue the herbal oils.',
            doctorReply: 'Ayubowan Saman. Your X-Ray shows minor lumbar compression. Please continue Arandhi Oil massage twice daily.',
            repliedAt: '2026-08-11 10:30 AM',
            status: 'Replied',
            submittedAt: '2026-08-10 03:15 PM'
        }
    ],

    reviews: [
        {
            id: 'REV-1',
            doctorId: 'doc-101',
            patientName: 'Nimali Senanayake',
            rating: 5,
            comment: 'Excellent Ayurvedic treatment at Hela Osu Weda Gedara Colombo! Joint pain decreased significantly.',
            date: '2026-07-28'
        }
    ],

    notifications: [
        {
            id: 'NOTIF-1',
            userId: 'pat-201',
            title: 'Appointment Reminder 🔔',
            message: 'Your session with Dr. Deshabandu Wickramasinghe at Hela Osu Weda Gedara is scheduled for Aug 15 at 09:00 AM.',
            time: '2 hours ago',
            unread: true
        }
    ],

    adminConfig: {
        platformCommissionPercent: 10,
        standardHospitalFee: 500,
        contactEmail: 'support@helaosu.lk',
        contactHotline: '1390 / +94 11 234 5678'
    },

    specializations: [
        { id: 'spec-1', name: 'Ayurveda & Traditional Healing', code: 'AYU-01', category: 'Traditional Medicine', description: 'Holistic Sri Lankan Weda Kam, Panchakarma, and herbal healing.', status: 'active' },
        { id: 'spec-2', name: 'Ayurvedic Wellness & Vitality', code: 'AYU-02', category: 'Wellness & Prevention', description: 'Ayurvedic nutrition, hypertension, cardiac care, and rejuvenation.', status: 'active' },
        { id: 'spec-3', name: 'Pediatrics & Child Health', code: 'AYU-03', category: 'Pediatrics', description: 'Bala Roga Weda, herbal immunizations, and pediatric digestive health.', status: 'active' },
        { id: 'spec-4', name: 'Spine & Joint Rehabilitation', code: 'AYU-04', category: 'Orthopedics', description: 'Kadu Wedamahataya joint alignment, arthritis, and spine oil therapy.', status: 'active' },
        { id: 'spec-5', name: 'Dermatology & Skin Care', code: 'AYU-05', category: 'Dermatology', description: 'Herbal skin restoration, eczema, acne, and complexion wellness.', status: 'active' }
    ]
};

class DataStore {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('hela_osu_db_galle_v5')) {
            localStorage.setItem('hela_osu_db', JSON.stringify(DEFAULT_DATA));
            localStorage.setItem('hela_osu_db_galle_v5', 'true');
        }
    }

    get() {
        try {
            const data = JSON.parse(localStorage.getItem('hela_osu_db')) || DEFAULT_DATA;
            if (!data.specializations || data.specializations.length === 0) {
                data.specializations = DEFAULT_DATA.specializations;
                this.save(data);
            }
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
