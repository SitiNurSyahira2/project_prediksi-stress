import bcrypt
from config.connection import get_connection
from schemas.auth_schema import UserRegister, UserLogin
from datetime import datetime
import secrets

def hash_password(password: str) -> str:
    """Hash password dengan bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password dengan hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def get_user_by_email(email: str):
    """Ambil user berdasarkan email"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, nama, email, password FROM pengguna WHERE email = %s", (email,))
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if user:
        return {
            "id": user[0],
            "nama": user[1],
            "email": user[2],
            "password": user[3]
        }
    return None

def register_user(user_data: UserRegister):
    """Registrasi user baru"""
    # Check if user already exists
    existing_user = get_user_by_email(user_data.email)
    if existing_user:
        raise ValueError("Email sudah terdaftar")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Insert to database
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO pengguna (nama, email, password, tanggal_daftar) VALUES (%s, %s, %s, %s) RETURNING id, nama, email",
        (user_data.nama, user_data.email, hashed_password, datetime.now())
    )
    new_user = cursor.fetchone()
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        "id": new_user[0],
        "nama": new_user[1],
        "email": new_user[2]
    }

def login_user(login_data: UserLogin):
    """Login user"""
    user = get_user_by_email(login_data.email)
    if not user:
        raise ValueError("Email tidak ditemukan")
    
    if not verify_password(login_data.password, user["password"]):
        raise ValueError("Password salah")
    
    # Generate access token (simple token for now)
    access_token = secrets.token_urlsafe(32)
    
    return {
        "user": {
            "id": user["id"],
            "nama": user["nama"],
            "email": user["email"]
        },
        "access_token": access_token
    }
