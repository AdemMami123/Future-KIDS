# Future Childs - Backend API

Backend server for the Educational Quiz Platform built with Node.js, Express, TypeScript, and Socket.IO.

## 🚀 Features

- RESTful API with Express
- Real-time communication with Socket.IO
- Firebase Admin SDK integration
- TypeScript support
- Image upload with Cloudinary
- Request validation with express-validator
- Error handling middleware
- CORS configuration
- Environment-based configuration

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── firebase.ts   # Firebase Admin SDK setup
│   │   └── cloudinary.ts # Cloudinary configuration
│   ├── controllers/      # Route controllers
│   ├── routes/           # API routes
│   │   └── health.routes.ts
│   ├── middleware/       # Custom middleware
│   │   ├── errorHandler.ts
│   │   └── requestLogger.ts
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── socket/           # Socket.io event handlers
│   └── server.ts         # Main server file
├── dist/                 # Compiled JavaScript (generated)
├── .env.example          # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── nodemon.json
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Admin SDK credentials
- Cloudinary account (optional, for image uploads)

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Fill in your credentials in `.env` (see Firebase Setup section below)

4. **Get Firebase credentials** (see detailed instructions below)

5. **Get Cloudinary credentials** (optional, for image uploads):
   - Sign up at [Cloudinary](https://cloudinary.com/)
   - Find credentials in Dashboard
   - Add to `.env` file

### Firebase Admin SDK Setup

The backend uses Firebase Admin SDK for server-side operations. Here's how to set it up:

#### Option 1: Using Service Account Key (Recommended for Development)

1. **Generate Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click the gear icon (⚙️) > Project Settings
   - Go to "Service Accounts" tab
   - Click "Generate New Private Key"
   - Save the JSON file as `serviceAccountKey.json` in the backend root directory
   - **Important:** Add this file to `.gitignore` (already configured)

2. **Configure `.env`:**
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   ```

#### Option 2: Using Environment Variables (Recommended for Production)

1. **Extract values from Service Account JSON:**
   - Use the same JSON file from Option 1
   - Extract these values:
     - `project_id`
     - `private_key` (keep the `\n` newline characters)
     - `client_email`

2. **Configure `.env`:**
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   ```

   **Important:** 
   - Keep the quotes around `FIREBASE_PRIVATE_KEY`
   - Preserve the `\n` characters (they represent newlines)
   - The private key should start with `-----BEGIN PRIVATE KEY-----\n` and end with `\n-----END PRIVATE KEY-----\n`

#### Firebase Admin SDK Features

The backend Firebase configuration ([src/config/firebase.ts](backend/src/config/firebase.ts)) provides:

- **Firestore Admin**: Server-side database operations
- **Authentication Admin**: Verify ID tokens, manage users, set custom claims
- **Realtime Database**: For live game sessions and real-time data
- Automatic initialization with error handling
- Support for both service account file and environment variables

#### Setting User Roles

User roles are managed via Firebase custom claims. Example:

```typescript
import { auth } from './config/firebase';

// Set custom claim for a user
await auth.setCustomUserClaims(userId, { role: 'teacher' });
```

### Cloudinary Setup (Optional)

For image uploads (quiz covers, profile pictures):

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your credentials from the Dashboard
3. Add to `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

The configuration is in [src/config/cloudinary.ts](backend/src/config/cloudinary.ts).
     
     # Cloudinary
     CLOUDINARY_CLOUD_NAME=your-cloud-name
     CLOUDINARY_API_KEY=your-api-key
     CLOUDINARY_API_SECRET=your-api-secret
     
     # CORS
     FRONTEND_URL=http://localhost:3000
     ```

### Running the Server

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

**Linting:**
```bash
npm run lint
```

**Format code:**
```bash
npm run format
```

## 🌐 API Endpoints

### Health Check

- **GET** `/api/health` - Basic health check
- **GET** `/api/health/detailed` - Detailed health check with service status

Example response:
```json
{
  "success": true,
  "message": "Server is running smoothly",
  "uptime": 123.456,
  "timestamp": "2024-01-13T10:30:00.000Z",
  "environment": "development"
}
```

## 🔌 Socket.IO

The server includes Socket.IO for real-time communication. Connection endpoint:
```
ws://localhost:5000
```

## 🧪 Testing

```bash
npm test
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment mode | No (default: development) |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes* |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Yes* |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | Yes* |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON | Yes* |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | No |
| `CLOUDINARY_API_KEY` | Cloudinary API key | No |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | No |
| `FRONTEND_URL` | Frontend application URL | Yes |

*Either provide individual Firebase credentials OR the service account JSON path

## 🔒 Security Features

- CORS configured for frontend origin
- Request body size limits
- Error handling middleware
- Environment-based configuration
- Input validation with express-validator

## 📚 Next Steps

1. Implement authentication middleware
2. Create user routes and controllers
3. Set up quiz management endpoints
4. Implement game session Socket.IO handlers
5. Add Cloudinary upload service
6. Create database models/services

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and formatting
4. Test your changes
5. Submit a pull request

## 📄 License

ISC
