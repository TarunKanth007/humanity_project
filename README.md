# CuraLink - Healthcare Research Platform

<div align="center">

![CuraLink Logo](https://img.shields.io/badge/CuraLink-Healthcare_Research-3F51B5?style=for-the-badge)

**Connecting Patients and Researchers to Clinical Trials, Medical Publications, and Health Experts**

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai&logoColor=white)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [API Documentation](#api-documentation) • [AskCura AI](#askcura-ai-treatment-advisor)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [AskCura AI Treatment Advisor](#askcura-ai-treatment-advisor)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Visual Design](#visual-design)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About

CuraLink is a comprehensive healthcare research platform that bridges the gap between patients seeking treatments and researchers advancing medical science. The platform enables:

- **Patients/Caregivers** to discover clinical trials, connect with health experts, and access cutting-edge research
- **Researchers** to manage trials, find collaborators, and engage directly with the patient community

## ✨ Features

### 🤖 AskCura AI Treatment Advisor (NEW!)

- **Patient Version** - AI-powered treatment advisor with simple, patient-friendly language
  - Compare treatment options with detailed analysis
  - Get information about effectiveness, side effects, costs, and lifestyle impact
  - Interactive chat interface with conversation history
  - Visual comparison mode with treatment selection
  
- **Researcher Version** - Scientific protocol advisor for researchers
  - Technical protocol comparison with scientific metrics
  - Efficacy data, toxicity profiles, biomarker analysis
  - Trial design insights and mechanistic information
  - Evidence-based recommendations with citations

### For Patients & Caregivers

- 🔍 **Smart Search with Matching** - AI-powered search with match scores and relevance reasons
- 👨‍⚕️ **Expert Discovery** - Find researchers with publications, trials, and patient reviews
- 📚 **Personalized "For You" Feed** - Curated recommendations based on your conditions
- 💬 **Q&A Community** - Ask anonymous questions and get expert answers
- ⭐ **Reviews & Ratings** - Rate and review healthcare professionals after consultations
- 📅 **Appointment Management** - Request and manage appointments with researchers
- 💾 **Favorites** - Save and organize trials, publications, and experts
- 🔔 **Real-time Notifications** - Instant updates on appointments and messages
- 🎯 **Enhanced Researcher Profiles** - View complete portfolios with trials and publications

### For Researchers

- 🧪 **Trial Management** - Create and manage clinical trials with AI-powered summaries
- 🤝 **Collaboration Tools** - Connect with researchers, send requests, and collaborate
- 📊 **Smart Search** - Find researchers, trials, and publications with intelligent matching
- 📚 **Publications Tab** - Automatic PubMed integration showing your authored publications
- 💡 **Personalized Overview** - "For You" feed with relevant trials, researchers, and publications
- 🏆 **Profile Builder** - Showcase specialties, institution, collaboration status
- 🎨 **Forum Filtering** - Filter discussions by your field of expertise
- 📝 **Patient Engagement** - Respond to patient questions and manage consultations
- 💬 **Live Messaging** - Real-time chat with collaboration partners

### Platform Features

- 🔐 **Custom Google OAuth** - Secure authentication with session management
- 📱 **Fully Responsive** - Optimized for desktop, tablet, and mobile devices
- 🎨 **Modern Indigo Theme** - Beautiful UI with consistent color scheme (#3F51B5, #536DFE)
- ✨ **Animated Particles Background** - Elegant floating particles on all pages
- 🔔 **Real-time Updates** - Live notifications and chat messages
- 💬 **Advanced Chat** - Image sharing, message history, and real-time delivery
- 🌐 **CORS-Protected APIs** - Secure backend with explicit origin whitelisting
- 🚀 **High Performance** - Fast API responses (<3s) with caching and optimization
- 📊 **Activity Tracking** - Comprehensive user activity monitoring
- 🎯 **Smart Recommendations** - AI-powered content matching and personalization

---

## 🤖 AskCura AI Treatment Advisor

### Overview
AskCura is an intelligent AI-powered treatment advisor integrated into CuraLink, providing personalized medical information to both patients and researchers.

### Patient Version: Treatment Advisor 💊

**Features:**
- Simple, easy-to-understand explanations of treatment options
- Compare multiple treatments side-by-side
- Get information about:
  - Effectiveness and success rates
  - Common side effects and risks
  - Cost considerations
  - Lifestyle impact
  - Treatment duration
- Conversational chat interface
- Treatment selection and comparison mode
- Chat history persistence

**How it Works:**
1. Click the floating AskCura button in the bottom-right corner
2. Ask questions about your condition or treatments
3. Use comparison mode to select and compare multiple treatments
4. Get AI-generated insights in simple language
5. Always consult with healthcare providers before making decisions

### Researcher Version: Protocol Advisor 🔬

**Features:**
- Technical scientific language for protocol analysis
- Evidence-based comparisons with citations
- Detailed metrics including:
  - Efficacy metrics (hazard ratios, response rates, survival data)
  - Toxicity profiles (Grade 3/4 adverse events)
  - Biomarker analysis (molecular targets, predictive markers)
  - Trial design details (phase, endpoints, patient selection)
  - Mechanistic insights (MOA, pathway analysis)
  - Key publications and trial references
- Protocol comparison mode
- Scientific chat interface

**Technology:**
- **AI Model**: OpenAI GPT-4o
- **Response Time**: 5-15 seconds
- **Conversation Storage**: MongoDB
- **API Authentication**: Session-based with automatic cleanup

### API Endpoints

```
POST   /api/askcura/patient/chat                    - Patient chat
POST   /api/askcura/researcher/chat                 - Researcher chat
POST   /api/askcura/patient/compare-treatments      - Compare treatments
POST   /api/askcura/researcher/compare-protocols    - Compare protocols
GET    /api/askcura/history                         - Get chat history
DELETE /api/askcura/history                         - Clear history
```

### Visual Features
- **Formatted Responses**: Auto-formatted sections with headers
- **Contextual Icons**: ✓ efficacy, ⚠ side effects, 💰 cost, 🧬 biomarkers, 📊 trials
- **Color-Coded Terms**: 
  - 🟢 Green: Effectiveness, efficacy, survival
  - 🟠 Orange: Side effects, toxicity, risks
  - 🔵 Blue: Cost, price, insurance
  - 🟣 Purple: Protocol, treatment, therapy
- **Smooth Animations**: Slide-up panel, floating button
- **Responsive Design**: Works on all devices

---

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Shadcn UI** - Component library
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend
- **FastAPI** - Modern Python web framework
- **Motor** - Async MongoDB driver for async operations
- **Pydantic** - Data validation and serialization
- **Python-dotenv** - Environment variable management
- **Requests** - HTTP library for external API calls
- **Emergent Integrations** - LLM integration library
- **OpenAI GPT-4o** - AI-powered features (via Emergent LLM Key)
- **Biopython** - PubMed API integration
- **Requests-Cache** - API response caching

### Database
- **MongoDB** - NoSQL database for flexible data storage

### Infrastructure
- **Emergent Platform** - Kubernetes-based hosting
- **Jitsi Meet** - Video conferencing integration
- **Nginx** - Reverse proxy

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- Python 3.9+
- MongoDB 6.0+
- Emergent LLM API Key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/curalink.git
   cd curalink
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   yarn install
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   mongod --dbpath /path/to/data
   ```

5. **Run the Application**

   In separate terminals:
   
   **Backend:**
   ```bash
   cd backend
   uvicorn server:app --reload --host 0.0.0.0 --port 8001
   ```
   
   **Frontend:**
   ```bash
   cd frontend
   yarn start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - API Docs: http://localhost:8001/docs

---

## 🔐 Environment Variables

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_AUTH_URL=https://auth.emergentagent.com
REACT_APP_JITSI_DOMAIN=meet.jit.si
WDS_SOCKET_PORT=443
```

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=curalink_db
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
EMERGENT_LLM_KEY=your_emergent_llm_key
EMERGENT_AUTH_BACKEND_URL=https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data
```

---

## 📁 Project Structure

```
curalink/
├── backend/
│   ├── server.py                    # Main FastAPI application (4500+ lines)
│   ├── treatment_advisor.py         # AskCura AI module
│   ├── auth_google.py               # Google OAuth implementation
│   ├── clinical_trials_api.py       # ClinicalTrials.gov integration
│   ├── pubmed_api.py                # PubMed API integration
│   ├── requirements.txt             # Python dependencies
│   └── .env                         # Backend environment variables
├── frontend/
│   ├── public/
│   │   └── index.html              # HTML template
│   ├── src/
│   │   ├── App.js                  # Main React component (6100+ lines)
│   │   ├── App.css                 # Global styles with animations
│   │   ├── index.js                # React entry point
│   │   ├── index.css               # Tailwind imports
│   │   ├── components/
│   │   │   ├── ui/                 # Shadcn UI components
│   │   │   ├── AskCura.jsx         # AI Treatment Advisor UI
│   │   │   ├── AskCura.css         # AskCura styling
│   │   │   ├── QACommunity.js      # Q&A feature
│   │   │   ├── Notifications.js    # Notification center
│   │   │   ├── ChatRoom.js         # Real-time chat
│   │   │   └── ForumDiscussion.js  # Forum discussions
│   │   ├── hooks/
│   │   │   ├── use-toast.js        # Toast notifications
│   │   │   └── useScrollAnimation.js # Scroll animations
│   │   └── lib/
│   │       └── utils.js            # Utility functions
│   ├── package.json                # Node dependencies
│   ├── tailwind.config.js          # Tailwind configuration
│   └── .env                        # Frontend environment variables
├── tests/                          # Test files
├── test_result.md                  # Testing documentation
└── README.md                       # This file
```

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/google/login` | Initiate Google OAuth login | No |
| GET | `/api/auth/google/callback` | Handle OAuth callback | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |
| POST | `/api/auth/role` | Set user role (patient/researcher) | Yes |

### AskCura AI Endpoints (NEW!)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/askcura/patient/chat` | Chat with patient advisor | Yes |
| POST | `/api/askcura/researcher/chat` | Chat with researcher advisor | Yes |
| POST | `/api/askcura/patient/compare-treatments` | Compare treatments | Yes |
| POST | `/api/askcura/researcher/compare-protocols` | Compare protocols | Yes |
| GET | `/api/askcura/history` | Get conversation history | Yes |
| DELETE | `/api/askcura/history` | Clear conversation history | Yes |

### Search Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/search` | Patient search with matching | Yes |
| POST | `/api/researcher/search` | Researcher search with matching | Yes |

### Patient Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/patient/profile` | Create/update patient profile | Yes |
| GET | `/api/patient/profile` | Get patient profile | Yes |
| GET | `/api/patient/overview` | Get personalized "For You" feed | Yes |
| GET | `/api/patient/clinical-trials` | Search clinical trials | Yes |
| GET | `/api/patient/experts` | Get health experts with ratings | Yes |
| GET | `/api/patient/publications` | Get medical publications | Yes |
| POST | `/api/appointments/request` | Request appointment with expert | Yes |
| GET | `/api/appointments` | Get user appointments | Yes |

### Researcher Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/researcher/profile` | Create/update researcher profile | Yes |
| PUT | `/api/researcher/profile` | Update researcher profile | Yes |
| GET | `/api/researcher/profile` | Get researcher profile | Yes |
| GET | `/api/researcher/overview` | Get personalized "For You" feed | Yes |
| GET | `/api/researcher/publications` | Get PubMed publications | Yes |
| POST | `/api/researcher/trial` | Create clinical trial | Yes |
| GET | `/api/researcher/trials` | Get researcher's trials | Yes |
| GET | `/api/researcher/collaborators` | Find collaborators | Yes |
| GET | `/api/researcher/{id}/details` | Get detailed researcher info | Yes |

### Q&A Community Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/qa/questions` | Create question (patients) | Yes |
| GET | `/api/qa/questions` | Get all questions | Yes |
| GET | `/api/qa/questions/{id}` | Get question with answers | Yes |
| POST | `/api/qa/answers` | Answer question (researchers) | Yes |
| POST | `/api/qa/vote` | Vote on answer (like/dislike) | Yes |

### Forum Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/forums` | Get all forums | No |
| POST | `/api/forums` | Create forum | Yes |
| GET | `/api/forums/{id}` | Get forum details | No |
| POST | `/api/forums/{id}/join` | Join forum | Yes |
| POST | `/api/forums/{id}/leave` | Leave forum | Yes |
| POST | `/api/forums/{id}/posts` | Create forum post | Yes |
| GET | `/api/forums/{id}/posts` | Get forum posts | No |

### Chat & Collaboration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/chat-rooms` | Get user's chat rooms | Yes |
| GET | `/api/chat-rooms/{id}/messages` | Get chat messages | Yes |
| POST | `/api/chat-rooms/{id}/messages` | Send message | Yes |
| POST | `/api/chat-rooms/{id}/close` | Close chat session | Yes |
| POST | `/api/collaborations/request` | Request collaboration | Yes |
| GET | `/api/collaborations/requests` | Get collaboration requests | Yes |
| POST | `/api/collaborations/{id}/accept` | Accept request | Yes |
| POST | `/api/collaborations/{id}/reject` | Reject request | Yes |
| GET | `/api/collaborations/{id}/messages` | Get collab messages | Yes |
| POST | `/api/collaborations/{id}/messages` | Send collab message | Yes |

### Notifications & Reviews

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notifications` | Get user notifications | Yes |
| GET | `/api/notifications/unread-count` | Get unread count | Yes |
| PUT | `/api/notifications/{id}/read` | Mark as read | Yes |
| POST | `/api/reviews` | Submit review | Yes |
| GET | `/api/reviews/researcher/{id}` | Get researcher reviews | Yes |

### Favorites

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/favorites` | Add to favorites | Yes |
| GET | `/api/favorites` | Get user favorites | Yes |
| DELETE | `/api/favorites` | Remove from favorites | Yes |

### Activity & Analytics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/activity` | Get user activity | Yes |
| GET | `/api/analytics/stats` | Get platform statistics | No |

---

## 🗄 Database Schema

### Collections

#### users
```javascript
{
  id: UUID,
  email: String,
  name: String,
  roles: [String],  // ["patient", "researcher"]
  created_at: DateTime
}
```

#### patient_profiles
```javascript
{
  user_id: UUID,
  conditions: [String],
  location: String,
  age: Number,
  medical_history: String
}
```

#### researcher_profiles
```javascript
{
  user_id: UUID,
  name: String,
  specialty: [String],
  research_interests: [String],
  institution: String,
  bio: String,
  experience: Number,
  sector: String,
  hours_per_week: Number,
  open_to_collaboration: Boolean
}
```

#### clinical_trials
```javascript
{
  id: String (NCT ID),
  title: String,
  description: String,
  phase: String,
  status: String,
  location: String,
  disease_areas: [String],
  eligibility: String,
  created_by: UUID,
  ai_summary: String
}
```

#### askcura_conversations (NEW!)
```javascript
{
  user_id: UUID,
  role: String,  // "patient" or "researcher"
  messages: [{
    role: String,  // "user" or "assistant"
    content: String,
    timestamp: DateTime
  }],
  updated_at: DateTime
}
```

#### treatment_comparisons (NEW!)
```javascript
{
  user_id: UUID,
  disease: String,
  treatments: [String],
  comparison: Object,
  created_at: DateTime
}
```

#### protocol_comparisons (NEW!)
```javascript
{
  user_id: UUID,
  condition: String,
  protocols: [String],
  comparison: Object,
  created_at: DateTime
}
```

---

## 🔐 Authentication

### Google OAuth 2.0 Flow

1. **User clicks "Sign In"**
   - Frontend redirects to `/api/auth/google/login`
   - Backend generates Google OAuth URL with `prompt=select_account`

2. **User authenticates with Google**
   - Google redirects to `/api/auth/google/callback`
   - Backend exchanges code for tokens

3. **Session Creation**
   - Backend verifies Google token
   - Creates/updates user in MongoDB
   - Generates session token
   - Sets HttpOnly cookie

4. **Session Management**
   - Session expires after 7 days
   - Automatic cleanup on logout
   - Session validation on each API request

### Security Features
- HttpOnly cookies (prevents XSS)
- CORS whitelist
- Session expiration
- Google OAuth token verification
- No password storage

---

## 🎨 Visual Design

### Color Theme
- **Primary**: #3F51B5 (Indigo)
- **Secondary**: #536DFE (Lighter Indigo)
- **Background**: Linear gradients with indigo tones
- **Text**: Dark grays with good contrast

### Animated Particles Background
- **Landing Page**: 50 particles (opacity 0.3-0.8)
- **Dashboards**: 20 particles (opacity 0.15-0.35)
- **QA Community**: 20 particles (opacity 0.15-0.35)
- **Notifications**: 20 particles (opacity 0.15-0.35)
- **Animation**: Bottom-to-top float with rotation
- **Color**: Soft indigo/lavender gradient

### UI Components
- **Shadcn UI**: High-quality accessible components
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Modern icon library
- **Responsive Grid**: Mobile-first design
- **Smooth Animations**: CSS transitions and keyframes

---

## 🚀 Deployment

### Emergent Platform (Recommended)

1. **Prepare Environment**
   - Ensure all environment variables are configured
   - CORS origins include production domain
   - Database connection uses production MongoDB URL

2. **Deploy to Emergent**
   ```bash
   # Push to repository connected to Emergent
   git push origin main
   ```

3. **Post-Deployment**
   - Verify services are running
   - Test authentication flow
   - Seed initial data if needed

### Resource Requirements
- CPU: 250m (0.25 cores)
- Memory: 1Gi
- Replicas: 2 (for high availability)
- Database: MongoDB managed instance

### Health Checks
- Frontend: Port 3000
- Backend: Port 8001
- API Health: `/api/auth/me`

---

## 🎨 Features Showcase

### Landing Page
- Clean, modern design with testimonials carousel
- Role-based CTAs for patients and researchers
- Responsive design for all devices

### Patient Dashboard
- Personalized recommendations
- Easy access to trials, experts, and publications
- Quick appointment scheduling

### Researcher Dashboard
- Trial management interface
- Patient inquiry handling
- Collaboration tools

### One-on-One Consultations
- Real-time chat with image sharing
- Integrated Jitsi Meet video calls
- Temporary session management

---

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest tests/
```

### Frontend Testing
```bash
cd frontend
yarn test
```

### E2E Testing
Use Playwright for end-to-end testing:
```bash
yarn test:e2e
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Your Name** - Initial work - [YourGitHub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- **Emergent Platform** - Hosting, deployment infrastructure, and LLM integration
- **OpenAI GPT-4o** - AI-powered features (AskCura, summaries, matching)
- **ClinicalTrials.gov** - Clinical trials database API
- **PubMed/NCBI** - Medical publications database
- **Google OAuth** - Secure authentication
- **Jitsi** - Video conferencing integration (planned)
- **Shadcn UI** - Beautiful accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Icons** - Modern icon library

---

## 📞 Support

For support, email support@curalink.com or join our Slack channel.

---

## 🗺 Roadmap

### Completed ✅
- [x] Patient and Researcher dashboards
- [x] Clinical trials integration (ClinicalTrials.gov)
- [x] PubMed publications integration
- [x] Google OAuth authentication
- [x] Real-time chat and notifications
- [x] Q&A community platform
- [x] AI-powered search and matching
- [x] AskCura AI Treatment Advisor
- [x] Animated particles background
- [x] Responsive mobile design
- [x] Reviews and ratings system
- [x] Collaboration tools for researchers
- [x] Forum discussions
- [x] Profile customization

### In Progress 🚧
- [ ] Video consultations (Jitsi integration)
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Export favorites summary (PDF/Print)

### Future Plans 🔮
- [ ] Mobile app (iOS & Android)
- [ ] Multi-language support (Spanish, French, Chinese)
- [ ] Integration with EHR systems
- [ ] Blockchain-based medical records
- [ ] Telemedicine expansion
- [ ] AI-powered trial matching
- [ ] Wearable device integration
- [ ] Insurance integration
- [ ] Clinical trial enrollment tracking

---

<div align="center">

**Made with ❤️ for advancing healthcare research**

⭐ Star us on GitHub — it motivates us a lot!

[Website](https://curalink.com) • [Documentation](https://docs.curalink.com) • [Twitter](https://twitter.com/curalink)

</div>
