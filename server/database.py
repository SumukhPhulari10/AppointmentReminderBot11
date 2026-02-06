import sqlite3
import os
from datetime import datetime

DB_NAME = 'appointments.db'

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DB_NAME):
        print("Creating new database...")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create appointments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            time TEXT NOT NULL,
            contact_email TEXT,
            contact_phone TEXT,
            email_notif BOOLEAN,
            sms_notif BOOLEAN,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized.")

def add_appointment(subject, time_str, contact_email, contact_phone, email_notif, sms_notif):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO appointments (subject, time, contact_email, contact_phone, email_notif, sms_notif)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (subject, time_str, contact_email, contact_phone, email_notif, sms_notif))
    conn.commit()
    appt_id = cursor.lastrowid
    conn.close()
    return appt_id

def get_all_appointments(email=None, phone=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM appointments WHERE status != 'cancelled'"
    params = []
    
    # Filter by user if provided (simple privacy/filtering)
    if email or phone:
        query += " AND (contact_email = ? OR contact_phone = ?)"
        params.extend([email, phone])
        
    query += " ORDER BY time ASC"
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_pending_appointments():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM appointments WHERE status = 'pending'")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_status(appt_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE appointments SET status = ? WHERE id = ?", (status, appt_id))
    conn.commit()
    conn.close()

def delete_appointment(appt_id):
    # Soft delete (mark as cancelled) or Hard delete?
    # Requirement: "he must just get for you deleted this appointment" -> Implying we need to know who to notify.
    # So we'll fetch it first, then maybe mark as cancelled.
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    row = cursor.fetchone()
    
    if row:
        cursor.execute("UPDATE appointments SET status = 'cancelled' WHERE id = ?", (appt_id,))
        conn.commit()
        conn.close()
        return dict(row)
    
    conn.close()
    return None

def update_appointment_details(appt_id, new_subject, new_time):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE appointments 
        SET subject = ?, time = ?, status = 'pending'
        WHERE id = ?
    ''', (new_subject, new_time, appt_id))
    conn.commit()
    conn.close()
