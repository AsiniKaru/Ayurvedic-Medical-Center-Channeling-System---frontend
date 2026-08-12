/**
 * Hela Osu Channeling System - Interactive AI Assistant Chatbot
 */

class ChatbotWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [
            { sender: 'bot', text: 'Ayubowan! 🌿 I am your Hela Osu Weda Gedara Assistant. How can I help you find a doctor or book an appointment at our centers?' }
        ];
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const box = document.getElementById('chatbotBox');
        if (box) {
            box.classList.toggle('active', this.isOpen);
        }
        if (this.isOpen) {
            this.renderMessages();
        }
    }

    renderMessages() {
        const container = document.getElementById('chatMessagesContainer');
        if (!container) return;

        container.innerHTML = this.messages.map(msg => `
            <div class="chat-msg ${msg.sender}">
                ${msg.text}
            </div>
        `).join('');

        container.scrollTop = container.scrollHeight;
    }

    sendMessage(userText) {
        if (!userText.trim()) return;

        this.messages.push({ sender: 'user', text: userText });
        this.renderMessages();

        setTimeout(() => {
            const reply = this.generateResponse(userText.toLowerCase());
            this.messages.push({ sender: 'bot', text: reply });
            this.renderMessages();
        }, 600);
    }

    generateResponse(query) {
        const data = window.dbStore.get();
        const docs = data.doctors.filter(d => d.hospital.includes('Hela Osu Weda Gedara'));

        if (query.includes('hello') || query.includes('ayubowan') || query.includes('hi')) {
            return 'Ayubowan! You can channel our Wedamahatayas across Colombo, Kandy, Galle, Kurunegala, and Gampaha branches!';
        }

        if (query.includes('ayurveda') || query.includes('weda') || query.includes('herb')) {
            return `Dr. Deshabandu Wickramasinghe (Colombo 07) and Dr. Anura Jayawardena (Kandy) are available for Ayurvedic consultations!`;
        }

        if (query.includes('cancel') || query.includes('reschedule')) {
            return 'To cancel or reschedule an appointment, log in as a Patient and open "My Bookings" tab.';
        }

        if (query.includes('payment') || query.includes('fee')) {
            return 'We accept Visa/Mastercard credit card checkout and cash/card payment directly at Hela Osu clinic counters.';
        }

        return `We have ${docs.length} active Wedamahatayas across Hela Osu Weda Gedara centers! Select a doctor from the home screen to book your slot.`;
    }
}

window.chatbot = new ChatbotWidget();
