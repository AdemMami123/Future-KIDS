# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. Generate Production JWT Secret
```bash
# Run this command to generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Or use: openssl rand -base64 32
```
Save this value - you'll need it for Render environment variables.

### 2. Verify You Have All Credentials
- [ ] Firebase Project ID
- [ ] Firebase Private Key (from service account JSON)
- [ ] Firebase Client Email
- [ ] Firebase Web Config (9 values starting with NEXT_PUBLIC_)
- [ ] Cloudinary Cloud Name, API Key, API Secret
- [ ] New JWT Secret (generated above, **never reuse dev secret**)

---

## 🔧 Backend Deployment (Render.com)

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Create Render Web Service
1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `future-childs-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter for better performance)

### Step 3: Set Environment Variables on Render
Click **"Environment"** tab and add these variables:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=<your-generated-secret-from-step-1>

FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_PRIVATE_KEY=<your-firebase-private-key-with-\n-escaped>
FIREBASE_CLIENT_EMAIL=<your-firebase-client-email>

CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>

FRONTEND_URL=http://localhost:3000
# ⚠️ You'll update this after deploying frontend
```

**Important**: For `FIREBASE_PRIVATE_KEY`, escape newlines as `\n`:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG...\n-----END PRIVATE KEY-----\n
```

### Step 4: Deploy Backend
1. Click **"Create Web Service"**
2. Wait for build to complete (~2-3 minutes)
3. Note your backend URL: `https://future-childs-backend.onrender.com`

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Create Vercel Project
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

### Step 2: Set Environment Variables on Vercel
Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_API_URL=https://future-childs-backend.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://future-childs-backend.onrender.com

NEXT_PUBLIC_FIREBASE_API_KEY=<your-firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project-id>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<your-measurement-id>
```

**Tip**: Select "Production", "Preview", and "Development" for all variables.

### Step 3: Deploy Frontend
1. Click **"Deploy"**
2. Wait for build to complete (~1-2 minutes)
3. Note your frontend URL: `https://your-app.vercel.app`

---

## 🔗 Post-Deployment Configuration

### 1. Update Backend FRONTEND_URL
Go back to Render → Environment Variables:
```
FRONTEND_URL=https://your-app.vercel.app
```
**Important**: This enables CORS between your frontend and backend. Save and the service will auto-redeploy.

### 2. Update Firebase Security Rules
Go to Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - authenticated users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Game sessions - authenticated users can read/write
    match /gameSessions/{sessionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Quizzes - authenticated users can read/write
    match /quizzes/{quizId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

Click **"Publish"** to apply the rules.

---

## 🧪 Testing Your Deployment

### 1. Health Check
Visit: `https://future-childs-backend.onrender.com/api/health`

Expected response:
```json
{
  "status": "OK",
  "message": "FutureChilds API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Test Complete Flow
1. Visit your Vercel frontend URL
2. **Sign Up** as a teacher
3. **Create a class** and quiz
4. **Start a game** from the quiz
5. Copy game code
6. Open **incognito window**, sign up as student
7. **Join game** with code
8. Teacher **starts game** from lobby
9. Both answer questions
10. View **results page**

### 3. Check Socket.io Connection
Open browser DevTools → Network tab → filter "ws" or "websocket"
- Should see successful WebSocket upgrade
- If polling only, that's OK (it works but slower)

---

## ⚠️ Common Issues & Fixes

### Backend Build Fails
**Error**: "Cannot find module" or "TypeScript errors"
**Fix**: 
```bash
cd backend
npm install
npm run build
# If successful locally, push to trigger Render rebuild
```

### Frontend Build Fails
**Error**: "Module not found" or linting errors
**Fix**:
```bash
cd frontend
npm install
npm run build
# Fix any errors shown, then push
```

### CORS Errors in Browser Console
**Error**: "Access to fetch at ... has been blocked by CORS policy"
**Fix**: 
1. Verify `FRONTEND_URL` on Render matches your Vercel URL exactly
2. Check for `http://` vs `https://` mismatch
3. Wait 1-2 minutes for Render to redeploy after changing env vars

### Socket.io Not Connecting
**Error**: Console shows "WebSocket connection failed" or timeouts
**Fix**:
1. Verify `NEXT_PUBLIC_SOCKET_URL` on Vercel is correct (no `/api` suffix)
2. Check Render logs for socket connection attempts
3. Free tier cold starts take ~30s - refresh after initial load

### Authentication Failing
**Error**: "Invalid token" or "Authentication required"
**Fix**:
1. Clear browser cookies and localStorage
2. Sign up with a new account
3. Verify Firebase credentials are correct on both platforms
4. Check JWT_SECRET is set on Render (and different from dev)

### Results Page Shows "Unauthorized"
**Fix**: This was temporarily disabled for debugging. Now re-enabled with authentication middleware. Users must be logged in to view results.

---

## 📊 Monitoring Your Apps

### Render Dashboard
- **Logs**: Click your service → "Logs" tab for real-time server logs
- **Metrics**: View CPU, memory usage, and request counts
- **Events**: See deploys, restarts, and configuration changes

### Vercel Dashboard
- **Deployments**: See all deployments and their status
- **Analytics**: View page views and performance (requires upgrade)
- **Logs**: Click deployment → "Functions" for serverless logs

### Firebase Console
- **Firestore Usage**: Monitor reads/writes (free tier: 50k reads/day, 20k writes/day)
- **Authentication**: Track active users
- **Rules**: Check for denied requests

---

## 🎯 Performance Notes

### Render Free Tier Limitations
- **Cold Starts**: Service sleeps after 15 minutes of inactivity
- **First Request**: Takes ~30 seconds to wake up
- **Active Usage**: Normal response times (<200ms) when warm
- **Upgrade**: $7/month for always-on instance (no cold starts)

### Vercel Free Tier
- **Function Timeout**: 10 seconds per request
- **Bandwidth**: 100GB/month
- **Builds**: Unlimited
- **Deployments**: Unlimited

---

## 🔒 Security Checklist

- [ ] JWT_SECRET is different from development (never reuse)
- [ ] Firebase private key is properly escaped with `\n`
- [ ] All environment variables set on both platforms
- [ ] Firebase security rules updated for production
- [ ] `.env` files NOT committed to GitHub (.gitignore verified ✅)
- [ ] HTTPS enabled on both Vercel and Render (automatic)
- [ ] CORS restricted to your frontend domain only

---

## 🚀 Next Steps

### Custom Domains (Optional)
1. **Vercel**: Settings → Domains → Add your domain
2. **Render**: Settings → Custom Domain → Add your API subdomain
3. Update `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` accordingly

### Scaling Up
When you exceed free tier limits:
1. **Render**: Upgrade to Starter ($7/month) for always-on
2. **Vercel**: Upgrade to Pro ($20/month) for more bandwidth
3. **Firebase**: Upgrade to Blaze (pay-as-you-go) for higher limits

### Monitoring & Alerts
1. Set up [Sentry](https://sentry.io) for error tracking
2. Use Render email alerts for service downtime
3. Monitor Firebase usage in console

---

## 📚 Additional Resources

- **Full Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Firebase Docs**: https://firebase.google.com/docs

---

## ✅ Final Checklist Before Going Live

- [ ] Backend deployed and health check passes
- [ ] Frontend deployed and loads correctly
- [ ] FRONTEND_URL updated on Render with Vercel URL
- [ ] Firebase security rules published
- [ ] Test complete game flow (teacher creates, student joins, both play)
- [ ] Socket.io connections working
- [ ] Results page loading correctly
- [ ] Authentication working (signup/login)
- [ ] All environment variables verified on both platforms

**Congratulations! Your app is now live! 🎉**
