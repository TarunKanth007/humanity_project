import { useState, useEffect } from "react";
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
import { Heart, Search, Users, FileText, MessageSquare, Star, Plus, Send, LogOut, User, Microscope, Stethoscope, BookOpen, MapPin, Filter, HelpCircle } from "lucide-react";
import { QACommunity } from "@/components/QACommunity";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const AUTH_URL = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(window.location.origin + '/dashboard')}`;

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
      
      // Redirect based on role
      if (response.data.user.role) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Session processing failed:', error);
      toast.error('Authentication failed');
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
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
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
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Search />
            </div>
            <h3>Find Clinical Trials</h3>
            <p>Access thousands of clinical trials tailored to your condition</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <Users />
            </div>
            <h3>Connect with Experts</h3>
            <p>Reach health experts and researchers in your area of interest</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <BookOpen />
            </div>
            <h3>Latest Research</h3>
            <p>Stay updated with cutting-edge medical publications</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Onboarding
const Onboarding = ({ user, setUser }) => {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  const handleRoleSelect = async (selectedRole) => {
    try {
      await api.post('/auth/role', { role: selectedRole });
      // Refresh user data
      const response = await api.get('/auth/me');
      setUser(response.data);
      navigate(`/profile-setup?role=${selectedRole}`);
    } catch (error) {
      toast.error('Failed to set role');
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <h1>Welcome to CuraLink!</h1>
        <p className="onboarding-subtitle">Choose your role(s) - you can be both a patient and researcher</p>

        <div className="role-cards">
          <div 
            data-testid="patient-role-card"
            className={`role-card ${user.roles?.includes('patient') ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('patient')}
          >
            <Stethoscope className="role-icon" />
            <h3>Patient or Caregiver</h3>
            <p>Find clinical trials, connect with health experts, and access research</p>
            {user.roles?.includes('patient') && <Badge className="mt-4">Selected</Badge>}
          </div>

          <div 
            data-testid="researcher-role-card"
            className={`role-card ${user.roles?.includes('researcher') ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('researcher')}
          >
            <Microscope className="role-icon" />
            <h3>Researcher</h3>
            <p>Manage trials, find collaborators, and engage with the community</p>
            {user.roles?.includes('researcher') && <Badge className="mt-4">Selected</Badge>}
          </div>
        </div>
        
        {user.roles && user.roles.length > 0 && (
          <Button 
            data-testid="continue-btn"
            className="mt-8" 
            size="lg"
            onClick={() => navigate('/dashboard')}
          >
            Continue to Dashboard
          </Button>
        )}
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
    specialties: [],
    research_interests: [],
    bio: ''
  });
  const [conditionInput, setConditionInput] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const isPatient = setupRole === 'patient';

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
    try {
      const endpoint = isPatient ? '/patient/profile' : '/researcher/profile';
      await api.post(endpoint, formData);
      toast.success('Profile created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to create profile');
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
                <label>Specialties</label>
                <p className="field-hint">Your areas of medical expertise</p>
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
                <label>Bio</label>
                <Textarea
                  data-testid="bio-input"
                  placeholder="Brief description of your research and expertise"
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

  useEffect(() => {
    loadData();
  }, [activeTab]);

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
                        <div className="tags">
                          {expert.research_areas.map((area, idx) => (
                            <Badge key={idx} variant="secondary">{area}</Badge>
                          ))}
                        </div>
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
  }, [activeTab]);

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
          <Button variant="ghost" onClick={() => window.location.href = '/dashboard'}>
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
                  <Card key={answer.id} className=\"answer-card mb-4\">
                    <CardContent className=\"pt-6\">
                      <div className=\"answer-header\">
                        <div>
                          <p className=\"font-semibold\">{answer.researcher_name}</p>
                          {answer.researcher_specialty && (
                            <p className=\"text-sm text-muted-foreground\">{answer.researcher_specialty}</p>
                          )}
                        </div>
                        <span className=\"text-sm text-muted-foreground\">
                          {new Date(answer.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className=\"answer-content mt-4\">{answer.content}</p>

                      <div className=\"answer-actions mt-4\">
                        <div className=\"vote-buttons\">
                          <Button
                            variant={answer.user_vote === 'like' ? 'default' : 'outline'}
                            size=\"sm\"
                            onClick={() => handleVote(answer.id, 'like')}
                            data-testid={`like-btn-${answer.id}`}
                          >
                            <ThumbsUp className=\"icon-xs\" />
                            {answer.likes}
                          </Button>
                          <Button
                            variant={answer.user_vote === 'dislike' ? 'default' : 'outline'}
                            size=\"sm\"
                            onClick={() => handleVote(answer.id, 'dislike')}
                            data-testid={`dislike-btn-${answer.id}`}
                          >
                            <ThumbsDown className=\"icon-xs\" />
                            {answer.dislikes}
                          </Button>
                        </div>

                        {isResearcher && (
                          <Button
                            variant=\"ghost\"
                            size=\"sm\"
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
                        <div className=\"replies-section mt-4\">
                          {answer.replies.map((reply) => (
                            <Card key={reply.id} className=\"reply-card\">
                              <CardContent className=\"pt-4\">
                                <div className=\"answer-header\">
                                  <div>
                                    <p className=\"font-semibold text-sm\">{reply.researcher_name}</p>
                                    {reply.researcher_specialty && (
                                      <p className=\"text-xs text-muted-foreground\">{reply.researcher_specialty}</p>
                                    )}
                                  </div>
                                </div>
                                <p className=\"text-sm mt-2\">{reply.content}</p>
                                
                                <div className=\"vote-buttons mt-3\">
                                  <Button
                                    variant={reply.user_vote === 'like' ? 'default' : 'outline'}
                                    size=\"sm\"
                                    onClick={() => handleVote(reply.id, 'like')}
                                  >
                                    <ThumbsUp className=\"icon-xs\" />
                                    {reply.likes}
                                  </Button>
                                  <Button
                                    variant={reply.user_vote === 'dislike' ? 'default' : 'outline'}
                                    size=\"sm\"
                                    onClick={() => handleVote(reply.id, 'dislike')}
                                  >
                                    <ThumbsDown className=\"icon-xs\" />
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
                  {user?.roles?.includes('patient') && !user?.roles?.includes('researcher') ? (
                    <PatientDashboard user={user} logout={logout} />
                  ) : user?.roles?.includes('researcher') && !user?.roles?.includes('patient') ? (
                    <ResearcherDashboard user={user} logout={logout} />
                  ) : user?.roles?.length > 1 ? (
                    // User has both roles - show patient dashboard with option to switch
                    <PatientDashboard user={user} logout={logout} />
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
            </Routes>
          )}
        </AuthContext>
      </BrowserRouter>
    </div>
  );
}

export default App;