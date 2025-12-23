# Educational Feedback Galaxy (E-F-G)

An AI-powered educational platform for interactive feedback, quizzes, and learning analytics.

## Features

- **AI Quiz Arena** - Generate quizzes using Google Gemini AI from topics or uploaded documents
- **Real-time Multiplayer** - Compete with other students in live quiz battles
- **Feedback System** - Submit and receive AI-powered feedback on assignments
- **Learning Analytics** - Track progress with visual dashboards and statistics
- **Role-based Access** - Separate interfaces for students, teachers, and administrators
- **Document Upload** - Generate quizzes from PDF, DOCX, and TXT files

## Tech Stack

**Frontend**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui components

**Backend**
- Node.js with Express
- MongoDB for database
- Socket.io for real-time features
- Google Gemini AI integration

**Authentication**
- JWT tokens
- Firebase Authentication
- Google OAuth

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/SRINIKHIL2005/E-F-G.git
cd E-F-G
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
   - Copy `.env.example` to `.env`
   - Add your MongoDB connection string
   - Add Google Gemini API key
   - Add Firebase configuration
   - Add other required API keys

4. Start development server
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Project Structure

```
├── server/              # Backend Express server
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   └── server.js       # Main server file
├── src/                # Frontend React application
│   ├── components/     # Reusable components
│   ├── contexts/       # React contexts
│   ├── pages/          # Page components
│   └── lib/            # Utility functions
└── public/             # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Setup

Create a `.env` file with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
JWT_SECRET=your_jwt_secret
```

## Contact

Dronadula Sri Nikhil - dronasrinikhil@gmail.com
