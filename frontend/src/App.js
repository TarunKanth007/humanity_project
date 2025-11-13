import { useState, useEffect, useRef } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Heart, Search, Users, FileText, MessageSquare, Star, Plus, Send, LogOut, User, Microscope, Stethoscope, BookOpen, MapPin, Filter, HelpCircle, Bell, Calendar, ChevronLeft, ChevronRight, Trash2, Edit, Save, X, Phone, CheckCircle, Clock, Activity } from "lucide-react";
import { QACommunity } from "@/components/QACommunity";
import { Notifications } from "@/components/Notifications";
import { ChatRoom } from "@/components/ChatRoom";
import { ForumDiscussion } from "@/components/ForumDiscussion";

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
          <img src="/logo.svg" alt="CuraLink Logo" className="hero-logo" />
          
          <div className="hero-badge">
            <Microscope className="icon-sm" />
            Connecting Healthcare Research
          </div>
          
          <h1 className="hero-title">
            <span className="gradient-text">Discover Clinical Trials,</span><br />
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
  const [activeTab, setActiveTab] = useState('overview');
  const [clinicalTrials, setClinicalTrials] = useState([]);
  const [experts, setExperts] = useState([]);
  const [publications, setPublications] = useState([]);
  const [forums, setForums] = useState([]);
  const [forumMemberships, setForumMemberships] = useState({});
  const [forumFavorites, setForumFavorites] = useState({});
  const [selectedForum, setSelectedForum] = useState(null);
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
  const [profileData, setProfileData] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [userActivity, setUserActivity] = useState(null);
  const [conditionInput, setConditionInput] = useState('');
  
  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Overview/Featured section states
  const [overviewData, setOverviewData] = useState(null);
  
  // Enhanced researcher profile states
  const [researcherDetails, setResearcherDetails] = useState(null);
  const [showResearcherDetails, setShowResearcherDetails] = useState(false);
  
  // Favorite status tracking
  const [favoritedItems, setFavoritedItems] = useState({});
  
  // Pagination states
  const [trialsPage, setTrialsPage] = useState(1);
  const [pubsPage, setPubsPage] = useState(1);
  const [loadingMoreTrials, setLoadingMoreTrials] = useState(false);
  const [loadingMorePubs, setLoadingMorePubs] = useState(false);

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

  // Magnetic cursor effect and parallax scroll for tabs
  useEffect(() => {
    const tabs = document.querySelectorAll('.dashboard-tabs [role="tab"]');
    const tabList = document.querySelector('.dashboard-tabs [role="tablist"]');
    
    // Magnetic cursor effect - text moves slightly with cursor
    const handleMouseMove = (e) => {
      tabs.forEach(tab => {
        const rect = tab.getBoundingClientRect();
        const tabCenterX = rect.left + rect.width / 2;
        const tabCenterY = rect.top + rect.height / 2;
        
        // Calculate distance from cursor to tab center
        const deltaX = (e.clientX - tabCenterX) / 30; // Gentle movement
        const deltaY = (e.clientY - tabCenterY) / 30;
        
        const distance = Math.sqrt(
          Math.pow(e.clientX - tabCenterX, 2) + 
          Math.pow(e.clientY - tabCenterY, 2)
        );
        
        // Apply magnetic effect within 200px radius
        if (distance < 200) {
          tab.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        } else {
          tab.style.transform = '';
        }
      });
    };
    
    const handleMouseLeave = () => {
      tabs.forEach(tab => {
        tab.style.transform = '';
      });
    };
    
    // Parallax scroll effect - text shifts smoothly with scroll
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (tabList) {
        // Smooth parallax movement based on scroll
        const parallaxOffset = scrollY * 0.03; // Subtle movement
        tabList.style.transform = `translateY(${parallaxOffset}px)`;
      }
    };
    
    if (tabList) {
      tabList.addEventListener('mousemove', handleMouseMove);
      tabList.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        tabList.removeEventListener('mousemove', handleMouseMove);
        tabList.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

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
      if (activeTab === 'overview') {
        const res = await api.get('/patient/overview');
        setOverviewData(res.data);
      } else if (activeTab === 'trials') {
        const res = await api.get('/patient/clinical-trials');
        setClinicalTrials(res.data);
        // Load favorite statuses for trials
        await loadFavoriteStatuses(res.data, 'trial');
      } else if (activeTab === 'experts') {
        const res = await api.get('/patient/experts');
        setExperts(res.data);
        // Load favorite statuses for experts
        await loadFavoriteStatuses(res.data, 'expert');
      } else if (activeTab === 'publications') {
        const res = await api.get('/patient/publications');
        setPublications(res.data);
        // Load favorite statuses for publications
        await loadFavoriteStatuses(res.data, 'publication');
      } else if (activeTab === 'forums') {
        const res = await api.get('/forums');
        setForums(res.data);
        // Load membership status and favorites for each forum
        await loadForumMemberships(res.data);
        await loadForumFavorites(res.data);
      } else if (activeTab === 'favorites') {
        const res = await api.get('/favorites');
        setFavorites(res.data);
        // Update favorited items state for all loaded favorites
        const favoritedIds = {};
        res.data.forEach(fav => {
          if (fav.item?.id) {
            favoritedIds[fav.item.id] = true;
          }
        });
        setFavoritedItems(prev => ({ ...prev, ...favoritedIds }));
      } else if (activeTab === 'profile') {
        // Load profile data
        const profileRes = await api.get('/patient/profile');
        setProfileData(profileRes.data);
        setEditedProfile(profileRes.data || {});
        
        // Load activity data
        const activityRes = await api.get('/profile/activity');
        setUserActivity(activityRes.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async (itemType, itemId) => {
    try {
      const res = await api.get(`/favorites/check/${itemType}/${itemId}`);
      return res.data.is_favorited;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  };

  const loadFavoriteStatuses = async (items, itemType) => {
    // Load favorite statuses in parallel for speed
    const statusPromises = items.map(item => 
      checkFavoriteStatus(itemType, item.id)
        .then(isFavorited => ({ id: item.id, isFavorited }))
        .catch(() => ({ id: item.id, isFavorited: false }))
    );
    
    const statusResults = await Promise.all(statusPromises);
    
    const statuses = {};
    statusResults.forEach(({ id, isFavorited }) => {
      statuses[id] = isFavorited;
    });
    
    setFavoritedItems(prev => ({ ...prev, ...statuses }));
  };

  const addToFavorites = async (itemType, itemId, itemData = null) => {
    try {
      // Check if already favorited
      const checkRes = await api.get(`/favorites/check/${itemType}/${itemId}`);
      
      if (checkRes.data.is_favorited) {
        // Remove from favorites
        await api.delete(`/favorites/${checkRes.data.favorite_id}`);
        toast.success('Removed from favorites');
        // Update state immediately for visual feedback
        setFavoritedItems(prev => ({ ...prev, [itemId]: false }));
        // Reload data to update UI
        if (activeTab === 'favorites') {
          loadData();
        }
      } else {
        // Add to favorites with item data for API-fetched items
        await api.post('/favorites', { 
          item_type: itemType, 
          item_id: itemId,
          item_data: itemData  // Include full item for API-fetched content
        });
        toast.success('Added to favorites');
        // Update state immediately for visual feedback
        setFavoritedItems(prev => ({ ...prev, [itemId]: true }));
      }
    } catch (error) {
      console.error('Favorite toggle error:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleJoinGroup = async (forumId) => {
    try {
      await api.post(`/forums/${forumId}/join`);
      toast.success('Successfully joined the group!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (forumId) => {
    try {
      await api.delete(`/forums/${forumId}/leave`);
      toast.success('Left the group');
      loadData();
    } catch (error) {
      toast.error('Failed to leave group');
    }
  };
  const loadForumFavorites = async (forumsList) => {
    try {
      const favStatus = {};
      for (const forum of forumsList) {
        const res = await api.get(`/favorites/check/forum/${forum.id}`);
        favStatus[forum.id] = res.data;
      }
      setForumFavorites(favStatus);
    } catch (error) {
      console.error('Failed to load forum favorites:', error);
    }
  };

  // handleAddSpecialty removed from PatientDashboard

  // handleRemoveSpecialty removed from PatientDashboard

  // handleAddInterest removed from PatientDashboard

  // handleRemoveInterest removed from PatientDashboard

  const handleToggleFavorite = async (forumId) => {
    try {
      const currentFav = forumFavorites[forumId];
      
      if (currentFav?.is_favorited) {
        // Remove from favorites
        await api.delete(`/favorites/${currentFav.favorite_id}`);
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        await api.post('/favorites', {
          item_type: 'forum',
          item_id: forumId
        });
        toast.success('Added to favorites');
      }
      
      // Reload favorites status
      await loadForumFavorites(forums);
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const loadForumMemberships = async (forumsList) => {
    try {
      const memberships = {};
      for (const forum of forumsList) {
        const res = await api.get(`/forums/${forum.id}/membership`);
        memberships[forum.id] = res.data;
      }
      setForumMemberships(memberships);
    } catch (error) {
      console.error('Failed to load memberships:', error);
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

  const handleSaveProfile = async () => {
    try {
      await api.put('/patient/profile', editedProfile);
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
      setProfileData(editedProfile);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAddCondition = () => {
    if (conditionInput.trim()) {
      setEditedProfile({
        ...editedProfile,
        conditions: [...(editedProfile.conditions || []), conditionInput.trim()]
      });
      setConditionInput('');
    }
  };

  const handleRemoveCondition = (index) => {
    const updated = [...(editedProfile.conditions || [])];
    updated.splice(index, 1);
    setEditedProfile({ ...editedProfile, conditions: updated });
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await api.post('/search', {
        query: searchQuery,
        filters: {}
      });
      setSearchResults(res.data);
      
      // Load favorite statuses for search results
      if (res.data.researchers) await loadFavoriteStatuses(res.data.researchers, 'expert');
      if (res.data.trials) await loadFavoriteStatuses(res.data.trials, 'trial');
      if (res.data.publications) await loadFavoriteStatuses(res.data.publications, 'publication');
      
      setActiveTab('search');
    } catch (error) {
      toast.error('Search failed. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const viewResearcherDetails = async (expert) => {
    if (!expert.user_id) {
      // If not a platform member, show basic details
      viewExpertDetails(expert);
      return;
    }
    
    try {
      const res = await api.get(`/researcher/${expert.user_id}/details`);
      setResearcherDetails(res.data);
      setShowResearcherDetails(true);
    } catch (error) {
      console.error('Failed to load researcher details:', error);
      toast.error('Failed to load researcher details');
    }
  };

  const loadMoreTrials = async () => {
    setLoadingMoreTrials(true);
    try {
      const nextPage = trialsPage + 1;
      const res = await api.get(`/patient/clinical-trials?page=${nextPage}`);
      
      // Append new trials to existing ones
      setClinicalTrials(prev => [...prev, ...res.data]);
      setTrialsPage(nextPage);
      
      // Load favorite statuses for new trials
      await loadFavoriteStatuses(res.data, 'trial');
      
      toast.success(`Loaded ${res.data.length} more trials`);
    } catch (error) {
      console.error('Failed to load more trials:', error);
      toast.error('Failed to load more trials');
    } finally {
      setLoadingMoreTrials(false);
    }
  };

  const loadMorePublications = async () => {
    setLoadingMorePubs(true);
    try {
      const nextPage = pubsPage + 1;
      const res = await api.get(`/patient/publications?page=${nextPage}`);
      
      // Append new publications to existing ones
      setPublications(prev => [...prev, ...res.data]);
      setPubsPage(nextPage);
      
      // Load favorite statuses for new publications
      await loadFavoriteStatuses(res.data, 'publication');
      
      toast.success(`Loaded ${res.data.length} more publications`);
    } catch (error) {
      console.error('Failed to load more publications:', error);
      toast.error('Failed to load more publications');
    } finally {
      setLoadingMorePubs(false);
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
        <div data-testid="patient-dashboard" className="dashboard-content">
          <div className="dashboard-header">
            <div>
              <h1>Welcome back, {user.name.split(' ')[0]}!</h1>
              <p className="dashboard-subtitle">Explore clinical trials, experts, and research</p>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '24px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', maxWidth: '800px', margin: '0 auto' }}>
              <Input
                data-testid="search-input"
                type="text"
                placeholder="Search for researchers, trials, or publications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button 
                type="submit" 
                disabled={isSearching || !searchQuery.trim()}
                data-testid="search-button"
              >
                <Search className="icon-sm" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </form>
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
              <TabsTrigger data-testid="overview-tab" value="overview">
                <Stethoscope className="icon-sm" />
                For You
              </TabsTrigger>
              {searchResults && (
                <TabsTrigger data-testid="search-tab" value="search">
                  <Search className="icon-sm" />
                  Search Results
                </TabsTrigger>
              )}
              <TabsTrigger data-testid="trials-tab" value="trials">
                <FileText className="icon-sm" />
                Clinical Trials
              </TabsTrigger>
              <TabsTrigger data-testid="experts-tab" value="experts">
                <Users className="icon-sm" />
                Health Experts
              </TabsTrigger>
              <TabsTrigger data-testid="publications-tab" value="publications">
                <BookOpen className="icon-sm" />
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
              <TabsTrigger data-testid="profile-tab" value="profile">
                <User className="icon-sm" />
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {loading ? (
                <div className="loading-state">Loading your personalized overview...</div>
              ) : overviewData ? (
                <div style={{ display: 'grid', gap: '32px' }}>
                  {/* Top Researchers Section */}
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--olive)' }}>
                      Top Rated Researchers
                    </h2>
                    {overviewData.top_researchers.length > 0 ? (
                      <div className="items-grid">
                        {overviewData.top_researchers.map((expert) => (
                          <Card key={expert.id} className="item-card">
                            <CardHeader>
                              <div className="card-header-row">
                                <CardTitle className="item-title">{expert.name}</CardTitle>
                                <Badge variant="default">⭐ {expert.average_rating}</Badge>
                              </div>
                              <CardDescription>{expert.specialty}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {expert.bio && <p className="item-description">{expert.bio.slice(0, 150)}...</p>}
                              <div className="item-meta">
                                <span><MapPin className="icon-xs" /> {expert.location}</span>
                              </div>
                              <div className="tags">
                                {expert.research_areas.slice(0, 3).map((area, idx) => (
                                  <Badge key={idx} variant="secondary">{area}</Badge>
                                ))}
                              </div>
                              <Button 
                                className="w-full mt-3"
                                onClick={() => viewResearcherDetails(expert)}
                              >
                                View Profile
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p style={{ textAlign: 'center', padding: '24px', color: 'var(--taupe)' }}>
                        No top researchers available yet
                      </p>
                    )}
                  </div>

                  {/* Featured Trials Section */}
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--olive)' }}>
                      Featured Clinical Trials
                    </h2>
                    {overviewData.featured_trials.length > 0 ? (
                      <div className="items-grid">
                        {overviewData.featured_trials.map((trial) => (
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
                              <div className="tags">
                                {trial.disease_areas.map((area, idx) => (
                                  <Badge key={idx} variant="secondary">{area}</Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p style={{ textAlign: 'center', padding: '24px', color: 'var(--taupe)' }}>
                        No featured trials available
                      </p>
                    )}
                  </div>

                  {/* Latest Publications Section */}
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--olive)' }}>
                      Latest Research Publications
                    </h2>
                    {overviewData.latest_publications.length > 0 ? (
                      <div className="items-grid">
                        {overviewData.latest_publications.map((pub) => (
                          <Card key={pub.id} className="item-card">
                            <CardHeader>
                              <CardTitle className="item-title">{pub.title}</CardTitle>
                              <CardDescription>
                                {pub.journal} • {pub.year}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="item-authors">{pub.authors.join(', ')}</p>
                              {pub.ai_summarized ? (
                                <div>
                                  <div style={{ marginBottom: '8px' }}>
                                    <span 
                                      style={{ 
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        color: '#3F51B5',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                      }}
                                    >
                                      ✨ AI Summarized
                                    </span>
                                  </div>
                                  <p 
                                    className="item-description"
                                    style={{ 
                                      background: 'linear-gradient(135deg, #3F51B5, #536DFE)',
                                      WebkitBackgroundClip: 'text',
                                      WebkitTextFillColor: 'transparent',
                                      backgroundClip: 'text',
                                      fontWeight: '500',
                                      fontSize: '15px'
                                    }}
                                  >
                                    {pub.ai_summary}
                                  </p>
                                </div>
                              ) : (
                                <p className="item-description">{pub.summary || pub.abstract.slice(0, 200) + '...'}</p>
                              )}
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
                    ) : (
                      <p style={{ textAlign: 'center', padding: '24px', color: 'var(--taupe)' }}>
                        No publications available
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <Stethoscope className="empty-icon" />
                  <h3>Loading your personalized recommendations...</h3>
                </div>
              )}
            </TabsContent>

            <TabsContent value="search">
              {searchResults && (
                <div style={{ display: 'grid', gap: '32px' }}>
                  {/* Researchers Results */}
                  {searchResults.researchers.length > 0 && (
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
                        Researchers ({searchResults.researchers.length})
                      </h2>
                      <div className="items-grid">
                        {searchResults.researchers.map((expert) => (
                          <Card key={expert.id} className="item-card">
                            <CardHeader>
                              <div className="card-header-row">
                                <div>
                                  <CardTitle className="item-title">{expert.name}</CardTitle>
                                  <Badge 
                                    variant="default" 
                                    style={{ 
                                      marginTop: '4px',
                                      background: `linear-gradient(135deg, var(--olive), var(--sage))`,
                                      color: 'white'
                                    }}
                                  >
                                    {expert.match_score}% Match
                                  </Badge>
                                </div>
                              </div>
                              <CardDescription>{expert.specialty}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {expert.bio && <p className="item-description">{expert.bio.slice(0, 150)}...</p>}
                              <div style={{ marginTop: '12px', padding: '8px', background: 'var(--cream)', borderRadius: '8px' }}>
                                <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Why this matches:</p>
                                <ul style={{ fontSize: '12px', paddingLeft: '20px', margin: 0 }}>
                                  {expert.match_reasons.slice(0, 3).map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                              <Button 
                                className="w-full mt-3"
                                onClick={() => viewResearcherDetails(expert)}
                              >
                                View Profile
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trials Results */}
                  {searchResults.trials.length > 0 && (
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
                        Clinical Trials ({searchResults.trials.length})
                      </h2>
                      <div className="items-grid">
                        {searchResults.trials.map((trial) => (
                          <Card key={trial.id} className="item-card">
                            <CardHeader>
                              <div className="card-header-row">
                                <div>
                                  <CardTitle className="item-title">{trial.title}</CardTitle>
                                  <Badge 
                                    variant="default"
                                    style={{ 
                                      marginTop: '4px',
                                      background: `linear-gradient(135deg, var(--olive), var(--sage))`,
                                      color: 'white'
                                    }}
                                  >
                                    {trial.match_score}% Match
                                  </Badge>
                                </div>
                              </div>
                              <CardDescription>
                                <Badge variant="outline">{trial.phase}</Badge>
                                <Badge className="ml-2">{trial.status}</Badge>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {trial.ai_summarized ? (
                                <div>
                                  <div style={{ marginBottom: '8px' }}>
                                    <span 
                                      style={{ 
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        color: '#3F51B5',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                      }}
                                    >
                                      ✨ AI Summarized
                                    </span>
                                  </div>
                                  <p 
                                    className="item-description"
                                    style={{ 
                                      background: 'linear-gradient(135deg, #3F51B5, #536DFE)',
                                      WebkitBackgroundClip: 'text',
                                      WebkitTextFillColor: 'transparent',
                                      backgroundClip: 'text',
                                      fontWeight: '500',
                                      fontSize: '15px'
                                    }}
                                  >
                                    {trial.ai_summary}
                                  </p>
                                </div>
                              ) : (
                                <p className="item-description">
                                  {trial.description.slice(0, 150) + '...'}
                                </p>
                              )}
                              <div style={{ marginTop: '12px', padding: '8px', background: 'var(--cream)', borderRadius: '8px' }}>
                                <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Why this matches:</p>
                                <ul style={{ fontSize: '12px', paddingLeft: '20px', margin: 0 }}>
                                  {trial.match_reasons.slice(0, 3).map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Publications Results */}
                  {searchResults.publications.length > 0 && (
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
                        Publications ({searchResults.publications.length})
                      </h2>
                      <div className="items-grid">
                        {searchResults.publications.map((pub) => (
                          <Card key={pub.id} className="item-card">
                            <CardHeader>
                              <div className="card-header-row">
                                <div>
                                  <CardTitle className="item-title">{pub.title}</CardTitle>
                                  <Badge 
                                    variant="default"
                                    style={{ 
                                      marginTop: '4px',
                                      background: `linear-gradient(135deg, var(--olive), var(--sage))`,
                                      color: 'white'
                                    }}
                                  >
                                    {pub.match_score}% Match
                                  </Badge>
                                </div>
                              </div>
                              <CardDescription>
                                {pub.journal} • {pub.year}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {pub.ai_summarized ? (
                                <div>
                                  <div style={{ marginBottom: '8px' }}>
                                    <span 
                                      style={{ 
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        color: '#3F51B5',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                      }}
                                    >
                                      ✨ AI Summarized
                                    </span>
                                  </div>
                                  <p 
                                    className="item-description"
                                    style={{ 
                                      background: 'linear-gradient(135deg, #3F51B5, #536DFE)',
                                      WebkitBackgroundClip: 'text',
                                      WebkitTextFillColor: 'transparent',
                                      backgroundClip: 'text',
                                      fontWeight: '500',
                                      fontSize: '15px'
                                    }}
                                  >
                                    {pub.ai_summary}
                                  </p>
                                </div>
                              ) : (
                                <p className="item-description">{pub.abstract.slice(0, 150)}...</p>
                              )}
                              <div style={{ marginTop: '12px', padding: '8px', background: 'var(--cream)', borderRadius: '8px' }}>
                                <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Why this matches:</p>
                                <ul style={{ fontSize: '12px', paddingLeft: '20px', margin: 0 }}>
                                  {pub.match_reasons.slice(0, 3).map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                  ))}
                                </ul>
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
                    </div>
                  )}

                  {searchResults.researchers.length === 0 && searchResults.trials.length === 0 && searchResults.publications.length === 0 && (
                    <div className="empty-state">
                      <Search className="empty-icon" />
                      <h3>No results found</h3>
                      <p>Try different search terms or browse the categories above</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

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
                            onClick={() => addToFavorites('trial', trial.id, trial)}
                          >
                            <Heart 
                              className="icon-sm" 
                              fill={favoritedItems[trial.id] ? '#3F51B5' : 'none'}
                              color={favoritedItems[trial.id] ? '#3F51B5' : 'currentColor'}
                            />
                          </Button>
                        </div>
                        <CardDescription>
                          <Badge variant="outline">{trial.phase}</Badge>
                          <Badge className="ml-2">{trial.status}</Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {trial.ai_summarized ? (
                          <div>
                            <div style={{ marginBottom: '8px' }}>
                              <span 
                                style={{ 
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: '#3F51B5',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                ✨ AI Summarized
                              </span>
                            </div>
                            <p 
                              className="item-description"
                              style={{ 
                                background: 'linear-gradient(135deg, #3F51B5, #536DFE)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontWeight: '500',
                                fontSize: '15px'
                              }}
                            >
                              {trial.ai_summary}
                            </p>
                          </div>
                        ) : (
                          <p className="item-description">
                            {trial.summary || trial.description}
                          </p>
                        )}
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
              
              {!loading && clinicalTrials.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                  <Button
                    onClick={loadMoreTrials}
                    disabled={loadingMoreTrials}
                    size="lg"
                    style={{
                      background: 'linear-gradient(135deg, #3F51B5, #536DFE)',
                      color: 'white',
                      padding: '12px 32px',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    {loadingMoreTrials ? 'Loading...' : 'Get 10 More'}
                  </Button>
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
                            onClick={() => addToFavorites('expert', expert.id, expert)}
                          >
                            <Heart 
                              className="icon-sm" 
                              fill={favoritedItems[expert.id] ? '#3F51B5' : 'none'}
                              color={favoritedItems[expert.id] ? '#3F51B5' : 'currentColor'}
                            />
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
                            onClick={() => viewResearcherDetails(expert)}
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
                            onClick={() => addToFavorites('publication', pub.id, pub)}
                          >
                            <Heart 
                              className="icon-sm" 
                              fill={favoritedItems[pub.id] ? '#3F51B5' : 'none'}
                              color={favoritedItems[pub.id] ? '#3F51B5' : 'currentColor'}
                            />
                          </Button>
                        </div>
                        <CardDescription>
                          {pub.journal} • {pub.year}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="item-authors">{pub.authors.join(', ')}</p>
                        {pub.ai_summarized ? (
                          <div>
                            <div style={{ marginBottom: '8px' }}>
                              <span 
                                style={{ 
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: '#3F51B5',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                ✨ AI Summarized
                              </span>
                            </div>
                            <p 
                              className="item-description"
                              style={{ 
                                background: 'linear-gradient(135deg, #3F51B5, #536DFE)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontWeight: '500',
                                fontSize: '15px'
                              }}
                            >
                              {pub.ai_summary}
                            </p>
                          </div>
                        ) : (
                          <p className="item-description">{pub.summary || pub.abstract.slice(0, 200) + '...'}</p>
                        )}
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
              
              {!loading && publications.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                  <Button
                    onClick={loadMorePublications}
                    disabled={loadingMorePubs}
                    size="lg"
                    style={{
                      background: 'linear-gradient(135deg, #3F51B5, #536DFE)',
                      color: 'white',
                      padding: '12px 32px',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    {loadingMorePubs ? 'Loading...' : 'Get 10 More'}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="forums">
              {selectedForum ? (
                <ForumDiscussion 
                  forum={selectedForum} 
                  user={user}
                  onBack={() => setSelectedForum(null)}
                />
              ) : loading ? (
                <div className="loading-state">Loading forums...</div>
              ) : (
                <div className="items-grid">
                  {forums.map((forum) => {
                    const membership = forumMemberships[forum.id];
                    const isMember = membership?.is_member;
                    
                    return (
                      <Card key={forum.id} className="item-card" style={{ cursor: 'pointer' }}>
                        <CardHeader onClick={() => setSelectedForum(forum)}>
                          <CardTitle className="item-title">{forum.name}</CardTitle>
                          <CardDescription>{forum.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="item-meta">
                            <Badge variant={isMember ? "default" : "outline"}>{forum.category}</Badge>
                            <span>{forum.post_count} posts</span>
                          </div>
                          
                          {isMember && (
                            <div className="forum-member-badge">
                              <Users className="icon-sm" style={{color: 'var(--olive)'}} />
                              <span style={{color: 'var(--olive)', fontWeight: 600}}>Group Member</span>
                            </div>
                          )}
                          
                          <div style={{marginTop: '16px', display: 'flex', gap: '8px'}}>
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedForum(forum);
                              }}
                              style={{
                                flex: 1,
                                background: 'var(--accent-gradient)',
                                color: 'var(--cream)'
                              }}
                            >
                              <MessageSquare className="icon-sm" />
                              View Discussions
                            </Button>
                            
                            {isMember ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeaveGroup(forum.id);
                                }}
                              >
                                Leave
                              </Button>
                            ) : (
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinGroup(forum.id);
                                }}
                              >
                                <Users className="icon-sm" />
                                Join
                              </Button>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`favorite-forum-btn-${forum.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(forum.id);
                              }}
                              style={{
                                color: forumFavorites[forum.id]?.is_favorited ? 'var(--olive)' : 'var(--taupe)'
                              }}
                            >
                              <Heart 
                                className="icon-sm" 
                                fill={forumFavorites[forum.id]?.is_favorited ? 'var(--olive)' : 'none'}
                              />
                            </Button>
                          </div>
                          
                          {!isMember && (
                            <p style={{
                              fontSize: '12px', 
                              color: 'var(--taupe)', 
                              opacity: 0.7,
                              marginTop: '8px',
                              fontStyle: 'italic'
                            }}>
                              Join this group to ask questions and share your experiences with images
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
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
                    <Popover key={fav.favorite_id}>
                      <PopoverTrigger asChild>
                        <Card className="item-card" style={{ cursor: 'pointer' }}>
                          <CardHeader>
                            <div className="card-header-row">
                              <CardTitle className="item-title">
                                {fav.item.title || fav.item.name}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToFavorites(fav.item_type, fav.item.id, fav.item);
                                }}
                              >
                                <Heart 
                                  className="icon-sm" 
                                  fill={favoritedItems[fav.item.id] !== false ? '#3F51B5' : 'none'}
                                  color={favoritedItems[fav.item.id] !== false ? '#3F51B5' : 'currentColor'}
                                />
                              </Button>
                            </div>
                            <CardDescription>
                              <Badge>{fav.item_type}</Badge>
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </PopoverTrigger>
                      <PopoverContent className="w-96" align="start">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-lg mb-2">
                              {fav.item.title || fav.item.name}
                            </h4>
                            <Badge variant="secondary">{fav.item_type}</Badge>
                          </div>
                          
                          {fav.item_type === 'trial' && (
                            <>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Phase:</strong> {fav.item.phase}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Status:</strong> {fav.item.status}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Location:</strong> {fav.item.location}
                                </p>
                              </div>
                              <p className="text-sm">{fav.item.description || fav.item.summary}</p>
                              {fav.item.disease_areas && fav.item.disease_areas.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {fav.item.disease_areas.map((area, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{area}</Badge>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                          
                          {fav.item_type === 'expert' && (
                            <>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Specialty:</strong> {fav.item.specialty}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Location:</strong> {fav.item.location}
                                </p>
                                {fav.item.available_hours && (
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <strong>Available:</strong> {fav.item.available_hours}
                                  </p>
                                )}
                                {fav.item.average_rating > 0 && (
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <strong>Rating:</strong> ⭐ {fav.item.average_rating} ({fav.item.total_reviews} reviews)
                                  </p>
                                )}
                              </div>
                              {fav.item.bio && <p className="text-sm">{fav.item.bio}</p>}
                              {fav.item.research_areas && fav.item.research_areas.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {fav.item.research_areas.map((area, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{area}</Badge>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                          
                          {fav.item_type === 'publication' && (
                            <>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Journal:</strong> {fav.item.journal}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Year:</strong> {fav.item.year}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Authors:</strong> {fav.item.authors?.join(', ')}
                                </p>
                              </div>
                              <p className="text-sm">{fav.item.summary || fav.item.abstract?.slice(0, 300) + '...'}</p>
                              {fav.item.disease_areas && fav.item.disease_areas.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {fav.item.disease_areas.map((area, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{area}</Badge>
                                  ))}
                                </div>
                              )}
                              {fav.item.url && (
                                <a 
                                  href={fav.item.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  View Publication →
                                </a>
                              )}
                            </>
                          )}
                          
                          {fav.item_type === 'forum' && (
                            <>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Category:</strong> {fav.item.category}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Posts:</strong> {fav.item.post_count || 0}
                                </p>
                                {fav.item.created_by_name && (
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <strong>Created by:</strong> {fav.item.created_by_name}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm">{fav.item.description}</p>
                            </>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              )}
            </TabsContent>

 

            <TabsContent value="profile">
              {loading ? (
                <div className="loading-state">Loading profile...</div>
              ) : (
                <div className="researcher-profile-content" style={{display: 'grid', gap: '24px'}}>
                  {/* Profile Information Card */}
                  <Card>
                    <CardHeader>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                          <CardTitle>Profile Information</CardTitle>
                          <CardDescription>Your personal details and contact information</CardDescription>
                        </div>
                        {!isEditingProfile ? (
                          <Button onClick={() => setIsEditingProfile(true)} variant="outline">
                            <Edit className="icon-sm" /> Edit Profile
                          </Button>
                        ) : (
                          <div style={{display: 'flex', gap: '8px'}}>
                            <Button onClick={handleSaveProfile}>
                              <Save className="icon-sm" /> Save
                            </Button>
                            <Button onClick={() => {
                              setIsEditingProfile(false);
                              setEditedProfile(profileData || {});
                            }} variant="outline">
                              <X className="icon-sm" /> Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div style={{display: 'flex', gap: '24px', marginBottom: '24px'}}>
                        <img src={user.picture} alt={user.name} style={{width: '80px', height: '80px', borderRadius: '50%'}} />
                        <div>
                          <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '4px'}}>{user.name}</h3>
                          <p style={{color: 'var(--taupe)', marginBottom: '8px'}}>{user.email}</p>
                          <Badge>Patient/Caregiver</Badge>
                        </div>
                      </div>

                      <div style={{display: 'grid', gap: '16px'}}>
                        <div>
                          <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>Phone Number</label>
                          {isEditingProfile ? (
                            <Input
                              placeholder="Enter phone number"
                              value={editedProfile.phone_number || ''}
                              onChange={(e) => setEditedProfile({...editedProfile, phone_number: e.target.value})}
                            />
                          ) : (
                            <p>{profileData?.phone_number || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>Location</label>
                          {isEditingProfile ? (
                            <Input
                              placeholder="Enter location"
                              value={editedProfile.location || ''}
                              onChange={(e) => setEditedProfile({...editedProfile, location: e.target.value})}
                            />
                          ) : (
                            <p>{profileData?.location || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>Medical Conditions</label>
                          {isEditingProfile ? (
                            <>
                              <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
                                <Input
                                  placeholder="Add condition"
                                  value={conditionInput}
                                  onChange={(e) => setConditionInput(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCondition())}
                                />
                                <Button onClick={handleAddCondition} type="button">Add</Button>
                              </div>
                              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                                {(editedProfile.conditions || []).map((condition, idx) => (
                                  <Badge key={idx} variant="secondary">
                                    {condition}
                                    <button
                                      onClick={() => handleRemoveCondition(idx)}
                                      style={{marginLeft: '8px', cursor: 'pointer', background: 'none', border: 'none'}}
                                    >×</button>
                                  </Badge>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                              {(profileData?.conditions || []).length > 0 ? (
                                profileData.conditions.map((condition, idx) => (
                                  <Badge key={idx} variant="secondary">{condition}</Badge>
                                ))
                              ) : (
                                <p>No conditions listed</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Progress Tracker Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Journey</CardTitle>
                      <CardDescription>Track your progress on CuraLink</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                          <CheckCircle style={{color: 'var(--olive)', width: '24px', height: '24px'}} />
                          <div>
                            <p style={{fontWeight: '600'}}>Signed Up</p>
                            <p style={{fontSize: '14px', color: 'var(--taupe)'}}>Welcome to CuraLink!</p>
                          </div>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                          <CheckCircle style={{color: 'var(--olive)', width: '24px', height: '24px'}} />
                          <div>
                            <p style={{fontWeight: '600'}}>Profile Created</p>
                            <p style={{fontSize: '14px', color: 'var(--taupe)'}}>You're all set up</p>
                          </div>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                          {userActivity?.forums_joined?.length > 0 ? (
                            <CheckCircle style={{color: 'var(--olive)', width: '24px', height: '24px'}} />
                          ) : (
                            <Clock style={{color: 'var(--taupe)', opacity: 0.5, width: '24px', height: '24px'}} />
                          )}
                          <div>
                            <p style={{fontWeight: '600'}}>Joined Forums</p>
                            <p style={{fontSize: '14px', color: 'var(--taupe)'}}>
                              {userActivity?.forums_joined?.length > 0 
                                ? `${userActivity.forums_joined.length} forums joined`
                                : 'Join forums to connect with others'}
                            </p>
                          </div>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                          {userActivity?.favorites_count > 0 ? (
                            <CheckCircle style={{color: 'var(--olive)', width: '24px', height: '24px'}} />
                          ) : (
                            <Clock style={{color: 'var(--taupe)', opacity: 0.5, width: '24px', height: '24px'}} />
                          )}
                          <div>
                            <p style={{fontWeight: '600'}}>Saved Favorites</p>
                            <p style={{fontSize: '14px', color: 'var(--taupe)'}}>
                              {userActivity?.favorites_count > 0
                                ? `${userActivity.favorites_count} items saved`
                                : 'Save trials, experts, or forums'}
                            </p>
                          </div>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                          {userActivity?.appointments?.length > 0 ? (
                            <CheckCircle style={{color: 'var(--olive)', width: '24px', height: '24px'}} />
                          ) : (
                            <Clock style={{color: 'var(--taupe)', opacity: 0.5, width: '24px', height: '24px'}} />
                          )}
                          <div>
                            <p style={{fontWeight: '600'}}>Booked Appointment</p>
                            <p style={{fontSize: '14px', color: 'var(--taupe)'}}>
                              {userActivity?.appointments?.length > 0
                                ? `${userActivity.appointments.length} appointments`
                                : 'Connect with health experts'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity History Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity History</CardTitle>
                      <CardDescription>Your recent activity on CuraLink</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="appointments" className="activity-tabs">
                        <TabsList>
                          <TabsTrigger value="appointments">
                            <Calendar className="icon-sm" /> Appointments ({userActivity?.appointments?.length || 0})
                          </TabsTrigger>
                          <TabsTrigger value="forums">
                            <MessageSquare className="icon-sm" /> Forums ({userActivity?.forums_joined?.length || 0})
                          </TabsTrigger>
                          <TabsTrigger value="reviews">
                            <Star className="icon-sm" /> Reviews ({userActivity?.reviews_given?.length || 0})
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="appointments">
                          {userActivity?.appointments?.length > 0 ? (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                              {userActivity.appointments.map((appt) => (
                                <Card key={appt.id} style={{padding: '16px'}}>
                                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <div>
                                      <p style={{fontWeight: '600'}}>{appt.researcher_name || 'Researcher'}</p>
                                      <p style={{fontSize: '14px', color: 'var(--taupe)'}}>{appt.researcher_specialty}</p>
                                      <p style={{fontSize: '14px', marginTop: '4px'}}>{appt.condition}</p>
                                    </div>
                                    <Badge variant={
                                      appt.status === 'accepted' ? 'default' :
                                      appt.status === 'pending' ? 'secondary' :
                                      appt.status === 'completed' ? 'outline' : 'destructive'
                                    }>
                                      {appt.status}
                                    </Badge>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p style={{textAlign: 'center', padding: '24px', color: 'var(--taupe)'}}>
                              No appointments yet
                            </p>
                          )}
                        </TabsContent>

                        <TabsContent value="forums">
                          {userActivity?.forums_joined?.length > 0 ? (
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px'}}>
                              {userActivity.forums_joined.map((membership) => (
                                <Card key={membership.forum_id} style={{padding: '16px'}}>
                                  <p style={{fontWeight: '600', marginBottom: '4px'}}>
                                    {membership.forum_details?.name || 'Forum'}
                                  </p>
                                  <Badge variant="outline">{membership.forum_details?.category}</Badge>
                                  <p style={{fontSize: '12px', marginTop: '8px', color: 'var(--taupe)'}}>
                                    Joined {new Date(membership.joined_at).toLocaleDateString()}
                                  </p>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p style={{textAlign: 'center', padding: '24px', color: 'var(--taupe)'}}>
                              No forums joined yet
                            </p>
                          )}
                        </TabsContent>

                        <TabsContent value="reviews">
                          {userActivity?.reviews_given?.length > 0 ? (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                              {userActivity.reviews_given.map((review) => (
                                <Card key={review.id} style={{padding: '16px'}}>
                                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className="icon-xs"
                                        fill={i < review.rating ? 'var(--olive)' : 'none'}
                                        color={i < review.rating ? 'var(--olive)' : 'var(--taupe)'}
                                      />
                                    ))}
                                  </div>
                                  <p style={{fontSize: '14px'}}>{review.text}</p>
                                  <p style={{fontSize: '12px', marginTop: '8px', color: 'var(--taupe)'}}>
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </p>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p style={{textAlign: 'center', padding: '24px', color: 'var(--taupe)'}}>
                              No reviews yet
                            </p>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
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

      {/* Enhanced Researcher Details Dialog */}
      <Dialog open={showResearcherDetails} onOpenChange={setShowResearcherDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {researcherDetails?.user?.name || researcherDetails?.profile?.name}
            </DialogTitle>
            <CardDescription>{researcherDetails?.profile?.specialties?.join(', ')}</CardDescription>
          </DialogHeader>
          
          {researcherDetails && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Professional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium">{researcherDetails.profile.years_experience} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sector</p>
                    <p className="font-medium">{researcherDetails.profile.sector}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available Hours</p>
                    <p className="font-medium">{researcherDetails.profile.available_hours}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">
                        {researcherDetails.average_rating} / 5.0 ({researcherDetails.total_reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {researcherDetails.profile.bio && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">About</h3>
                  <p className="text-sm">{researcherDetails.profile.bio}</p>
                </div>
              )}

              {/* Research Interests */}
              {researcherDetails.profile.research_interests?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Research Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {researcherDetails.profile.research_interests.map((interest, idx) => (
                      <Badge key={idx} variant="secondary">{interest}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Trials */}
              {researcherDetails.trials?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Clinical Trials ({researcherDetails.trials.length})</h3>
                  <div className="space-y-3">
                    {researcherDetails.trials.slice(0, 5).map((trial) => (
                      <Card key={trial.id}>
                        <CardContent className="pt-4">
                          <h4 className="font-semibold mb-2">{trial.title}</h4>
                          <div className="flex gap-2 mb-2">
                            <Badge variant="outline">{trial.phase}</Badge>
                            <Badge>{trial.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{trial.description.slice(0, 150)}...</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Publications */}
              {researcherDetails.publications?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Publications ({researcherDetails.publications.length})</h3>
                  <div className="space-y-3">
                    {researcherDetails.publications.slice(0, 5).map((pub) => (
                      <Card key={pub.id}>
                        <CardContent className="pt-4">
                          <h4 className="font-semibold mb-2">{pub.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {pub.journal} • {pub.year} • {pub.authors.slice(0, 3).join(', ')}
                          </p>
                          <p className="text-sm">{pub.abstract.slice(0, 150)}...</p>
                          {pub.url && (
                            <a 
                              href={pub.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                            >
                              View Publication →
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {researcherDetails.reviews?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Patient Reviews</h3>
                  <div className="space-y-3">
                    {researcherDetails.reviews.slice(0, 3).map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className="w-4 h-4"
                                fill={i < review.rating ? 'var(--olive)' : 'none'}
                                color={i < review.rating ? 'var(--olive)' : 'var(--taupe)'}
                              />
                            ))}
                            <span className="text-sm text-muted-foreground ml-2">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => {
                  setShowResearcherDetails(false);
                  setSelectedExpert({
                    ...researcherDetails.profile,
                    user_id: researcherDetails.user.id,
                    name: researcherDetails.user.name,
                    email: researcherDetails.user.email
                  });
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
  const [forumMemberships, setForumMemberships] = useState({});
  const [forumFavorites, setForumFavorites] = useState({});
  const [selectedForum, setSelectedForum] = useState(null);
  const [showCreateForum, setShowCreateForum] = useState(false);
  const [newForum, setNewForum] = useState({ name: '', description: '', category: '' });
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
  const [profileData, setProfileData] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [userActivity, setUserActivity] = useState(null);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Publications state
  const [publications, setPublications] = useState([]);
  
  // Overview states
  const [overviewData, setOverviewData] = useState(null);
  
  // Forum filter state
  const [forumFilter, setForumFilter] = useState('all'); // 'all' or 'myfield'
  
  // Favorite status tracking
  const [favoritedItems, setFavoritedItems] = useState({});
  
  // Collaboration states
  const [showCollabRequest, setShowCollabRequest] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [collabRequestForm, setCollabRequestForm] = useState({
    purpose: '',
    sector: '',
    message: ''
  });
  const [collaborations, setCollaborations] = useState([]);
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [collabMessages, setCollabMessages] = useState([]);
  const [collabMessageInput, setCollabMessageInput] = useState('');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' });
  const collabMessagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Poll for new collaboration messages every 2 seconds when chat is open
  useEffect(() => {
    if (selectedCollab) {
      const loadCollabMessages = async () => {
        try {
          const res = await api.get(`/collaborations/${selectedCollab.id}/messages`);
          setCollabMessages(res.data);
        } catch (error) {
          console.error('Failed to load messages:', error);
        }
      };

      loadCollabMessages();
      const interval = setInterval(loadCollabMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedCollab]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (collabMessagesEndRef.current) {
      collabMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [collabMessages]);

  // Magnetic cursor effect and parallax scroll for tabs
  useEffect(() => {
    const tabs = document.querySelectorAll('.dashboard-tabs [role="tab"]');
    const tabList = document.querySelector('.dashboard-tabs [role="tablist"]');
    
    // Magnetic cursor effect - text moves slightly with cursor
    const handleMouseMove = (e) => {
      tabs.forEach(tab => {
        const rect = tab.getBoundingClientRect();
        const tabCenterX = rect.left + rect.width / 2;
        const tabCenterY = rect.top + rect.height / 2;
        
        // Calculate distance from cursor to tab center
        const deltaX = (e.clientX - tabCenterX) / 30; // Gentle movement
        const deltaY = (e.clientY - tabCenterY) / 30;
        
        const distance = Math.sqrt(
          Math.pow(e.clientX - tabCenterX, 2) + 
          Math.pow(e.clientY - tabCenterY, 2)
        );
        
        // Apply magnetic effect within 200px radius
        if (distance < 200) {
          tab.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        } else {
          tab.style.transform = '';
        }
      });
    };
    
    const handleMouseLeave = () => {
      tabs.forEach(tab => {
        tab.style.transform = '';
      });
    };
    
    // Parallax scroll effect - text shifts smoothly with scroll
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (tabList) {
        // Smooth parallax movement based on scroll
        const parallaxOffset = scrollY * 0.03; // Subtle movement
        tabList.style.transform = `translateY(${parallaxOffset}px)`;
      }
    };
    
    if (tabList) {
      tabList.addEventListener('mousemove', handleMouseMove);
      tabList.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        tabList.removeEventListener('mousemove', handleMouseMove);
        tabList.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

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
        // Load membership status and favorites for each forum
        await loadForumMemberships(res.data);
        await loadForumFavorites(res.data);
      } else if (activeTab === 'favorites') {
        const res = await api.get('/favorites');
        setFavorites(res.data);
        // Update favorited items state for all loaded favorites
        const favoritedIds = {};
        res.data.forEach(fav => {
          if (fav.item?.id) {
            favoritedIds[fav.item.id] = true;
          }
        });
        setFavoritedItems(prev => ({ ...prev, ...favoritedIds }));
      } else if (activeTab === 'profile') {
        // Load profile data
        const profileRes = await api.get('/researcher/profile');
        setProfileData(profileRes.data);
        setEditedProfile(profileRes.data || {});
        
        // Load activity data
        const activityRes = await api.get('/profile/activity');
        setUserActivity(activityRes.data);
      } else if (activeTab === 'collaborations') {
        // Load active collaborations
        const res = await api.get('/collaborations');
        setCollaborations(res.data);
      } else if (activeTab === 'publications') {
        // Load publications
        const res = await api.get('/researcher/publications');
        setPublications(res.data);
      } else if (activeTab === 'overview') {
        // Load personalized overview
        const res = await api.get('/researcher/overview');
        setOverviewData(res.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadForumMemberships = async (forumsList) => {
    try {
      const memberships = {};

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await api.post('/researcher/search', { query: searchQuery });
      setSearchResults(res.data);
      setActiveTab('search');
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

      for (const forum of forumsList) {
        const res = await api.get(`/forums/${forum.id}/membership`);
        memberships[forum.id] = res.data;
      }
      setForumMemberships(memberships);
    } catch (error) {
      console.error('Failed to load memberships:', error);
    }
  };

  const handleJoinGroup = async (forumId) => {
    try {
      await api.post(`/forums/${forumId}/join`);
      toast.success('Successfully joined the group!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (forumId) => {
    try {
      await api.delete(`/forums/${forumId}/leave`);
      toast.success('Left the group');
      loadData();
    } catch (error) {
      toast.error('Failed to leave group');
    }
  };

  const handleDeleteForum = async (forumId) => {
    try {
      await api.delete(`/forums/${forumId}`);
      toast.success('Forum deleted successfully');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete forum');
    }
  };

  const loadForumFavorites = async (forumsList) => {
    try {
      const favStatus = {};
      for (const forum of forumsList) {
        const res = await api.get(`/favorites/check/forum/${forum.id}`);
        favStatus[forum.id] = res.data;
      }
      setForumFavorites(favStatus);
    } catch (error) {
      console.error('Failed to load forum favorites:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await api.put('/researcher/profile', editedProfile);
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
      setProfileData(editedProfile);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAddSpecialty = () => {
    if (specialtyInput.trim()) {
      setEditedProfile({
        ...editedProfile,
        specialties: [...(editedProfile.specialties || []), specialtyInput.trim()]
      });
      setSpecialtyInput('');
    }
  };

  const handleRemoveSpecialty = (index) => {
    const updated = [...(editedProfile.specialties || [])];
    updated.splice(index, 1);
    setEditedProfile({ ...editedProfile, specialties: updated });
  };

  const handleAddInterest = () => {
    if (interestInput.trim()) {
      setEditedProfile({
        ...editedProfile,
        research_interests: [...(editedProfile.research_interests || []), interestInput.trim()]
      });
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (index) => {
    const updated = [...(editedProfile.research_interests || [])];
    updated.splice(index, 1);
    setEditedProfile({ ...editedProfile, research_interests: updated });
  };

  const handleToggleFavorite = async (forumId) => {
    try {
      const currentFav = forumFavorites[forumId];
      
      if (currentFav?.is_favorited) {
        // Remove from favorites
        await api.delete(`/favorites/${currentFav.favorite_id}`);
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        await api.post('/favorites', {
          item_type: 'forum',
          item_id: forumId
        });
        toast.success('Added to favorites');
      }
      
      // Reload favorites status
      await loadForumFavorites(forums);
    } catch (error) {
      toast.error('Failed to update favorites');
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

  const handleSendCollabRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/collaborations/request', {
        receiver_id: selectedCollaborator.user_id,
        purpose: collabRequestForm.purpose,
        sector: collabRequestForm.sector,
        message: collabRequestForm.message
      });
      toast.success('Collaboration request sent!');
      setShowCollabRequest(false);
      setCollabRequestForm({ purpose: '', sector: '', message: '' });
      setSelectedCollaborator(null);
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  const handleOpenCollabChat = async (collaboration) => {
    setSelectedCollab(collaboration);
    // Messages will be loaded by useEffect polling
  };

  const handleSendCollabMessage = async () => {
    if (!collabMessageInput.trim() || !selectedCollab) return;
    
    try {
      await api.post(`/collaborations/${selectedCollab.id}/messages`, {
        message: collabMessageInput
      });
      setCollabMessageInput('');
      // Message will appear via polling in 2 seconds max
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleEndCollaboration = async (collabId) => {
    if (!window.confirm('Are you sure you want to end this collaboration?')) return;
    
    try {
      await api.post(`/collaborations/${collabId}/end`);
      toast.success('Collaboration ended');
      setSelectedCollab(null);
      loadData();
    } catch (error) {
      toast.error('Failed to end collaboration');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedCollab) return;
    
    try {
      await api.post(`/collaborations/${selectedCollab.id}/review`, {
        rating: reviewForm.rating,
        text: reviewForm.text
      });
      toast.success('Review submitted successfully!');
      setShowReviewDialog(false);
      setReviewForm({ rating: 5, text: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
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
        {/* Collaboration Request Dialog */}
        <Dialog open={showCollabRequest} onOpenChange={setShowCollabRequest}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Collaboration Request</DialogTitle>
              <DialogDescription>
                Connect with {selectedCollaborator?.name} for research collaboration
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendCollabRequest}>
              <div style={{display: 'grid', gap: '16px'}}>
                <div>
                  <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>
                    Purpose of Collaboration
                  </label>
                  <Input
                    placeholder="e.g., Joint research on cancer treatment"
                    value={collabRequestForm.purpose}
                    onChange={(e) => setCollabRequestForm({...collabRequestForm, purpose: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>
                    Your Specialization/Sector
                  </label>
                  <Input
                    placeholder="e.g., Oncology, Cardiology"
                    value={collabRequestForm.sector}
                    onChange={(e) => setCollabRequestForm({...collabRequestForm, sector: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>
                    Formal Introduction Message
                  </label>
                  <Textarea
                    placeholder="Introduce yourself and explain why you'd like to collaborate..."
                    value={collabRequestForm.message}
                    onChange={(e) => setCollabRequestForm({...collabRequestForm, message: e.target.value})}
                    rows={4}
                    required
                  />
                </div>
                
                <Button type="submit" style={{marginTop: '8px'}}>
                  Send Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave a Review</DialogTitle>
              <DialogDescription>
                Share your experience collaborating with {selectedCollab?.partner?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitReview}>
              <div style={{display: 'grid', gap: '16px'}}>
                <div>
                  <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>
                    Rating
                  </label>
                  <div style={{display: 'flex', gap: '8px'}}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        style={{
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          fill: star <= reviewForm.rating ? 'var(--olive)' : 'none',
                          color: star <= reviewForm.rating ? 'var(--olive)' : 'var(--taupe)'
                        }}
                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>
                    Your Review
                  </label>
                  <Textarea
                    placeholder="Share your collaboration experience..."
                    value={reviewForm.text}
                    onChange={(e) => setReviewForm({...reviewForm, text: e.target.value})}
                    rows={4}
                    required
                  />
                </div>
                
                <Button type="submit" style={{marginTop: '8px'}}>
                  Submit Review
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div data-testid="researcher-dashboard" className="dashboard-content">
          <div className="dashboard-header">
            <div>
              <h1>Welcome back, {user.name.split(' ')[0]}!</h1>
              <p className="dashboard-subtitle">Manage trials, collaborate, and engage</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-container" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search for researchers, trials, or publications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="search-input"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
                data-testid="search-button"
                style={{ padding: '12px 24px' }}
              >
                <Search className="icon-sm" style={{ marginRight: '8px' }} />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="dashboard-tabs">
            <TabsList>
              <TabsTrigger data-testid="overview-tab" value="overview">
                <Stethoscope className="icon-sm" />
                For You
              </TabsTrigger>
              {searchResults && (
                <TabsTrigger data-testid="search-tab" value="search">
                  <Search className="icon-sm" />
                  Search Results
                </TabsTrigger>
              )}
              <TabsTrigger data-testid="collaborators-tab" value="collaborators">
                <Users className="icon-sm" />
                Collaborators
              </TabsTrigger>
              <TabsTrigger data-testid="trials-tab" value="trials">
                <FileText className="icon-sm" />
                My Trials
              </TabsTrigger>
              <TabsTrigger data-testid="publications-tab" value="publications">
                <BookOpen className="icon-sm" />
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
              <TabsTrigger data-testid="collaborations-tab" value="collaborations">
                <Users className="icon-sm" />
                Collaborations
              </TabsTrigger>
              <TabsTrigger data-testid="profile-tab" value="profile">
                <User className="icon-sm" />
                Profile
              </TabsTrigger>
            </TabsList>


            {/* Overview Tab */}
            <TabsContent value="overview">
              {loading ? (
                <div className="loading-state">Loading overview...</div>
              ) : overviewData ? (
                <div className="overview-sections">
                  {/* Top Researchers in Field */}
                  <div className="overview-section">
                    <h3 className="section-title">Top Researchers in Your Field</h3>
                    {overviewData.top_researchers?.length > 0 ? (
                      <div className="items-grid">
                        {overviewData.top_researchers.map((researcher) => (
                          <Card key={researcher.id} className="item-card">
                            <CardHeader>
                              <div className="card-header-row">
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                  {researcher.picture && (
                                    <img src={researcher.picture} alt={researcher.name} className="collab-avatar" />
                                  )}
                                  <div>
                                    <CardTitle className="item-title">{researcher.name}</CardTitle>
                                    <CardDescription>{researcher.institution}</CardDescription>
                                  </div>
                                </div>
                                {researcher.open_to_collaboration && (
                                  <Badge variant="default" style={{ background: 'var(--olive)' }}>
                                    Open to Collaboration
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              {researcher.bio && <p className="item-description">{researcher.bio}</p>}
                              <div className="tags">
                                {researcher.specialties?.map((spec, idx) => (
                                  <Badge key={idx} variant="secondary">{spec}</Badge>
                                ))}
                              </div>
                              {researcher.reasons && researcher.reasons.length > 0 && (
                                <div className="match-reasons">
                                  <p className="match-reasons-title">Why you might connect:</p>
                                  {researcher.reasons.map((reason, idx) => (
                                    <span key={idx} className="match-reason-badge">{reason}</span>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-message">No researchers found in your field yet.</p>
                    )}
                  </div>

                  {/* Featured Trials */}
                  <div className="overview-section">
                    <h3 className="section-title">Featured Clinical Trials</h3>
                    {overviewData.featured_trials?.length > 0 ? (
                      <div className="items-grid">
                        {overviewData.featured_trials.map((trial) => (
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
                                <span>📍 {trial.location}</span>
                              </div>
                              {trial.disease_areas && trial.disease_areas.length > 0 && (
                                <div className="tags">
                                  {trial.disease_areas.map((area, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{area}</Badge>
                                  ))}
                                </div>
                              )}
                              {trial.reasons && trial.reasons.length > 0 && (
                                <div className="match-reasons">
                                  <p className="match-reasons-title">Relevant because:</p>
                                  {trial.reasons.map((reason, idx) => (
                                    <span key={idx} className="match-reason-badge">{reason}</span>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-message">No trials found matching your expertise yet.</p>
                    )}
                  </div>

                  {/* Latest Publications */}
                  <div className="overview-section">
                    <h3 className="section-title">Latest Research Publications</h3>
                    {overviewData.latest_publications?.length > 0 ? (
                      <div className="items-grid">
                        {overviewData.latest_publications.map((pub, idx) => (
                          <Card key={idx} className="item-card">
                            <CardHeader>
                              <CardTitle className="item-title">{pub.title}</CardTitle>
                              <CardDescription>
                                {pub.journal} • {pub.year}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {pub.authors && <p className="item-meta">Authors: {pub.authors.join(', ')}</p>}
                              <p className="item-description">{pub.summary || pub.abstract?.slice(0, 200) + '...'}</p>
                              {pub.reasons && pub.reasons.length > 0 && (
                                <div className="match-reasons">
                                  <p className="match-reasons-title">Relevant to:</p>
                                  {pub.reasons.map((reason, idx) => (
                                    <span key={idx} className="match-reason-badge">{reason}</span>
                                  ))}
                                </div>
                              )}
                              {pub.url && (
                                <a href={pub.url} target="_blank" rel="noopener noreferrer" className="publication-link">
                                  View Publication →
                                </a>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-message">No publications found yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <BookOpen className="empty-icon" />
                  <h3>Complete your profile</h3>
                  <p>Add your specialties and research interests to see personalized content</p>
                </div>
              )}
            </TabsContent>

            {/* Search Results Tab */}
            {searchResults && (
              <TabsContent value="search">
                <div className="search-results">
                  <h3 className="section-title">Search Results for "{searchQuery}"</h3>
                  
                  {/* Researchers Results */}
                  {searchResults.researchers?.length > 0 && (
                    <div className="results-section">
                      <h4 className="results-category">Researchers ({searchResults.researchers.length})</h4>
                      <div className="items-grid">
                        {searchResults.researchers.map((researcher) => (
                          <Card key={researcher.id} className="item-card">
                            <CardHeader>
                              <div className="card-header-row">
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                                  {researcher.picture && (
                                    <img src={researcher.picture} alt={researcher.name} className="collab-avatar" />
                                  )}
                                  <div>
                                    <CardTitle className="item-title">{researcher.name}</CardTitle>
                                    <CardDescription>{researcher.institution}</CardDescription>
                                  </div>
                                </div>
                                <Badge className="match-score-badge">
                                  {researcher.match_score}% Match
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {researcher.bio && <p className="item-description">{researcher.bio}</p>}
                              <div className="tags">
                                {researcher.specialties?.map((spec, idx) => (
                                  <Badge key={idx} variant="secondary">{spec}</Badge>
                                ))}
                              </div>
                              {researcher.match_reasons && researcher.match_reasons.length > 0 && (
                                <div className="match-reasons">
                                  <p className="match-reasons-title">Why this matches:</p>
                                  {researcher.match_reasons.map((reason, idx) => (
                                    <span key={idx} className="match-reason-badge">{reason}</span>
                                  ))}
                                </div>
                              )}
                              {researcher.open_to_collaboration && (
                                <Badge variant="default" style={{ background: 'var(--olive)', marginTop: '8px' }}>
                                  Open to Collaboration
                                </Badge>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trials Results */}
                  {searchResults.trials?.length > 0 && (
                    <div className="results-section">
                      <h4 className="results-category">Clinical Trials ({searchResults.trials.length})</h4>
                      <div className="items-grid">
                        {searchResults.trials.map((trial) => (
                          <Card key={trial.id} className="item-card">
                            <CardHeader>
                              <div className="card-header-row">
                                <CardTitle className="item-title">{trial.title}</CardTitle>
                                <Badge className="match-score-badge">
                                  {trial.match_score}% Match
                                </Badge>
                              </div>
                              <CardDescription>
                                <Badge variant="outline">{trial.phase}</Badge>
                                <Badge className="ml-2">{trial.status}</Badge>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="item-description">{trial.summary || trial.description}</p>
                              <div className="item-meta">
                                <span>📍 {trial.location}</span>
                              </div>
                              {trial.disease_areas && trial.disease_areas.length > 0 && (
                                <div className="tags">
                                  {trial.disease_areas.map((area, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{area}</Badge>
                                  ))}
                                </div>
                              )}
                              {trial.match_reasons && trial.match_reasons.length > 0 && (
                                <div className="match-reasons">
                                  <p className="match-reasons-title">Why this matches:</p>
                                  {trial.match_reasons.map((reason, idx) => (
                                    <span key={idx} className="match-reason-badge">{reason}</span>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Publications Results */}
                  {searchResults.publications?.length > 0 && (
                    <div className="results-section">
                      <h4 className="results-category">Publications ({searchResults.publications.length})</h4>
                      <div className="items-grid">
                        {searchResults.publications.map((pub, idx) => (
                          <Card key={idx} className="item-card">
                            <CardHeader>
                              <div className="card-header-row">
                                <CardTitle className="item-title">{pub.title}</CardTitle>
                                <Badge className="match-score-badge">
                                  {pub.match_score}% Match
                                </Badge>
                              </div>
                              <CardDescription>
                                {pub.journal} • {pub.year}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {pub.authors && <p className="item-meta">Authors: {pub.authors.join(', ')}</p>}
                              <p className="item-description">{pub.summary || pub.abstract?.slice(0, 200) + '...'}</p>
                              {pub.match_reasons && pub.match_reasons.length > 0 && (
                                <div className="match-reasons">
                                  <p className="match-reasons-title">Why this matches:</p>
                                  {pub.match_reasons.map((reason, idx) => (
                                    <span key={idx} className="match-reason-badge">{reason}</span>
                                  ))}
                                </div>
                              )}
                              {pub.url && (
                                <a href={pub.url} target="_blank" rel="noopener noreferrer" className="publication-link">
                                  View Publication →
                                </a>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.researchers?.length === 0 && 
                   searchResults.trials?.length === 0 && 
                   searchResults.publications?.length === 0 && (
                    <div className="empty-state">
                      <Search className="empty-icon" />
                      <h3>No results found</h3>
                      <p>Try a different search query</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

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
                        <Button 
                          onClick={() => {
                            setSelectedCollaborator(collab);
                            setShowCollabRequest(true);
                          }}
                          style={{
                            marginTop: '16px',
                            width: '100%',
                            background: 'var(--accent-gradient)',
                            color: 'var(--cream)'
                          }}
                        >
                          <Users className="icon-sm" />
                          Connect & Collaborate
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="collaborations">
              {selectedCollab ? (
                <div>
                  <Button 
                    onClick={() => setSelectedCollab(null)} 
                    variant="outline"
                    style={{marginBottom: '16px'}}
                  >
                    <ChevronLeft className="icon-sm" />
                    Back to Collaborations
                  </Button>
                  
                  <Card>
                    <CardHeader>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                          <CardTitle>Chat with {selectedCollab.partner?.name}</CardTitle>
                          <CardDescription>{selectedCollab.partner?.sector}</CardDescription>
                        </div>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <Button 
                            variant="outline"
                            onClick={() => setShowReviewDialog(true)}
                          >
                            <Star className="icon-sm" />
                            Leave Review
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleEndCollaboration(selectedCollab.id)}
                          >
                            End Collaboration
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div style={{
                        height: '400px',
                        overflowY: 'auto',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '16px'
                      }}>
                        {collabMessages.map((msg) => (
                          <div 
                            key={msg.id}
                            style={{
                              marginBottom: '12px',
                              textAlign: msg.sender_id === user.id ? 'right' : 'left'
                            }}
                          >
                            <div style={{
                              display: 'inline-block',
                              maxWidth: '70%',
                              padding: '8px 12px',
                              borderRadius: '12px',
                              background: msg.sender_id === user.id ? 'var(--olive)' : 'var(--cream-dark)',
                              color: msg.sender_id === user.id ? 'white' : 'var(--taupe)'
                            }}>
                              <p>{msg.message}</p>
                              <p style={{fontSize: '12px', marginTop: '4px', opacity: 0.7}}>
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={collabMessagesEndRef} />
                      </div>
                      
                      <div style={{display: 'flex', gap: '8px'}}>
                        <Input
                          placeholder="Type your message..."
                          value={collabMessageInput}
                          onChange={(e) => setCollabMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendCollabMessage()}
                        />
                        <Button onClick={handleSendCollabMessage}>
                          <Send className="icon-sm" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : loading ? (
                <div className="loading-state">Loading collaborations...</div>
              ) : collaborations.length > 0 ? (
                <div className="items-grid">
                  {collaborations.map((collab) => (
                    <Card key={collab.id} className="item-card" style={{cursor: 'pointer'}}>
                      <CardHeader onClick={() => handleOpenCollabChat(collab)}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                          <img 
                            src={collab.partner?.picture || '/default-avatar.png'} 
                            alt={collab.partner?.name} 
                            style={{width: '48px', height: '48px', borderRadius: '50%'}}
                          />
                          <div>
                            <CardTitle className="item-title">{collab.partner?.name}</CardTitle>
                            <CardDescription>{collab.partner?.sector}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="tags">
                          {collab.partner?.specialties?.map((spec, idx) => (
                            <Badge key={idx} variant="secondary">{spec}</Badge>
                          ))}
                        </div>
                        <p style={{fontSize: '12px', color: 'var(--taupe)', marginTop: '8px'}}>
                          Active since {new Date(collab.created_at).toLocaleDateString()}
                        </p>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCollabChat(collab);
                          }}
                          style={{marginTop: '12px', width: '100%'}}
                        >
                          <MessageSquare className="icon-sm" />
                          Open Chat
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '48px'}}>
                  <Users style={{width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.3}} />
                  <h3>No Active Collaborations</h3>
                  <p style={{color: 'var(--taupe)', marginTop: '8px'}}>
                    Connect with researchers from the Collaborators tab to start collaborating
                  </p>
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


            {/* Publications Tab */}
            <TabsContent value="publications">
              {loading ? (
                <div className="loading-state">Loading publications...</div>
              ) : publications.length > 0 ? (
                <div className="items-grid">
                  {publications.map((pub, idx) => (
                    <Card key={idx} className="item-card">
                      <CardHeader>
                        <CardTitle className="item-title">{pub.title}</CardTitle>
                        <CardDescription>
                          {pub.journal} • {pub.year}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {pub.authors && pub.authors.length > 0 && (
                          <p className="item-meta" style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
                            <strong>Authors:</strong> {pub.authors.join(', ')}
                          </p>
                        )}
                        <p className="item-description">
                          {pub.summary || pub.abstract?.slice(0, 300) + '...'}
                        </p>
                        {pub.disease_areas && pub.disease_areas.length > 0 && (
                          <div className="tags">
                            {pub.disease_areas.map((area, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{area}</Badge>
                            ))}
                          </div>
                        )}
                        {pub.url && (
                          <a 
                            href={pub.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="publication-link"
                            style={{
                              display: 'inline-block',
                              marginTop: '12px',
                              color: '#3F51B5',
                              textDecoration: 'none',
                              fontWeight: '500'
                            }}
                          >
                            View Publication →
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <BookOpen className="empty-icon" />
                  <h3>No publications found</h3>
                  <p>Your publications from PubMed will appear here</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="forums">
              {selectedForum ? (
                <ForumDiscussion 
                  forum={selectedForum} 
                  user={user}
                  onBack={() => setSelectedForum(null)}
                />
              ) : (
                <>
                  <div style={{marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                      <h2 style={{fontSize: '20px', fontWeight: 600, color: 'var(--olive)'}}>Forum Groups</h2>
                      <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                        <Button
                          variant={forumFilter === 'all' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setForumFilter('all')}
                        >
                          All Forums
                        </Button>
                        <Button
                          variant={forumFilter === 'myfield' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setForumFilter('myfield')}
                        >
                          My Field
                        </Button>
                      </div>
                    </div>
                    <Dialog open={showCreateForum} onOpenChange={setShowCreateForum}>
                      <DialogTrigger asChild>
                        <Button 
                          data-testid="create-forum-btn"
                          style={{
                            background: 'var(--accent-gradient)',
                            color: 'var(--cream)'
                          }}
                        >
                          <Plus className="icon-sm" />
                          Create Forum
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Forum Group</DialogTitle>
                          <DialogDescription>
                            Create a forum group for a specific health issue or specialty
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            await api.post('/forums/create', {
                              name: newForum.name,
                              description: newForum.description,
                              category: newForum.category
                            });
                            toast.success('Forum created successfully!');
                            setShowCreateForum(false);
                            setNewForum({ name: '', description: '', category: '' });
                            loadData();
                          } catch (error) {
                            toast.error(error.response?.data?.detail || 'Failed to create forum');
                          }
                        }}>
                          <Input
                            data-testid="forum-name-input"
                            placeholder="Forum Name (e.g., Diabetes Type 2 Support)"
                            value={newForum.name}
                            onChange={(e) => setNewForum({ ...newForum, name: e.target.value })}
                            required
                            style={{marginBottom: '12px'}}
                          />
                          <Input
                            data-testid="forum-category-input"
                            placeholder="Specialty/Category (e.g., Endocrinology)"
                            value={newForum.category}
                            onChange={(e) => setNewForum({ ...newForum, category: e.target.value })}
                            required
                            style={{marginBottom: '12px'}}
                          />
                          <textarea
                            data-testid="forum-description-input"
                            placeholder="Description of the forum group"
                            value={newForum.description}
                            onChange={(e) => setNewForum({ ...newForum, description: e.target.value })}
                            required
                            style={{
                              width: '100%',
                              minHeight: '100px',
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              fontFamily: 'inherit',
                              fontSize: '14px',
                              marginBottom: '12px'
                            }}
                          />
                          <Button data-testid="submit-forum-btn" type="submit">Create Forum</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {loading ? (
                    <div className="loading-state">Loading forums...</div>
                  ) : (
                    <div className="items-grid">
                      {forums.map((forum) => {
                        const membership = forumMemberships[forum.id];
                        const isMember = membership?.is_member;
                        const isOwner = forum.created_by === user.id;
                        
                        return (
                          <Card key={forum.id} className="item-card" style={{ cursor: 'pointer' }}>
                            <CardHeader onClick={() => setSelectedForum(forum)}>
                              <CardTitle className="item-title">
                                {forum.name}
                                {isOwner && (
                                  <Badge variant="secondary" style={{marginLeft: '8px', fontSize: '10px'}}>
                                    Owner
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription>{forum.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="item-meta">
                                <Badge variant={isMember ? "default" : "outline"}>{forum.category}</Badge>
                                <span>{forum.post_count} posts</span>
                              </div>
                              
                              {isMember && (
                                <div className="forum-member-badge">
                                  <Users className="icon-sm" style={{color: 'var(--olive)'}} />
                                  <span style={{color: 'var(--olive)', fontWeight: 600}}>Group Member</span>
                                </div>
                              )}
                              
                              <div style={{marginTop: '16px', display: 'flex', gap: '8px'}}>
                                <Button 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedForum(forum);
                                  }}
                                  style={{
                                    flex: 1,
                                    background: 'var(--accent-gradient)',
                                    color: 'var(--cream)'
                                  }}
                                >
                                  <MessageSquare className="icon-sm" />
                                  View Discussions
                                </Button>
                                
                                {isMember ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLeaveGroup(forum.id);
                                    }}
                                  >
                                    Leave
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleJoinGroup(forum.id);
                                    }}
                                  >
                                    <Users className="icon-sm" />
                                    Join
                                  </Button>
                                )}
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`favorite-forum-btn-${forum.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(forum.id);
                                  }}
                                  style={{
                                    color: forumFavorites[forum.id]?.is_favorited ? 'var(--olive)' : 'var(--taupe)'
                                  }}
                                >
                                  <Heart 
                                    className="icon-sm" 
                                    fill={forumFavorites[forum.id]?.is_favorited ? 'var(--olive)' : 'none'}
                                  />
                                </Button>
                                
                                {isOwner && (
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    data-testid={`delete-forum-btn-${forum.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Are you sure you want to delete "${forum.name}"? This will remove all posts and memberships.`)) {
                                        handleDeleteForum(forum.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="icon-sm" />
                                  </Button>
                                )}
                              </div>
                              
                              {!isMember && (
                                <p style={{
                                  fontSize: '12px', 
                                  color: 'var(--taupe)', 
                                  opacity: 0.7,
                                  marginTop: '8px',
                                  fontStyle: 'italic'
                                }}>
                                  Only researchers with matching specialties can join and post
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
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
                    <Popover key={fav.favorite_id}>
                      <PopoverTrigger asChild>
                        <Card className="item-card" style={{ cursor: 'pointer' }}>
                          <CardHeader>
                            <div className="card-header-row">
                              <CardTitle className="item-title">
                                {fav.item.title || fav.item.name}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToFavorites(fav.item_type, fav.item.id, fav.item);
                                }}
                              >
                                <Heart 
                                  className="icon-sm" 
                                  fill={favoritedItems[fav.item.id] !== false ? '#3F51B5' : 'none'}
                                  color={favoritedItems[fav.item.id] !== false ? '#3F51B5' : 'currentColor'}
                                />
                              </Button>
                            </div>
                            <CardDescription>
                              <Badge>{fav.item_type}</Badge>
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </PopoverTrigger>
                      <PopoverContent className="w-96" align="start">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-lg mb-2">
                              {fav.item.title || fav.item.name}
                            </h4>
                            <Badge variant="secondary">{fav.item_type}</Badge>
                          </div>
                          
                          {fav.item_type === 'trial' && (
                            <>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Phase:</strong> {fav.item.phase}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Status:</strong> {fav.item.status}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Location:</strong> {fav.item.location}
                                </p>
                              </div>
                              <p className="text-sm">{fav.item.description || fav.item.summary}</p>
                              {fav.item.disease_areas && fav.item.disease_areas.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {fav.item.disease_areas.map((area, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{area}</Badge>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                          
                          {fav.item_type === 'expert' && (
                            <>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Specialty:</strong> {fav.item.specialty}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Location:</strong> {fav.item.location}
                                </p>
                                {fav.item.available_hours && (
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <strong>Available:</strong> {fav.item.available_hours}
                                  </p>
                                )}
                                {fav.item.average_rating > 0 && (
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <strong>Rating:</strong> ⭐ {fav.item.average_rating} ({fav.item.total_reviews} reviews)
                                  </p>
                                )}
                              </div>
                              {fav.item.bio && <p className="text-sm">{fav.item.bio}</p>}
                              {fav.item.research_areas && fav.item.research_areas.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {fav.item.research_areas.map((area, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{area}</Badge>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                          
                          {fav.item_type === 'publication' && (
                            <>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Journal:</strong> {fav.item.journal}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Year:</strong> {fav.item.year}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Authors:</strong> {fav.item.authors?.join(', ')}
                                </p>
                              </div>
                              <p className="text-sm">{fav.item.summary || fav.item.abstract?.slice(0, 300) + '...'}</p>
                              {fav.item.disease_areas && fav.item.disease_areas.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {fav.item.disease_areas.map((area, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{area}</Badge>
                                  ))}
                                </div>
                              )}
                              {fav.item.url && (
                                <a 
                                  href={fav.item.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  View Publication →
                                </a>
                              )}
                            </>
                          )}
                          
                          {fav.item_type === 'forum' && (
                            <>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Category:</strong> {fav.item.category}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Posts:</strong> {fav.item.post_count || 0}
                                </p>
                                {fav.item.created_by_name && (
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <strong>Created by:</strong> {fav.item.created_by_name}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm">{fav.item.description}</p>
                            </>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              )}
            </TabsContent>

 

            <TabsContent value="profile">
              {loading ? (
                <div className="loading-state">Loading profile...</div>
              ) : (
                <div className="researcher-profile-content" style={{display: 'grid', gap: '24px'}}>
                  {/* Profile Information Card */}
                  <Card>
                    <CardHeader>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                          <CardTitle>Profile Information</CardTitle>
                          <CardDescription>Your professional details and research information</CardDescription>
                        </div>
                        {!isEditingProfile ? (
                          <Button onClick={() => setIsEditingProfile(true)} variant="outline">
                            <Edit className="icon-sm" /> Edit Profile
                          </Button>
                        ) : (
                          <div style={{display: 'flex', gap: '8px'}}>
                            <Button onClick={handleSaveProfile}>
                              <Save className="icon-sm" /> Save
                            </Button>
                            <Button onClick={() => {
                              setIsEditingProfile(false);
                              setEditedProfile(profileData || {});
                            }} variant="outline">
                              <X className="icon-sm" /> Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div style={{display: 'flex', gap: '24px', marginBottom: '24px'}}>
                        <img src={user.picture} alt={user.name} style={{width: '80px', height: '80px', borderRadius: '50%'}} />
                        <div>
                          <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '4px'}}>{profileData?.name || user.name}</h3>
                          <p style={{color: 'var(--taupe)', marginBottom: '8px'}}>{user.email}</p>
                          <Badge>Researcher</Badge>
                        </div>
                      </div>

                      <div style={{display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(2, 1fr)'}}>
                        <div>
                          <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>Full Name</label>
                          {isEditingProfile ? (
                            <Input
                              value={editedProfile.name || ''}
                              onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                            />
                          ) : (
                            <p>{profileData?.name || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>Phone Number</label>
                          {isEditingProfile ? (
                            <Input
                              placeholder="Enter phone number"
                              value={editedProfile.phone_number || ''}
                              onChange={(e) => setEditedProfile({...editedProfile, phone_number: e.target.value})}
                            />
                          ) : (
                            <p>{profileData?.phone_number || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>Age</label>
                          {isEditingProfile ? (
                            <Input
                              type="number"
                              value={editedProfile.age || ''}
                              onChange={(e) => setEditedProfile({...editedProfile, age: parseInt(e.target.value)})}
                            />
                          ) : (
                            <p>{profileData?.age || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>Years of Experience</label>
                          {isEditingProfile ? (
                            <Input
                              type="number"
                              value={editedProfile.years_experience || ''}
                              onChange={(e) => setEditedProfile({...editedProfile, years_experience: parseInt(e.target.value)})}
                            />
                          ) : (
                            <p>{profileData?.years_experience || 'Not provided'}</p>
                          )}
                        </div>

                        <div style={{gridColumn: 'span 2'}}>
                          <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>Sector / Expertise</label>
                          {isEditingProfile ? (
                            <Input
                              placeholder="e.g., Clinical Oncologist"
                              value={editedProfile.sector || ''}
                              onChange={(e) => setEditedProfile({...editedProfile, sector: e.target.value})}
                            />
                          ) : (
                            <p>{profileData?.sector || 'Not provided'}</p>
                          )}
                        </div>

                        <div style={{gridColumn: 'span 2'}}>
                          <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>Available Hours</label>
                          {isEditingProfile ? (
                            <Input
                              placeholder="e.g., 9 AM - 5 PM EST"
                              value={editedProfile.available_hours || ''}
                              onChange={(e) => setEditedProfile({...editedProfile, available_hours: e.target.value})}
                            />
                          ) : (
                            <p>{profileData?.available_hours || 'Not provided'}</p>
                          )}
                        </div>

                        <div style={{gridColumn: 'span 2'}}>
                          <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>Specialties</label>
                          {isEditingProfile ? (
                            <>
                              <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
                                <Input
                                  placeholder="Add specialty"
                                  value={specialtyInput}
                                  onChange={(e) => setSpecialtyInput(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                                />
                                <Button onClick={handleAddSpecialty} type="button">Add</Button>
                              </div>
                              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                                {(editedProfile.specialties || []).map((spec, idx) => (
                                  <Badge key={idx} variant="secondary">
                                    {spec}
                                    <button
                                      onClick={() => handleRemoveSpecialty(idx)}
                                      style={{marginLeft: '8px', cursor: 'pointer', background: 'none', border: 'none'}}
                                    >×</button>
                                  </Badge>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                              {(profileData?.specialties || []).length > 0 ? (
                                profileData.specialties.map((spec, idx) => (
                                  <Badge key={idx} variant="secondary">{spec}</Badge>
                                ))
                              ) : (
                                <p>No specialties listed</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{gridColumn: 'span 2'}}>
                          <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>Research Interests</label>
                          {isEditingProfile ? (
                            <>
                              <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
                                <Input
                                  placeholder="Add research interest"
                                  value={interestInput}
                                  onChange={(e) => setInterestInput(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                                />
                                <Button onClick={handleAddInterest} type="button">Add</Button>
                              </div>
                              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                                {(editedProfile.research_interests || []).map((interest, idx) => (
                                  <Badge key={idx} variant="outline">
                                    {interest}
                                    <button
                                      onClick={() => handleRemoveInterest(idx)}
                                      style={{marginLeft: '8px', cursor: 'pointer', background: 'none', border: 'none'}}
                                    >×</button>
                                  </Badge>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                              {(profileData?.research_interests || []).length > 0 ? (
                                profileData.research_interests.map((interest, idx) => (
                                  <Badge key={idx} variant="outline">{interest}</Badge>
                                ))
                              ) : (
                                <p>No research interests listed</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{gridColumn: 'span 2'}}>
                          <label style={{display: 'block', fontWeight: '600', marginBottom: '8px'}}>About / Bio</label>
                          {isEditingProfile ? (
                            <Textarea
                              placeholder="Tell us about yourself..."
                              value={editedProfile.bio || ''}
                              onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                              rows={4}
                            />
                          ) : (
                            <p>{profileData?.bio || 'No bio provided'}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity History Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity History</CardTitle>
                      <CardDescription>Your contributions and engagement on CuraLink</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="appointments" className="activity-tabs">
                        <TabsList>
                          <TabsTrigger value="appointments">
                            <Calendar className="icon-sm" /> Appointments ({userActivity?.appointments?.length || 0})
                          </TabsTrigger>
                          <TabsTrigger value="forums">
                            <MessageSquare className="icon-sm" /> Forums Created ({userActivity?.forums_created?.length || 0})
                          </TabsTrigger>
                          <TabsTrigger value="trials">
                            <Activity className="icon-sm" /> Trials ({userActivity?.trials_created?.length || 0})
                          </TabsTrigger>
                          <TabsTrigger value="collabs">
                            <Users className="icon-sm" /> Collaborations ({userActivity?.collaborations_history?.length || 0})
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="appointments">
                          {userActivity?.appointments?.length > 0 ? (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                              {userActivity.appointments.map((appt) => (
                                <Card key={appt.id} style={{padding: '16px'}}>
                                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <div>
                                      <p style={{fontWeight: '600'}}>Patient: {appt.patient_name}</p>
                                      <p style={{fontSize: '14px', marginTop: '4px'}}>{appt.condition}</p>
                                      <p style={{fontSize: '12px', color: 'var(--taupe)', marginTop: '4px'}}>
                                        {appt.location} • Suffering for {appt.duration_suffering}
                                      </p>
                                    </div>
                                    <Badge variant={
                                      appt.status === 'accepted' ? 'default' :
                                      appt.status === 'pending' ? 'secondary' :
                                      appt.status === 'completed' ? 'outline' : 'destructive'
                                    }>
                                      {appt.status}
                                    </Badge>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p style={{textAlign: 'center', padding: '24px', color: 'var(--taupe)'}}>
                              No appointments yet
                            </p>
                          )}
                        </TabsContent>

                        <TabsContent value="forums">
                          {userActivity?.forums_created?.length > 0 ? (
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px'}}>
                              {userActivity.forums_created.map((forum) => (
                                <Card key={forum.id} style={{padding: '16px'}}>
                                  <p style={{fontWeight: '600', marginBottom: '4px'}}>{forum.name}</p>
                                  <Badge variant="outline">{forum.category}</Badge>
                                  <p style={{fontSize: '12px', marginTop: '8px', color: 'var(--taupe)'}}>
                                    {forum.post_count || 0} posts
                                  </p>
                                  <p style={{fontSize: '12px', marginTop: '4px', color: 'var(--taupe)'}}>
                                    Created {new Date(forum.created_at).toLocaleDateString()}
                                  </p>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p style={{textAlign: 'center', padding: '24px', color: 'var(--taupe)'}}>
                              No forums created yet
                            </p>
                          )}
                        </TabsContent>

                        <TabsContent value="trials">
                          {userActivity?.trials_created?.length > 0 ? (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                              {userActivity.trials_created.map((trial) => (
                                <Card key={trial.id} style={{padding: '16px'}}>
                                  <div style={{marginBottom: '8px'}}>
                                    <p style={{fontWeight: '600'}}>{trial.title}</p>
                                    <div style={{display: 'flex', gap: '8px', marginTop: '4px'}}>
                                      <Badge variant="outline">{trial.phase}</Badge>
                                      <Badge>{trial.status}</Badge>
                                    </div>
                                  </div>
                                  <p style={{fontSize: '14px', color: 'var(--taupe)'}}>{trial.location}</p>
                                  <p style={{fontSize: '12px', marginTop: '8px', color: 'var(--taupe)'}}>
                                    Created {new Date(trial.created_at).toLocaleDateString()}
                                  </p>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p style={{textAlign: 'center', padding: '24px', color: 'var(--taupe)'}}>
                              No trials created yet
                            </p>
                          )}
                        </TabsContent>

                        <TabsContent value="collabs">
                          {userActivity?.collaborations_history?.length > 0 ? (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                              {userActivity.collaborations_history.map((collab) => (
                                <Card key={collab.id} style={{padding: '16px'}}>
                                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                                    <div style={{flex: 1}}>
                                      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                                        <Users style={{width: '20px', height: '20px', color: 'var(--olive)'}} />
                                        <p style={{fontWeight: '600'}}>{collab.partner_name}</p>
                                      </div>
                                      <p style={{fontSize: '14px', color: 'var(--taupe)', marginBottom: '4px'}}>
                                        <strong>Sector:</strong> {collab.partner_sector}
                                      </p>
                                      <p style={{fontSize: '12px', color: 'var(--taupe)', marginTop: '8px'}}>
                                        Started: {new Date(collab.created_at).toLocaleDateString()}
                                      </p>
                                      {collab.ended_at && (
                                        <p style={{fontSize: '12px', color: 'var(--taupe)'}}>
                                          Ended: {new Date(collab.ended_at).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                    <Badge variant={collab.status === 'active' ? 'default' : 'secondary'}>
                                      {collab.status}
                                    </Badge>
                                  </div>
                                  
                                  {collab.status === 'ended' && (
                                    <div style={{
                                      marginTop: '12px',
                                      padding: '8px',
                                      background: 'var(--cream-dark)',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      color: 'var(--taupe)'
                                    }}>
                                      Duration: {Math.ceil((new Date(collab.ended_at) - new Date(collab.created_at)) / (1000 * 60 * 60 * 24))} days
                                    </div>
                                  )}
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p style={{textAlign: 'center', padding: '24px', color: 'var(--taupe)'}}>
                              No collaboration history yet
                            </p>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {/* Stats Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Impact</CardTitle>
                      <CardDescription>Summary of your contributions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px'}}>
                        <div style={{textAlign: 'center'}}>
                          <Activity style={{width: '32px', height: '32px', margin: '0 auto 8px', color: 'var(--olive)'}} />
                          <p style={{fontSize: '24px', fontWeight: '700', color: 'var(--olive)'}}>
                            {userActivity?.forums_created?.length || 0}
                          </p>
                          <p style={{fontSize: '14px', color: 'var(--taupe)'}}>Forums Created</p>
                        </div>
                        <div style={{textAlign: 'center'}}>
                          <Search style={{width: '32px', height: '32px', margin: '0 auto 8px', color: 'var(--olive)'}} />
                          <p style={{fontSize: '24px', fontWeight: '700', color: 'var(--olive)'}}>
                            {userActivity?.trials_created?.length || 0}
                          </p>
                          <p style={{fontSize: '14px', color: 'var(--taupe)'}}>Trials Created</p>
                        </div>
                        <div style={{textAlign: 'center'}}>
                          <Users style={{width: '32px', height: '32px', margin: '0 auto 8px', color: 'var(--olive)'}} />
                          <p style={{fontSize: '24px', fontWeight: '700', color: 'var(--olive)'}}>
                            {userActivity?.collaborations_history?.length || 0}
                          </p>
                          <p style={{fontSize: '14px', color: 'var(--taupe)'}}>Collaborations</p>
                        </div>
                        <div style={{textAlign: 'center'}}>
                          <Calendar style={{width: '32px', height: '32px', margin: '0 auto 8px', color: 'var(--olive)'}} />
                          <p style={{fontSize: '24px', fontWeight: '700', color: 'var(--olive)'}}>
                            {userActivity?.appointments?.length || 0}
                          </p>
                          <p style={{fontSize: '14px', color: 'var(--taupe)'}}>Appointments</p>
                        </div>
                        <div style={{textAlign: 'center'}}>
                          <Star style={{width: '32px', height: '32px', margin: '0 auto 8px', color: 'var(--olive)'}} />
                          <p style={{fontSize: '24px', fontWeight: '700', color: 'var(--olive)'}}>
                            {userActivity?.favorites_count || 0}
                          </p>
                          <p style={{fontSize: '14px', color: 'var(--taupe)'}}>Favorites</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
// Global Animation Wrapper Component
const AnimatedRouteWrapper = ({ children }) => {
  useScrollAnimation();
  
  // Only auto-add animations to landing page elements
  useEffect(() => {
    // Don't auto-animate dashboard content
    if (window.location.pathname.includes('/dashboard')) {
      return;
    }
    
    const autoAnimateSelectors = [
      '.landing-page .role-card',
      '.onboarding-page .role-card'
    ];
    
    const addAnimationClasses = () => {
      autoAnimateSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
          if (!el.classList.contains('scroll-animate')) {
            el.classList.add('scroll-animate', 'scroll-scale');
            el.style.transitionDelay = `${index * 0.05}s`;
          }
        });
      });
    };
    
    // Run on mount
    addAnimationClasses();
  }, []);
  
  return <>{children}</>;
};

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <AnimatedRouteWrapper>
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
        </AnimatedRouteWrapper>
      </BrowserRouter>
    </div>
  );
}

export default App;
