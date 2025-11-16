import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Send, Loader2, Download, Share2 } from 'lucide-react';
import axios from 'axios';
import './AskCura.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export function AskCuraResearcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `askcura-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [suggestedTreatments, setSuggestedTreatments] = useState([]);
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [currentDisease, setCurrentDisease] = useState('');
  
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        type: 'bot',
        content: "Hi! I'm AskCura Research Assistant 🔬\n\nAsk about treatment protocols, clinical trial designs, or research methodologies for any condition.\n\n⚠️ For research purposes only.",
        timestamp: new Date()
      }]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Check if this might be a disease/condition query
      const isDiseaseQuery = inputMessage.length > 3 && !messages.some(m => m.type === 'treatments');
      
      if (isDiseaseQuery) {
        // Get treatment suggestions
        const response = await api.post('/treatment-advisor/suggest', {
          disease: inputMessage,
          session_id: sessionId,
          patient_profile: null
        });

        const botMessage = {
          type: 'bot',
          content: `Here are recommended treatments for ${response.data.disease}:\n\n${response.data.disclaimer}`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setSuggestedTreatments(response.data.treatments || []);
        setCurrentDisease(response.data.disease);
        
        // Add treatments message
        const treatmentsMessage = {
          type: 'treatments',
          treatments: response.data.treatments || [],
          timestamp: new Date()
        };
        setMessages(prev => [...prev, treatmentsMessage]);
        
      } else {
        // Regular chat
        const response = await api.post('/treatment-advisor/chat', {
          message: inputMessage,
          session_id: sessionId
        });

        const botMessage = {
          type: 'bot',
          content: response.data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTreatmentSelection = (treatmentName) => {
    setSelectedTreatments(prev => {
      if (prev.includes(treatmentName)) {
        return prev.filter(t => t !== treatmentName);
      } else {
        return [...prev, treatmentName];
      }
    });
  };

  const handleCompareSelected = async () => {
    if (selectedTreatments.length < 2) {
      alert('Please select at least 2 treatments to compare');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/treatment-advisor/compare', {
        disease: currentDisease,
        treatment_names: selectedTreatments,
        session_id: sessionId,
        patient_profile: null
      });

      setComparisonData(response.data);
      setShowComparison(true);
    } catch (error) {
      console.error('Error comparing treatments:', error);
      alert('Failed to compare treatments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedPrompts = [
    "immunotherapy protocols for melanoma",
    "clinical trial design for Alzheimer's",
    "CAR-T cell therapy effectiveness",
    "latest research on CRISPR gene editing"
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        className="askcura-float-button"
        onClick={() => setIsOpen(true)}
        aria-label="Open AskCura Treatment Advisor"
      >
        <span className="askcura-icon">🧬</span>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="askcura-panel">
          {/* Header */}
          <div className="askcura-header">
            <div>
              <h3 className="askcura-title">AskCura — Treatment Advisor</h3>
              <p className="askcura-subtitle">AI-powered treatment explanations. Not medical advice.</p>
            </div>
            <button
              className="askcura-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Body */}
          <div className="askcura-body">
            {messages.map((message, index) => (
              <div key={index}>
                {message.type === 'user' && (
                  <div className="askcura-message user">
                    <div className="askcura-message-content">
                      {message.content}
                    </div>
                  </div>
                )}
                
                {message.type === 'bot' && (
                  <div className="askcura-message bot">
                    <div className="askcura-message-content">
                      {message.content}
                    </div>
                  </div>
                )}

                {message.type === 'treatments' && (
                  <div className="askcura-treatments">
                    {message.treatments.map((treatment, idx) => {
                      const treatmentId = `treatment-${idx}-${treatment.name || treatment.raw_response}`;
                      const treatmentName = treatment.name || `Treatment ${idx + 1}`;
                      
                      return (
                        <div key={treatmentId} className="askcura-treatment-card">
                          <label className="askcura-treatment-label">
                            <input
                              type="checkbox"
                              checked={selectedTreatments.includes(treatmentName)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleTreatmentSelection(treatmentName);
                              }}
                            />
                            <div className="askcura-treatment-info">
                              <h4>{treatmentName}</h4>
                              {treatment.description && <p>{treatment.description}</p>}
                              {treatment.timeline && (
                                <span className="askcura-treatment-badge">
                                  Timeline: {treatment.timeline}
                                </span>
                              )}
                              {treatment.side_effects && (
                                <span className="askcura-treatment-badge">
                                  Side effects: {treatment.side_effects}
                                </span>
                              )}
                            </div>
                          </label>
                        </div>
                      );
                    })}
                    
                    {selectedTreatments.length >= 2 && (
                      <Button
                        onClick={handleCompareSelected}
                        disabled={isLoading}
                        className="askcura-compare-btn"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Comparing...
                          </>
                        ) : (
                          `Compare Selected (${selectedTreatments.length})`
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="askcura-message bot">
                <div className="askcura-message-content">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Analyzing research data...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Footer / Input */}
          <div className="askcura-footer">
            {messages.length === 1 && (
              <div className="askcura-suggested-prompts">
                <p>Try asking about:</p>
                <div className="askcura-prompts-grid">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      className="askcura-prompt-chip"
                      onClick={() => {
                        setInputMessage(prompt);
                        inputRef.current?.focus();
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="askcura-input-container">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your condition or question..."
                className="askcura-input"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="askcura-send-btn"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="askcura-comparison-modal">
          <DialogHeader>
            <DialogTitle>Treatment Comparison Report</DialogTitle>
            <DialogDescription>
              Comparing: {selectedTreatments.join(', ')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="askcura-comparison-content">
            {comparisonData && (
              <div>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {comparisonData.raw_response || JSON.stringify(comparisonData, null, 2)}
                </pre>
                
                <div className="askcura-comparison-actions">
                  <Button variant="outline" onClick={() => setShowComparison(false)}>
                    Back to Chat
                  </Button>
                  <Button>
                    <Download size={16} style={{ marginRight: '8px' }} />
                    Download PDF
                  </Button>
                  <Button variant="outline">
                    <Share2 size={16} style={{ marginRight: '8px' }} />
                    Share with Doctor
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
