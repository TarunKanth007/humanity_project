"""
AskCura AI Treatment Advisor Module

This module provides AI-powered assistance for:
1. Patients - Treatment comparison and advice in simple language
2. Researchers - Protocol comparison and scientific analysis in technical language

Uses OpenAI GPT-5 and Gemini 2.5 Pro via emergentintegrations library
"""

from emergentintegrations.llm.chat import LlmChat, UserMessage
from typing import Dict, List, Optional, Any
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime, timezone

# Load environment variables
load_dotenv()

# Get the Emergent LLM key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# System messages for different advisor types
PATIENT_SYSTEM_MESSAGE = """You are AskCura Treatment Advisor, a friendly AI assistant helping patients understand their treatment options.

Your role:
- Use simple, easy-to-understand language (avoid medical jargon)
- Be empathetic and supportive
- Provide clear comparisons between treatment options
- Focus on effectiveness, side effects, costs, and lifestyle impact
- Always remind patients to consult their healthcare provider
- Present information in an organized, patient-friendly way

When comparing treatments:
1. Effectiveness: How well does it work?
2. Side Effects: What are common side effects?
3. Cost: General cost considerations
4. Lifestyle Impact: How does it affect daily life?
5. Treatment Duration: How long does treatment last?

Always be encouraging and supportive while providing accurate information."""

RESEARCHER_SYSTEM_MESSAGE = """You are AskCura Protocol Advisor, a scientific AI assistant for researchers and clinicians.

Your role:
- Use precise medical and scientific terminology
- Provide evidence-based analysis with citations when possible
- Compare treatment protocols with technical depth
- Include statistical metrics (hazard ratios, p-values, confidence intervals)
- Reference clinical trial data and publications
- Analyze biomarker responses and molecular mechanisms

When comparing protocols:
1. Efficacy Metrics: Hazard ratios, response rates, survival data
2. Toxicity Profiles: Grade 3/4 adverse events, discontinuation rates
3. Biomarker Analysis: Molecular targets, predictive markers
4. Trial Design: Phase, randomization, endpoints
5. Patient Selection: Inclusion/exclusion criteria, stratification
6. Mechanistic Insights: MOA, pathway analysis

Provide scientific rigor while being concise and actionable."""


class AskCuraAdvisor:
    """AI advisor for treatment and protocol guidance"""
    
    def __init__(self, role: str = "patient", provider: str = "openai"):
        """
        Initialize AskCura advisor
        
        Args:
            role: "patient" or "researcher"
            provider: "openai" or "gemini"
        """
        self.role = role
        self.provider = provider
        
        # Select system message based on role
        system_message = PATIENT_SYSTEM_MESSAGE if role == "patient" else RESEARCHER_SYSTEM_MESSAGE
        
        # Create LLM chat instance
        self.chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"askcura-{role}-{uuid.uuid4().hex[:8]}",
            system_message=system_message
        )
        
        # Configure model based on provider
        if provider == "openai":
            self.chat.with_model("openai", "gpt-4o")
        elif provider == "gemini":
            self.chat.with_model("gemini", "gemini-2.5-pro")
        else:
            # Default to OpenAI GPT-4o (more stable than gpt-5)
            self.chat.with_model("openai", "gpt-4o")
    
    async def send_message(self, message: str) -> str:
        """
        Send a message to the advisor and get a response
        
        Args:
            message: User message
            
        Returns:
            AI response
        """
        try:
            user_message = UserMessage(text=message)
            response = await self.chat.send_message(user_message)
            return str(response).strip()
        except Exception as e:
            error_msg = str(e)
            # Provide more helpful error messages
            if "502" in error_msg or "timeout" in error_msg.lower():
                return "I apologize, but the AI service is currently experiencing high demand. Please try again in a moment with a shorter query, or try the chat feature instead of comparison mode."
            elif "rate limit" in error_msg.lower():
                return "I apologize, but we've reached our rate limit. Please wait a moment and try again."
            else:
                return f"I apologize, but I encountered an error: {error_msg}. Please try again with a simpler query."
    
    async def get_treatment_comparison(self, disease: str, treatments: List[str]) -> Dict[str, Any]:
        """
        Get detailed comparison of treatments for a specific disease (Patient version)
        
        Args:
            disease: Disease or condition name
            treatments: List of treatment names to compare
            
        Returns:
            Structured comparison data
        """
        if self.role != "patient":
            return {"error": "This method is only available for patient advisors"}
        
        treatments_str = ", ".join(treatments)
        prompt = f"""Compare these treatments for {disease} in simple terms:
{treatments_str}

For each treatment, briefly explain:
1. How effective is it?
2. Common side effects
3. Cost range
4. Daily life impact
5. Treatment duration

Keep response clear and under 400 words."""

        response = await self.send_message(prompt)
        
        return {
            "disease": disease,
            "treatments": treatments,
            "comparison": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_protocol_comparison(self, condition: str, protocols: List[str]) -> Dict[str, Any]:
        """
        Get detailed protocol comparison with scientific metrics (Researcher version)
        
        Args:
            condition: Medical condition
            protocols: List of protocol names to compare
            
        Returns:
            Structured comparison with scientific metrics
        """
        if self.role != "researcher":
            return {"error": "This method is only available for researcher advisors"}
        
        protocols_str = ", ".join(protocols)
        prompt = f"""Compare these treatment protocols for {condition} concisely:
{protocols_str}

For each protocol, provide:
1. Efficacy: Response rates, survival metrics
2. Toxicity: Key adverse events
3. Biomarkers: Molecular targets
4. Trial Data: Key trials and endpoints

Keep response under 500 words. Be specific and evidence-based."""

        response = await self.send_message(prompt)
        
        return {
            "condition": condition,
            "protocols": protocols,
            "comparison": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Helper functions for creating advisors
def create_patient_advisor(provider: str = "openai") -> AskCuraAdvisor:
    """Create a patient advisor instance"""
    return AskCuraAdvisor(role="patient", provider=provider)


def create_researcher_advisor(provider: str = "openai") -> AskCuraAdvisor:
    """Create a researcher advisor instance"""
    return AskCuraAdvisor(role="researcher", provider=provider)
