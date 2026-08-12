/**
 * Hela Osu Channeling System - Internationalization (i18n) Engine
 * Multi-Language: English (EN), Sinhala (SI), Tamil (TA)
 */

const TRANSLATIONS = {
    en: {
        brandName: "Hela Osu Channeling",
        tagline: "Connecting You with Trusted Doctors & Traditional Ayurvedic Healing",
        navHome: "Home",
        navSearch: "Find Doctors",
        navBookings: "My Bookings",
        navConsultation: "Report Consultation",
        navDoctorPortal: "Doctor Portal",
        navAdminPortal: "Admin Portal",
        heroTitle: "Channel Sri Lanka's Top Doctors & Ayurvedic Practitioners",
        heroSub: "Instant appointment booking, e-receipts, digital prescriptions, and online report consultations.",
        btnSearchDoctor: "Search Doctors Now",
        btnEmergencyCall: "Hotline 1390",
        searchPlaceholder: "Search doctor name, hospital or condition...",
        specAll: "All Specializations",
        specAyurveda: "Ayurveda & Traditional Healing",
        specCardiology: "Cardiology",
        specPediatrics: "Pediatrics & Child Health",
        specNeurology: "Neurology",
        specDermatology: "Dermatology & Skin Care",
        cardFee: "Channeling Fee",
        cardHospitalFee: "Hospital Fee",
        cardBookNow: "Book Appointment",
        cardViewProfile: "View Profile",
        cardExperience: "Experience",
        cardRating: "Rating",
        modalBookTitle: "Book Channeling Slot",
        btnConfirmPayment: "Proceed to Payment",
        adminTitle: "Admin Management Dashboard",
        adminDoctors: "Manage Doctors",
        adminPatients: "Manage Patients",
        adminAppointments: "All Appointments",
        adminRevenue: "Revenue Analytics",
        adminFee: "Channeling Fees",
        doctorTitle: "Doctor Workspace & Appointments",
        docAvailability: "Set Availability",
        docQueue: "Patient Queue",
        docPrescription: "Issue Digital Prescription",
        docMessages: "Report Consultations",
        chatbotHeader: "Hela Osu AI Health Assistant",
        chatbotPlaceholder: "Ask me anything about booking, doctors, or symptoms...",
        footerCopy: "© 2026 Hela Osu Channeling System. All Rights Reserved."
    },
    si: {
        brandName: "හෙළ ඔසු චැනලින් පද්ධතිය",
        tagline: "විශ්වසනීය වෛද්‍යවරුන් සහ පාරම්පරික හෙළ වෙදකම සමඟ ඔබ යා කරමු",
        navHome: "මුල් පිටුව",
        navSearch: "වෛද්‍යවරුන් සොයන්න",
        navBookings: "මගේ වේලාවන්",
        navConsultation: "වාර්තා පරීක්ෂාව",
        navDoctorPortal: "වෛද්‍ය පිවිසුම",
        navAdminPortal: "පරිපාලන පිවිසුම",
        heroTitle: "ශ්‍රී ලංකාවේ ප්‍රමුඛතම විශේෂඥ සහ හෙළ වෙද වෛද්‍යවරුන් චැනල් කරන්න",
        heroSub: "ක්ෂණික වේලාවන් වෙන්කරවා ගැනීම, ඩිජිටල් රිසිට්පත්, ඩිජිටල් බෙහෙත් තුණ්ඩු සහ මාර්ගගත වාර්තා පරීක්ෂාව.",
        btnSearchDoctor: "වෛද්‍යවරයෙකු සොයන්න",
        btnEmergencyCall: "ක්ෂණික ඇමතුම් 1390",
        searchPlaceholder: "වෛද්‍යවරයාගේ නම, රෝහල හෝ රෝගය සපයන්න...",
        specAll: "සියලුම විශේෂඥතාවයන්",
        specAyurveda: "ආයුර්වේද සහ හෙළ වෙදකම",
        specCardiology: "හෘද රෝග විශේෂඥ",
        specPediatrics: "ළමා රෝග විශේෂඥ",
        specNeurology: "ස්නායු රෝග විශේෂඥ",
        specDermatology: "චර්ම රෝග විශේෂඥ",
        cardFee: "චැනලින් ගාස්තුව",
        cardHospitalFee: "රෝහල් ගාස්තුව",
        cardBookNow: "වේලාවක් වෙන්කරන්න",
        cardViewProfile: "විස්තර බලන්න",
        cardExperience: "පළපුරුද්ද",
        cardRating: "ගරුත්වය",
        modalBookTitle: "චැනලින් වේලාව වෙන් කිරීම",
        btnConfirmPayment: "ගෙවීම සඳහා පිවිසෙන්න",
        adminTitle: "පරිපාලන පාලක පුවරුව",
        adminDoctors: "වෛද්‍යවරුන් කළමනාකරණය",
        adminPatients: "රෝගීන් කළමනාකරණය",
        adminAppointments: "සියලුම වේලාවන්",
        adminRevenue: "ආදායම් වාර්තා",
        adminFee: "ගාස්තු සංශෝධනය",
        doctorTitle: "වෛද්‍ය සේවා පුවරුව",
        docAvailability: "ලබාගත හැකි වේලාවන්",
        docQueue: "රෝගීන් ලැයිස්තුව",
        docPrescription: "ඩිජිටල් බෙහෙත් තුණ්ඩුව",
        docMessages: "වාර්තා උපදෙස්",
        chatbotHeader: "හෙළ ඔසු AI සෞඛ්‍ය සහායක",
        chatbotPlaceholder: "චැනලින් හෝ සෞඛ්‍ය ගැටලු පිළිබඳ විමසන්න...",
        footerCopy: "© 2026 හෙළ ඔසු චැනලින් පද්ධතිය. සියලුම හිමිකම් ඇවිරිණි."
    },
    ta: {
        brandName: "ஹெல ஒசு சேனலிங் முறைமை",
        tagline: "நம்பகமான மருத்துவர்கள் மற்றும் பாரம்பரிய ஆயுர்வேத வைத்தியத்துடன் இணைக்கவும்",
        navHome: "முகப்பு",
        navSearch: "மருத்துவர்களைத் தேடுங்கள்",
        navBookings: "எனது முன்பதிவுகள்",
        navConsultation: "அறிக்கை ஆலோசனை",
        navDoctorPortal: "மருத்துவர் தளம்",
        navAdminPortal: "நிர்வாகி தளம்",
        heroTitle: "இலங்கையின் முன்னணி மருத்துவர்கள் & ஆயுர்வேத நிபுணர்களை முன்பதிவு செய்யுங்கள்",
        heroSub: "உடனடி முன்பதிவு, மின்னணு ரசீதுகள், டிஜிட்டல் மருந்துக் சீட்டு மற்றும் ஆன்லைன் அறிக்கை ஆலோசனை.",
        btnSearchDoctor: "மருத்துவரைக் கண்டுபிடி",
        btnEmergencyCall: "அவசர அழைப்பு 1390",
        searchPlaceholder: "மருத்துவர் பெயர், மருத்துவமனை அல்லது நோயைத் தேடுங்கள்...",
        specAll: "அனைத்து சிறப்புகளும்",
        specAyurveda: "ஆயுர்வேதம் & பாரம்பரிய சிகிச்சை",
        specCardiology: "இதயவியல்",
        specPediatrics: "குழந்தை மருத்துவம்",
        specNeurology: "நரம்பியல்",
        specDermatology: "தோல் மருத்துவம்",
        cardFee: "சேனலிங் கட்டணம்",
        cardHospitalFee: "மருத்துவமனை கட்டணம்",
        cardBookNow: "முன்பதிவு செய்ய",
        cardViewProfile: "சுயவிவரம் பார்க்க",
        cardExperience: "அனுபவம்",
        cardRating: "மதிப்பீடு",
        modalBookTitle: "நேரத்தை முன்பதிவு செய்க",
        btnConfirmPayment: "பணம் செலுத்த தொடரவும்",
        adminTitle: "நிர்வாக டாஷ்போர்டு",
        adminDoctors: "மருத்துவர் நிர்வாகம்",
        adminPatients: "நோயாளி நிர்வாகம்",
        adminAppointments: "அனைத்து முன்பதிவுகள்",
        adminRevenue: "வருவாய் பகுப்பாய்வு",
        adminFee: "கட்டண மேலாண்மை",
        doctorTitle: "மருத்துவர் பணி இடம்",
        docAvailability: "நேரத்தை அமைக்கவும்",
        docQueue: "நோயாளி வரிசை",
        docPrescription: "டிஜிட்டல் மருந்துச்சீட்டு",
        docMessages: "அறிக்கை ஆலோசனைகள்",
        chatbotHeader: "ஹெல ஒசு AI சுகாதார உதவியாளர்",
        chatbotPlaceholder: "முன்பதிவு அல்லது கேள்விகளைத் கேட்கவும்...",
        footerCopy: "© 2026 ஹெல ஒசு சேனலிங் முறைமை. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை."
    }
};

class I18nEngine {
    constructor() {
        this.currentLang = localStorage.getItem('hela_osu_lang') || 'en';
    }

    setLanguage(lang) {
        if (TRANSLATIONS[lang]) {
            this.currentLang = lang;
            localStorage.setItem('hela_osu_lang', lang);
            this.applyTranslations();
        }
    }

    t(key) {
        return (TRANSLATIONS[this.currentLang] && TRANSLATIONS[this.currentLang][key]) ||
               (TRANSLATIONS['en'][key]) || key;
    }

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(elem => {
            const key = elem.getAttribute('data-i18n');
            const translation = this.t(key);
            if (elem.tagName === 'INPUT' && elem.hasAttribute('placeholder')) {
                elem.placeholder = translation;
            } else {
                elem.textContent = translation;
            }
        });
        document.documentElement.lang = this.currentLang;
        
        // Dispatch language change event for dynamic JS views
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.currentLang } }));
    }
}

window.i18n = new I18nEngine();
