import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (_req: Request, res: Response) => {
  const healthcheck = {
    success: true,
    message: 'Server is running smoothly',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  res.status(200).json(healthcheck);
});

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with service status
 * @access  Public
 */
router.get('/detailed', (_req: Request, res: Response) => {
  const healthcheck = {
    success: true,
    message: 'Server is running smoothly',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected', // Update based on actual connection status
      socketIO: 'active',
      cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not configured',
    },
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
    },
  };

  res.status(200).json(healthcheck);
});

export default router;
