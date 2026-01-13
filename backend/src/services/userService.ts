import { firestore, auth } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';

// User type definitions
export interface UserData {
  userId: string;
  email: string;
  role: 'teacher' | 'student' | 'parent';
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  
  // Teacher-specific fields
  schoolId?: string;
  subjects?: string[];
  
  // Student-specific fields
  grade?: string;
  classId?: string;
  parentIds?: string[];
  
  // Parent-specific fields
  childrenIds?: string[];
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: 'teacher' | 'student' | 'parent';
  firstName: string;
  lastName: string;
  
  // Optional role-specific fields
  schoolId?: string;
  subjects?: string[];
  grade?: string;
  classId?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  schoolId?: string;
  subjects?: string[];
  grade?: string;
  classId?: string;
}

/**
 * Create a new user profile in Firestore and Firebase Auth
 */
export const createUserProfile = async (
  userData: CreateUserInput
): Promise<{ userId: string; user: UserData }> => {
  try {
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: `${userData.firstName} ${userData.lastName}`,
    });

    // Prepare Firestore user document
    const userDoc: Omit<UserData, 'userId'> = {
      email: userData.email,
      role: userData.role,
      firstName: userData.firstName,
      lastName: userData.lastName,
      createdAt: FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      updatedAt: FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    };

    // Add role-specific fields
    if (userData.role === 'teacher') {
      userDoc.schoolId = userData.schoolId || '';
      userDoc.subjects = userData.subjects || [];
    } else if (userData.role === 'student') {
      userDoc.grade = userData.grade || '';
      userDoc.classId = userData.classId || '';
      userDoc.parentIds = [];
    } else if (userData.role === 'parent') {
      userDoc.childrenIds = [];
    }

    // Save to Firestore
    await firestore.collection('users').doc(userRecord.uid).set(userDoc);

    // Return created user
    return {
      userId: userRecord.uid,
      user: {
        userId: userRecord.uid,
        ...userDoc,
      } as UserData,
    };
  } catch (error: any) {
    // Handle Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      throw new Error('Email already registered');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Minimum 6 characters required');
    }
    
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

/**
 * Get user profile by user ID
 */
export const getUserProfile = async (userId: string): Promise<UserData | null> => {
  try {
    const userDoc = await firestore.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    return {
      userId: userDoc.id,
      ...userDoc.data(),
    } as UserData;
  } catch (error: any) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: UpdateUserInput
): Promise<UserData> => {
  try {
    // Verify user exists
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    // Prepare update data
    const updateData: any = {
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Update Firestore
    await firestore.collection('users').doc(userId).update(updateData);

    // Update Firebase Auth display name if firstName or lastName changed
    if (updates.firstName || updates.lastName) {
      const currentData = userDoc.data() as UserData;
      const displayName = `${updates.firstName || currentData.firstName} ${updates.lastName || currentData.lastName}`;
      
      await auth.updateUser(userId, {
        displayName,
      });
    }

    // Get and return updated user
    const updatedUser = await getUserProfile(userId);
    
    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user');
    }

    return updatedUser;
  } catch (error: any) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (
  role: 'teacher' | 'student' | 'parent'
): Promise<UserData[]> => {
  try {
    const usersSnapshot = await firestore
      .collection('users')
      .where('role', '==', role)
      .get();

    return usersSnapshot.docs.map((doc) => ({
      userId: doc.id,
      ...doc.data(),
    })) as UserData[];
  } catch (error: any) {
    throw new Error(`Failed to get users by role: ${error.message}`);
  }
};

/**
 * Delete user (both Auth and Firestore)
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // Delete from Firebase Auth
    await auth.deleteUser(userId);

    // Delete from Firestore
    await firestore.collection('users').doc(userId).delete();
  } catch (error: any) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

/**
 * Verify user credentials and return user data (for login)
 */
export const verifyUserCredentials = async (
  email: string,
  _password: string
): Promise<{ userId: string; user: UserData }> => {
  try {
    // Note: Firebase Admin SDK doesn't have a direct method to verify password
    // We'll need to use Firebase Client SDK on the frontend for actual authentication
    // This method is for getting user data after client-side authentication
    
    const userRecord = await auth.getUserByEmail(email);
    const userProfile = await getUserProfile(userRecord.uid);

    if (!userProfile) {
      throw new Error('User profile not found');
    }

    return {
      userId: userRecord.uid,
      user: userProfile,
    };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('Invalid email or password');
    }
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

/**
 * Search users by email (for parent-child linking)
 */
export const searchUserByEmail = async (email: string): Promise<UserData | null> => {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return await getUserProfile(userRecord.uid);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw new Error(`Failed to search user: ${error.message}`);
  }
};

/**
 * Link parent to child
 */
export const linkParentToChild = async (
  parentId: string,
  childId: string
): Promise<void> => {
  try {
    // Verify parent exists and is a parent
    const parent = await getUserProfile(parentId);
    if (!parent || parent.role !== 'parent') {
      throw new Error('Invalid parent user');
    }

    // Verify child exists and is a student
    const child = await getUserProfile(childId);
    if (!child || child.role !== 'student') {
      throw new Error('Invalid student user');
    }

    // Update parent's childrenIds
    await firestore.collection('users').doc(parentId).update({
      childrenIds: FieldValue.arrayUnion(childId),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Update child's parentIds
    await firestore.collection('users').doc(childId).update({
      parentIds: FieldValue.arrayUnion(parentId),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`Failed to link parent to child: ${error.message}`);
  }
};
