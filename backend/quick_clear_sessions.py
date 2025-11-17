"""
Quick Session Clear Script
Clears all user sessions without prompts
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


async def clear_sessions():
    """Clear all user sessions"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        print("🧹 Clearing all user sessions...")
        
        # Clear user sessions
        sessions_result = await db.user_sessions.delete_many({})
        print(f"✅ Cleared {sessions_result.deleted_count} user session(s)")
        
        # Verify sessions are cleared
        remaining_sessions = await db.user_sessions.count_documents({})
        print(f"📊 Remaining sessions: {remaining_sessions}")
        
        if remaining_sessions == 0:
            print("\n🎉 All sessions cleared successfully!")
            print("🔓 All users have been logged out.")
            print("👤 Users will need to log in again to access the application.")
        
    except Exception as e:
        print(f"❌ Error clearing sessions: {e}")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(clear_sessions())
