import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { cloudinaryService } from '../services/cloudinaryService';

const router = express.Router();

// Upload image endpoint
router.post('/image', authenticate(), async (req: Request, res: Response) => {
  try {
    const { file, type } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // Determine upload type
    let result;
    if (type === 'cover') {
      result = await cloudinaryService.uploadQuizCover(file);
    } else if (type === 'question') {
      result = await cloudinaryService.uploadQuestionImage(file);
    } else {
      result = await cloudinaryService.uploadImage(file, 'general');
    }

    return res.status(200).json({
      success: true,
      url: result.secureUrl,
      publicId: result.publicId,
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload image',
    });
  }
});

export default router;
