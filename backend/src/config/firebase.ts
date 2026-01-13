import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin SDK already initialized');
      return;
    }

    // Option 1: Using service account JSON file
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      console.log('✅ Firebase Admin SDK initialized with service account file');
      return;
    }

    // Option 2: Using environment variables
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      
      console.log('✅ Firebase Admin SDK initialized with environment variables');
      return;
    }

    throw new Error(
      'Firebase credentials not found. Please provide either FIREBASE_SERVICE_ACCOUNT_PATH or individual Firebase credentials in .env file'
    );
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
};

// Initialize Firebase
initializeFirebase();

// Export Firebase services
export const firebaseAdmin = admin;
export const firestore = admin.firestore();
export const auth = admin.auth();

// Realtime Database (optional - requires databaseURL)
export const getRealtimeDb = () => {
  if (process.env.FIREBASE_DATABASE_URL) {
    return admin.database();
  }
  console.warn('⚠️  Realtime Database URL not configured. Set FIREBASE_DATABASE_URL in .env to use Realtime Database.');
  return null;
};

// Firestore settings (optional)
firestore.settings({
  ignoreUndefinedProperties: true,
});

export default admin;
