import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth } from '../config/firebase';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: 'teacher' | 'student' | 'parent';
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

/**
 * Generate JWT token for authenticated user
 */
export const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify JWT token from cookies
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔐 Auth middleware - Path:', req.path, 'Method:', req.method);
    // Get token from cookie
    const token = req.cookies?.authToken;

    if (!token) {
      console.log('❌ No auth token found in cookies');
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
      return;
    }
    console.log('✅ Auth token found');

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: 'teacher' | 'student' | 'parent';
    };

    // Verify user still exists in Firebase Auth
    try {
      console.log('🔍 Verifying user exists in Firebase Auth:', decoded.userId);
      const userRecord = await auth.getUser(decoded.userId);
      console.log('✅ User verified:', userRecord.email);
    } catch (error) {
      console.log('❌ User verification failed:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid authentication. User not found.',
      });
      return;
    }

    // Attach user data to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    console.log('✅ Auth successful for user:', decoded.userId, 'role:', decoded.role);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error occurred.',
    });
  }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (...allowedRoles: Array<'teacher' | 'student' | 'parent'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
      return;
    }

    next();
  };
};

/**
 * Combined authentication and role-based access control
 * Usage: authenticate() for any authenticated user
 *        authenticate(['teacher', 'student']) for specific roles
 */
export const authenticate = (allowedRoles?: Array<'teacher' | 'student' | 'parent'>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from cookie
      const token = req.cookies?.authToken;

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.',
        });
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: 'teacher' | 'student' | 'parent';
      };

      // Verify user still exists in Firebase Auth
      try {
        await auth.getUser(decoded.userId);
      } catch (error) {
        res.status(401).json({
          success: false,
          message: 'Invalid authentication. User not found.',
        });
        return;
      }

      // Attach user data to request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      // Check role-based access if roles are specified
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(req.user.role)) {
          res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient permissions.',
          });
          return;
        }
      }

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: 'Invalid authentication token.',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Authentication error occurred.',
      });
    }
  };
};

/**
 * Optional authentication - attaches user if token exists but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.authToken;

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: 'teacher' | 'student' | 'parent';
      };

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user data
    next();
  }
};
