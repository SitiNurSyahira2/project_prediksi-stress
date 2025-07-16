"""
Script to check users in database
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
import logging

logger = logging.getLogger(__name__)

def check_users():
    """Check users in database"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get all users
        cursor.execute("SELECT id, nama, email, password, role, is_active FROM users")
        users = cursor.fetchall()
        
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"ID: {user['id']}")
            print(f"Name: {user['nama']}")
            print(f"Email: {user['email']}")
            print(f"Password (first 20 chars): {user['password'][:20]}")
            print(f"Role: {user['role']}")
            print(f"Active: {user['is_active']}")
            print("-" * 40)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"Error checking users: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    check_users()
