import psycopg2
from psycopg2.extras import RealDictCursor
from config.settings import settings
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_connection():
    """Membuat koneksi ke database PostgreSQL"""
    try:
        connection = psycopg2.connect(
            host=settings.DATABASE_HOST,
            port=settings.DATABASE_PORT,
            database=settings.DATABASE_NAME,
            user=settings.DATABASE_USER,
            password=settings.DATABASE_PASSWORD,
            cursor_factory=RealDictCursor
        )
        return connection
    except psycopg2.Error as e:
        logger.error(f"Database connection error: {e}")
        raise Exception(f"Failed to connect to database: {e}")

def test_connection():
    """Test koneksi database"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        cursor.close()
        conn.close()
        logger.info(f"Database connected successfully. Version: {version}")
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False
