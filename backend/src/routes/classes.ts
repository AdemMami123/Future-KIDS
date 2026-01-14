import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createClass,
  getTeacherClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
  getClassWithStudents,
  getTeacherStats,
} from '../services/classService';

const router = Router();

/**
 * @route   POST /api/classes
 * @desc    Create a new class
 * @access  Private (Teacher only)
 */
router.post('/', authenticate(['teacher']), async (req, res): Promise<void> => {
  try {
    const { name, grade, subject } = req.body;
    const teacherId = req.user!.userId;

    if (!name || !grade || !subject) {
      res.status(400).json({
        success: false,
        message: 'Name, grade, and subject are required',
      });
      return;
    }

    const newClass = await createClass({
      name,
      grade,
      subject,
      teacherId,
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass,
    });
  } catch (error: any) {
    console.error('Create class error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/classes/teacher/:teacherId
 * @desc    Get all classes for a teacher
 * @access  Private (Teacher only)
 */
router.get(
  '/teacher/:teacherId',
  authenticate(['teacher']),
  async (req, res): Promise<void> => {
    try {
      const { teacherId } = req.params;

      // Verify teacher is requesting their own classes
      if (req.user!.userId !== teacherId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to access these classes',
        });
        return;
      }

      const classes = await getTeacherClasses(teacherId);

      res.json({
        success: true,
        data: classes,
      });
    } catch (error: any) {
      console.error('Get teacher classes error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/classes/stats
 * @desc    Get teacher statistics
 * @access  Private (Teacher only)
 */
router.get(
  '/stats',
  authenticate(['teacher']),
  async (req, res): Promise<void> => {
    try {
      const teacherId = req.user!.userId;
      const stats = await getTeacherStats(teacherId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get teacher stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/classes/:classId
 * @desc    Get class details
 * @access  Private (Teacher only)
 */
router.get(
  '/:classId',
  authenticate(['teacher']),
  async (req, res): Promise<void> => {
    try {
      const { classId } = req.params;
      const classData = await getClassById(classId);

      if (!classData) {
        res.status(404).json({
          success: false,
          message: 'Class not found',
        });
        return;
      }

      // Verify teacher owns this class
      if (classData.teacherId !== req.user!.userId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to access this class',
        });
        return;
      }

      res.json({
        success: true,
        data: classData,
      });
    } catch (error: any) {
      console.error('Get class error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/classes/:classId/students
 * @desc    Get class with student details
 * @access  Private (Teacher only)
 */
router.get(
  '/:classId/students',
  authenticate(['teacher']),
  async (req, res): Promise<void> => {
    try {
      const { classId } = req.params;
      const classWithStudents = await getClassWithStudents(classId);

      // Verify teacher owns this class
      if (classWithStudents.teacherId !== req.user!.userId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to access this class',
        });
        return;
      }

      res.json({
        success: true,
        data: classWithStudents,
      });
    } catch (error: any) {
      console.error('Get class with students error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   PATCH /api/classes/:classId
 * @desc    Update class
 * @access  Private (Teacher only)
 */
router.patch(
  '/:classId',
  authenticate(['teacher']),
  async (req, res): Promise<void> => {
    try {
      const { classId } = req.params;
      const { name, grade, subject } = req.body;
      const teacherId = req.user!.userId;

      const updatedClass = await updateClass(classId, teacherId, {
        name,
        grade,
        subject,
      });

      res.json({
        success: true,
        message: 'Class updated successfully',
        data: updatedClass,
      });
    } catch (error: any) {
      console.error('Update class error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   DELETE /api/classes/:classId
 * @desc    Delete class
 * @access  Private (Teacher only)
 */
router.delete(
  '/:classId',
  authenticate(['teacher']),
  async (req, res): Promise<void> => {
    try {
      const { classId } = req.params;
      const teacherId = req.user!.userId;

      await deleteClass(classId, teacherId);

      res.json({
        success: true,
        message: 'Class deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete class error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/classes/:classId/students
 * @desc    Add student to class
 * @access  Private (Teacher only)
 */
router.post(
  '/:classId/students',
  authenticate(['teacher']),
  async (req, res): Promise<void> => {
    try {
      const { classId } = req.params;
      const { studentId } = req.body;
      const teacherId = req.user!.userId;

      if (!studentId) {
        res.status(400).json({
          success: false,
          message: 'Student ID is required',
        });
        return;
      }

      await addStudentToClass(classId, studentId, teacherId);

      res.json({
        success: true,
        message: 'Student added to class successfully',
      });
    } catch (error: any) {
      console.error('Add student to class error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   DELETE /api/classes/:classId/students/:studentId
 * @desc    Remove student from class
 * @access  Private (Teacher only)
 */
router.delete(
  '/:classId/students/:studentId',
  authenticate(['teacher']),
  async (req, res): Promise<void> => {
    try {
      const { classId, studentId } = req.params;
      const teacherId = req.user!.userId;

      await removeStudentFromClass(classId, studentId, teacherId);

      res.json({
        success: true,
        message: 'Student removed from class successfully',
      });
    } catch (error: any) {
      console.error('Remove student from class error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;
