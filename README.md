# 💪 Gladiator App

A competitive fitness challenge app where users upload videos completing assigned challenges and compete 1-on-1, with battles judged by a group of peers.

## 🎯 Features

- **Authentication**: Sign-up/Login with email/password
- **Battle System**: Real-time matchmaking with 10-user groups (5 head-to-head battles)
- **Video Challenges**: Upload videos completing fitness challenges
- **Peer Voting**: Community-based judging system
- **Ranking System**: Tier-based progression (Bronze → Silver → Gold → Platinum → Diamond → Gladiator)
- **Leaderboards**: Global and tier-specific rankings
- **User Profiles**: Track stats, battle history, and progression

## 🏗️ Project Structure

```
Gladiator/
├── backend/                 # Node.js/Express API
│   ├── config/             # Database configuration
│   ├── middleware/         # Auth and error handling
│   ├── routes/            # API routes
│   └── scripts/           # Database migration/seeding
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities and API calls
│   │   └── store/        # State management
└── package.json          # Workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Gladiator
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup PostgreSQL Database**
   - Create a PostgreSQL database named `gladiator_db`
   - Update database credentials in `backend/config.example.env`

4. **Configure Environment Variables**
   ```bash
   cp backend/config.example.env backend/.env
   ```
   
   Update the following variables in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/gladiator_db
   JWT_SECRET=your-super-secret-jwt-key
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name (optional)
   CLOUDINARY_API_KEY=your-cloudinary-key (optional)
   CLOUDINARY_API_SECRET=your-cloudinary-secret (optional)
   ```

5. **Initialize Database**
   ```bash
   npm run backend:migrate
   npm run backend:seed
   ```

6. **Start Development Servers**
   ```bash
   npm run dev
   ```

This will start:
- Backend API server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

## 🗄️ Database Schema

The app uses PostgreSQL with the following main tables:

- **users**: User profiles, stats, and tier information
- **battles**: Head-to-head challenge matches
- **challenges**: Fitness challenge definitions
- **votes**: Peer voting records
- **voting_groups**: 10-user matchmaking groups
- **video_uploads**: Challenge video metadata
- **leaderboards**: Ranking snapshots

## 🎮 How It Works

1. **Join Battle Queue**: Users click "Battle Now" to join matchmaking
2. **Matchmaking**: System groups 10 users for 5 simultaneous battles
3. **Challenge Assignment**: Each pair gets a randomized fitness challenge
4. **Video Submission**: Users record themselves completing the challenge
5. **Peer Voting**: Other 8 users in the group vote on each battle
6. **Results**: Winners are determined by majority vote
7. **Progression**: Users gain/lose points and advance through tiers

## 🛠️ Tech Stack

### Backend
- **Node.js + Express**: RESTful API server
- **PostgreSQL**: Primary database
- **JWT**: Authentication
- **Multer + Cloudinary**: Video upload handling
- **bcryptjs**: Password hashing

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Shadcn/ui**: Component library
- **Zustand**: State management
- **React Router**: Client-side routing
- **Axios**: HTTP client

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Battles
- `POST /api/battles/battle-now` - Join battle queue
- `GET /api/battles/active` - Get user's active battles
- `POST /api/battles/:id/submit-video` - Submit challenge video

### Voting
- `GET /api/votes/pending` - Get battles available for voting
- `POST /api/votes/:battleId/vote` - Submit vote

### Users
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/leaderboard` - Get leaderboard
- `PUT /api/users/profile` - Update user profile

## 🎨 UI Components

Built with Shadcn/ui components:
- **Button**: Multiple variants including custom "gladiator" style
- **Card**: Content containers with headers and footers
- **Avatar**: User profile images with fallbacks
- **Badge**: Tier and status indicators
- **Input/Label**: Form components

## 🔧 Development Scripts

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Backend only
npm run backend:dev
npm run backend:start

# Frontend only  
npm run frontend:dev
npm run frontend:build

# Database operations
npm run backend:migrate
npm run backend:seed
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Run database migrations
3. Deploy to your preferred platform (Heroku, Railway, etc.)

### Frontend Deployment
1. Build the production bundle: `npm run frontend:build`
2. Deploy the `frontend/dist` folder to a static hosting service (Vercel, Netlify, etc.)
3. Update the API base URL in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify database connection and credentials
3. Ensure all dependencies are installed correctly
4. Check that both servers are running on the correct ports

For development with test users:
- Email: `john@example.com`, Password: `password123`
- Email: `sarah@example.com`, Password: `password123`
- Email: `mike@example.com`, Password: `password123`

---

Built with ❤️ for the fitness community 