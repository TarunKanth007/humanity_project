"""
Complete Database Reset Script
Clears ALL data from the database for a fresh start
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"


async def complete_reset():
    """Clear ALL data from database"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        print("="*60)
        print("🧹 COMPLETE DATABASE RESET")
        print("="*60)
        print(f"Database: {DB_NAME}")
        print("="*60)
        print("\n⚠️  This will DELETE ALL DATA permanently!")
        print("\nCollections to be cleared:")
        print("  - Users")
        print("  - Patient profiles")
        print("  - Researcher profiles")
        print("  - Sessions")
        print("  - AskCura conversations")
        print("  - Treatment/Protocol comparisons")
        print("  - Notifications")
        print("  - Favorites")
        print("  - Chat rooms & messages")
        print("  - Reviews")
        print("  - Appointments")
        print("  - Collaborations")
        print("  - Activity logs")
        print("  - Forums, Q&A, and all user-generated content")
        print("="*60)
        
        # Delete from all collections
        collections = [
            "users",
            "user_sessions",
            "patient_profiles",
            "researcher_profiles",
            "askcura_conversations",
            "treatment_comparisons",
            "protocol_comparisons",
            "notifications",
            "favorites",
            "chat_rooms",
            "messages",
            "reviews",
            "appointments",
            "collaborations",
            "collaboration_requests",
            "activity_logs",
            "forums",
            "forum_posts",
            "forum_members",
            "qa_questions",
            "qa_answers",
            "clinical_trials",
            "health_experts",
            "publications"
        ]
        
        total_deleted = 0
        
        for collection in collections:
            result = await db[collection].delete_many({})
            if result.deleted_count > 0:
                print(f"✅ {collection}: {result.deleted_count} documents deleted")
                total_deleted += result.deleted_count
        
        print("\n" + "="*60)
        print(f"🎉 RESET COMPLETE!")
        print(f"📊 Total documents deleted: {total_deleted}")
        print(f"🗄️ Database is now empty and ready for fresh start")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()


if __name__ == "__main__":
    print("\n⚠️  WARNING: This script will DELETE ALL DATA!\n")
    confirmation = input("Type 'YES DELETE EVERYTHING' to proceed: ")
    
    if confirmation == "YES DELETE EVERYTHING":
        asyncio.run(complete_reset())
    else:
        print("❌ Reset cancelled. No data was deleted.")
