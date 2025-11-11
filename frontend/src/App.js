import { useState, useEffect } from "react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Heart, Search, Users, FileText, MessageSquare, Star, Plus, Send, LogOut, User, Microscope, Stethoscope, BookOpen, MapPin, Filter, HelpCircle, Bell, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { QACommunity } from "@/components/QACommunity";
import { Notifications } from "@/components/Notifications";
import { ChatRoom } from "@/components/ChatRoom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const AUTH_BASE_URL = process.env.REACT_APP_AUTH_URL || 'https://auth.emergentagent.com';
const AUTH_URL = `${AUTH_BASE_URL}/?redirect=${encodeURIComponent(window.location.origin + '/dashboard')}`;

// Axios instance with credentials
const api = axios.create({
  baseURL: API,
  withCredentials: true
});

// Auth Context
const AuthContext = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for session_id in URL fragment
    const hash = window.location.hash;
    if (hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      processSession(sessionId);
      return;
    }

    // Check existing session
    checkAuth();
  }, []);

  const processSession = async (sessionId) => {
    try {
      const response = await api.post('/auth/session', { session_id: sessionId });
      setUser(response.data.user);
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Redirect based on role status
      if (response.data.user.roles && response.data.user.roles.length > 0) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Session processing failed:', error);
      toast.error('Authentication failed');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      navigate('/', { replace: true });
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API fails
      setUser(null);
      navigate('/', { replace: true });
    }
  };

  if (loading && !location.pathname.includes('session_id')) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return children({ user, setUser, logout });
};

// Landing Page
const LandingPage = () => {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, observerOptions);

    // Observe all animated elements
    const animatedElements = document.querySelectorAll('.scroll-animate');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const testimonials = [
    {
      id: 1,
      name: "Dr. Sarah Mitchell",
      role: "Oncology Researcher",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
      rating: 5,
      text: "CuraLink has revolutionized how I connect with patients for clinical trials. The platform's intuitive interface and AI-powered matching have significantly improved our recruitment process."
    },
    {
      id: 2,
      name: "Robert Thompson",
      role: "Cancer Patient & Advocate",
      image: "https://images.unsplash.com/photo-1698465281093-9f09159733b9",
      rating: 5,
      text: "Finding the right clinical trial seemed impossible until I discovered CuraLink. Within weeks, I was connected with a specialist who changed my treatment journey. This platform is a game-changer."
    },
    {
      id: 3,
      name: "Dr. Emily Chen",
      role: "Neurological Research Lead",
      image: "https://images.unsplash.com/photo-1659353888922-7c7b1ad21650",
      rating: 5,
      text: "As a researcher, I've tried multiple platforms, but CuraLink stands out. The ability to engage directly with patients and share research findings has enhanced our study outcomes tremendously."
    },
    {
      id: 4,
      name: "Maria Rodriguez",
      role: "Caregiver",
      image: "https://images.unsplash.com/photo-1592393532405-fb1f165c4a1f",
      rating: 5,
      text: "Caring for my mother with Alzheimer's was overwhelming. CuraLink helped us find cutting-edge research and connect with experts who provided invaluable guidance and hope."
    },
    {
      id: 5,
      name: "Dr. James Patterson",
      role: "Clinical Trial Coordinator",
      image: "https://images.unsplash.com/photo-1758691461516-7e716e0ca135",
      rating: 5,
      text: "The Q&A community and one-on-one consultation features have transformed patient engagement. CuraLink bridges the gap between research and real-world patient needs beautifully."
    },
    {
      id: 6,
      name: "Lisa Anderson",
      role: "Diabetes Patient",
      image: "https://images.pexels.com/photos/5215017/pexels-photo-5215017.jpeg",
      rating: 4,
      text: "I was skeptical at first, but CuraLink exceeded my expectations. The platform made it easy to understand complex research and connect with experts who genuinely care about patient outcomes."
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-hero">
          <div className="hero-badge">
            <Microscope className="icon-sm" />
            Connecting Healthcare Research
          </div>
          
          <h1 className="hero-title">
            Discover Clinical Trials,<br />
            <span className="gradient-text">Connect with Experts</span>
          </h1>
          
          <p className="hero-description">
            CuraLink bridges the gap between patients seeking treatments and researchers 
            advancing medical science. Find clinical trials, connect with health experts, 
            and access cutting-edge research.
          </p>

          <div className="cta-buttons">
            <Button 
              data-testid="patient-cta-btn"
              size="lg" 
              className="cta-primary"
              onClick={() => window.location.href = AUTH_URL}
            >
              <Stethoscope className="icon-sm" />
              I'm a Patient or Caregiver
            </Button>
            
            <Button 
              data-testid="researcher-cta-btn"
              size="lg" 
              variant="outline" 
              className="cta-secondary"
              onClick={() => window.location.href = AUTH_URL}
            >
              <Microscope className="icon-sm" />
              I'm a Researcher
            </Button>
          </div>

          <div className="signin-section">
            <div className="signin-divider">
              <span>or</span>
            </div>
            <p className="signin-quote">
              "Continue your journey to better health outcomes"
            </p>
            <button 
              className="signin-button"
              onClick={() => window.location.href = AUTH_URL}
            >
              <User className="icon-sm" />
              Already have an account? <strong>Sign In</strong>
            </button>
            <p className="signin-subtext">
              Access your saved trials, appointments, and consultations
            </p>
          </div>
        </div>

        {/* What We Do Section */}
        <div className="what-we-do-section scroll-animate scroll-fade-up">
          <h2 className="section-title">What We Do</h2>
          
          <div className="what-we-do-grid">
            <div className="what-we-do-card scroll-animate scroll-scale">
              <div className="what-icon">
                <Star className="w-8 h-8" />
              </div>
              <h3>AI Summaries</h3>
              <p>Human-friendly summaries of clinical trials and publications so both patients and researchers grasp the essentials quickly.</p>
            </div>

            <div className="what-we-do-card scroll-animate scroll-scale">
              <div className="what-icon">
                <Search className="w-8 h-8" />
              </div>
              <h3>Find Trials</h3>
              <p>Search and filter trials by condition, phase, and location with personalized recommendations based on your profile.</p>
            </div>

            <div className="what-we-do-card scroll-animate scroll-scale">
              <div className="what-icon">
                <Users className="w-8 h-8" />
              </div>
              <h3>Connect with Experts</h3>
              <p>Discover specialists, follow their work, and request meetings when available on the platform.</p>
            </div>
          </div>
        </div>

        {/* Trusted By Section */}
        <div className="trusted-by-section scroll-animate scroll-scale">
          <div className="trusted-content scroll-animate scroll-slide-left">
            <h2 className="trusted-title">Trusted by clinicians & patients</h2>
            <p className="trusted-description">
              Evidence-driven matches and clear summaries to support informed decisions.
            </p>
          </div>
          <div className="stats-grid scroll-animate scroll-slide-right">
            <div className="stat-card">
              <div className="stat-number">1.2k+</div>
              <div className="stat-label">Trials surfaced</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">800+</div>
              <div className="stat-label">Experts in network</div>
            </div>
          </div>
        </div>

        <div className="feature-grid scroll-animate scroll-fade-up">
          <div className="feature-card scroll-animate scroll-scale">
            <div className="feature-icon">
              <Search />
            </div>
            <h3>Find Clinical Trials</h3>
            <p>Access thousands of clinical trials tailored to your condition</p>
          </div>
          
          <div className="feature-card scroll-animate scroll-scale">
            <div className="feature-icon">
              <Users />
            </div>
            <h3>Connect with Experts</h3>
            <p>Reach health experts and researchers in your area of interest</p>
          </div>
          
          <div className="feature-card scroll-animate scroll-scale">
            <div className="feature-icon">
              <BookOpen />
            </div>
            <h3>Latest Research</h3>
            <p>Stay updated with cutting-edge medical publications</p>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="testimonials-section scroll-animate scroll-fade-up">
          <h2 className="section-title">What Our Community Says</h2>
          <p className="section-subtitle">
            Trusted by patients and researchers worldwide
          </p>

          <div className="testimonials-carousel">
            <button 
              className="carousel-btn carousel-btn-prev"
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
            >
              <ChevronLeft />
            </button>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <img 
                  src={testimonials[currentTestimonial].image} 
                  alt={testimonials[currentTestimonial].name}
                  className="testimonial-avatar"
                />
                <div className="testimonial-info">
                  <h4 className="testimonial-name">{testimonials[currentTestimonial].name}</h4>
                  <p className="testimonial-role">{testimonials[currentTestimonial].role}</p>
                  <div className="testimonial-rating">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`star-icon ${i < testimonials[currentTestimonial].rating ? 'star-filled' : 'star-empty'}`}
                        fill={i < testimonials[currentTestimonial].rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="testimonial-text">"{testimonials[currentTestimonial].text}"</p>
              
              <div className="testimonial-dots">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentTestimonial ? 'dot-active' : ''}`}
                    onClick={() => setCurrentTestimonial(index)}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <button 
              className="carousel-btn carousel-btn-next"
              onClick={nextTestimonial}
              aria-label="Next testimonial"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Onboarding
const Onboarding = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleRoleSelect = async (selectedRole) => {
    console.log('Selecting role:', selectedRole);
    try {
      await api.post('/auth/role', { role: selectedRole });
      // Refresh user data
      const response = await api.get('/auth/me');
      console.log('User after role set:', response.data);
      setUser(response.data);
      
      // ALWAYS go to profile setup after role selection
      const targetUrl = '/profile-setup?role=' + selectedRole;
      console.log('Navigating to:', targetUrl);
      navigate(targetUrl, { replace: true });
    } catch (error) {
      console.error('Role selection error:', error);
      if (error.response?.status === 400) {
        toast.error('Role already set. Cannot change role.');
        navigate('/dashboard', { replace: true });
      } else {
        toast.error('Failed to set role');
      }
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <h1>Welcome to CuraLink!</h1>
        <p className="onboarding-subtitle">Choose your role - this cannot be changed later</p>

        <div className="role-cards">
          <div 
            data-testid="patient-role-card"
            className="role-card"
            onClick={() => handleRoleSelect('patient')}
          >
            <Stethoscope className="role-icon" />
            <h3>Patient or Caregiver</h3>
            <p>Find clinical trials, connect with health experts, and access research</p>
          </div>

          <div 
            data-testid="researcher-role-card"
            className="role-card"
            onClick={() => handleRoleSelect('researcher')}
          >
            <Microscope className="role-icon" />
            <h3>Researcher</h3>
            <p>Manage trials, find collaborators, and engage with the community</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Setup
const ProfileSetup = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const setupRole = searchParams.get('role'); // patient or researcher
  
  const [formData, setFormData] = useState({
    conditions: [],
    location: '',
    name: '',
    specialties: [],
    research_interests: [],
    age: '',
    years_experience: '',
    sector: '',
    available_hours: '',
    bio: ''
  });
  const [conditionInput, setConditionInput] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const isPatient = setupRole === 'patient';

  console.log('ProfileSetup Debug:', {
    setupRole,
    isPatient,
    userRoles: user?.roles,
    searchParams: location.search
  });

  const handleAddTag = (field, input, setInput) => {
    if (input.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], input.trim()]
      }));
      setInput('');
    }
  };

  const handleRemoveTag = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting profile:', formData);
    try {
      const endpoint = isPatient ? '/patient/profile' : '/researcher/profile';
      
      // Prepare data based on role
      let dataToSend;
      if (isPatient) {
        // Only send patient-specific fields
        dataToSend = {
          conditions: formData.conditions,
          location: formData.location,
          interests: formData.interests
        };
      } else {
        // Send researcher-specific fields with proper type conversion
        dataToSend = {
          name: formData.name,
          age: formData.age ? parseInt(formData.age) : undefined,
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : undefined,
          sector: formData.sector,
          available_hours: formData.available_hours,
          specialties: formData.specialties,
          research_interests: formData.research_interests,
          bio: formData.bio
        };
      }
      
      const response = await api.post(endpoint, dataToSend);
      console.log('Profile creation response:', response.data);
      
      if (!isPatient) {
        toast.success('Profile created! You are now listed in Health Experts directory.');
      } else {
        toast.success('Profile created successfully!');
      }
      
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } catch (error) {
      console.error('Profile creation error:', error);
      
      let errorMessage = 'Failed to create profile';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(err => err.msg || JSON.stringify(err)).join(', ');
        }
      }
      
      toast.error(errorMessage);
    }
  };

  return (
    <div className="profile-setup-page">
      <div className="profile-setup-container">
        <h1>Set Up Your Profile</h1>
        <p className="profile-subtitle">
          {isPatient 
            ? 'Tell us about your medical interests to get personalized recommendations'
            : 'Share your expertise to connect with collaborators and patients'}
        </p>

        <form data-testid="profile-setup-form" onSubmit={handleSubmit} className="profile-form">
          {isPatient ? (
            <>
              <div className="form-group">
                <label>Medical Conditions or Interests</label>
                <p className="field-hint">Enter conditions you're interested in (e.g., "Brain Cancer", "Lung Cancer")</p>
                <div className="tag-input">
                  <Input
                    data-testid="condition-input"
                    placeholder="Type a condition and press Enter"
                    value={conditionInput}
                    onChange={(e) => setConditionInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag('conditions', conditionInput, setConditionInput);
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleAddTag('conditions', conditionInput, setConditionInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="tags">
                  {formData.conditions.map((condition, index) => (
                    <Badge key={index} variant="secondary">
                      {condition}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag('conditions', index)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Location</label>
                <Input
                  data-testid="location-input"
                  placeholder="e.g., Boston, MA, USA"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Full Name *</label>
                <Input
                  data-testid="name-input"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Age *</label>
                <Input
                  data-testid="age-input"
                  type="number"
                  placeholder="Your age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Years of Experience *</label>
                <Input
                  data-testid="experience-input"
                  type="number"
                  placeholder="Years in medical research/practice"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Sector / Expertise Title *</label>
                <p className="field-hint">Your primary area of expertise (shown as your title)</p>
                <Input
                  data-testid="sector-input"
                  placeholder="e.g., Clinical Oncologist, Neuroscience Researcher, Cardiologist"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Available Hours *</label>
                <p className="field-hint">When are you available for consultations?</p>
                <Input
                  data-testid="hours-input"
                  placeholder="e.g., 9 AM - 5 PM EST, Flexible, Weekends Only"
                  value={formData.available_hours}
                  onChange={(e) => setFormData({ ...formData, available_hours: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Specialties</label>
                <p className="field-hint">Your areas of medical expertise (optional)</p>
                <div className="tag-input">
                  <Input
                    data-testid="specialty-input"
                    placeholder="e.g., Oncology, Neurology"
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag('specialties', specialtyInput, setSpecialtyInput);
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleAddTag('specialties', specialtyInput, setSpecialtyInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="tags">
                  {formData.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag('specialties', index)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Research Interests</label>
                <p className="field-hint">Your research focus areas (optional)</p>
                <div className="tag-input">
                  <Input
                    data-testid="interest-input"
                    placeholder="e.g., Immunotherapy, Clinical AI"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag('research_interests', interestInput, setInterestInput);
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleAddTag('research_interests', interestInput, setInterestInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="tags">
                  {formData.research_interests.map((interest, index) => (
                    <Badge key={index} variant="secondary">
                      {interest}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag('research_interests', index)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Bio (Optional)</label>
                <Textarea
                  data-testid="bio-input"
                  placeholder="Brief description of your background and expertise"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
              </div>
            </>
          )}

          <Button data-testid="profile-submit-btn" type="submit" size="lg" className="submit-btn">
            Complete Setup
          </Button>
        </form>
      </div>
    </div>
  );
};

// Patient Dashboard
const PatientDashboard = ({ user, logout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trials');
  const [clinicalTrials, setClinicalTrials] = useState([]);
  const [experts, setExperts] = useState([]);
  const [publications, setPublications] = useState([]);
  const [forums, setForums] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChatRooms, setActiveChatRooms] = useState([]);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [showExpertDetails, setShowExpertDetails] = useState(false);
  const [expertReviews, setExpertReviews] = useState([]);
  const [appointmentForm, setAppointmentForm] = useState({
    patient_name: '',
    condition: '',
    location: '',
    duration_suffering: ''
  });

  useEffect(() => {
    loadData();
    loadUnreadCount();
    loadActiveChatRooms();
    // Poll for notifications
    const interval = setInterval(() => {
      loadUnreadCount();
      loadActiveChatRooms();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadActiveChatRooms = async () => {
    try {
      const res = await api.get('/chat-rooms');
      setActiveChatRooms(res.data);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'trials') {
        const res = await api.get('/patient/clinical-trials');
        setClinicalTrials(res.data);
      } else if (activeTab === 'experts') {
        const res = await api.get('/patient/experts');
        setExperts(res.data);
      } else if (activeTab === 'publications') {
        const res = await api.get('/patient/publications');
        setPublications(res.data);
      } else if (activeTab === 'forums') {
        const res = await api.get('/forums');
        setForums(res.data);
      } else if (activeTab === 'favorites') {
        const res = await api.get('/favorites');
        setFavorites(res.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (itemType, itemId) => {
    try {
      await api.post('/favorites', { item_type: itemType, item_id: itemId });
      toast.success('Added to favorites');
    } catch (error) {
      toast.error('Failed to add to favorites');
    }
  };

  const requestAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments/request', {
        researcher_id: selectedExpert.user_id,
        ...appointmentForm
      });
      toast.success('Appointment request sent!');
      setShowAppointmentDialog(false);
      setShowExpertDetails(false);
      setAppointmentForm({ patient_name: '', condition: '', location: '', duration_suffering: '' });
    } catch (error) {
      toast.error('Failed to send appointment request');
    }
  };

  const viewExpertDetails = async (expert) => {
    setSelectedExpert(expert);
    // Load reviews
    if (expert.user_id) {
      try {
        const res = await api.get(`/reviews/researcher/${expert.user_id}`);
        setExpertReviews(res.data.reviews || []);
      } catch (error) {
        console.error('Failed to load reviews:', error);
      }
    }
    setShowExpertDetails(true);
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Microscope className="brand-icon" />
          <span>CuraLink</span>
        </div>
        <div className="nav-actions">
          <Button variant="ghost" onClick={() => navigate('/qa-community')}>
            <HelpCircle className="icon-sm" />
            Q&A Community
          </Button>
          <Button variant="ghost" onClick={() => navigate('/notifications')} className="relative">
            <Bell className="icon-sm" />
            {unreadCount > 0 && (
              <Badge className="notification-badge">{unreadCount}</Badge>
            )}
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
        <div data-testid="patient-dashboard" className="dashboard-content">
          <div className="dashboard-header">
            <div>
              <h1>Welcome back, {user.name.split(' ')[0]}!</h1>
              <p className="dashboard-subtitle">Explore clinical trials, experts, and research</p>
            </div>
          </div>

          {/* Active Consultations Section */}
          {activeChatRooms.length > 0 && (
            <div className="active-consultations mb-6">
              <h2 className="text-xl font-semibold mb-4">🟢 Active Consultations</h2>
              <div className="consultations-grid">
                {activeChatRooms.map((room) => (
                  <Card key={room.id} className="consultation-card">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={room.other_user?.picture || 'https://via.placeholder.com/40'} 
                            alt={room.other_user?.name}
                            className="consultation-avatar"
                          />
                          <div>
                            <h4 className="font-semibold">{room.other_user?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {room.appointment?.condition}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => navigate(`/chat/${room.id}`)}
                          data-testid="join-consultation-btn"
                        >
                          Join Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="dashboard-tabs">
            <TabsList>
              <TabsTrigger data-testid="trials-tab" value="trials">
                <Search className="icon-sm" />
                Clinical Trials
              </TabsTrigger>
              <TabsTrigger data-testid="experts-tab" value="experts">
                <Users className="icon-sm" />
                Health Experts
              </TabsTrigger>
              <TabsTrigger data-testid="publications-tab" value="publications">
                <FileText className="icon-sm" />
                Publications
              </TabsTrigger>
              <TabsTrigger data-testid="forums-tab" value="forums">
                <MessageSquare className="icon-sm" />
                Forums
              </TabsTrigger>
              <TabsTrigger data-testid="favorites-tab" value="favorites">
                <Star className="icon-sm" />
                Favorites
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trials">
              {loading ? (
                <div className="loading-state">Loading trials...</div>
              ) : (
                <div className="items-grid">
                  {clinicalTrials.map((trial) => (
                    <Card key={trial.id} className="item-card">
                      <CardHeader>
                        <div className="card-header-row">
                          <CardTitle className="item-title">{trial.title}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addToFavorites('trial', trial.id)}
                          >
                            <Heart className="icon-sm" />
                          </Button>
                        </div>
                        <CardDescription>
                          <Badge variant="outline">{trial.phase}</Badge>
                          <Badge className="ml-2">{trial.status}</Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="item-description">{trial.summary || trial.description}</p>
                        <div className="item-meta">
                          <span><MapPin className="icon-xs" /> {trial.location}</span>
                        </div>
                        <div className="tags">
                          {trial.disease_areas.map((area, idx) => (
                            <Badge key={idx} variant="secondary">{area}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="experts">
              {loading ? (
                <div className="loading-state">Loading experts...</div>
              ) : (
                <div className="items-grid">
                  {experts.map((expert) => (
                    <Card key={expert.id} className="item-card">
                      <CardHeader>
                        <div className="card-header-row">
                          <CardTitle className="item-title">{expert.name}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addToFavorites('expert', expert.id)}
                          >
                            <Heart className="icon-sm" />
                          </Button>
                        </div>
                        <CardDescription>{expert.specialty}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {expert.bio && <p className="item-description">{expert.bio}</p>}
                        <div className="item-meta">
                          <span><MapPin className="icon-xs" /> {expert.location}</span>
                          {expert.is_platform_member && (
                            <Badge variant="default">Platform Member</Badge>
                          )}
                        </div>
                        {expert.average_rating > 0 && (
                          <div className="rating-display">
                            <Star className="star-filled" />
                            <span className="rating-text">
                              {expert.average_rating} ({expert.total_reviews} reviews)
                            </span>
                          </div>
                        )}
                        <div className="tags">
                          {expert.research_areas.map((area, idx) => (
                            <Badge key={idx} variant="secondary">{area}</Badge>
                          ))}
                        </div>
                        {expert.is_platform_member && (
                          <Button 
                            className="w-full mt-3"
                            onClick={() => viewExpertDetails(expert)}
                          >
                            <Calendar className="icon-sm mr-1" />
                            View Details & Book
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="publications">
              {loading ? (
                <div className="loading-state">Loading publications...</div>
              ) : (
                <div className="items-grid">
                  {publications.map((pub) => (
                    <Card key={pub.id} className="item-card">
                      <CardHeader>
                        <div className="card-header-row">
                          <CardTitle className="item-title">{pub.title}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addToFavorites('publication', pub.id)}
                          >
                            <Heart className="icon-sm" />
                          </Button>
                        </div>
                        <CardDescription>
                          {pub.journal} • {pub.year}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="item-authors">{pub.authors.join(', ')}</p>
                        <p className="item-description">{pub.summary || pub.abstract.slice(0, 200) + '...'}</p>
                        <div className="tags">
                          {pub.disease_areas.map((area, idx) => (
                            <Badge key={idx} variant="secondary">{area}</Badge>
                          ))}
                        </div>
                        {pub.url && (
                          <a href={pub.url} target="_blank" rel="noopener noreferrer" className="item-link">
                            View Publication →
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="forums">
              {loading ? (
                <div className="loading-state">Loading forums...</div>
              ) : (
                <div className="items-grid">
                  {forums.map((forum) => (
                    <Card key={forum.id} className="item-card clickable">
                      <CardHeader>
                        <CardTitle className="item-title">{forum.name}</CardTitle>
                        <CardDescription>{forum.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="item-meta">
                          <Badge>{forum.category}</Badge>
                          <span>{forum.post_count} posts</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites">
              {loading ? (
                <div className="loading-state">Loading favorites...</div>
              ) : favorites.length === 0 ? (
                <div className="empty-state">
                  <Star className="empty-icon" />
                  <h3>No favorites yet</h3>
                  <p>Start adding trials, experts, and publications to your favorites</p>
                </div>
              ) : (
                <div className="items-grid">
                  {favorites.map((fav) => (
                    <Card key={fav.favorite_id} className="item-card">
                      <CardHeader>
                        <CardTitle className="item-title">
                          {fav.item.title || fav.item.name}
                        </CardTitle>
                        <CardDescription>
                          <Badge>{fav.item_type}</Badge>
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Expert Details Dialog */}
      <Dialog open={showExpertDetails} onOpenChange={setShowExpertDetails}>
        <DialogContent className="expert-details-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedExpert?.name}</DialogTitle>
            <CardDescription>{selectedExpert?.specialty}</CardDescription>
          </DialogHeader>
          
          {selectedExpert && (
            <div className="expert-details-content">
              <div className="expert-info-section">
                <h3 className="section-title">Professional Information</h3>
                <div className="info-grid">
                  {selectedExpert.age && (
                    <div className="info-item">
                      <span className="info-label">Age:</span>
                      <span className="info-value">{selectedExpert.age} years</span>
                    </div>
                  )}
                  {selectedExpert.years_experience && (
                    <div className="info-item">
                      <span className="info-label">Experience:</span>
                      <span className="info-value">{selectedExpert.years_experience} years</span>
                    </div>
                  )}
                  {selectedExpert.sector && (
                    <div className="info-item">
                      <span className="info-label">Sector:</span>
                      <span className="info-value">{selectedExpert.sector}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{selectedExpert.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Location:</span>
                    <span className="info-value">{selectedExpert.location}</span>
                  </div>
                  {selectedExpert.available_hours && (
                    <div className="info-item">
                      <span className="info-label">Available Hours:</span>
                      <span className="info-value">{selectedExpert.available_hours}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedExpert.bio && (
                <div className="expert-info-section">
                  <h3 className="section-title">About</h3>
                  <p className="bio-text">{selectedExpert.bio}</p>
                </div>
              )}

              {selectedExpert.research_areas && selectedExpert.research_areas.length > 0 && (
                <div className="expert-info-section">
                  <h3 className="section-title">Research Areas</h3>
                  <div className="tags">
                    {selectedExpert.research_areas.map((area, idx) => (
                      <Badge key={idx} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedExpert.average_rating > 0 && (
                <div className="expert-info-section">
                  <h3 className="section-title">Rating</h3>
                  <div className="rating-display-large">
                    <Star className="star-large-filled" />
                    <span className="rating-text-large">
                      {selectedExpert.average_rating} / 5.0
                    </span>
                    <span className="rating-count">({selectedExpert.total_reviews} reviews)</span>
                  </div>
                </div>
              )}

              {expertReviews.length > 0 && (
                <div className="expert-info-section">
                  <h3 className="section-title">Patient Reviews</h3>
                  <div className="reviews-list">
                    {expertReviews.slice(0, 3).map((review, idx) => (
                      <Card key={idx} className="review-card">
                        <CardContent className="pt-4">
                          <div className="review-rating">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`review-star ${i < review.rating ? 'filled' : ''}`}
                              />
                            ))}
                            <span className="review-date">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="review-comment">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                className="w-full mt-4" 
                size="lg"
                onClick={() => {
                  setShowExpertDetails(false);
                  setShowAppointmentDialog(true);
                }}
              >
                <Calendar className="icon-sm mr-2" />
                Request Appointment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment Request Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent className="dialog-content">
          <DialogHeader>
            <DialogTitle>Request Appointment</DialogTitle>
            <DialogDescription>
              Request a consultation with {selectedExpert?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={requestAppointment} className="trial-form">
            <Input
              placeholder="Your Name"
              value={appointmentForm.patient_name}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, patient_name: e.target.value })}
              required
            />
            <Input
              placeholder="Condition or Medical Concern"
              value={appointmentForm.condition}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, condition: e.target.value })}
              required
            />
            <Input
              placeholder="Your Location"
              value={appointmentForm.location}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, location: e.target.value })}
              required
            />
            <Input
              placeholder="How long have you been experiencing this? (e.g., 6 months)"
              value={appointmentForm.duration_suffering}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, duration_suffering: e.target.value })}
              required
            />
            <Button type="submit">Send Request</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Researcher Dashboard
const ResearcherDashboard = ({ user, logout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('collaborators');
  const [collaborators, setCollaborators] = useState([]);
  const [myTrials, setMyTrials] = useState([]);
  const [forums, setForums] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTrialDialog, setShowTrialDialog] = useState(false);
  const [trialForm, setTrialForm] = useState({
    title: '',
    description: '',
    phase: '',
    status: '',
    location: '',
    eligibility: '',
    disease_areas: [],
    contact_email: ''
  });

  useEffect(() => {
    loadData();
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'collaborators') {
        const res = await api.get('/researcher/collaborators');
        setCollaborators(res.data);
      } else if (activeTab === 'trials') {
        const res = await api.get('/researcher/trials');
        setMyTrials(res.data);
      } else if (activeTab === 'forums') {
        const res = await api.get('/forums');
        setForums(res.data);
      } else if (activeTab === 'favorites') {
        const res = await api.get('/favorites');
        setFavorites(res.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTrial = async (e) => {
    e.preventDefault();
    try {
      await api.post('/researcher/trial', trialForm);
      toast.success('Clinical trial created successfully');
      setShowTrialDialog(false);
      setTrialForm({
        title: '',
        description: '',
        phase: '',
        status: '',
        location: '',
        eligibility: '',
        disease_areas: [],
        contact_email: ''
      });
      loadData();
    } catch (error) {
      toast.error('Failed to create trial');
    }
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Microscope className="brand-icon" />
          <span>CuraLink</span>
        </div>
        <div className="nav-actions">
          <Button variant="ghost" onClick={() => navigate('/qa-community')}>
            <HelpCircle className="icon-sm" />
            Q&A Community
          </Button>
          <Button variant="ghost" onClick={() => navigate('/notifications')} className="relative">
            <Bell className="icon-sm" />
            {unreadCount > 0 && (
              <Badge className="notification-badge">{unreadCount}</Badge>
            )}
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
        <div data-testid="researcher-dashboard" className="dashboard-content">
          <div className="dashboard-header">
            <div>
              <h1>Welcome back, {user.name.split(' ')[0]}!</h1>
              <p className="dashboard-subtitle">Manage trials, collaborate, and engage</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="dashboard-tabs">
            <TabsList>
              <TabsTrigger data-testid="collaborators-tab" value="collaborators">
                <Users className="icon-sm" />
                Collaborators
              </TabsTrigger>
              <TabsTrigger data-testid="trials-tab" value="trials">
                <Search className="icon-sm" />
                My Trials
              </TabsTrigger>
              <TabsTrigger data-testid="forums-tab" value="forums">
                <MessageSquare className="icon-sm" />
                Forums
              </TabsTrigger>
              <TabsTrigger data-testid="favorites-tab" value="favorites">
                <Star className="icon-sm" />
                Favorites
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collaborators">
              {loading ? (
                <div className="loading-state">Loading collaborators...</div>
              ) : (
                <div className="items-grid">
                  {collaborators.map((collab) => (
                    <Card key={collab.user_id} className="item-card">
                      <CardHeader>
                        <div className="collab-header">
                          {collab.picture && (
                            <img src={collab.picture} alt={collab.name} className="collab-avatar" />
                          )}
                          <div>
                            <CardTitle className="item-title">{collab.name}</CardTitle>
                            <CardDescription>{collab.email}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {collab.bio && <p className="item-description">{collab.bio}</p>}
                        <div className="tags">
                          {collab.specialties?.map((spec, idx) => (
                            <Badge key={idx} variant="secondary">{spec}</Badge>
                          ))}
                        </div>
                        <div className="tags">
                          {collab.research_interests?.map((interest, idx) => (
                            <Badge key={idx} variant="outline">{interest}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trials">
              <div className="tab-header">
                <Dialog open={showTrialDialog} onOpenChange={setShowTrialDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="create-trial-btn">
                      <Plus className="icon-sm" />
                      Create Trial
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dialog-content">
                    <DialogHeader>
                      <DialogTitle>Create Clinical Trial</DialogTitle>
                      <DialogDescription>
                        Add details about your clinical trial
                      </DialogDescription>
                    </DialogHeader>
                    <form data-testid="trial-form" onSubmit={createTrial} className="trial-form">
                      <Input
                        data-testid="trial-title-input"
                        placeholder="Trial Title"
                        value={trialForm.title}
                        onChange={(e) => setTrialForm({ ...trialForm, title: e.target.value })}
                        required
                      />
                      <Textarea
                        data-testid="trial-description-input"
                        placeholder="Description"
                        value={trialForm.description}
                        onChange={(e) => setTrialForm({ ...trialForm, description: e.target.value })}
                        required
                        rows={4}
                      />
                      <Input
                        data-testid="trial-phase-input"
                        placeholder="Phase (e.g., Phase III)"
                        value={trialForm.phase}
                        onChange={(e) => setTrialForm({ ...trialForm, phase: e.target.value })}
                        required
                      />
                      <Input
                        data-testid="trial-status-input"
                        placeholder="Status (e.g., Recruiting)"
                        value={trialForm.status}
                        onChange={(e) => setTrialForm({ ...trialForm, status: e.target.value })}
                        required
                      />
                      <Input
                        data-testid="trial-location-input"
                        placeholder="Location"
                        value={trialForm.location}
                        onChange={(e) => setTrialForm({ ...trialForm, location: e.target.value })}
                        required
                      />
                      <Input
                        data-testid="trial-eligibility-input"
                        placeholder="Eligibility Criteria"
                        value={trialForm.eligibility}
                        onChange={(e) => setTrialForm({ ...trialForm, eligibility: e.target.value })}
                        required
                      />
                      <Input
                        data-testid="trial-email-input"
                        placeholder="Contact Email"
                        type="email"
                        value={trialForm.contact_email}
                        onChange={(e) => setTrialForm({ ...trialForm, contact_email: e.target.value })}
                      />
                      <Button data-testid="submit-trial-btn" type="submit">Create Trial</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="loading-state">Loading trials...</div>
              ) : myTrials.length === 0 ? (
                <div className="empty-state">
                  <Search className="empty-icon" />
                  <h3>No trials yet</h3>
                  <p>Create your first clinical trial</p>
                </div>
              ) : (
                <div className="items-grid">
                  {myTrials.map((trial) => (
                    <Card key={trial.id} className="item-card">
                      <CardHeader>
                        <CardTitle className="item-title">{trial.title}</CardTitle>
                        <CardDescription>
                          <Badge variant="outline">{trial.phase}</Badge>
                          <Badge className="ml-2">{trial.status}</Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="item-description">{trial.summary || trial.description}</p>
                        <div className="item-meta">
                          <span><MapPin className="icon-xs" /> {trial.location}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="forums">
              {loading ? (
                <div className="loading-state">Loading forums...</div>
              ) : (
                <div className="items-grid">
                  {forums.map((forum) => (
                    <Card key={forum.id} className="item-card clickable">
                      <CardHeader>
                        <CardTitle className="item-title">{forum.name}</CardTitle>
                        <CardDescription>{forum.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="item-meta">
                          <Badge>{forum.category}</Badge>
                          <span>{forum.post_count} posts</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites">
              {loading ? (
                <div className="loading-state">Loading favorites...</div>
              ) : favorites.length === 0 ? (
                <div className="empty-state">
                  <Star className="empty-icon" />
                  <h3>No favorites yet</h3>
                  <p>Start adding collaborators and trials to your favorites</p>
                </div>
              ) : (
                <div className="items-grid">
                  {favorites.map((fav) => (
                    <Card key={fav.favorite_id} className="item-card">
                      <CardHeader>
                        <CardTitle className="item-title">
                          {fav.item.title || fav.item.name}
                        </CardTitle>
                        <CardDescription>
                          <Badge>{fav.item_type}</Badge>
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Main App
function App() {
  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <AuthContext>
          {({ user, setUser, logout }) => (
            <Routes>
              <Route path="/" element={
                user ? (
                  user.roles && user.roles.length > 0 ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />
                ) : (
                  <LandingPage />
                )
              } />
              
              <Route path="/onboarding" element={
                <ProtectedRoute user={user}>
                  <Onboarding user={user} setUser={setUser} />
                </ProtectedRoute>
              } />
              
              <Route path="/profile-setup" element={
                <ProtectedRoute user={user}>
                  <ProfileSetup user={user} />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute user={user}>
                  {user?.roles?.includes('patient') ? (
                    <PatientDashboard user={user} logout={logout} />
                  ) : user?.roles?.includes('researcher') ? (
                    <ResearcherDashboard user={user} logout={logout} />
                  ) : (
                    <Navigate to="/onboarding" replace />
                  )}
                </ProtectedRoute>
              } />
              
              <Route path="/qa-community" element={
                <ProtectedRoute user={user}>
                  <QACommunity user={user} logout={logout} />
                </ProtectedRoute>
              } />
              
              <Route path="/notifications" element={
                <ProtectedRoute user={user}>
                  <Notifications user={user} logout={logout} />
                </ProtectedRoute>
              } />
              
              <Route path="/chat/:roomId" element={
                <ProtectedRoute user={user}>
                  <ChatRoom user={user} logout={logout} />
                </ProtectedRoute>
              } />
            </Routes>
          )}
        </AuthContext>
      </BrowserRouter>
    </div>
  );
}

export default App;
