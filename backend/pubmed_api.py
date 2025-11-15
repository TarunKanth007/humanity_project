"""
PubMed API Client
Fetches research publications from NCBI PubMed using E-utilities
"""
from Bio import Entrez
import logging
import time
from typing import List, Dict, Optional
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

# Set email for NCBI (required)
Entrez.email = "curalink@example.com"

class PubMedAPI:
    """Client for PubMed E-utilities API"""
    
    RATE_LIMIT_DELAY = 0.34  # ~3 requests per second (without API key)
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize PubMed client
        
        Args:
            api_key: NCBI API key (optional, increases rate limit to 10/sec)
        """
        if api_key:
            Entrez.api_key = api_key
            self.RATE_LIMIT_DELAY = 0.1  # 10 requests per second with key
        
        self.last_request_time = 0
    
    def _rate_limit(self):
        """Enforce rate limiting between requests"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.RATE_LIMIT_DELAY:
            time.sleep(self.RATE_LIMIT_DELAY - elapsed)
        self.last_request_time = time.time()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def search(
        self,
        query: str,
        max_results: int = 50,
        min_date: Optional[str] = None,
        max_date: Optional[str] = None
    ) -> List[str]:
        """
        Search PubMed and return PMIDs
        
        Args:
            query: Search query
            max_results: Maximum number of results
            min_date: Minimum publication date (YYYY/MM/DD)
            max_date: Maximum publication date (YYYY/MM/DD)
        
        Returns:
            List of PMIDs
        """
        self._rate_limit()
        
        try:
            # Add date restrictions if provided
            search_term = query
            if min_date or max_date:
                date_clause = f'{min_date or "1970"}:{max_date or "2099"}[DP]'
                search_term = f'{query} AND {date_clause}'
            
            logger.info(f"Searching PubMed: {search_term[:100]}")
            
            handle = Entrez.esearch(
                db='pubmed',
                term=search_term,
                retmax=max_results,
                sort='relevance',
                retmode='xml'
            )
            
            result = Entrez.read(handle)
            handle.close()
            
            pmids = result.get('IdList', [])
            logger.info(f"Found {len(pmids)} PMIDs (total: {result.get('Count', 0)})")
            
            return pmids
            
        except Exception as e:
            logger.error(f"PubMed search error: {e}")
            return []
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def fetch_articles(self, pmids: List[str]) -> List[Dict]:
        """
        Fetch article details for given PMIDs
        
        Args:
            pmids: List of PubMed IDs
        
        Returns:
            List of article dicts
        """
        if not pmids:
            return []
        
        self._rate_limit()
        
        try:
            logger.info(f"Fetching {len(pmids)} articles from PubMed")
            
            handle = Entrez.efetch(
                db='pubmed',
                id=','.join(pmids),
                rettype='medline',
                retmode='xml'
            )
            
            records = Entrez.read(handle)
            handle.close()
            
            articles = []
            for record in records.get('PubmedArticle', []):
                article = self._parse_article(record)
                if article:
                    articles.append(article)
            
            logger.info(f"Successfully parsed {len(articles)} articles")
            return articles
            
        except Exception as e:
            logger.error(f"Error fetching articles: {e}")
            return []
    
    def _parse_article(self, record: Dict) -> Optional[Dict]:
        """
        Parse article record from Entrez response
        
        Args:
            record: Article record from Entrez.read()
        
        Returns:
            Parsed article dict or None
        """
        try:
            medline = record.get('MedlineCitation', {})
            article = medline.get('Article', {})
            
            # Extract PMID
            pmid = str(medline.get('PMID', ''))
            
            # Extract title
            title = article.get('ArticleTitle', '')
            
            # Extract abstract
            abstract = ''
            if 'Abstract' in article:
                abstract_texts = article['Abstract'].get('AbstractText', [])
                if isinstance(abstract_texts, list):
                    abstract = ' '.join(str(t) for t in abstract_texts)
                else:
                    abstract = str(abstract_texts)
            
            # Extract authors
            authors = []
            author_list = article.get('AuthorList', [])
            for author in author_list:
                if isinstance(author, dict):
                    last_name = author.get('LastName', '')
                    first_name = author.get('ForeName', '')
                    initials = author.get('Initials', '')
                    if last_name:
                        author_string = f"{last_name}, {first_name or initials}".strip()
                        authors.append(author_string)
            
            # Extract journal info
            journal = article.get('Journal', {})
            journal_title = journal.get('Title', '')
            
            # Extract publication date
            journal_issue = journal.get('JournalIssue', {})
            pub_date = journal_issue.get('PubDate', {})
            year = pub_date.get('Year', '')
            month = pub_date.get('Month', '')
            
            # Extract MeSH terms as disease areas
            mesh_terms = []
            mesh_list = medline.get('MeshHeadingList', [])
            for mesh in mesh_list[:5]:  # Limit to 5 main terms
                if isinstance(mesh, dict):
                    descriptor = mesh.get('DescriptorName', {})
                    if isinstance(descriptor, dict):
                        term = descriptor.get('String', '')
                        if term:
                            mesh_terms.append(term)
                    elif isinstance(descriptor, str):
                        mesh_terms.append(descriptor)
            
            # Extract DOI
            article_ids = record.get('PubmedData', {}).get('ArticleIdList', [])
            doi = None
            for art_id in article_ids:
                if isinstance(art_id, dict) and art_id.get('IdType') == 'doi':
                    doi = str(art_id)
                    break
            
            # Build URL
            url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else None
            
            return {
                "id": pmid,
                "title": str(title),
                "abstract": abstract[:500] + '...' if len(abstract) > 500 else abstract,
                "summary": abstract[:200] + '...' if len(abstract) > 200 else abstract,
                "authors": authors[:10],  # Limit to 10 authors
                "journal": str(journal_title),
                "year": int(year) if year.isdigit() else None,
                "doi": doi,
                "url": url,
                "disease_areas": mesh_terms,
                "source": "PubMed API"
            }
            
        except Exception as e:
            logger.error(f"Error parsing article: {e}")
            return None
    
    def search_and_fetch(
        self,
        query: str,
        max_results: int = 50,
        disease_area: Optional[str] = None
    ) -> List[Dict]:
        """
        Search PubMed and fetch complete article data
        
        Args:
            query: Search query
            max_results: Maximum results to return
            disease_area: Optional disease area filter
        
        Returns:
            List of article dicts
        """
        try:
            # Enhance query with disease area if provided
            search_query = query
            if disease_area:
                search_query = f'({query}) AND ("{disease_area}"[MeSH Terms] OR "{disease_area}"[Title/Abstract])'
            
            # Search for PMIDs
            pmids = self.search(search_query, max_results=max_results)
            
            if not pmids:
                logger.info("No PMIDs found for query")
                return []
            
            # Fetch article details in chunks
            chunk_size = 100
            all_articles = []
            
            for i in range(0, len(pmids), chunk_size):
                chunk = pmids[i:i+chunk_size]
                articles = self.fetch_articles(chunk)
                all_articles.extend(articles)
                
                # Small delay between chunks
                if i + chunk_size < len(pmids):
                    time.sleep(0.5)
            
            return all_articles
            
        except Exception as e:
            logger.error(f"Error in search_and_fetch: {e}")
            return []


# Global PubMed client instance
_pubmed_client = None

def get_pubmed_client() -> PubMedAPI:
    """Get or create global PubMed client instance"""
    global _pubmed_client
    if _pubmed_client is None:
        _pubmed_client = PubMedAPI()
    return _pubmed_client


async def search_pubmed(query: str, max_results: int = 20, disease_area: Optional[str] = None) -> List[Dict]:
    """
    Async wrapper for PubMed search
    
    Args:
        query: Search query string
        max_results: Maximum number of results to return
        disease_area: Optional disease area to filter by
    
    Returns:
        List of publication dictionaries with title, abstract, authors, etc.
    """
    import asyncio
    
    try:
        client = get_pubmed_client()
        # Run the sync function in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            lambda: client.search_and_fetch(query, max_results, disease_area)
        )
        return results
    except Exception as e:
        logger.error(f"Error in async search_pubmed: {e}")
        return []
