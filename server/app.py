from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from twilio.rest import Client
import os
from dotenv import load_dotenv
import dateparser
import threading
import time
from datetime import datetime
import database

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
EMAIL_SENDER = os.getenv('EMAIL_SENDER')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

# Initialize DB
database.init_db()

def send_email_task(to_email, subject, body):
    print(f"[{datetime.now()}] Attempting to send EMAIL to {to_email}")
    if not EMAIL_SENDER or not EMAIL_PASSWORD or 'your_' in EMAIL_SENDER:
        print(f"[SIMULATION] Email would be sent to {to_email}")
        return
    
    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = EMAIL_SENDER
        msg['To'] = to_email

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, to_email, msg.as_string())
        print(f"[{datetime.now()}] EMAIL SENT successfully to {to_email}")
    except Exception as e:
        print(f"[{datetime.now()}] EMAIL FAILED: {e}")

def send_sms_task(to_phone, body):
    print(f"[{datetime.now()}] Attempting to send SMS to {to_phone}")
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or 'your_' in TWILIO_ACCOUNT_SID:
        print(f"[SIMULATION] SMS would be sent to {to_phone}")
        return

    try:
        # Basic number formatting check
        if not to_phone.startswith('+'):
            pass 

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=body,
            from_=TWILIO_PHONE_NUMBER,
            to=to_phone
        )
        print(f"[{datetime.now()}] SMS SENT successfully. SID: {message.sid}")
    except Exception as e:
        print(f"[{datetime.now()}] SMS FAILED: {e}")

# ==================== Background Scheduler ====================
def polling_scheduler():
    print("Scheduler Thread Started...")
    while True:
        try:
            pending = database.get_pending_appointments()
            now = datetime.now()
            
            for appt in pending:
                appt_time = datetime.fromisoformat(appt['time'])
                
                if appt_time <= now:
                    print(f"Triggering appointment {appt['id']}: {appt['subject']}")
                    
                    # Format time for display
                    readable_time = appt_time.strftime("%I:%M %p, %B %d")
                    msg_footer = f"\n\nDetails: {appt['subject']}\nTime: {readable_time}\n\n(Reminder from Appointment Bot)"
                    
                    # 1. Send Email
                    if appt['email_notif'] and appt['contact_email']:
                        send_email_task(appt['contact_email'], f"Reminder: {appt['subject']} 🔔", f"This is your scheduled reminder for {readable_time}." + msg_footer)

                    # 2. Send SMS
                    if appt['sms_notif'] and appt['contact_phone']:
                        send_sms_task(appt['contact_phone'], f"🔔 Reminder! {appt['subject']} at {readable_time}")
                    
                    # Mark as sent
                    database.update_status(appt['id'], 'sent')
                    
            time.sleep(10) # Check every 10 seconds
        except Exception as e:
            print(f"Scheduler Error: {e}")
            time.sleep(10)

# Start scheduler in background
# In a real production WSGI server, this needs careful handling. 
# For this simple flask run, daemon thread is fine.
scheduler_thread = threading.Thread(target=polling_scheduler, daemon=True)
scheduler_thread.start()

# ==================== API Endpoints ====================

@app.route('/api/schedule', methods=['POST'])
def schedule_appointment():
    data = request.json
    contact_info = data.get('contact', {})
    
    # Check for structured data from Subject Modal
    if data.get('is_structured'):
        subject = data.get('subject')
        date_str = data.get('date_str')
        user_message = f"{subject} on {date_str}" 
        dt = dateparser.parse(date_str, settings={'PREFER_DATES_FROM': 'future'})
        print(f"Received STRUCTURED request: Subject='{subject}', Date='{date_str}'")
    else:
        # Legacy/Chat-only flow
        user_message = data.get('message', '')
        print(f"Received natural language request: '{user_message}'")
        dt = dateparser.parse(user_message, settings={'PREFER_DATES_FROM': 'future'})
        subject = user_message

    delay = 0
    scheduled_time_str = "Immediate"
    
    if dt:
        now = datetime.now()
        if dt > now:
            delay = (dt - now).total_seconds()
            scheduled_time_str = dt.isoformat()
            
            # SAVE TO DB
            database.add_appointment(
                subject=subject,
                time_str=scheduled_time_str,
                contact_email=contact_info.get('email'),
                contact_phone=contact_info.get('phone'),
                email_notif=contact_info.get('emailNotif', False),
                sms_notif=contact_info.get('smsNotif', False)
            )
            
        else:
            print("Detected date is in the past, sending immediately.")
    else:
        print("No date detected, sending immediately.")

    # 2. Send Immediate Confirmation (Booking Receipt)
    print("Sending immediate confirmation...")
    
    if data.get('is_structured'):
        email_body = f"Subject: {subject}\nTime: {date_str}\n\nWe will remind you at the scheduled time."
        sms_body = f"✅ Booked: '{subject}' for {date_str}."
    else:
        email_body = f"You have scheduled: '{user_message}'\n\nWe will remind you at the scheduled time."
        sms_body = f"✅ Booked: '{user_message}'. We'll remind you at the time."

    if contact_info.get('email') and contact_info.get('emailNotif'):
        send_email_task(contact_info['email'], "Booking Confirmed ✅", email_body)
    
    if contact_info.get('phone') and contact_info.get('smsNotif'):
        send_sms_task(contact_info['phone'], sms_body)

    response_data = {
        "status": "success",
        "delay_seconds": delay,
        "scheduled_time": scheduled_time_str,
        "notifications": []
    }
    
    if contact_info.get('email') and contact_info.get('emailNotif'): response_data['notifications'].append('email')
    if contact_info.get('phone') and contact_info.get('smsNotif'): response_data['notifications'].append('sms')
    
    if not TWILIO_ACCOUNT_SID or 'your_' in TWILIO_ACCOUNT_SID:
        response_data['notifications'].append('sms_simulated')

    return jsonify(response_data)

@app.route('/api/appointments', methods=['GET'])
def get_appointments():
    # Allow filtering by email/phone via query params
    email = request.args.get('email')
    phone = request.args.get('phone')
    appointments = database.get_all_appointments(email, phone)
    return jsonify(appointments)

@app.route('/api/appointments/<int:appt_id>', methods=['DELETE'])
def delete_appointment(appt_id):
    deleted_appt = database.delete_appointment(appt_id)
    if deleted_appt:
        print(f"Appointment {appt_id} cancelled.")
        
        # Notify about cancellation
        subject = f"Cancellation: {deleted_appt['subject']}"
        body = f"You have successfully cancelled the appointment: '{deleted_appt['subject']}' scheduled for {deleted_appt['time']}."
        
        if deleted_appt['contact_email'] and deleted_appt['email_notif']:
            send_email_task(deleted_appt['contact_email'], subject, body)
            
        if deleted_appt['contact_phone'] and deleted_appt['sms_notif']:
            send_sms_task(deleted_appt['contact_phone'], f"❌ Cancelled: '{deleted_appt['subject']}'")

        return jsonify({"status": "success", "message": "Appointment cancelled"})
    else:
        return jsonify({"status": "error", "message": "Appointment not found"}), 404

@app.route('/api/appointments/<int:appt_id>', methods=['PUT'])
def update_appointment(appt_id):
    data = request.json
    subject = data.get('subject')
    date_str = data.get('date_str')
    
    # Parse new time
    dt = dateparser.parse(date_str, settings={'PREFER_DATES_FROM': 'future'})
    if not dt:
        return jsonify({"status": "error", "message": "Invalid date format"}), 400
        
    scheduled_time_str = dt.isoformat()
    
    database.update_appointment_details(appt_id, subject, scheduled_time_str)
    
    return jsonify({
        "status": "success", 
        "message": "Appointment updated",
        "new_time": scheduled_time_str
    })

if __name__ == '__main__':
    print("Server running on http://localhost:5000")
    print("Logs will appear here when requests come in.")
    app.run(debug=True)
