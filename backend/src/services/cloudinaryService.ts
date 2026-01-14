import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
}

export const cloudinaryService = {
  /**
   * Upload an image to Cloudinary
   * @param file - Base64 encoded image or file path
   * @param folder - Folder name in Cloudinary (e.g., 'quizzes', 'questions', 'avatars')
   * @param options - Additional Cloudinary upload options
   */
  async uploadImage(
    file: string,
    folder: string = 'quizzes',
    options: any = {}
  ): Promise<UploadResult> {
    try {
      const uploadOptions = {
        folder: `future_childs/${folder}`,
        resource_type: 'image' as const,
        transformation: [
          {
            quality: 'auto',
            fetch_format: 'auto',
          },
        ],
        ...options,
      };

      const result: UploadApiResponse = await cloudinary.uploader.upload(
        file,
        uploadOptions
      );

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw new Error('Failed to upload image');
    }
  },

  /**
   * Upload quiz cover image with optimizations
   */
  async uploadQuizCover(file: string): Promise<UploadResult> {
    return this.uploadImage(file, 'quiz-covers', {
      transformation: [
        {
          width: 1200,
          height: 630,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    });
  },

  /**
   * Upload question image with optimizations
   */
  async uploadQuestionImage(file: string): Promise<UploadResult> {
    return this.uploadImage(file, 'question-images', {
      transformation: [
        {
          width: 800,
          height: 600,
          crop: 'limit',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    });
  },

  /**
   * Delete an image from Cloudinary
   * @param publicId - The public ID of the image to delete
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw new Error('Failed to delete image');
    }
  },

  /**
   * Delete multiple images from Cloudinary
   * @param publicIds - Array of public IDs to delete
   */
  async deleteImages(publicIds: string[]): Promise<void> {
    try {
      const deletePromises = publicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId)
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting images from Cloudinary:', error);
      throw new Error('Failed to delete images');
    }
  },

  /**
   * Get optimized image URL with transformations
   * @param publicId - The public ID of the image
   * @param width - Desired width
   * @param height - Desired height
   */
  getOptimizedUrl(
    publicId: string,
    width?: number,
    height?: number
  ): string {
    const transformations: any[] = [
      {
        quality: 'auto',
        fetch_format: 'auto',
      },
    ];

    if (width || height) {
      transformations.push({
        width,
        height,
        crop: 'fill',
      });
    }

    return cloudinary.url(publicId, {
      transformation: transformations,
    });
  },

  /**
   * Get thumbnail URL
   * @param publicId - The public ID of the image
   */
  getThumbnailUrl(publicId: string): string {
    return this.getOptimizedUrl(publicId, 200, 200);
  },
};
