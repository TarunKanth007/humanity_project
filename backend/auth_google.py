"""
Google OAuth Authentication Module
Implements direct Google OAuth flow without Emergent Auth
"""

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests
import logging
import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Google OAuth Configuration - Read from environment variables
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

logger = logging.getLogger(__name__)

# Validate required environment variables
if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    logger.warning("Google OAuth credentials not found in environment variables. Authentication will fail.")


def get_google_oauth_url(redirect_uri: str, state: str = None) -> str:
    """
    Step A: Generate Google OAuth authorization URL
    Forces account selection with prompt=select_account
    """
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",  # CRITICAL: Forces account picker every time
    }
    
    if state:
        params["state"] = state
    
    # Build URL
    query_string = "&".join([f"{k}={requests.utils.quote(str(v))}" for k, v in params.items()])
    oauth_url = f"{base_url}?{query_string}"
    
    logger.info(f"OAUTH: Generated Google OAuth URL with prompt=select_account")
    return oauth_url


def exchange_code_for_tokens(code: str, redirect_uri: str) -> Dict[str, Any]:
    """
    Step C: Exchange authorization code for tokens
    Returns: {id_token, access_token, expires_in}
    """
    logger.info(f"OAUTH: Exchanging authorization code for tokens")
    
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    
    try:
        response = requests.post(GOOGLE_TOKEN_URL, data=token_data, timeout=10)
        response.raise_for_status()
        tokens = response.json()
        
        logger.info(f"OAUTH: Successfully exchanged code for tokens")
        return tokens
    
    except requests.exceptions.RequestException as e:
        logger.error(f"OAUTH: Token exchange failed: {e}")
        raise ValueError(f"Failed to exchange code for tokens: {e}")


def verify_google_token(token: str) -> Dict[str, Any]:
    """
    Step D: Verify Google ID token and extract user info
    Returns: {email, email_verified, name, picture, sub (google_user_id)}
    """
    logger.info(f"OAUTH: Verifying Google ID token")
    
    try:
        # Verify the token signature and decode
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Check if email is verified
        if not idinfo.get("email_verified", False):
            logger.error(f"OAUTH: Email not verified: {idinfo.get('email')}")
            raise ValueError("Email not verified by Google")
        
        user_info = {
            "email": idinfo.get("email"),
            "email_verified": idinfo.get("email_verified"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
            "google_user_id": idinfo.get("sub"),
        }
        
        logger.info(f"OAUTH: Token verified for user: {user_info['email']}")
        return user_info
    
    except Exception as e:
        logger.error(f"OAUTH: Token verification failed: {e}")
        raise ValueError(f"Invalid Google token: {e}")


def get_user_info_from_access_token(access_token: str) -> Dict[str, Any]:
    """
    Alternative: Get user info using access token
    """
    logger.info(f"OAUTH: Fetching user info from access token")
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(GOOGLE_USERINFO_URL, headers=headers, timeout=10)
        response.raise_for_status()
        
        user_info = response.json()
        logger.info(f"OAUTH: Retrieved user info for: {user_info.get('email')}")
        return user_info
    
    except requests.exceptions.RequestException as e:
        logger.error(f"OAUTH: Failed to fetch user info: {e}")
        raise ValueError(f"Failed to get user info: {e}")
