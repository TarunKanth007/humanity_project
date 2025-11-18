"""
Background tasks for forum operations
Handles async operations that don't need to block API responses
"""
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any

logger = logging.getLogger(__name__)


async def invalidate_forum_caches(forums_cache_ref, forums_cache_time_ref):
    """
    Invalidate all forum-related caches
    Runs asynchronously after forum create/delete operations
    """
    try:
        forums_cache_ref['data'] = None
        forums_cache_time_ref['time'] = 0
        
        logger.info("✅ Forum caches invalidated (background task)")
    except Exception as e:
        logger.error(f"❌ Error invalidating forum caches: {str(e)}")


async def cleanup_forum_data(db: AsyncIOMotorDatabase, forum_id: str, forums_cache_ref, forums_cache_time_ref):
    """
    Cleanup all data related to a deleted forum
    Runs asynchronously after forum deletion response is sent
    
    Args:
        db: MongoDB database instance
        forum_id: ID of the forum to clean up
    """
    try:
        logger.info(f"🧹 Starting background cleanup for forum: {forum_id}")
        
        # Delete all posts in this forum
        posts_result = await db.forum_posts.delete_many({"forum_id": forum_id})
        logger.info(f"  ✅ Deleted {posts_result.deleted_count} forum posts")
        
        # Delete all memberships
        members_result = await db.forum_memberships.delete_many({"forum_id": forum_id})
        logger.info(f"  ✅ Deleted {members_result.deleted_count} memberships")
        
        # Invalidate caches
        await invalidate_forum_caches(forums_cache_ref, forums_cache_time_ref)
        
        logger.info(f"✅ Background cleanup complete for forum: {forum_id}")
        
        return {
            "posts_deleted": posts_result.deleted_count,
            "memberships_deleted": members_result.deleted_count
        }
        
    except Exception as e:
        logger.error(f"❌ Error in background cleanup for forum {forum_id}: {str(e)}", exc_info=True)
        return {"error": str(e)}


async def update_forum_post_count(db: AsyncIOMotorDatabase, forum_id: str):
    """
    Update the post count for a forum
    Runs asynchronously to avoid blocking post creation
    
    Args:
        db: MongoDB database instance
        forum_id: ID of the forum to update
    """
    try:
        # Count posts for this forum
        post_count = await db.forum_posts.count_documents({"forum_id": forum_id})
        
        # Update forum document
        await db.forums.update_one(
            {"id": forum_id},
            {"$set": {"post_count": post_count}}
        )
        
        logger.info(f"✅ Updated post count for forum {forum_id}: {post_count} posts")
        
    except Exception as e:
        logger.error(f"❌ Error updating post count for forum {forum_id}: {str(e)}")