import { firestore } from '../config/firebase';
import admin from 'firebase-admin';
import { getUserProfile } from './userService';

const FieldValue = admin.firestore.FieldValue;

export interface Class {
  classId: string;
  name: string;
  grade: string;
  subject: string;
  teacherId: string;
  studentIds: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CreateClassRequest {
  name: string;
  grade: string;
  subject: string;
  teacherId: string;
}

export interface UpdateClassRequest {
  name?: string;
  grade?: string;
  subject?: string;
}

/**
 * Create a new class
 */
export const createClass = async (
  data: CreateClassRequest
): Promise<Class> => {
  try {
    // Verify teacher exists
    const teacher = await getUserProfile(data.teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      throw new Error('Invalid teacher user');
    }

    // Validate required fields
    if (!data.name || !data.grade || !data.subject) {
      throw new Error('Name, grade, and subject are required');
    }

    const classData = {
      name: data.name.trim(),
      grade: data.grade.trim(),
      subject: data.subject.trim(),
      teacherId: data.teacherId,
      studentIds: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await firestore.collection('classes').add(classData);

    // Fetch the created document to get server timestamps
    const createdDoc = await docRef.get();
    
    return {
      classId: docRef.id,
      ...createdDoc.data(),
    } as Class;
  } catch (error: any) {
    throw new Error(`Failed to create class: ${error.message}`);
  }
};

/**
 * Get all classes for a teacher
 */
export const getTeacherClasses = async (
  teacherId: string
): Promise<Class[]> => {
  try {
    const snapshot = await firestore
      .collection('classes')
      .where('teacherId', '==', teacherId)
      .get();

    // Sort in memory to avoid needing a composite index
    const classes = snapshot.docs.map((doc) => ({
      classId: doc.id,
      ...doc.data(),
    })) as Class[];

    return classes.sort((a, b) => {
      const timeA = a.createdAt?.toMillis() || 0;
      const timeB = b.createdAt?.toMillis() || 0;
      return timeB - timeA; // desc order
    });
  } catch (error: any) {
    throw new Error(`Failed to get teacher classes: ${error.message}`);
  }
};

/**
 * Get class by ID
 */
export const getClassById = async (classId: string): Promise<Class | null> => {
  try {
    const doc = await firestore.collection('classes').doc(classId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      classId: doc.id,
      ...doc.data(),
    } as Class;
  } catch (error: any) {
    throw new Error(`Failed to get class: ${error.message}`);
  }
};

/**
 * Update class
 */
export const updateClass = async (
  classId: string,
  teacherId: string,
  updates: UpdateClassRequest
): Promise<Class> => {
  try {
    const classRef = firestore.collection('classes').doc(classId);
    const classDoc = await classRef.get();

    if (!classDoc.exists) {
      throw new Error('Class not found');
    }

    const classData = classDoc.data() as Class;

    // Verify teacher owns this class
    if (classData.teacherId !== teacherId) {
      throw new Error('Unauthorized to update this class');
    }

    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (updates.name) updateData.name = updates.name.trim();
    if (updates.grade) updateData.grade = updates.grade.trim();
    if (updates.subject) updateData.subject = updates.subject.trim();

    await classRef.update(updateData);

    const updatedDoc = await classRef.get();
    return {
      classId: updatedDoc.id,
      ...updatedDoc.data(),
    } as Class;
  } catch (error: any) {
    throw new Error(`Failed to update class: ${error.message}`);
  }
};

/**
 * Delete class
 */
export const deleteClass = async (
  classId: string,
  teacherId: string
): Promise<void> => {
  try {
    const classRef = firestore.collection('classes').doc(classId);
    const classDoc = await classRef.get();

    if (!classDoc.exists) {
      throw new Error('Class not found');
    }

    const classData = classDoc.data() as Class;

    // Verify teacher owns this class
    if (classData.teacherId !== teacherId) {
      throw new Error('Unauthorized to delete this class');
    }

    // Remove class reference from all students
    if (classData.studentIds && classData.studentIds.length > 0) {
      const batch = firestore.batch();
      for (const studentId of classData.studentIds) {
        const studentRef = firestore.collection('users').doc(studentId);
        batch.update(studentRef, {
          classId: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }

    await classRef.delete();
  } catch (error: any) {
    throw new Error(`Failed to delete class: ${error.message}`);
  }
};

/**
 * Add student to class
 */
export const addStudentToClass = async (
  classId: string,
  studentId: string,
  teacherId: string
): Promise<void> => {
  try {
    const classRef = firestore.collection('classes').doc(classId);
    const classDoc = await classRef.get();

    if (!classDoc.exists) {
      throw new Error('Class not found');
    }

    const classData = classDoc.data() as Class;

    // Verify teacher owns this class
    if (classData.teacherId !== teacherId) {
      throw new Error('Unauthorized to modify this class');
    }

    // Verify student exists
    const student = await getUserProfile(studentId);
    if (!student || student.role !== 'student') {
      throw new Error('Invalid student user');
    }

    // Check if student is already in class
    if (classData.studentIds.includes(studentId)) {
      throw new Error('Student is already in this class');
    }

    // Add student to class
    await classRef.update({
      studentIds: FieldValue.arrayUnion(studentId),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Update student's classId
    await firestore
      .collection('users')
      .doc(studentId)
      .update({
        classId: classId,
        updatedAt: FieldValue.serverTimestamp(),
      });
  } catch (error: any) {
    throw new Error(`Failed to add student to class: ${error.message}`);
  }
};

/**
 * Remove student from class
 */
export const removeStudentFromClass = async (
  classId: string,
  studentId: string,
  teacherId: string
): Promise<void> => {
  try {
    const classRef = firestore.collection('classes').doc(classId);
    const classDoc = await classRef.get();

    if (!classDoc.exists) {
      throw new Error('Class not found');
    }

    const classData = classDoc.data() as Class;

    // Verify teacher owns this class
    if (classData.teacherId !== teacherId) {
      throw new Error('Unauthorized to modify this class');
    }

    // Check if student is in class
    if (!classData.studentIds.includes(studentId)) {
      throw new Error('Student is not in this class');
    }

    // Remove student from class
    await classRef.update({
      studentIds: FieldValue.arrayRemove(studentId),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Remove classId from student
    await firestore
      .collection('users')
      .doc(studentId)
      .update({
        classId: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
  } catch (error: any) {
    throw new Error(`Failed to remove student from class: ${error.message}`);
  }
};

/**
 * Get class with student details
 */
export const getClassWithStudents = async (
  classId: string
): Promise<any> => {
  try {
    const classData = await getClassById(classId);
    if (!classData) {
      throw new Error('Class not found');
    }

    // Get student details
    const students = await Promise.all(
      classData.studentIds.map(async (studentId) => {
        const student = await getUserProfile(studentId);
        return student
          ? {
              userId: student.userId,
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email,
              avatarUrl: student.avatarUrl,
              grade: student.grade,
            }
          : null;
      })
    );

    return {
      ...classData,
      students: students.filter((s) => s !== null),
    };
  } catch (error: any) {
    throw new Error(`Failed to get class with students: ${error.message}`);
  }
};

/**
 * Get teacher statistics
 */
export const getTeacherStats = async (teacherId: string): Promise<any> => {
  try {
    // Get all classes
    const classes = await getTeacherClasses(teacherId);

    // Count total students across all classes
    const totalStudents = classes.reduce(
      (sum, cls) => sum + cls.studentIds.length,
      0
    );

    // Get total quizzes (placeholder - implement when quiz service exists)
    // const quizzesSnapshot = await firestore
    //   .collection('quizzes')
    //   .where('teacherId', '==', teacherId)
    //   .get();
    // const totalQuizzes = quizzesSnapshot.size;

    // Get active game sessions (placeholder - implement when game service exists)
    // const activeGamesSnapshot = await firestore
    //   .collection('gameSessions')
    //   .where('teacherId', '==', teacherId)
    //   .where('status', '==', 'active')
    //   .get();
    // const activeGames = activeGamesSnapshot.size;

    return {
      totalClasses: classes.length,
      totalStudents,
      totalQuizzes: 0, // Placeholder
      activeGames: 0, // Placeholder
    };
  } catch (error: any) {
    throw new Error(`Failed to get teacher stats: ${error.message}`);
  }
};
