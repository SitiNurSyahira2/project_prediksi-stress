"""
Router untuk autentikasi pengguna (login dan register)
"""
from fastapi import APIRouter, HTTPException, status
from schemas.auth_schema import UserRegister, UserLogin, UserResponse
from config.connection import get_connection
import bcrypt
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=dict)
def register_user(user_data: UserRegister):
    """
    Registrasi pengguna baru
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=400, 
                detail="Email sudah terdaftar"
            )
        
        # Hash password
        hashed_password = bcrypt.hashpw(
            user_data.password.encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # Insert new user
        cursor.execute(
            """
            INSERT INTO users (nama, email, password, role, tanggal_daftar)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, nama, email, role, tanggal_daftar
            """,
            (user_data.nama, user_data.email, hashed_password, 
             user_data.role or 'user', datetime.now())
        )
        
        new_user = cursor.fetchone()
        conn.commit()
        
        logger.info(f"✅ New user registered: {user_data.email}")
        
        return {
            "status": "success",
            "message": "Registrasi berhasil",
            "data": {
                "id": new_user['id'],
                "nama": new_user['nama'],
                "email": new_user['email'],
                "role": new_user['role'],
                "tanggal_daftar": new_user['tanggal_daftar'].isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Registration error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Terjadi kesalahan saat registrasi: {str(e)}"
        )

@router.post("/login", response_model=dict)
def login_user(login_data: UserLogin):
    """
    Login pengguna
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get user by email
        cursor.execute(
            "SELECT id, nama, email, password, role, is_active FROM users WHERE email = %s",
            (login_data.email,)
        )
        
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Email atau password salah"
            )
        
        # Extract user data using named access (RealDictCursor)
        user_id = user['id']
        user_nama = user['nama']
        user_email = user['email']
        user_password = user['password']
        user_role = user['role']
        user_is_active = user['is_active']
        
        # Check if user is active
        if not user_is_active:
            raise HTTPException(
                status_code=401,
                detail="Akun tidak aktif"
            )
        
        # Verify password
        if not bcrypt.checkpw(login_data.password.encode('utf-8'), user_password.encode('utf-8')):
            raise HTTPException(
                status_code=401,
                detail="Email atau password salah"
            )
        
        # Update last login
        cursor.execute(
            "UPDATE users SET last_login = %s WHERE id = %s",
            (datetime.now(), user_id)
        )
        conn.commit()
        
        logger.info(f"✅ User logged in: {login_data.email}")
        
        return {
            "status": "success",
            "message": "Login berhasil",
            "data": {
                "id": user_id,
                "nama": user_nama,
                "email": user_email,
                "role": user_role
            },
            # Note: In production, implement proper JWT token
            "access_token": f"dummy_token_{user_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Login error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat login: {str(e)}"
        )
