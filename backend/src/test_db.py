"""
Simple test for database save issue
"""
import sys
import os
from pathlib import Path

# Add project root and src to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(project_root / '.env')

from config.connection import get_connection
from datetime import date
import logging

logger = logging.getLogger(__name__)

def test_database_insert():
    """Test database insert untuk debug masalah"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Test user exists or create default user
        cursor.execute("SELECT id FROM users WHERE id = 1")
        user_result = cursor.fetchone()
        
        if not user_result:
            logger.info("Creating default user...")
            cursor.execute("""
                INSERT INTO users (nama, email, password, role) 
                VALUES (%s, %s, %s, %s) 
                RETURNING id
            """, ("Test User", "test@relaxaid.com", "hashed_password", "user"))
            user_result = cursor.fetchone()
            conn.commit()
            logger.info(f"Created user with ID: {user_result['id']}")
        
        user_id = user_result['id'] if user_result else 1
        
        # Test digital activity insert
        logger.info("Testing digital activity insert...")
        cursor.execute("""
            INSERT INTO digital_activities (
                user_id, tanggal, screen_time_total, durasi_pemakaian, frekuensi_penggunaan,
                jumlah_aplikasi, notifikasi_count, durasi_tidur, durasi_makan, durasi_olahraga,
                main_game, belajar_online, buka_sosmed, streaming, scroll_time, email_time,
                panggilan_time, waktu_pagi, waktu_siang, waktu_sore, waktu_malam, jumlah_aktivitas
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, date.today(), 5.0, 5.0, 70.0, 10, 60, 7.0, 1.2, 1.0,
            2.0, 2.0, 3.0, 1.5, 2.5, 0.7, 0.5, 1, 1, 0, 1, 12
        ))
        
        activity_result = cursor.fetchone()
        if not activity_result:
            raise Exception("Failed to insert digital activity")
            
        digital_activity_id = activity_result['id']
        logger.info(f"Created digital activity with ID: {digital_activity_id}")
        
        # Test prediction insert
        logger.info("Testing prediction insert...")
        cursor.execute("""
            INSERT INTO predictions (
                user_id, digital_activity_id, predicted_stress_level, confidence_score,
                probability_rendah, probability_sedang, probability_tinggi, model_version
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, digital_activity_id, "Tinggi", 0.85, 0.1, 0.05, 0.85, "1.0.0"
        ))
        
        prediction_result = cursor.fetchone()
        if not prediction_result:
            raise Exception("Failed to insert prediction")
            
        prediction_id = prediction_result['id']
        
        conn.commit()
        logger.info(f"✅ Database test successful! Prediction ID: {prediction_id}")
        
        cursor.close()
        conn.close()
        return prediction_id
        
    except Exception as e:
        logger.error(f"❌ Database test failed: {str(e)}")
        logger.error(f"Exception type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        try:
            if conn:
                conn.rollback()
        except:
            pass
        try:
            if cursor:
                cursor.close()
        except:
            pass
        try:
            if conn:
                conn.close()
        except:
            pass
        return None

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    test_database_insert()
