# Deployment Guide

## Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to GitHub
2. **Firebase Project**: Have your Firebase credentials ready
3. **Cloudinary Account**: Have your Cloudinary credentials ready
4. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
5. **Render Account**: Sign up at [render.com](https://render.com)

---

## Backend Deployment (Render)

### 1. Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select the repository: `future_childs`
5. Configure the service:
   - **Name**: `future-childs-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

### 2. Set Environment Variables

Add these environment variables in Render:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# JWT Secret (generate a random string)
JWT_SECRET=your-secure-random-string-min-32-characters

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Frontend URL (will be your Vercel URL)
FRONTEND_URL=https://your-app.vercel.app
```

**Important Notes:**
- For `FIREBASE_PRIVATE_KEY`: Copy the entire private key from your Firebase service account JSON, including newlines as `\n`
- Generate `JWT_SECRET`: Use `openssl rand -base64 32` or any random string generator
- `FRONTEND_URL` will be updated after Vercel deployment

### 3. Deploy

1. Click **Create Web Service**
2. Wait for the build to complete
3. Your backend URL will be: `https://future-childs-backend.onrender.com`

---

## Frontend Deployment (Vercel)

### 1. Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Select the `future_childs` repository

### 2. Configure Project

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 3. Set Environment Variables

Add these environment variables in Vercel:

```bash
# Backend API URL (your Render backend URL)
NEXT_PUBLIC_API_URL=https://future-childs-backend.onrender.com/api

# Socket.io URL (same as backend, without /api)
NEXT_PUBLIC_SOCKET_URL=https://future-childs-backend.onrender.com

# Firebase Configuration (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-web-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**Where to find Firebase Web Config:**
1. Go to Firebase Console → Project Settings
2. Scroll to "Your apps" section
3. Click the web app (</> icon)
4. Copy the config values

### 4. Deploy

1. Click **Deploy**
2. Wait for the build to complete
3. Your frontend URL will be: `https://your-app.vercel.app`

### 5. Update Backend CORS

After getting your Vercel URL, go back to Render and update the `FRONTEND_URL` environment variable to match your actual Vercel URL.

---

## Post-Deployment Steps

### 1. Update Firebase Security Rules

Update your Firestore security rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /classes/{classId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher');
    }
    
    match /quizzes/{quizId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher');
    }
    
    match /gameSessions/{sessionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /quizAttempts/{attemptId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /parentChildLinks/{linkId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. Test the Deployment

1. Visit your Vercel URL
2. Try logging in
3. Create a test quiz
4. Start a game session
5. Test student joining and answering
6. Verify results page loads

### 3. Custom Domain (Optional)

**Vercel:**
1. Go to your project settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

**Render:**
1. Go to your service → Settings → Custom Domain
2. Add your custom domain
3. Update DNS records as instructed

---

## Troubleshooting

### Backend Issues

**Build Fails:**
- Check Node.js version: Render uses latest LTS by default
- Verify all dependencies are in `package.json`
- Check build logs for TypeScript errors

**Runtime Errors:**
- Check environment variables are set correctly
- Verify Firebase credentials format (especially private key)
- Check Render logs: Settings → Logs

**CORS Errors:**
- Ensure `FRONTEND_URL` matches your Vercel URL exactly
- Include protocol (https://)
- No trailing slash

### Frontend Issues

**Build Fails:**
- Check for TypeScript errors
- Verify all environment variables start with `NEXT_PUBLIC_`
- Check Vercel build logs

**API Connection Fails:**
- Verify `NEXT_PUBLIC_API_URL` includes `/api` suffix
- Ensure backend is deployed and running
- Check browser console for CORS errors

**Socket.io Not Connecting:**
- Verify `NEXT_PUBLIC_SOCKET_URL` points to backend root (no /api)
- Check browser console for connection errors
- Ensure Render backend supports WebSocket (free tier does)

---

## Monitoring

### Render
- View logs: Dashboard → Your Service → Logs
- Monitor metrics: Dashboard → Your Service → Metrics
- Set up alerts: Dashboard → Your Service → Settings → Notifications

### Vercel
- View logs: Project → Deployments → [Deployment] → Functions
- Monitor performance: Project → Analytics
- Error tracking: Project → Integrations → Add Sentry (optional)

---

## Scaling Considerations

### Free Tier Limitations

**Render Free Tier:**
- Service spins down after 15 minutes of inactivity
- First request after spin-down will be slow (cold start ~30s)
- 750 hours/month (enough for one service)

**Vercel Free Tier:**
- 100GB bandwidth/month
- Unlimited deployments
- Fast edge network

### Upgrade Path

When you need better performance:
1. **Render**: Upgrade to Starter ($7/month) for always-on service
2. **Vercel**: Pro plan ($20/month) for team features and higher limits
3. **Database**: Consider Firebase Blaze plan for production scale

---

## Backup Strategy

1. **Firebase Data**: Set up automated exports
2. **Environment Variables**: Keep a secure backup of all credentials
3. **Code**: Ensure GitHub repository is up to date

---

## Security Checklist

- [ ] All environment variables are set
- [ ] JWT_SECRET is strong and random
- [ ] Firebase private key is properly escaped
- [ ] CORS is configured with correct frontend URL
- [ ] Firebase security rules are production-ready
- [ ] API endpoints have proper authentication
- [ ] No sensitive data in client-side code
- [ ] HTTPS is enforced (automatic on Vercel/Render)

---

## Support

If you encounter issues:
1. Check deployment logs on both platforms
2. Verify all environment variables
3. Test API endpoints directly (using Postman/curl)
4. Check Firebase Console for database errors
5. Review browser console for frontend errors
