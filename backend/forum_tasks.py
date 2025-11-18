"""
Background tasks for forum operations
Non-blocking cleanup and cache invalidation
"""

import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


async def cleanup_forum_data(db: AsyncIOMotorDatabase, forum_id: str):
    """
    Async cleanup of forum-related data after forum deletion
    Runs in background, doesn't block response
    """
    try:
        # Delete all posts
        posts_result = await db.forum_posts.delete_many({"forum_id": forum_id})
        logger.info(f"Cleanup: Deleted {posts_result.deleted_count} posts for forum {forum_id}")
        
        # Delete all memberships
        members_result = await db.forum_memberships.delete_many({"forum_id": forum_id})
        logger.info(f"Cleanup: Deleted {members_result.deleted_count} memberships for forum {forum_id}")
        
        logger.info(f"✅ Background cleanup complete for forum {forum_id}")
        
    except Exception as e:
        logger.error(f"❌ Background cleanup failed for forum {forum_id}: {e}")


async def invalidate_forum_caches():
    """
    Async cache invalidation
    Runs in background, doesn't block response
    """
    try:
        # Import here to avoid circular dependency
        from server import forums_cache, forums_cache_time, forum_posts_cache, forum_posts_cache_time
        
        # Clear caches
        globals()['forums_cache'] = None
        globals()['forums_cache_time'] = 0
        
        logger.info("✅ Background cache invalidation complete")
        
    except Exception as e:
        logger.error(f"❌ Background cache invalidation failed: {e}")
