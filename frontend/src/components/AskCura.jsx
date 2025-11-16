import React, { useState, useEffect, useRef } from 'react';
import './AskCura.css';

// Component to format AI responses with better visual presentation
const FormattedResponse = ({ content }) => {
  // Highlight important medical/scientific terms
  const highlightKeyTerms = (text) => {
    // Key terms to highlight with colors
    const keyTermPatterns = [
      { pattern: /\b(effective|effectiveness|efficacy|response rate|survival|remission)\b/gi, className: 'highlight-success' },
      { pattern: /\b(side effect|adverse|toxicity|risk|complication|contraindication)\b/gi, className: 'highlight-warning' },
      { pattern: /\b(cost|expensive|affordable|price|insurance)\b/gi, className: 'highlight-info' },
      { pattern: /\b(protocol|treatment|therapy|medication|drug|procedure)\b/gi, className: 'highlight-primary' }
    ];

    let parts = [text];
    
    keyTermPatterns.forEach(({ pattern, className }) => {
      const newParts = [];
      parts.forEach((part) => {
        if (typeof part === 'string') {
          const matches = part.split(pattern);
          matches.forEach((match, i) => {
            if (i > 0 && i % 2 === 1) {
              newParts.push(
                <span key={`${className}-${i}`} className={className}>
                  {match}
                </span>
              );
            } else {
              newParts.push(match);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return parts;
  };

  // Parse the content and add formatting
  const formatContent = (text) => {
    const lines = text.split('\n');
    const formatted = [];
    let currentSection = null;
    let listItems = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        if (listItems.length > 0) {
          formatted.push(
            <ul key={`list-${index}`} className="askcura-list">
              {listItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
          listItems = [];
        }
        return;
      }

      // Detect section headers (numbers followed by period or colon, or all caps)
      if (
        /^\d+\.\s/.test(trimmedLine) || 
        /^[A-Z\s]+:/.test(trimmedLine) ||
        /^\*\*[^*]+\*\*/.test(trimmedLine)
      ) {
        // Flush any pending list items
        if (listItems.length > 0) {
          formatted.push(
            <ul key={`list-${index}`} className="askcura-list">
              {listItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
          listItems = [];
        }

        // Add section header with contextual icons
        const cleanHeader = trimmedLine.replace(/^\d+\.\s*|^\*\*|\*\*$/g, '');
        let icon = '•';
        
        // Add contextual icons based on content
        if (/efficacy|effectiveness|response|survival/i.test(cleanHeader)) {
          icon = '✓';
        } else if (/toxicity|adverse|side effect|risk/i.test(cleanHeader)) {
          icon = '⚠';
        } else if (/cost|price|expense/i.test(cleanHeader)) {
          icon = '💰';
        } else if (/biomarker|molecular|mechanism|pathway/i.test(cleanHeader)) {
          icon = '🧬';
        } else if (/trial|study|protocol/i.test(cleanHeader)) {
          icon = '📊';
        } else if (/duration|time|timeline/i.test(cleanHeader)) {
          icon = '⏱';
        } else if (/lifestyle|daily|impact/i.test(cleanHeader)) {
          icon = '🏃';
        }
        
        formatted.push(
          <div key={`header-${index}`} className="askcura-section-header">
            <span className="askcura-header-icon">{icon}</span>
            {cleanHeader}
          </div>
        );
      }
      // Detect bullet points or list items
      else if (/^[-•*]\s/.test(trimmedLine) || /^[a-z]\)\s/.test(trimmedLine)) {
        const cleanItem = trimmedLine.replace(/^[-•*]\s*|^[a-z]\)\s*/, '');
        listItems.push(cleanItem);
      }
      // Regular paragraph
      else {
        if (listItems.length > 0) {
          formatted.push(
            <ul key={`list-${index}`} className="askcura-list">
              {listItems.map((item, i) => (
                <li key={i}>{highlightKeyTerms(item)}</li>
              ))}
            </ul>
          );
          listItems = [];
        }
        formatted.push(
          <p key={`para-${index}`} className="askcura-paragraph">
            {highlightKeyTerms(trimmedLine)}
          </p>
        );
      }
    });

    // Flush any remaining list items
    if (listItems.length > 0) {
      formatted.push(
        <ul key="list-final" className="askcura-list">
          {listItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }

    return formatted;
  };

  return <div className="askcura-formatted-content">{formatContent(content)}</div>;
};

const AskCura = ({ userRole, backendUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [disease, setDisease] = useState('');
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  const [treatmentOptions, setTreatmentOptions] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/askcura/history`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const endpoint =
        userRole === 'patient'
          ? `${backendUrl}/api/askcura/patient/chat`
          : `${backendUrl}/api/askcura/researcher/chat`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: inputMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openComparisonMode = () => {
    setShowComparison(true);
  };

  const closeComparisonMode = () => {
    setShowComparison(false);
    setDisease('');
    setSelectedTreatments([]);
    setTreatmentOptions([]);
    setComparisonData(null);
  };

  const handleDiseaseSubmit = async () => {
    if (!disease.trim()) return;

    setIsLoading(true);
    try {
      // Ask AI for treatment options for this disease
      const endpoint =
        userRole === 'patient'
          ? `${backendUrl}/api/askcura/patient/chat`
          : `${backendUrl}/api/askcura/researcher/chat`;

      const prompt =
        userRole === 'patient'
          ? `What are the main treatment options for ${disease}? Please list 3-5 common treatments, just the names, separated by commas.`
          : `What are the main treatment protocols for ${disease}? Please list 3-5 standard protocols, just the names, separated by commas.`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        // Parse the treatment options from the response
        const options = data.response
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        setTreatmentOptions(options.slice(0, 5));
      }
    } catch (error) {
      console.error('Error getting treatment options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTreatmentSelection = (treatment) => {
    setSelectedTreatments((prev) => {
      if (prev.includes(treatment)) {
        return prev.filter((t) => t !== treatment);
      } else {
        return [...prev, treatment];
      }
    });
  };

  const compareSelectedTreatments = async () => {
    if (selectedTreatments.length < 2) {
      alert('Please select at least 2 treatments to compare');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint =
        userRole === 'patient'
          ? `${backendUrl}/api/askcura/patient/compare-treatments`
          : `${backendUrl}/api/askcura/researcher/compare-protocols`;

      const body =
        userRole === 'patient'
          ? { disease, treatments: selectedTreatments }
          : { condition: disease, protocols: selectedTreatments };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setComparisonData(data);
      }
    } catch (error) {
      console.error('Error comparing treatments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/askcura/history`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`askcura-float-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        data-testid="askcura-float-button"
      >
        {isOpen ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      <div className={`askcura-panel ${isOpen ? 'open' : ''}`} data-testid="askcura-panel">
        <div className="askcura-header">
          <div className="askcura-header-title">
            <h3>
              {userRole === 'patient'
                ? '💊 AskCura Treatment Advisor'
                : '🔬 AskCura Protocol Advisor'}
            </h3>
            <p>
              {userRole === 'patient'
                ? 'Your personal AI guide for treatment options'
                : 'Scientific AI assistant for protocol analysis'}
            </p>
          </div>
          <div className="askcura-header-actions">
            <button
              className="askcura-compare-btn"
              onClick={openComparisonMode}
              title="Compare Treatments"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button
              className="askcura-clear-btn"
              onClick={clearHistory}
              title="Clear History"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        {!showComparison ? (
          <>
            {/* Chat Messages */}
            <div className="askcura-messages" data-testid="askcura-messages">
              {messages.length === 0 ? (
                <div className="askcura-welcome">
                  <div className="askcura-welcome-icon">
                    {userRole === 'patient' ? '💊' : '🔬'}
                  </div>
                  <h4>
                    {userRole === 'patient'
                      ? 'Welcome to AskCura!'
                      : 'Welcome to Protocol Advisor!'}
                  </h4>
                  <p>
                    {userRole === 'patient'
                      ? 'Ask me about treatment options, side effects, or how to manage your condition. I\'m here to help you understand your healthcare journey.'
                      : 'Ask me about treatment protocols, clinical trial designs, biomarker analysis, or scientific literature. I provide evidence-based insights.'}
                  </p>
                  <div className="askcura-quick-actions">
                    <button onClick={openComparisonMode}>
                      Compare {userRole === 'patient' ? 'Treatments' : 'Protocols'}
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`askcura-message ${msg.role}`}
                    data-testid={`message-${msg.role}`}
                  >
                    <div className="askcura-message-content">
                      {msg.role === 'assistant' ? (
                        <FormattedResponse content={msg.content} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="askcura-message assistant">
                  <div className="askcura-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="askcura-input-area">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  userRole === 'patient'
                    ? 'Ask about treatments, side effects, or anything else...'
                    : 'Ask about protocols, trial designs, biomarkers...'
                }
                rows="2"
                disabled={isLoading}
                data-testid="askcura-input"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="askcura-send-btn"
                data-testid="askcura-send-btn"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Comparison Mode */}
            <div className="askcura-comparison-mode">
              <button
                className="askcura-back-btn"
                onClick={closeComparisonMode}
              >
                ← Back to Chat
              </button>

              {!comparisonData ? (
                <>
                  {/* Step 1: Enter Disease/Condition */}
                  {treatmentOptions.length === 0 && (
                    <div className="askcura-comparison-step">
                      <h4>
                        {userRole === 'patient'
                          ? 'What condition do you want to learn about?'
                          : 'What condition are you researching?'}
                      </h4>
                      <input
                        type="text"
                        value={disease}
                        onChange={(e) => setDisease(e.target.value)}
                        placeholder={
                          userRole === 'patient'
                            ? 'e.g., Type 2 Diabetes, Hypertension'
                            : 'e.g., Glioblastoma, Metastatic Melanoma'
                        }
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleDiseaseSubmit();
                          }
                        }}
                        data-testid="disease-input"
                      />
                      <button
                        onClick={handleDiseaseSubmit}
                        disabled={isLoading || !disease.trim()}
                        className="askcura-primary-btn"
                      >
                        {isLoading ? 'Loading...' : 'Find Treatments'}
                      </button>
                    </div>
                  )}

                  {/* Step 2: Select Treatments */}
                  {treatmentOptions.length > 0 && (
                    <div className="askcura-comparison-step">
                      <h4>Select treatments to compare (choose at least 2)</h4>
                      <div className="askcura-treatment-list">
                        {treatmentOptions.map((treatment, index) => (
                          <label
                            key={index}
                            className={`askcura-treatment-option ${
                              selectedTreatments.includes(treatment) ? 'selected' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTreatments.includes(treatment)}
                              onChange={() => toggleTreatmentSelection(treatment)}
                            />
                            <span>{treatment}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={compareSelectedTreatments}
                        disabled={isLoading || selectedTreatments.length < 2}
                        className="askcura-primary-btn"
                      >
                        {isLoading ? 'Comparing...' : 'Compare Selected'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Step 3: Show Comparison Results */}
                  <div className="askcura-comparison-results">
                    <h4>
                      <span className="askcura-result-icon">📊</span>
                      Comparison Results: {comparisonData.disease || comparisonData.condition}
                    </h4>
                    <div className="askcura-comparison-content">
                      <FormattedResponse content={comparisonData.comparison} />
                    </div>
                    <div className="askcura-comparison-actions">
                      <button
                        onClick={closeComparisonMode}
                        className="askcura-secondary-btn"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => {
                          setComparisonData(null);
                          setSelectedTreatments([]);
                          setTreatmentOptions([]);
                          setDisease('');
                        }}
                        className="askcura-primary-btn"
                      >
                        New Comparison
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <div className="askcura-footer">
          <small>
            {userRole === 'patient'
              ? '⚠️ Always consult your healthcare provider before making medical decisions'
              : '📚 Information provided for research purposes. Verify with primary sources.'}
          </small>
        </div>
      </div>
    </>
  );
};

export default AskCura;
