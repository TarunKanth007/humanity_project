"""
ClinicalTrials.gov API Client
Fetches real-time clinical trial data from ClinicalTrials.gov public API
"""
import requests
import requests_cache
import logging
import time
from typing import Dict, List, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

# Configure caching
requests_cache.install_cache(
    'clinical_trials_cache',
    backend='sqlite',
    expire_after=86400  # 24 hours
)

class ClinicalTrialsAPI:
    """Client for ClinicalTrials.gov API v2"""
    
    BASE_URL = "https://clinicaltrials.gov/api/v2/studies"
    RATE_LIMIT_DELAY = 1.5  # seconds between requests (to stay under 50/minute)
    
    def __init__(self):
        self.last_request_time = 0
        self.session = requests.Session()
    
    def _rate_limit(self):
        """Enforce rate limiting between requests"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.RATE_LIMIT_DELAY:
            time.sleep(self.RATE_LIMIT_DELAY - elapsed)
        self.last_request_time = time.time()
    
    @retry(
        retry=retry_if_exception_type((requests.RequestException,)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=30)
    )
    def search_trials(
        self,
        condition: Optional[str] = None,
        intervention: Optional[str] = None,
        location: Optional[str] = None,
        status: Optional[str] = None,
        page_size: int = 50
    ) -> Dict:
        """
        Search for clinical trials
        
        Args:
            condition: Disease or condition
            intervention: Intervention or treatment
            location: Location (city, state, or country)
            status: Recruitment status (RECRUITING, COMPLETED, etc.)
            page_size: Number of results (max 1000)
        
        Returns:
            Dict with trial data and metadata
        """
        self._rate_limit()
        
        params = {
            "pageSize": min(page_size, 1000),
            "countTotal": "true",
            "format": "json"
        }
        
        # Build search query
        query_parts = []
        if condition:
            query_parts.append(f'AREA[Condition]"{condition}"')
        if intervention:
            query_parts.append(f'AREA[InterventionName]"{intervention}"')
        if location:
            query_parts.append(f'AREA[LocationCity]"{location}"')
        
        if query_parts:
            params["query.term"] = " AND ".join(query_parts)
        
        if status:
            params["filter.overallStatus"] = status
        
        try:
            logger.info(f"Fetching clinical trials: {params}")
            response = self.session.get(
                self.BASE_URL,
                params=params,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Found {data.get('totalCount', 0)} trials")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"ClinicalTrials API error: {e}")
            raise
    
    def normalize_trial(self, study: Dict) -> Dict:
        """
        Extract and normalize trial data from API response
        
        Args:
            study: Raw study data from API
        
        Returns:
            Normalized trial dict
        """
        try:
            protocol = study.get('protocolSection', {})
            identification = protocol.get('identificationModule', {})
            status_module = protocol.get('statusModule', {})
            design_module = protocol.get('designModule', {})
            conditions = protocol.get('conditionsModule', {})
            arms = protocol.get('armsInterventionsModule', {})
            contacts = protocol.get('contactsLocationsModule', {})
            eligibility = protocol.get('eligibilityModule', {})
            
            # Get locations
            locations = []
            for loc in contacts.get('locations', []):
                locations.append({
                    "city": loc.get('city', ''),
                    "state": loc.get('state', ''),
                    "country": loc.get('country', ''),
                    "status": loc.get('status', '')
                })
            
            # Format location string
            location_str = "Multiple Locations"
            if locations:
                first_loc = locations[0]
                parts = [first_loc.get('city'), first_loc.get('state'), first_loc.get('country')]
                location_str = ', '.join([p for p in parts if p])
            
            normalized = {
                "id": identification.get('nctId', ''),
                "title": identification.get('briefTitle', ''),
                "description": protocol.get('descriptionModule', {}).get('briefSummary', ''),
                "phase": ', '.join(design_module.get('phases', [])) or 'N/A',
                "status": status_module.get('overallStatus', ''),
                "location": location_str,
                "disease_areas": conditions.get('conditions', []),
                "interventions": [
                    i.get('name', '') 
                    for i in arms.get('interventions', [])
                ],
                "eligibility": eligibility.get('eligibilityCriteria', ''),
                "min_age": eligibility.get('minimumAge', ''),
                "max_age": eligibility.get('maximumAge', ''),
                "enrollment": design_module.get('enrollmentInfo', {}).get('count'),
                "last_update": status_module.get('lastUpdatePostDateStruct', {}).get('date', ''),
                "created_by": "ClinicalTrials.gov",
                "source": "ClinicalTrials.gov API"
            }
            
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing trial: {e}")
            return {}
    
    def search_and_normalize(
        self,
        condition: Optional[str] = None,
        location: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """
        Search trials and return normalized results
        
        Args:
            condition: Disease or condition to search
            location: Location filter
            status: Recruitment status
            limit: Maximum results
        
        Returns:
            List of normalized trial dicts
        """
        try:
            result = self.search_trials(
                condition=condition,
                location=location,
                status=status,
                page_size=limit
            )
            
            studies = result.get('studies', [])
            normalized_trials = []
            
            for study in studies:
                normalized = self.normalize_trial(study)
                if normalized and normalized.get('id'):
                    normalized_trials.append(normalized)
            
            logger.info(f"Normalized {len(normalized_trials)} trials")
            return normalized_trials
            
        except Exception as e:
            logger.error(f"Error in search_and_normalize: {e}")
            return []
