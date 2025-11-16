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

### For Patients & Caregivers

- 🔍 **Clinical Trial Discovery** - Search and filter thousands of clinical trials by condition, location, and phase
- 👨‍⚕️ **Expert Consultation** - Connect with health experts and researchers for one-on-one consultations
- 📚 **Research Access** - Stay updated with the latest medical publications and research findings
- 💬 **Q&A Community** - Ask questions and get answers from verified medical researchers
- ⭐ **Reviews & Ratings** - Rate and review healthcare professionals after consultations
- 📅 **Appointment Management** - Request and manage appointments with researchers
- 💾 **Favorites** - Save trials, publications, and experts for easy access

### For Researchers

- 🧪 **Trial Management** - Create, update, and manage clinical trials with AI-powered summaries
- 🤝 **Collaboration** - Find and connect with other researchers in your field
- 📊 **Patient Engagement** - Respond to patient questions and manage consultation requests
- 🎥 **Video Consultations** - Conduct secure one-on-one consultations via integrated Jitsi Meet
- 💡 **AI Assistance** - Automatic trial and publication summarization using GPT-4
- 🏆 **Profile Building** - Showcase expertise, publications, and receive patient reviews

### Platform Features

- 🔐 **Secure Authentication** - OAuth-based authentication with Emergent Auth
- 📱 **Responsive Design** - Fully responsive interface for desktop, tablet, and mobile
- 🎨 **Modern UI/UX** - Clean, accessible interface with Shadcn UI components
- 🔔 **Real-time Notifications** - Get instant updates on appointments and messages
- 💬 **Live Chat** - Real-time messaging with image sharing capabilities
- 🌐 **CORS-Protected APIs** - Secure backend with explicit origin whitelisting

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
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation
- **Python-dotenv** - Environment variable management
- **Requests** - HTTP library
- **Emergent Integrations** - LLM integration (OpenAI GPT-4)

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
│   ├── server.py              # Main FastAPI application
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
├── frontend/
│   ├── public/
│   │   └── index.html        # HTML template
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── App.css           # Global styles
│   │   ├── index.js          # React entry point
│   │   ├── index.css         # Tailwind imports
│   │   └── components/
│   │       ├── ui/           # Shadcn UI components
│   │       ├── QACommunity.js    # Q&A feature
│   │       ├── Notifications.js  # Notification center
│   │       └── ChatRoom.js       # Chat functionality
│   ├── package.json          # Node dependencies
│   └── .env                  # Frontend environment variables
├── tests/                    # Test files
├── scripts/                  # Utility scripts
└── README.md                 # This file
```

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/session` | Process OAuth session |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/role` | Set user role (patient/researcher) |

### Patient Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/patient/profile` | Create/update patient profile |
| GET | `/api/patient/clinical-trials` | Search clinical trials |
| GET | `/api/patient/experts` | Get health experts with ratings |
| GET | `/api/patient/publications` | Get medical publications |
| POST | `/api/appointments/request` | Request appointment with expert |

### Researcher Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/researcher/profile` | Create/update researcher profile |
| POST | `/api/researcher/trial` | Create clinical trial |
| GET | `/api/researcher/collaborators` | Find collaborators |
| GET | `/api/researcher/trials` | Get researcher's trials |

### Q&A Community Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qa/questions` | Create question (patients) |
| GET | `/api/qa/questions` | Get all questions |
| GET | `/api/qa/questions/{id}` | Get question with answers |
| POST | `/api/qa/answers` | Answer question (researchers) |
| POST | `/api/qa/vote` | Vote on answer (like/dislike) |

### Chat & Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat-rooms` | Get user's chat rooms |
| GET | `/api/chat-rooms/{id}/messages` | Get chat messages |
| POST | `/api/chat-rooms/{id}/messages` | Send message |
| POST | `/api/chat-rooms/{id}/close` | Close chat session |
| GET | `/api/notifications` | Get user notifications |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Submit review |
| GET | `/api/reviews/researcher/{id}` | Get researcher reviews |

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

- **Emergent Platform** - Hosting and deployment infrastructure
- **OpenAI** - AI-powered summarization features
- **Jitsi** - Video conferencing integration
- **Shadcn UI** - Beautiful UI components
- **Unsplash & Pexels** - Testimonial images

---

## 📞 Support

For support, email support@curalink.com or join our Slack channel.

---

## 🗺 Roadmap

- [ ] Mobile app (iOS & Android)
- [ ] Advanced AI matching for trials
- [ ] Integration with EHR systems
- [ ] Multi-language support
- [ ] Blockchain-based medical records
- [ ] Telemedicine expansion

---

<div align="center">

**Made with ❤️ for advancing healthcare research**

⭐ Star us on GitHub — it motivates us a lot!

[Website](https://curalink.com) • [Documentation](https://docs.curalink.com) • [Twitter](https://twitter.com/curalink)

</div>
