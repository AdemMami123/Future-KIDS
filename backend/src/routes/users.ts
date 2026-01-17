import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as userService from '../services/userService';
import { verifyToken, requireRole, generateToken } from '../middleware/auth';
import { auth } from '../config/firebase';

const router = Router();

/**
 * POST /api/users/register
 * Register a new user
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .isIn(['teacher', 'student', 'parent'])
      .withMessage('Role must be teacher, student, or parent'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      // Create user
      const { userId, user } = await userService.createUserProfile(req.body);

      // Generate JWT token
      const token = generateToken(userId, user.email, user.role);

      // Set HTTP-only cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: true, // Required for sameSite: 'none'
        sameSite: 'none', // Allow cross-origin cookies (Vercel <-> Render)
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            userId: user.userId,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
          },
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to register user',
      });
    }
  }
);

/**
 * POST /api/users/login
 * Login with Firebase ID token and get JWT cookie
 */
router.post(
  '/login',
  [body('idToken').notEmpty().withMessage('Firebase ID token is required')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      // Verify Firebase ID token
      const decodedToken = await auth.verifyIdToken(req.body.idToken);
      const userId = decodedToken.uid;

      // Get user profile
      const user = await userService.getUserProfile(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User profile not found',
        });
        return;
      }

      // Generate JWT token
      const token = generateToken(userId, user.email, user.role);

      // Set HTTP-only cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: true, // Required for sameSite: 'none'
        sameSite: 'none', // Allow cross-origin cookies (Vercel <-> Render)
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            userId: user.userId,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
          },
        },
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Authentication failed',
      });
    }
  }
);

/**
 * POST /api/users/logout
 * Logout and clear cookie
 */
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('authToken');
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/users/profile
 * Get current user profile (requires authentication)
 */
router.get(
  '/profile',
  verifyToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const user = await userService.getUserProfile(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user profile',
      });
    }
  }
);

/**
 * PATCH /api/users/profile
 * Update current user profile (requires authentication)
 */
router.patch(
  '/profile',
  verifyToken,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('avatarUrl').optional().isURL(),
    body('schoolId').optional().trim(),
    body('subjects').optional().isArray(),
    body('grade').optional().trim(),
    body('classId').optional().trim(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const userId = req.user!.userId;
      const updates = req.body;

      // Update user profile
      const updatedUser = await userService.updateUserProfile(userId, updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }
);

/**
 * GET /api/users/:userId
 * Get user by ID (requires authentication)
 */
router.get(
  '/:userId',
  verifyToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = await userService.getUserProfile(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Return limited user info for privacy
      res.json({
        success: true,
        data: {
          user: {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatarUrl: user.avatarUrl,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user',
      });
    }
  }
);

/**
 * GET /api/users/role/:role
 * Get users by role (teachers only)
 */
router.get(
  '/role/:role',
  verifyToken,
  requireRole('teacher'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { role } = req.params;

      if (!['teacher', 'student', 'parent'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
        return;
      }

      const users = await userService.getUsersByRole(
        role as 'teacher' | 'student' | 'parent'
      );

      res.json({
        success: true,
        data: { users },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get users',
      });
    }
  }
);

/**
 * DELETE /api/users/:userId
 * Delete user account (self or admin)
 */
router.delete(
  '/:userId',
  verifyToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user!.userId;

      // Only allow users to delete their own account
      if (userId !== currentUserId) {
        res.status(403).json({
          success: false,
          message: 'You can only delete your own account',
        });
        return;
      }

      await userService.deleteUser(userId);

      // Clear auth cookie
      res.clearCookie('authToken');

      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete account',
      });
    }
  }
);

/**
 * POST /api/users/search
 * Search user by email (for parent-child linking)
 */
router.post(
  '/search',
  verifyToken,
  requireRole('parent'),
  [body('email').isEmail().withMessage('Valid email is required')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { email } = req.body;
      const user = await userService.searchUserByEmail(email);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'No user found with that email',
        });
        return;
      }

      // Return limited info
      res.json({
        success: true,
        data: {
          user: {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Search failed',
      });
    }
  }
);

export default router;
