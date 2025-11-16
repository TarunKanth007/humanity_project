"""
AskCura - Treatment Advisor AI Module
Provides AI-powered treatment suggestions and comparisons
"""

import logging
import json
from typing import List, Dict, Any, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv
import os
from pubmed_api import search_pubmed
from clinical_trials_api import search_clinical_trials

load_dotenv()

logger = logging.getLogger(__name__)

# System message for treatment advisor
TREATMENT_ADVISOR_SYSTEM_MESSAGE = """You are AskCura 🧬, an AI-powered treatment advisor assistant for the CuraLink platform.

Your role is to help users understand treatment options for medical conditions based on research and clinical guidelines.

**CRITICAL RULES:**
1. ALWAYS include this disclaimer in every response: "⚠️ This is NOT medical advice. Always cross-check with a licensed physician."
2. You provide research-based information, NOT diagnoses or prescriptions
3. You explain treatment options, their timelines, effects, and side effects
4. You help compare treatments based on effectiveness, timeline, side effects, cost, and quality of life
5. Base your responses on clinical trials, research papers, and medical guidelines
6. When uncertain, say so clearly
7. Always encourage users to discuss with their doctor

**Your tone:**
- Professional and empathetic
- Clear and educational
- Evidence-based
- Supportive but cautious

**Response format:**
- Use bullet points for clarity
- Include timelines when relevant
- Mention side effects
- Cite sources when possible (PubMed IDs, clinical trial IDs)
- Keep responses concise but comprehensive
"""

class TreatmentAdvisor:
    """Main class for treatment advisor functionality"""
    
    def __init__(self):
        self.api_key = os.getenv("EMERGENT_LLM_KEY")
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment variables")
    
    def create_chat_session(self, session_id: str) -> LlmChat:
        """Create a new chat session for treatment advisor"""
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=TREATMENT_ADVISOR_SYSTEM_MESSAGE
        )
        # Use GPT-4o for best quality responses
        chat.with_model("openai", "gpt-4o")
        return chat
    
    async def get_treatment_suggestions(
        self,
        disease: str,
        session_id: str,
        patient_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get treatment suggestions for a disease
        
        Args:
            disease: The disease/condition name
            session_id: Unique session identifier
            patient_profile: Optional patient information (age, gender, stage, etc.)
        
        Returns:
            Dict containing suggested treatments with details
        """
        try:
            # Search for relevant research
            research_papers = await self._get_relevant_research(disease)
            clinical_trials = await self._get_relevant_trials(disease)
            
            # Create enhanced prompt with research context
            context = self._build_research_context(research_papers, clinical_trials)
            
            patient_context = ""
            if patient_profile:
                patient_context = f"\n\nPatient Profile: {json.dumps(patient_profile, indent=2)}"
            
            prompt = f"""Based on the following research and clinical trial data, provide treatment options for: {disease}
            
{context}{patient_context}

Please list 4-6 treatment options with:
1. Treatment name
2. Brief description (1-2 sentences)
3. Timeline (how long)
4. Effectiveness (based on research)
5. Common side effects (top 3-4)
6. Suitability factors (who it works best for)
7. References (PubMed IDs or clinical trial IDs)

Format as JSON array of treatment objects.

Remember to include the medical disclaimer."""
            
            # Get AI response
            chat = self.create_chat_session(session_id)
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Parse response
            treatments = self._parse_treatment_response(response)
            
            return {
                "disease": disease,
                "treatments": treatments,
                "research_count": len(research_papers),
                "trials_count": len(clinical_trials),
                "disclaimer": "⚠️ This is NOT medical advice. Always cross-check with a licensed physician."
            }
            
        except Exception as e:
            logger.error(f"Error getting treatment suggestions: {e}")
            raise
    
    async def compare_treatments(
        self,
        disease: str,
        treatment_names: List[str],
        session_id: str,
        patient_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Compare multiple treatments for a disease
        
        Args:
            disease: The disease/condition
            treatment_names: List of treatment names to compare
            session_id: Session identifier
            patient_profile: Optional patient information
        
        Returns:
            Comprehensive comparison with tables, scores, and charts data
        """
        try:
            # Get research for each treatment
            research_data = {}
            for treatment in treatment_names:
                query = f"{disease} {treatment}"
                papers = await self._get_relevant_research(query, max_results=5)
                trials = await self._get_relevant_trials(query, max_results=3)
                research_data[treatment] = {
                    "papers": papers,
                    "trials": trials
                }
            
            # Build comparison prompt
            context = self._build_comparison_context(research_data)
            patient_context = ""
            if patient_profile:
                patient_context = f"\n\nPatient Profile: {json.dumps(patient_profile, indent=2)}"
            
            prompt = f"""Based on the research data, create a comprehensive comparison of these treatments for {disease}:
Treatments to compare: {', '.join(treatment_names)}

{context}{patient_context}

Provide a detailed comparison with:

1. **Effectiveness Comparison** (table format)
   - 1-year survival/success rate
   - 5-year survival/success rate (if applicable)
   - Response rate
   - Recurrence rate

2. **Side Effects Comparison** (severity scoring 1-10)
   - List common side effects for each treatment
   - Rate severity
   - Note quality of life impact

3. **Timeline Comparison**
   - Treatment duration
   - Recovery time
   - Total time commitment

4. **Cost Estimate** (relative: Low/Medium/High)
   - Direct treatment costs
   - Indirect costs (time off work, etc.)

5. **Suitability Score** (0-100 for this patient)
   - Based on patient profile
   - Consider age, stage, condition

6. **Quality of Life Impact** (1-10 scale)
   - During treatment
   - Post-treatment

7. **Recommendations**
   - Which treatment might be better and why
   - Important considerations
   - Questions to ask doctor

Format as structured JSON.

Include medical disclaimer and references (PubMed IDs, trial IDs)."""

            chat = self.create_chat_session(session_id)
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Parse comparison
            comparison = self._parse_comparison_response(response, treatment_names)
            
            return comparison
            
        except Exception as e:
            logger.error(f"Error comparing treatments: {e}")
            raise
    
    async def chat_message(
        self,
        message: str,
        session_id: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Handle a chat message from user
        
        Args:
            message: User's message
            session_id: Session identifier
            chat_history: Previous chat messages
        
        Returns:
            AI response as string
        """
        try:
            chat = self.create_chat_session(session_id)
            
            # If there's chat history, we could replay it (but LlmChat handles this internally)
            # For now, just send the new message
            
            user_message = UserMessage(text=message)
            response = await chat.send_message(user_message)
            
            return response
            
        except Exception as e:
            logger.error(f"Error in chat message: {e}")
            raise
    
    async def _get_relevant_research(self, query: str, max_results: int = 10) -> List[Dict]:
        """Fetch relevant research papers from PubMed"""
        try:
            papers = await search_pubmed(query, max_results=max_results)
            return papers
        except Exception as e:
            logger.warning(f"Error fetching PubMed research: {e}")
            return []
    
    async def _get_relevant_trials(self, query: str, max_results: int = 5) -> List[Dict]:
        """Fetch relevant clinical trials"""
        try:
            trials = await search_clinical_trials(query, max_results=max_results)
            return trials
        except Exception as e:
            logger.warning(f"Error fetching clinical trials: {e}")
            return []
    
    def _build_research_context(self, papers: List[Dict], trials: List[Dict]) -> str:
        """Build research context string from papers and trials"""
        context = "**Research Context:**\n\n"
        
        if papers:
            context += "**Recent Publications:**\n"
            for i, paper in enumerate(papers[:5], 1):
                context += f"{i}. {paper.get('title', 'N/A')} - {paper.get('journal', 'N/A')} ({paper.get('year', 'N/A')})\n"
                if paper.get('abstract'):
                    context += f"   Abstract: {paper['abstract'][:200]}...\n"
                if paper.get('pmid'):
                    context += f"   PMID: {paper['pmid']}\n"
            context += "\n"
        
        if trials:
            context += "**Relevant Clinical Trials:**\n"
            for i, trial in enumerate(trials[:3], 1):
                context += f"{i}. {trial.get('title', 'N/A')}\n"
                context += f"   Status: {trial.get('status', 'N/A')}\n"
                context += f"   Phase: {trial.get('phase', 'N/A')}\n"
                if trial.get('id'):
                    context += f"   NCT ID: {trial['id']}\n"
            context += "\n"
        
        return context
    
    def _build_comparison_context(self, research_data: Dict) -> str:
        """Build comparison context from research data"""
        context = "**Research Data for Comparison:**\n\n"
        
        for treatment, data in research_data.items():
            context += f"**{treatment}:**\n"
            
            if data.get('papers'):
                context += f"  Found {len(data['papers'])} relevant papers\n"
                for paper in data['papers'][:2]:
                    context += f"  - {paper.get('title', 'N/A')}\n"
            
            if data.get('trials'):
                context += f"  Found {len(data['trials'])} relevant trials\n"
                for trial in data['trials'][:1]:
                    context += f"  - {trial.get('title', 'N/A')} (Status: {trial.get('status', 'N/A')})\n"
            
            context += "\n"
        
        return context
    
    def _parse_treatment_response(self, response: str) -> List[Dict]:
        """Parse AI response to extract treatment list"""
        try:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                treatments = json.loads(json_match.group(0))
                return treatments
            else:
                # Fallback: return response as-is wrapped in dict
                return [{"raw_response": response}]
        except Exception as e:
            logger.warning(f"Could not parse treatment response as JSON: {e}")
            return [{"raw_response": response}]
    
    def _parse_comparison_response(self, response: str, treatment_names: List[str]) -> Dict:
        """Parse AI comparison response"""
        try:
            # Try to extract JSON
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                comparison = json.loads(json_match.group(0))
                comparison['treatments'] = treatment_names
                comparison['raw_response'] = response
                return comparison
            else:
                # Fallback
                return {
                    "treatments": treatment_names,
                    "raw_response": response,
                    "disclaimer": "⚠️ This is NOT medical advice. Always cross-check with a licensed physician."
                }
        except Exception as e:
            logger.warning(f"Could not parse comparison response as JSON: {e}")
            return {
                "treatments": treatment_names,
                "raw_response": response,
                "disclaimer": "⚠️ This is NOT medical advice. Always cross-check with a licensed physician."
            }


# Global instance
_treatment_advisor = None

def get_treatment_advisor() -> TreatmentAdvisor:
    """Get or create the global treatment advisor instance"""
    global _treatment_advisor
    if _treatment_advisor is None:
        _treatment_advisor = TreatmentAdvisor()
    return _treatment_advisor
