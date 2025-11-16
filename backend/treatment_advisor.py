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
            return f"I apologize, but I encountered an error: {str(e)}. Please try again."
    
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
        prompt = f"""I need to compare these treatments for {disease}:
{treatments_str}

Please provide a detailed comparison with these sections for each treatment:
1. Effectiveness: How well does it work?
2. Side Effects: What are the most common side effects?
3. Cost: General cost considerations
4. Lifestyle Impact: How does it affect daily life?
5. Treatment Duration: How long does treatment typically last?

Format your response clearly with each treatment as a separate section."""

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
        prompt = f"""Provide a comprehensive scientific comparison of these treatment protocols for {condition}:
{protocols_str}

Include for each protocol:
1. Efficacy Metrics: Hazard ratios, response rates, overall survival, progression-free survival
2. Toxicity Profile: Grade 3/4 adverse events, treatment discontinuation rates
3. Biomarker Analysis: Molecular targets, predictive biomarkers, patient selection criteria
4. Trial Design: Phase, sample size, primary/secondary endpoints
5. Mechanistic Insights: Mechanism of action, pathway targeting
6. Key Publications: Reference major trials and recent publications

Provide evidence-based, data-driven comparison with specific metrics."""

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
