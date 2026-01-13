import { firestore } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { getUserProfile } from './userService';

// Parent-Child Link types
export interface ParentChildLink {
  linkId: string;
  parentId: string;
  childId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: FirebaseFirestore.Timestamp;
  approvedAt?: FirebaseFirestore.Timestamp;
  rejectedAt?: FirebaseFirestore.Timestamp;
}

export interface LinkRequest {
  childEmail?: string;
  childId?: string;
  parentId: string;
}

/**
 * Create a parent-child link request
 */
export const createLinkRequest = async (
  request: LinkRequest
): Promise<ParentChildLink> => {
  try {
    // Verify parent exists and is a parent
    const parent = await getUserProfile(request.parentId);
    if (!parent || parent.role !== 'parent') {
      throw new Error('Invalid parent user');
    }

    // Find child by email or ID
    let childId: string;
    if (request.childEmail) {
      const usersSnapshot = await firestore
        .collection('users')
        .where('email', '==', request.childEmail)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        throw new Error('No student found with that email');
      }

      childId = usersSnapshot.docs[0].id;
    } else if (request.childId) {
      childId = request.childId;
    } else {
      throw new Error('Either childEmail or childId must be provided');
    }

    // Verify child exists and is a student
    const child = await getUserProfile(childId);
    if (!child || child.role !== 'student') {
      throw new Error('User is not a student');
    }

    // Check for existing link
    const existingLinkSnapshot = await firestore
      .collection('parentChildLinks')
      .where('parentId', '==', request.parentId)
      .where('childId', '==', childId)
      .where('status', '==', 'approved')
      .limit(1)
      .get();

    if (!existingLinkSnapshot.empty) {
      throw new Error('This parent-child link already exists');
    }

    // Create approved link immediately (no pending approval needed)
    const linkData: Omit<ParentChildLink, 'linkId'> = {
      parentId: request.parentId,
      childId,
      status: 'approved',
      requestedAt: FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      approvedAt: FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    };

    const docRef = await firestore.collection('parentChildLinks').add(linkData);

    // Update parent's childrenIds array immediately
    await firestore
      .collection('users')
      .doc(request.parentId)
      .update({
        childrenIds: FieldValue.arrayUnion(childId),
        updatedAt: FieldValue.serverTimestamp(),
      });

    // Update child's parentIds array immediately
    await firestore
      .collection('users')
      .doc(childId)
      .update({
        parentIds: FieldValue.arrayUnion(request.parentId),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return {
      linkId: docRef.id,
      ...linkData,
    };
  } catch (error: any) {
    throw new Error(`Failed to create link request: ${error.message}`);
  }
};

/**
 * Get pending link requests for a user (parent or student)
 */
export const getPendingRequests = async (
  userId: string
): Promise<ParentChildLink[]> => {
  try {
    const user = await getUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let query;
    if (user.role === 'parent') {
      query = firestore
        .collection('parentChildLinks')
        .where('parentId', '==', userId)
        .where('status', '==', 'pending');
    } else if (user.role === 'student') {
      query = firestore
        .collection('parentChildLinks')
        .where('childId', '==', userId)
        .where('status', '==', 'pending');
    } else {
      throw new Error('User must be a parent or student');
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      linkId: doc.id,
      ...doc.data(),
    })) as ParentChildLink[];
  } catch (error: any) {
    throw new Error(`Failed to get pending requests: ${error.message}`);
  }
};

/**
 * Approve a parent-child link request
 */
export const approveLinkRequest = async (
  linkId: string,
  studentId: string
): Promise<ParentChildLink> => {
  try {
    const linkRef = firestore.collection('parentChildLinks').doc(linkId);
    const linkDoc = await linkRef.get();

    if (!linkDoc.exists) {
      throw new Error('Link request not found');
    }

    const linkData = linkDoc.data() as ParentChildLink;

    // Verify the student is the one approving
    if (linkData.childId !== studentId) {
      throw new Error('Unauthorized to approve this request');
    }

    // Verify status is pending
    if (linkData.status !== 'pending') {
      throw new Error('Link request is not pending');
    }

    // Update link status
    await linkRef.update({
      status: 'approved',
      approvedAt: FieldValue.serverTimestamp(),
    });

    // Update parent's childrenIds array
    await firestore
      .collection('users')
      .doc(linkData.parentId)
      .update({
        childrenIds: FieldValue.arrayUnion(linkData.childId),
        updatedAt: FieldValue.serverTimestamp(),
      });

    // Update child's parentIds array
    await firestore
      .collection('users')
      .doc(linkData.childId)
      .update({
        parentIds: FieldValue.arrayUnion(linkData.parentId),
        updatedAt: FieldValue.serverTimestamp(),
      });

    // Get updated link
    const updatedDoc = await linkRef.get();
    return {
      linkId: updatedDoc.id,
      ...updatedDoc.data(),
    } as ParentChildLink;
  } catch (error: any) {
    throw new Error(`Failed to approve link request: ${error.message}`);
  }
};

/**
 * Reject a parent-child link request
 */
export const rejectLinkRequest = async (
  linkId: string,
  studentId: string
): Promise<void> => {
  try {
    const linkRef = firestore.collection('parentChildLinks').doc(linkId);
    const linkDoc = await linkRef.get();

    if (!linkDoc.exists) {
      throw new Error('Link request not found');
    }

    const linkData = linkDoc.data() as ParentChildLink;

    // Verify the student is the one rejecting
    if (linkData.childId !== studentId) {
      throw new Error('Unauthorized to reject this request');
    }

    // Verify status is pending
    if (linkData.status !== 'pending') {
      throw new Error('Link request is not pending');
    }

    // Update link status
    await linkRef.update({
      status: 'rejected',
      rejectedAt: FieldValue.serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`Failed to reject link request: ${error.message}`);
  }
};

/**
 * Remove an approved parent-child link
 */
export const removeLink = async (
  linkId: string,
  userId: string
): Promise<void> => {
  try {
    const linkRef = firestore.collection('parentChildLinks').doc(linkId);
    const linkDoc = await linkRef.get();

    if (!linkDoc.exists) {
      throw new Error('Link not found');
    }

    const linkData = linkDoc.data() as ParentChildLink;

    // Verify user is either parent or child
    if (linkData.parentId !== userId && linkData.childId !== userId) {
      throw new Error('Unauthorized to remove this link');
    }

    // Only allow removing approved links
    if (linkData.status !== 'approved') {
      throw new Error('Can only remove approved links');
    }

    // Remove from parent's childrenIds
    await firestore
      .collection('users')
      .doc(linkData.parentId)
      .update({
        childrenIds: FieldValue.arrayRemove(linkData.childId),
        updatedAt: FieldValue.serverTimestamp(),
      });

    // Remove from child's parentIds
    await firestore
      .collection('users')
      .doc(linkData.childId)
      .update({
        parentIds: FieldValue.arrayRemove(linkData.parentId),
        updatedAt: FieldValue.serverTimestamp(),
      });

    // Delete the link document
    await linkRef.delete();
  } catch (error: any) {
    throw new Error(`Failed to remove link: ${error.message}`);
  }
};

/**
 * Get all children for a parent
 */
export const getParentChildren = async (parentId: string): Promise<any[]> => {
  try {
    // Verify parent exists
    const parent = await getUserProfile(parentId);
    if (!parent || parent.role !== 'parent') {
      throw new Error('Invalid parent user');
    }

    // Get approved links
    const linksSnapshot = await firestore
      .collection('parentChildLinks')
      .where('parentId', '==', parentId)
      .where('status', '==', 'approved')
      .get();

    // Get child details
    const children = await Promise.all(
      linksSnapshot.docs.map(async (doc) => {
        const linkData = doc.data();
        const child = await getUserProfile(linkData.childId);
        return {
          linkId: doc.id,
          userId: child?.userId,
          firstName: child?.firstName,
          lastName: child?.lastName,
          email: child?.email,
          grade: child?.grade,
          avatarUrl: child?.avatarUrl,
          linkedAt: linkData.approvedAt,
        };
      })
    );

    return children.filter((child) => child.userId); // Filter out null entries
  } catch (error: any) {
    throw new Error(`Failed to get parent's children: ${error.message}`);
  }
};

/**
 * Get all parents for a child (student)
 */
export const getChildParents = async (childId: string): Promise<any[]> => {
  try {
    // Verify child exists
    const child = await getUserProfile(childId);
    if (!child || child.role !== 'student') {
      throw new Error('Invalid student user');
    }

    // Get approved links
    const linksSnapshot = await firestore
      .collection('parentChildLinks')
      .where('childId', '==', childId)
      .where('status', '==', 'approved')
      .get();

    // Get parent details
    const parents = await Promise.all(
      linksSnapshot.docs.map(async (doc) => {
        const linkData = doc.data();
        const parent = await getUserProfile(linkData.parentId);
        return {
          linkId: doc.id,
          userId: parent?.userId,
          firstName: parent?.firstName,
          lastName: parent?.lastName,
          email: parent?.email,
          avatarUrl: parent?.avatarUrl,
          linkedAt: linkData.approvedAt,
        };
      })
    );

    return parents.filter((parent) => parent.userId); // Filter out null entries
  } catch (error: any) {
    throw new Error(`Failed to get child's parents: ${error.message}`);
  }
};

/**
 * Get link details with parent and child info
 */
export const getLinkWithDetails = async (
  linkId: string
): Promise<any | null> => {
  try {
    const linkDoc = await firestore
      .collection('parentChildLinks')
      .doc(linkId)
      .get();

    if (!linkDoc.exists) {
      return null;
    }

    const linkData = linkDoc.data() as ParentChildLink;
    const parent = await getUserProfile(linkData.parentId);
    const child = await getUserProfile(linkData.childId);

    return {
      linkId: linkDoc.id,
      status: linkData.status,
      requestedAt: linkData.requestedAt,
      approvedAt: linkData.approvedAt,
      rejectedAt: linkData.rejectedAt,
      parent: parent
        ? {
            userId: parent.userId,
            firstName: parent.firstName,
            lastName: parent.lastName,
            email: parent.email,
            avatarUrl: parent.avatarUrl,
          }
        : null,
      child: child
        ? {
            userId: child.userId,
            firstName: child.firstName,
            lastName: child.lastName,
            email: child.email,
            grade: child.grade,
            avatarUrl: child.avatarUrl,
          }
        : null,
    };
  } catch (error: any) {
    throw new Error(`Failed to get link details: ${error.message}`);
  }
};
