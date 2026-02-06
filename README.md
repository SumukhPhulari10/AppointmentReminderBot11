
# Appointment Reminder Bot 🤖📅

A smart, interactive chatbot interface for scheduling appointments, setting reminders, and managing your personal calendar. It uses natural language processing to understand dates and times, creates persistent records in a database, and sends real-time notifications via Email and SMS.

## 🌟 Features

*   **Interactive Chat Interface**: A clean, modern UI for natural conversation.
*   **Smart Scheduling**: Recognizes phrases like "tomorrow at 3pm" or "next Friday" automatically.
*   **Structured Input**: Custom-built Date/Time pickers and Subject Selection modals for precision.
*   **Persistent Storage**: All appointments are saved in a robust **SQLite database** (`appointments.db`), so you never lose data even if the server restarts.
*   **Appointment Management (CRUD)**:
    *   **View**: See a list of all upcoming appointments.
    *   **Edit**: Reschedule or rename appointments.
    *   **Delete**: Cancel appointments instantly.
*   **Reliable Notifications**:
    *   **Background Scheduler**: A dedicated background thread monitors your database 24/7.
    *   **Real-time Alerts**: Sends Email (SMTP) and SMS (Twilio) reminders exactly when appointments are due.

## 🛠️ "The Theory" - How It Works

This project follows a **Client-Server Architecture**:

1.  **Frontend (The Client)**:
    *   Built with **HTML5, CSS3, and Vanilla JavaScript**.
    *   Handles user interactions, displays the chat interface, and manages the custom modals (Date Picker, Time Picker).
    *   Communicates with the backend using **REST API** calls (`fetch`).

2.  **Backend (The Server)**:
    *   Built with **Python & Flask**.
    *   **API Layer**: Receives requests to Schedule (`POST`), List (`GET`), Update (`PUT`), or Delete (`DELETE`) appointments.
    *   **Logic Layer**: Uses `dateparser` to convert natural text into actionable datetime objects.

3.  **The Brain (Scheduler & Database)**:
    *   **SQLite**: Serves as the single source of truth. It stores appointment details, contact info, and notification status.
    *   **Polling Loop**: A background thread runs infinitely on the server.
        *   *Every 10 seconds*, it queries the database: *"Are there any appointments due right now that haven't been notified yet?"*
        *   If **Yes**: It triggers the Email/SMS function and marks the appointment as `sent`.
        *   If **No**: It sleeps and waits for the next check.
    *   This ensures high reliability—even if you schedule something for 3 months from now, the bot will remember.

## 🚀 How to Run

### 1. Prerequisites
Ensure you have Python installed. Then install the required libraries:
```bash
pip install flask flask-cors twilio python-dotenv dateparser
```

### 2. Configure Environment
Create a `.env` file in the `server/` folder with your credentials:
```env
EMAIL_SENDER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### 3. Start the Server
Navigate to the server directory and run the app:
```bash
cd server
python app.py
```
*You will see "Scheduler Thread Started..." indicating the bot is alive.*

### 4. Application
Open `index.html` in your browser.
*   **Type**: "Remind me to call John tomorrow at 5pm"
*   **Click**: Use the "Date" or "Time" buttons for precise control.
*   **Manage**: Click the "Appointments" button to view your schedule.

---
*Created for the Advanced Coding Project.*
