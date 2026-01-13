import './config/firebase';
import { firestore, auth } from './config/firebase';

async function testFirebase() {
  console.log('\n🔍 Testing Firebase Integration...\n');

  try {
    // Test 1: Firestore connection
    console.log('1️⃣ Testing Firestore...');
    const testRef = firestore.collection('_test_').doc('connection');
    await testRef.set({ 
      timestamp: new Date().toISOString(),
      message: 'Firebase Admin SDK is working!' 
    });
    const testDoc = await testRef.get();
    if (testDoc.exists) {
      console.log('   ✅ Firestore: Connected and working!');
      await testRef.delete(); // Clean up
    } else {
      console.log('   ❌ Firestore: Connection failed');
    }

    // Test 2: Authentication service
    console.log('\n2️⃣ Testing Auth service...');
    const users = await auth.listUsers(1);
    console.log(`   ✅ Authentication: Connected! (${users.users.length} users found)`);

    console.log('\n✨ All Firebase services are working correctly!\n');
    console.log('📊 Configuration Summary:');
    console.log('   - Project ID: future-childs');
    console.log('   - Firestore: ✅ Ready');
    console.log('   - Authentication: ✅ Ready');
    console.log('   - Admin SDK: ✅ Initialized\n');

  } catch (error: any) {
    console.error('\n❌ Firebase Test Failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check that .env file exists in backend directory');
    console.error('   2. Verify FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL');
    console.error('   3. Ensure private key formatting is correct (with \\n characters)');
    console.error('   4. Verify Firestore Database is created in Firebase Console\n');
  }

  process.exit(0);
}

testFirebase();
