import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { HelpCircle, Send, LogOut, Microscope, ThumbsUp, ThumbsDown } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true
});

export const QACommunity = ({ user, logout }) => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [showAnswerDialog, setShowAnswerDialog] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    title: '',
    content: '',
    condition: '',
    is_anonymous: true
  });
  const [answerForm, setAnswerForm] = useState({
    content: '',
    parent_id: null
  });

  // Add animated particles background (reduced count for QA Community)
  useEffect(() => {
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.classList.add('particle');
      
      // Random horizontal position across screen width
      p.style.left = `${Math.random() * window.innerWidth}px`;
      
      // Random size between 8px and 16px
      const size = 8 + Math.random() * 8;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      
      // Random opacity between 0.3 and 0.8
      p.style.opacity = `${0.3 + Math.random() * 0.5}`;
      
      // Random duration between 8s and 20s (slower particles)
      p.style.animationDuration = `${8 + Math.random() * 12}s`;
      
      // Random delay to stagger particle appearance
      p.style.animationDelay = `${Math.random() * 8}s`;
      
      document.body.appendChild(p);
    }

    // Cleanup particles when component unmounts
    return () => {
      const particles = document.querySelectorAll('.particle');
      particles.forEach(p => p.remove());
    };
  }, []);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/qa/questions');
      setQuestions(res.data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionDetail = async (questionId) => {
    try {
      const res = await api.get(`/qa/questions/${questionId}`);
      setSelectedQuestion(res.data);
    } catch (error) {
      console.error('Failed to load question detail:', error);
    }
  };

  const askQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.post('/qa/questions', questionForm);
      toast.success('Question posted successfully');
      setShowAskDialog(false);
      setQuestionForm({ title: '', content: '', condition: '', is_anonymous: true });
      loadQuestions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to post question');
    }
  };

  const postAnswer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/qa/answers', {
        question_id: selectedQuestion.id,
        content: answerForm.content,
        parent_id: answerForm.parent_id
      });
      toast.success('Answer posted successfully');
      setShowAnswerDialog(false);
      setAnswerForm({ content: '', parent_id: null });
      loadQuestionDetail(selectedQuestion.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to post answer');
    }
  };

  const handleVote = async (answerId, voteType) => {
    try {
      await api.post('/qa/vote', { answer_id: answerId, vote_type: voteType });
      loadQuestionDetail(selectedQuestion.id);
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const isPatient = user.roles?.includes('patient');
  const isResearcher = user.roles?.includes('researcher');

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Microscope className="brand-icon" />
          <span>CuraLink</span>
        </div>
        <div className="nav-actions">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
          <div className="nav-user">
            <img src={user.picture} alt={user.name} className="user-avatar" />
            <span>{user.name}</span>
            <Button data-testid="logout-btn" variant="ghost" size="sm" onClick={logout}>
              <LogOut className="icon-sm" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div data-testid="qa-community" className="dashboard-content">
          {!selectedQuestion ? (
            <>
              <div className="dashboard-header">
                <div>
                  <h1>Community Q&A</h1>
                  <p className="dashboard-subtitle">Ask questions and get answers from medical researchers</p>
                </div>
                {isPatient && (
                  <Dialog open={showAskDialog} onOpenChange={setShowAskDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="ask-question-btn">
                        <HelpCircle className="icon-sm" />
                        Ask Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dialog-content">
                      <DialogHeader>
                        <DialogTitle>Ask a Question</DialogTitle>
                        <DialogDescription>
                          Your question will be posted anonymously
                        </DialogDescription>
                      </DialogHeader>
                      <form data-testid="question-form" onSubmit={askQuestion} className="trial-form">
                        <Input
                          data-testid="question-title-input"
                          placeholder="Question Title"
                          value={questionForm.title}
                          onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                          required
                        />
                        <Textarea
                          data-testid="question-content-input"
                          placeholder="Describe your question in detail..."
                          value={questionForm.content}
                          onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                          required
                          rows={6}
                        />
                        <Input
                          data-testid="question-condition-input"
                          placeholder="Related condition (optional)"
                          value={questionForm.condition}
                          onChange={(e) => setQuestionForm({ ...questionForm, condition: e.target.value })}
                        />
                        <Button data-testid="submit-question-btn" type="submit">Post Question</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {loading ? (
                <div className="loading-state">Loading questions...</div>
              ) : questions.length === 0 ? (
                <div className="empty-state">
                  <HelpCircle className="empty-icon" />
                  <h3>No questions yet</h3>
                  <p>Be the first to ask a question</p>
                </div>
              ) : (
                <div className="items-grid">
                  {questions.map((question) => (
                    <Card 
                      key={question.id} 
                      className="item-card clickable"
                      onClick={() => loadQuestionDetail(question.id)}
                    >
                      <CardHeader>
                        <CardTitle className="item-title">{question.title}</CardTitle>
                        <CardDescription>
                          Anonymous • {new Date(question.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="item-description">{question.content.slice(0, 150)}...</p>
                        {question.condition && (
                          <Badge variant="secondary" className="mt-2">{question.condition}</Badge>
                        )}
                        <div className="item-meta mt-3">
                          <span>{question.answer_count || 0} answers</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="mb-4"
                onClick={() => setSelectedQuestion(null)}
              >
                ← Back to Questions
              </Button>

              <Card className="question-detail-card">
                <CardHeader>
                  <CardTitle className="text-2xl">{selectedQuestion.title}</CardTitle>
                  <CardDescription>
                    Posted by Anonymous • {new Date(selectedQuestion.created_at).toLocaleDateString()}
                  </CardDescription>
                  {selectedQuestion.condition && (
                    <Badge variant="secondary" className="mt-2">{selectedQuestion.condition}</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="question-content">{selectedQuestion.content}</p>
                </CardContent>
              </Card>

              {isResearcher && (
                <div className="mt-4">
                  <Dialog open={showAnswerDialog} onOpenChange={setShowAnswerDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="answer-question-btn">
                        <Send className="icon-sm" />
                        Answer Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dialog-content">
                      <DialogHeader>
                        <DialogTitle>Post Your Answer</DialogTitle>
                      </DialogHeader>
                      <form data-testid="answer-form" onSubmit={postAnswer} className="trial-form">
                        <Textarea
                          data-testid="answer-content-input"
                          placeholder="Share your medical expertise and insights..."
                          value={answerForm.content}
                          onChange={(e) => setAnswerForm({ ...answerForm, content: e.target.value })}
                          required
                          rows={6}
                        />
                        <Button data-testid="submit-answer-btn" type="submit">Post Answer</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <div className="answers-section mt-6">
                <h3 className="text-xl font-semibold mb-4">
                  {selectedQuestion.answers?.length || 0} Answers
                </h3>

                {selectedQuestion.answers?.map((answer) => (
                  <Card key={answer.id} className="answer-card mb-4">
                    <CardContent className="pt-6">
                      <div className="answer-header">
                        <div>
                          <p className="font-semibold">{answer.researcher_name}</p>
                          {answer.researcher_specialty && (
                            <p className="text-sm text-muted-foreground">{answer.researcher_specialty}</p>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(answer.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="answer-content mt-4">{answer.content}</p>

                      <div className="answer-actions mt-4">
                        <div className="vote-buttons">
                          <Button
                            variant={answer.user_vote === 'like' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleVote(answer.id, 'like')}
                            data-testid={`like-btn-${answer.id}`}
                          >
                            <ThumbsUp className="icon-xs" />
                            {answer.likes}
                          </Button>
                          <Button
                            variant={answer.user_vote === 'dislike' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleVote(answer.id, 'dislike')}
                            data-testid={`dislike-btn-${answer.id}`}
                          >
                            <ThumbsDown className="icon-xs" />
                            {answer.dislikes}
                          </Button>
                        </div>

                        {isResearcher && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAnswerForm({ ...answerForm, parent_id: answer.id });
                              setShowAnswerDialog(true);
                            }}
                          >
                            Reply
                          </Button>
                        )}
                      </div>

                      {answer.replies && answer.replies.length > 0 && (
                        <div className="replies-section mt-4">
                          {answer.replies.map((reply) => (
                            <Card key={reply.id} className="reply-card">
                              <CardContent className="pt-4">
                                <div className="answer-header">
                                  <div>
                                    <p className="font-semibold text-sm">{reply.researcher_name}</p>
                                    {reply.researcher_specialty && (
                                      <p className="text-xs text-muted-foreground">{reply.researcher_specialty}</p>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm mt-2">{reply.content}</p>
                                
                                <div className="vote-buttons mt-3">
                                  <Button
                                    variant={reply.user_vote === 'like' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleVote(reply.id, 'like')}
                                  >
                                    <ThumbsUp className="icon-xs" />
                                    {reply.likes}
                                  </Button>
                                  <Button
                                    variant={reply.user_vote === 'dislike' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleVote(reply.id, 'dislike')}
                                  >
                                    <ThumbsDown className="icon-xs" />
                                    {reply.dislikes}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
