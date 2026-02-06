// ==================== DOM Elements ====================
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const datePickerBtn = document.getElementById('datePickerBtn');
const timePickerBtn = document.getElementById('timePickerBtn');
const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');

// ==================== Initialize Chat ====================
document.addEventListener('DOMContentLoaded', () => {
    // Display welcome message on load
    addBotMessage("Hello! 👋 I'm your Appointment Reminder Bot. I can help you schedule appointments, set reminders, and manage your calendar. How can I assist you today?");

    // Focus on input field
    userInput.focus();

    // ==================== Event Listeners ====================
    sendButton.addEventListener('click', handleSendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Date picker button (Native)
    datePickerBtn.addEventListener('click', () => {
        try {
            dateInput.showPicker();
        } catch (error) {
            dateInput.click();
        }
    });

    // State for structured scheduling
    let tempDate = null;
    let tempTime = null;

    dateInput.addEventListener('input', (e) => {
        const selectedDate = e.target.value;
        if (selectedDate) {
            tempDate = formatDate(selectedDate);
            // FIX: Clear value immediately so selecting the same date again triggers 'input'
            e.target.value = '';
            checkAndTriggerSubjectModal();
        }
    });

    // ==================== Custom Time Picker Logic ====================
    let currentHour = 12;
    let currentMinute = "00";
    let currentAmpm = "AM";
    const timePickerModal = document.getElementById('timePickerModal');

    // Open Time Picker
    timePickerBtn.addEventListener('click', () => {
        initializeTimePicker();
        timePickerModal.classList.add('show');
    });

    // Close Time Picker
    document.getElementById('closeTimePicker').addEventListener('click', () => {
        timePickerModal.classList.remove('show');
    });

    // Close on click outside
    timePickerModal.addEventListener('click', (e) => {
        if (e.target === timePickerModal) {
            timePickerModal.classList.remove('show');
        }
    });

    // Initialize Hours and Minutes
    function initializeTimePicker() {
        const hourList = document.getElementById('hourList');
        const minuteList = document.getElementById('minuteList');

        // Populate Hours (1-12)
        hourList.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            const div = document.createElement('div');
            div.className = `time-option ${i === currentHour ? 'selected' : ''}`;
            div.textContent = i;
            div.onclick = () => selectHour(i, div);
            hourList.appendChild(div);
        }

        // Populate Minutes (00-59)
        minuteList.innerHTML = '';
        for (let i = 0; i < 60; i++) {
            const min = i.toString().padStart(2, '0');
            const div = document.createElement('div');
            div.className = `time-option ${min === currentMinute ? 'selected' : ''}`;
            div.textContent = min;
            div.onclick = () => selectMinute(min, div);
            minuteList.appendChild(div);
        }

        updateTimeDisplay();
    }

    function selectHour(hour, element) {
        currentHour = hour;
        document.querySelectorAll('#hourList .time-option').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        updateTimeDisplay();
    }

    function selectMinute(minute, element) {
        currentMinute = minute;
        document.querySelectorAll('#minuteList .time-option').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        updateTimeDisplay();
    }

    // AM/PM Toggles
    document.getElementById('amBtn').addEventListener('click', () => {
        currentAmpm = "AM";
        document.getElementById('amBtn').classList.add('active');
        document.getElementById('pmBtn').classList.remove('active');
        updateTimeDisplay();
    });

    document.getElementById('pmBtn').addEventListener('click', () => {
        currentAmpm = "PM";
        document.getElementById('pmBtn').classList.add('active');
        document.getElementById('amBtn').classList.remove('active');
        updateTimeDisplay();
    });

    function updateTimeDisplay() {
        document.getElementById('selectedHour').textContent = currentHour;
        document.getElementById('selectedMinute').textContent = currentMinute;
    }

    // Confirm Selection
    document.getElementById('confirmTimeBtn').addEventListener('click', () => {
        tempTime = `${currentHour}:${currentMinute} ${currentAmpm}`;
        timePickerModal.classList.remove('show');
        checkAndTriggerSubjectModal();
    });

    // ==================== Subject Modal Logic ====================
    const subjectModal = document.getElementById('subjectModal');
    const closeSubjectBtn = document.getElementById('closeSubjectBtn');
    const confirmSubjectBtn = document.getElementById('confirmSubjectBtn');
    const subjectInput = document.getElementById('subjectInput');

    function checkAndTriggerSubjectModal() {
        if (tempDate && tempTime) {
            // Both selected, pop the modal.
            subjectModal.classList.add('show');
            subjectInput.focus();
        } else {
            // Visual feedback
            let parts = [];
            if (tempDate) parts.push(`📅 Date: ${tempDate}`);
            if (tempTime) parts.push(`⏰ Time: ${tempTime}`);

            userInput.value = parts.join(" | ") + " ... (Select " + (tempDate ? "Time" : "Date") + ")";
        }
    }

    closeSubjectBtn.addEventListener('click', () => {
        subjectModal.classList.remove('show');
        // Reset state or keep it? Let's keep it in case they re-open?
        // Maybe reset to allow strictly starting over.
        tempDate = null;
        tempTime = null;
        userInput.placeholder = "Type your appointment request...";
        userInput.value = ''; // FIX: Clear the "📅 Date: ..." feedback
    });

    confirmSubjectBtn.addEventListener('click', () => {
        const subject = subjectInput.value.trim();
        if (!subject) {
            alert("Please enter a subject!");
            return;
        }

        subjectModal.classList.remove('show');
        handleStructuredSchedule(subject, tempDate, tempTime);

        // Reset
        tempDate = null;
        tempTime = null;
        subjectInput.value = '';
        dateInput.value = ''; // FIX: Allow re-selection of same date
        userInput.value = ''; // Ensure input is clear
        userInput.placeholder = "Type your appointment request...";
    });

    // ==================== Settings Modal Logic ====================
    const settingsModal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    // Inputs
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userPhoneInput = document.getElementById('userPhone');
    const emailNotifCheck = document.getElementById('emailNotif');
    const smsNotifCheck = document.getElementById('smsNotif');

    // Load saved settings
    loadSettings();

    settingsBtn.addEventListener('click', () => {
        loadSettings(); // Refresh in case it changed elsewhere
        settingsModal.classList.add('show');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('show');
    });

    saveSettingsBtn.addEventListener('click', () => {
        saveSettings();
        settingsModal.classList.remove('show');
        console.log("Settings saved!");
    });

    // Close on click outside (shared with time picker logic if generalized, but handled separately here for simplicity)
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });

    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('aptBotSettings')) || {};
        userNameInput.value = settings.name || '';
        userEmailInput.value = settings.email || '';
        userPhoneInput.value = settings.phone || '';
        if (settings.emailNotif !== undefined) emailNotifCheck.checked = settings.emailNotif;
        if (settings.smsNotif !== undefined) smsNotifCheck.checked = settings.smsNotif;
    }

    function saveSettings() {
        const settings = {
            name: userNameInput.value,
            email: userEmailInput.value,
            phone: userPhoneInput.value,
            emailNotif: emailNotifCheck.checked,
            smsNotif: smsNotifCheck.checked
        };
        localStorage.setItem('aptBotSettings', JSON.stringify(settings));
    }

    // ==================== My Appointments Logic ====================
    const myAppointmentsBtn = document.getElementById('myAppointmentsBtn');
    const appointmentsModal = document.getElementById('appointmentsModal');
    const closeAppointmentsBtn = document.getElementById('closeAppointmentsBtn');
    const appointmentsList = document.getElementById('appointmentsList');

    // Edit Modal Elements
    const editModal = document.getElementById('editModal');
    const closeEditBtn = document.getElementById('closeEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const editSubjectInput = document.getElementById('editSubject');
    const editDateInput = document.getElementById('editDateStr');
    const editApptIdInput = document.getElementById('editApptId');

    if (myAppointmentsBtn) {
        myAppointmentsBtn.addEventListener('click', () => {
            loadAppointments();
            appointmentsModal.classList.add('show');
        });
    }

    if (closeAppointmentsBtn) {
        closeAppointmentsBtn.addEventListener('click', () => {
            appointmentsModal.classList.remove('show');
        });
    }

    if (appointmentsModal) {
        appointmentsModal.addEventListener('click', (e) => {
            if (e.target === appointmentsModal) appointmentsModal.classList.remove('show');
        });
    }

    // Edit Modal Listeners
    if (closeEditBtn) closeEditBtn.addEventListener('click', () => editModal.classList.remove('show'));
    if (saveEditBtn) saveEditBtn.addEventListener('click', saveAppointmentUpdate);

    async function loadAppointments() {
        const settings = JSON.parse(localStorage.getItem('aptBotSettings')) || {};
        // If no contact info, warn but let them see purely local if we had local?
        // Actually our DB depends on contact info for filtering mostly, or we show all if simplistic.
        // Let's filter by contact info to be "secure".
        if (!settings.email && !settings.phone) {
            appointmentsList.innerHTML = '<div class="empty-state">Please save your Email or Phone in Settings ⚙️ to view appointments.</div>';
            return;
        }

        appointmentsList.innerHTML = '<div class="empty-state">Loading...</div>';

        try {
            // Build query
            const params = new URLSearchParams();
            if (settings.email) params.append('email', settings.email);
            if (settings.phone) params.append('phone', settings.phone);

            const res = await fetch(`http://localhost:5000/api/appointments?${params.toString()}`);
            const appointments = await res.json();

            renderAppointments(appointments);
        } catch (error) {
            console.error("Fetch error:", error);
            appointmentsList.innerHTML = '<div class="empty-state">Failed to load appointments. Is the server running?</div>';
        }
    }

    function renderAppointments(appointments) {
        if (appointments.length === 0) {
            appointmentsList.innerHTML = '<div class="empty-state">No upcoming appointments found.</div>';
            return;
        }

        appointmentsList.innerHTML = '';
        appointments.forEach(appt => {
            const dateObj = new Date(appt.time);
            const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const item = document.createElement('div');
            item.className = 'appointment-item';
            item.innerHTML = `
                <div class="appointment-details">
                    <h4>${escapeHtml(appt.subject)}</h4>
                    <p>📅 ${dateStr}</p>
                </div>
                <div class="item-actions">
                    <button class="action-icon-btn edit-btn" onclick="openEditModal(${appt.id}, '${escapeHtml(appt.subject)}', '${escapeHtml(dateStr)}')" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                    <button class="action-icon-btn delete-btn" onclick="deleteAppointment(${appt.id})" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                    </button>
                </div>
            `;
            appointmentsList.appendChild(item);
        });
    }

    // Expose these to global scope because standard onclick="" needs them
    window.deleteAppointment = async (id) => {
        if (!confirm("Are you sure you want to cancel this appointment?")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/appointments/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.status === 'success') {
                loadAppointments(); // Refresh list
                addBotMessage(`🗑️ Appointment cancelled.`);
            } else {
                alert("Failed to delete: " + data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to server.");
        }
    };

    window.openEditModal = (id, subject, dateStr) => {
        editApptIdInput.value = id;
        editSubjectInput.value = subject;
        editDateInput.value = dateStr;
        editModal.classList.add('show');
    };

    async function saveAppointmentUpdate() {
        const id = editApptIdInput.value;
        const subject = editSubjectInput.value;
        const dateStr = editDateInput.value;

        if (!subject || !dateStr) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, date_str: dateStr })
            });
            const data = await res.json();

            if (data.status === 'success') {
                editModal.classList.remove('show');
                loadAppointments(); // Refresh list
                addBotMessage(`✏️ Appointment updated: "${subject}" is now set for ${new Date(data.new_time).toLocaleString()}`);
            } else {
                alert("Failed to update: " + data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to server.");
        }
    }
});

// ==================== Message Handling ====================
function handleSendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;

    // Standard flow (text only)
    processUserMessage(message);
}

function handleStructuredSchedule(subject, date, time) {
    const fullMessage = `${subject} on ${date} at ${time}`;
    processUserMessage(fullMessage, { subject, date, time });
}

function processUserMessage(message, structuredData = null) {
    // Add user message
    addUserMessage(message);

    // Clear input
    userInput.value = '';

    // Disable send button
    sendButton.disabled = true;

    // Show typing indicator
    showTypingIndicator();

    // Simulate bot response
    setTimeout(() => {
        removeTypingIndicator();
        const botResponse = generateBotResponse(message, structuredData);
        addBotMessage(botResponse);
        sendButton.disabled = false;
        userInput.focus();
    }, 1000);
}

// ==================== Add Messages ====================
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';

    messageDiv.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
            </svg>
        </div>
        <div class="message-content">${escapeHtml(text)}</div>
    `;

    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addBotMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';

    messageDiv.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
            </svg>
        </div>
        <div class="message-content">${escapeHtml(text)}</div>
    `;

    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// ==================== Typing Indicator ====================
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';

    typingDiv.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
            </svg>
        </div>
        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// ==================== Backend Integration ====================
async function scheduleRealReminderStructured(data, settings) {
    if (!settings.email && !settings.phone) return;
    console.log("Connecting to backend (Structured)...");

    try {
        const response = await fetch('http://localhost:5000/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: data.subject,
                date_str: `${data.date} ${data.time}`,
                contact: settings,
                is_structured: true
            })
        });

        const resData = await response.json();
        console.log("Backend Response:", resData);
        // ... (Optional: Handle specific feedback if needed, currently generic success is fine)
        if (resData.delay_seconds > 0) {
            setTimeout(() => {
                showReminderPopup(data.subject);
            }, resData.delay_seconds * 1000);
        } else {
            showReminderPopup(data.subject);
        }

    } catch (error) {
        console.error('Backend Error:', error);
        addBotMessage("⚠️ Note: I couldn't connect to the notification server. (Make sure 'server/app.py' is running!)");
    }
}

async function scheduleRealReminder(message, settings) {
    // Only proceed if we have at least one contact method
    if (!settings.email && !settings.phone) return;

    console.log("Connecting to backend...");

    try {
        const response = await fetch('http://localhost:5000/api/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                contact: settings
            })
        });

        const data = await response.json();
        console.log("Backend Response:", data);

        let feedback = "✅ **Confirmed!** ";

        // Format the time nicely
        if (data.scheduled_time && data.scheduled_time !== "Immediate") {
            feedback += `\n\n🕒 **Timer Set:** I'll verify this at: ${new Date(data.scheduled_time).toLocaleTimeString()}`;

            // Schedule Frontend Popup to match Backend
            if (data.delay_seconds > 0) {
                console.log(`Setting browser popup in ${data.delay_seconds} seconds`);
                setTimeout(() => {
                    showReminderPopup(message);
                }, data.delay_seconds * 1000);
            } else {
                showReminderPopup(message);
            }

        } else {
            feedback += "\n\n(Sending notification immediately...)";
            showReminderPopup(message);
        }

        if (data.notifications.includes('email')) feedback += "\n📧 Email queued.";
        if (data.notifications.includes('sms')) feedback += "\n📱 SMS queued.";

        if (data.notifications.includes('sms_simulated')) {
            feedback += "\n\n⚠️ **SMS Warning**: 'server/.env' keys are missing. Logs are in the server console.";
        }

        // Show feedback in chat
        addBotMessage(feedback);

    } catch (error) {
        console.error('Backend Error:', error);
        addBotMessage("⚠️ Note: I couldn't connect to the notification server. (Make sure 'server/app.py' is running!)");
    }
}

// ==================== Bot Response Logic ====================
function generateBotResponse(userMessage, structuredData = null) {
    const message = userMessage.toLowerCase();

    // Check Date/Time logic (existing regex or explicit data)
    const hasTime = /\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/i.test(message);
    const hasDate = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\b|\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\b(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i.test(message);

    if (structuredData || hasTime || hasDate) {
        // Get user details
        const settings = JSON.parse(localStorage.getItem('aptBotSettings')) || {};

        // TRIGGER BACKEND
        // Pass structured data if available
        if (structuredData) {
            scheduleRealReminderStructured(structuredData, settings);
        } else {
            scheduleRealReminder(userMessage, settings);
        }

        let confirmMsg = `✅ **Scheduled!**\n\n`;

        if (structuredData) {
            confirmMsg += `**Subject:** ${structuredData.subject}\n**Time:** ${structuredData.date} at ${structuredData.time}`;
        } else {
            confirmMsg += `I've added this to your calendar:\n"${userMessage}"`;
        }

        let extras = [];
        if (settings.email && settings.emailNotif) {
            extras.push(`📧 Confirmation sent to **${settings.email}**`);
        }
        if (settings.phone && settings.smsNotif) {
            extras.push(`📱 SMS reminder set for **${settings.phone}**`);
        }

        if (extras.length > 0) {
            confirmMsg += `\n\n${extras.join('\n')}`;
        } else if (!settings.email && !settings.phone) {
            confirmMsg += `\n\n💡 *Tip: Click the Settings gear ⚙️ to add your email/phone for reminders!*`;
        }

        return confirmMsg;
    }

    if (message.includes('appointment') || message.includes('schedule') || message.includes('book') || message.includes('meeting')) {
        return "I'd be happy to help you schedule an appointment! Could you please provide the following details:\n\n• Date and time\n• Type of appointment\n• Any specific preferences?";
    }

    if (message.includes('reminder') || message.includes('remind')) {
        return "Sure! I can set up a reminder for you. Please tell me:\n\n• What should I remind you about?\n• When would you like to be reminded?";
    }

    if (message.includes('cancel') || message.includes('delete')) {
        return "I can help you cancel an appointment. Could you please specify which appointment you'd like to cancel? You can provide the date or appointment ID.";
    }

    if (message.includes('view') || message.includes('show') || message.includes('list')) {
        return "Here are your upcoming appointments:\n\n📅 Tomorrow, 2:00 PM - Doctor's Appointment\n📅 Friday, 10:00 AM - Team Meeting\n📅 Next Monday, 3:30 PM - Dentist\n\nWould you like to modify any of these?";
    }

    if (message.includes('help') || message.includes('what can you do')) {
        return "I can help you with:\n\n✅ Scheduling new appointments\n✅ Setting reminders\n✅ Viewing your calendar\n✅ Canceling or rescheduling appointments\n✅ Sending notifications\n\nJust let me know what you need!";
    }

    if (message.includes('thank') || message.includes('thanks')) {
        return "You're welcome! 😊 Is there anything else I can help you with?";
    }

    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        return "Hello! How can I assist you with your appointments today?";
    }

    // Default response
    return "I understand you're asking about: \"" + userMessage + "\"\n\nCould you provide more details? I can help you schedule appointments, set reminders, or manage your calendar.";
}

// ==================== Reminder Logic ====================
function scheduleDemoReminder(details) {
    console.log("Scheduling reminder for:", details);
    setTimeout(() => {
        showReminderPopup(details);
    }, 10000); // 10 seconds delay for demo
}

function showReminderPopup(details) {
    if (Notification.permission === "granted") {
        new Notification("Appointment Reminder! 🔔", {
            body: `Upcoming: ${details}`,
            icon: "https://cdn-icons-png.flaticon.com/512/3239/3239958.png"
        });
    }
    addBotMessage(`🔔 **REMINDER!**\n\nYou have an upcoming appointment:\n"${details}"\n\nDon't be late!`);
}

if ("Notification" in window) {
    Notification.requestPermission();
}

// ==================== Utility Functions ====================
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function insertIntoInput(text) {
    const currentValue = userInput.value.trim();
    if (currentValue) {
        userInput.value = currentValue + ' ' + text;
    } else {
        userInput.value = text;
    }
    userInput.focus();
}


// ==================== Optional: Backend Integration ====================
// Uncomment and modify this function to connect to your backend API

/*
async function sendMessageToBackend(message) {
    try {
        const response = await fetch('YOUR_API_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error:', error);
        return "Sorry, I'm having trouble connecting right now. Please try again later.";
    }
}

// Then modify handleSendMessage to use this function:
// const botResponse = await sendMessageToBackend(message);
*/
