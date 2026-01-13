# 🚀 Quick Start Guide - Authentication System

## Prerequisites
- Node.js 18+ installed
- Firebase project configured
- Backend and Frontend folders in place

## 🎯 Quick Setup (5 minutes)

### Step 1: Backend Setup
```bash
cd backend
npm install
npm run dev
```
**Expected output:** 
```
✅ Firebase Admin SDK initialized
🚀 Server running on port 5000
```

### Step 2: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
**Expected output:**
```
✓ Ready in Xms
○ Local: http://localhost:3000
```

### Step 3: Test Authentication

1. **Open browser:** `http://localhost:3000/auth/signup`

2. **Create a teacher account:**
   - Select role: Teacher
   - Email: `teacher@test.com`
   - Password: `password123`
   - First Name: `John`
   - Last Name: `Doe`
   - Click "Create Account"

3. **Verify:**
   - Should redirect to `/teacher/dashboard`
   - See welcome message with your name
   - Cookie `authToken` should be set (check DevTools)

4. **Test protected routes:**
   - Try accessing `/student/dashboard` → redirects to teacher dashboard
   - Click logout → redirects to login page

## ✅ What's Working

- ✅ User registration with role selection
- ✅ Multi-step signup form with animations
- ✅ JWT tokens in HTTP-only cookies
- ✅ Role-based routing (teacher/student/parent)
- ✅ Protected routes with automatic redirects
- ✅ Login/Logout functionality
- ✅ Password reset flow
- ✅ User profile management
- ✅ Firebase + Firestore integration

## 🔑 Test Credentials

After creating accounts via signup, use:
- Teacher: `teacher@test.com` / `password123`
- Student: `student@test.com` / `password123`
- Parent: `parent@test.com` / `password123`

## 📱 Pages to Test

| Page | URL | Description |
|------|-----|-------------|
| Login | `/auth/login` | Sign in page |
| Signup | `/auth/signup` | 3-step registration |
| Forgot Password | `/auth/forgot-password` | Reset password |
| Teacher Dashboard | `/teacher/dashboard` | Protected (teachers only) |
| Student Dashboard | `/student/dashboard` | Protected (students only) |
| Parent Dashboard | `/parent/dashboard` | Protected (parents only) |

## 🐛 Troubleshooting

### Backend won't start?
```bash
# Check if port 5000 is available
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <PID> /F

# Restart
npm run dev
```

### CORS errors?
- Verify backend is running on port 5000
- Check `FRONTEND_URL=http://localhost:3000` in backend `.env`
- Ensure `credentials: 'include'` in frontend API calls

### Cookie not set?
- Check browser DevTools → Application → Cookies
- Cookie should be named `authToken`
- Should be HTTP-only and SameSite=Strict

### Firebase errors?
- Verify all Firebase env variables are set
- Check Firebase console for authentication setup
- Ensure Email/Password provider is enabled

## 📞 Support

For detailed documentation, see `AUTHENTICATION_SYSTEM.md`

## 🎉 You're Ready!

The authentication system is fully operational. You can now:
1. Create users with different roles
2. Test login/logout flows
3. Verify protected routes work correctly
4. Build additional features on top of this foundation

**Next:** Implement teacher dashboard features (quiz creation, class management, etc.)
