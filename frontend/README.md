# EduQuiz - Frontend

Interactive educational quiz platform built with Next.js 14, TypeScript, TailwindCSS, and Framer Motion.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend server running (see backend README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example.txt .env.local
```

3. Update `.env.local` with your configuration:
   - Firebase credentials
   - Backend API URL
   - Socket.io URL

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── teacher/           # Teacher dashboard & features
│   ├── student/           # Student dashboard & features
│   ├── parent/            # Parent portal
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── teacher/          # Teacher-specific components
│   ├── student/          # Student-specific components
│   ├── parent/           # Parent-specific components
│   ├── game/             # Live game components
│   └── shared/           # Shared/common components
├── lib/                   # Utility functions
│   ├── api.ts            # API client
│   ├── utils.ts          # Helper functions
│   └── firebase.ts       # Firebase config
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts        # Authentication hook
│   ├── useSocket.ts      # Socket.io hook
│   └── useQuiz.ts        # Quiz-related hooks
├── contexts/              # React Context providers
│   ├── AuthContext.tsx   # Auth state management
│   └── SocketContext.tsx # Socket connection
├── types/                 # TypeScript type definitions
│   └── index.ts          # Global types
└── config/                # Configuration files
    └── constants.ts      # App constants
```

## 🎨 Design System

### Colors

The application uses a vibrant, educational color palette:

- **Primary (Blue)**: Trust, learning, focus
- **Secondary (Purple)**: Creativity, engagement
- **Success (Green)**: Achievement, progress
- **Warning (Orange)**: Attention, alerts
- **Error (Red)**: Errors, incorrect answers
- **Info (Cyan)**: Information, hints
- **Accent (Pink)**: Gamification, rewards

### Typography

- **Headings**: Outfit (Google Font)
- **Body**: Inter (Google Font)
- **Monospace**: Fira Code

### Animations

Built with Framer Motion for smooth, engaging animations:
- Page transitions
- Component entrance/exit
- Hover effects
- Loading states
- Celebration effects

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🔧 Configuration

### Environment Variables

See `env.example.txt` for all required environment variables:

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SOCKET_URL` - Socket.io server URL
- Firebase configuration variables
- Feature flags

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Create a Realtime Database
5. Copy configuration to `.env.local`

## 📦 Key Dependencies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **Framer Motion** - Animation library
- **React Query** - Data fetching and caching
- **Socket.io Client** - Real-time communication
- **Firebase** - Authentication and database
- **Axios** - HTTP client
- **React Hook Form** - Form management

## 🎯 Features

### For Teachers
- Create and manage quiz games
- Host live game sessions
- Track student performance
- View detailed analytics
- Manage classes and students

### For Students
- Join live quiz games
- Take quizzes independently
- View progress and achievements
- Compete on leaderboards
- Track learning streaks

### For Parents
- Link to children's accounts
- Monitor academic progress
- View detailed statistics
- Generate performance reports
- Receive alerts

## 🔐 Authentication Flow

1. User signs up with role selection (Teacher/Student/Parent)
2. Firebase Authentication creates user
3. User profile stored in Firestore
4. Role-based routing to appropriate dashboard
5. Protected routes enforce authentication

## 🎮 Live Game Flow

1. Teacher creates game from quiz
2. Unique game code generated
3. Students join with code
4. Real-time lobby shows participants
5. Teacher starts game
6. Questions synced across all clients
7. Students submit answers in real-time
8. Live leaderboard updates
9. Results displayed at end

## 🚧 Development Guidelines

### Component Structure

```tsx
'use client'; // If using hooks/interactivity

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ComponentProps {
  // Props definition
}

export default function Component({ }: ComponentProps) {
  // Component logic
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card"
    >
      {/* Component JSX */}
    </motion.div>
  );
}
```

### Styling Conventions

- Use Tailwind utility classes
- Custom components in `globals.css`
- Responsive design (mobile-first)
- Follow design system colors

### API Calls

```tsx
import { apiClient, API_ENDPOINTS } from '@/lib/api';

// Example API call
const data = await apiClient.get(API_ENDPOINTS.USERS.PROFILE);
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
npx kill-port 3000
npm run dev
```

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build errors:**
```bash
rm -rf .next
npm run build
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Firebase Docs](https://firebase.google.com/docs)

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📝 License

MIT License - see LICENSE file for details

---

Built with ❤️ for education
