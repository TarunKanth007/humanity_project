"""
Clear All User Data and Sessions Script
This script clears all authentication sessions and optionally user data
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


async def clear_all_sessions():
    """Clear all user sessions"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Clear user sessions
        sessions_result = await db.user_sessions.delete_many({})
        print(f"✅ Cleared {sessions_result.deleted_count} user session(s)")
        
        # Verify sessions are cleared
        remaining_sessions = await db.user_sessions.count_documents({})
        print(f"📊 Remaining sessions: {remaining_sessions}")
        
        return sessions_result.deleted_count
        
    except Exception as e:
        print(f"❌ Error clearing sessions: {e}")
        return 0
    finally:
        client.close()


async def clear_all_users():
    """Clear all user data including profiles"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Clear users
        users_result = await db.users.delete_many({})
        print(f"✅ Cleared {users_result.deleted_count} user(s)")
        
        # Clear patient profiles
        patient_result = await db.patient_profiles.delete_many({})
        print(f"✅ Cleared {patient_result.deleted_count} patient profile(s)")
        
        # Clear researcher profiles
        researcher_result = await db.researcher_profiles.delete_many({})
        print(f"✅ Cleared {researcher_result.deleted_count} researcher profile(s)")
        
        # Clear AskCura conversations
        askcura_result = await db.askcura_conversations.delete_many({})
        print(f"✅ Cleared {askcura_result.deleted_count} AskCura conversation(s)")
        
        # Clear treatment comparisons
        treatment_result = await db.treatment_comparisons.delete_many({})
        print(f"✅ Cleared {treatment_result.deleted_count} treatment comparison(s)")
        
        # Clear protocol comparisons
        protocol_result = await db.protocol_comparisons.delete_many({})
        print(f"✅ Cleared {protocol_result.deleted_count} protocol comparison(s)")
        
        # Clear notifications
        notif_result = await db.notifications.delete_many({})
        print(f"✅ Cleared {notif_result.deleted_count} notification(s)")
        
        # Clear favorites
        fav_result = await db.favorites.delete_many({})
        print(f"✅ Cleared {fav_result.deleted_count} favorite(s)")
        
        # Clear chat rooms
        chat_result = await db.chat_rooms.delete_many({})
        print(f"✅ Cleared {chat_result.deleted_count} chat room(s)")
        
        # Clear messages
        msg_result = await db.messages.delete_many({})
        print(f"✅ Cleared {msg_result.deleted_count} message(s)")
        
        # Clear reviews
        review_result = await db.reviews.delete_many({})
        print(f"✅ Cleared {review_result.deleted_count} review(s)")
        
        # Clear appointments
        appt_result = await db.appointments.delete_many({})
        print(f"✅ Cleared {appt_result.deleted_count} appointment(s)")
        
        # Clear collaborations
        collab_result = await db.collaborations.delete_many({})
        print(f"✅ Cleared {collab_result.deleted_count} collaboration(s)")
        
        # Clear activity logs
        activity_result = await db.activity_logs.delete_many({})
        print(f"✅ Cleared {activity_result.deleted_count} activity log(s)")
        
        print("\n" + "="*60)
        print("🎉 ALL USER DATA CLEARED SUCCESSFULLY!")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error clearing user data: {e}")
        return False
    finally:
        client.close()


async def clear_sessions_only():
    """Clear only sessions, keep user data"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Clear user sessions
        sessions_result = await db.user_sessions.delete_many({})
        print(f"✅ Cleared {sessions_result.deleted_count} user session(s)")
        
        # Clear AskCura conversations (optional - contains chat history)
        askcura_result = await db.askcura_conversations.delete_many({})
        print(f"✅ Cleared {askcura_result.deleted_count} AskCura conversation(s)")
        
        print("\n" + "="*60)
        print("🎉 ALL SESSIONS CLEARED! Users will need to log in again.")
        print("📝 User profiles and data are preserved.")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error clearing sessions: {e}")
        return False
    finally:
        client.close()


async def main():
    """Main function with user choices"""
    print("="*60)
    print("🧹 CuraLink Data Clearing Utility")
    print("="*60)
    print(f"📍 Database: {DB_NAME}")
    print(f"🔗 MongoDB URL: {MONGO_URL}")
    print("="*60)
    print("\nChoose an option:")
    print("1. Clear ONLY login sessions (users stay, need to re-login)")
    print("2. Clear ALL user data (complete fresh start)")
    print("3. Exit")
    print("="*60)
    
    choice = input("\nEnter your choice (1/2/3): ").strip()
    
    if choice == "1":
        print("\n⚠️  This will log out all users. User data will be preserved.")
        confirm = input("Are you sure? (yes/no): ").strip().lower()
        if confirm == "yes":
            await clear_sessions_only()
        else:
            print("❌ Operation cancelled.")
    
    elif choice == "2":
        print("\n🚨 WARNING: This will DELETE ALL user data permanently!")
        print("This includes:")
        print("  - All user accounts")
        print("  - All patient and researcher profiles")
        print("  - All chat history")
        print("  - All favorites and reviews")
        print("  - All appointments and collaborations")
        print("  - ALL user-generated content")
        print("\n⚠️  This action CANNOT be undone!")
        confirm = input("\nType 'DELETE ALL DATA' to confirm: ").strip()
        if confirm == "DELETE ALL DATA":
            await clear_all_users()
            await clear_all_sessions()
        else:
            print("❌ Operation cancelled. Confirmation text didn't match.")
    
    elif choice == "3":
        print("👋 Exiting without making changes.")
    
    else:
        print("❌ Invalid choice. Exiting.")


if __name__ == "__main__":
    asyncio.run(main())
