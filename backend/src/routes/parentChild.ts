import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createLinkRequest,
  getPendingRequests,
  approveLinkRequest,
  rejectLinkRequest,
  removeLink,
  getParentChildren,
  getChildParents,
  getLinkWithDetails,
} from '../services/parentChildService';

const router = Router();

/**
 * @route   POST /api/parent-child/request
 * @desc    Create a parent-child link (auto-approved)
 * @access  Private (Parent only)
 */
router.post('/request', authenticate(['parent']), async (req, res): Promise<void> => {
  try {
    const { childEmail, childId } = req.body;
    const parentId = req.user!.userId;

    if (!childEmail && !childId) {
      res.status(400).json({
        success: false,
        message: 'Either childEmail or childId must be provided',
      });
      return;
    }

    const link = await createLinkRequest({
      parentId,
      childEmail,
      childId,
    });

    res.status(201).json({
      success: true,
      message: 'Child linked successfully',
      data: link,
    });
  } catch (error: any) {
    console.error('Create link request error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/parent-child/pending
 * @desc    Get pending link requests for user (parent or student)
 * @access  Private
 */
router.get('/pending', authenticate(), async (req, res): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const requests = await getPendingRequests(userId);

    // Enhance with user details
    const enhancedRequests = await Promise.all(
      requests.map(async (request) => {
        const details = await getLinkWithDetails(request.linkId);
        return details;
      })
    );

    res.json({
      success: true,
      data: enhancedRequests,
    });
  } catch (error: any) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/parent-child/approve/:linkId
 * @desc    Approve a parent-child link request
 * @access  Private (Student only)
 */
router.post('/approve/:linkId', authenticate(['student']), async (req, res): Promise<void> => {
  try {
    const { linkId } = req.params;
    const studentId = req.user!.userId;

    const link = await approveLinkRequest(linkId, studentId);

    res.json({
      success: true,
      message: 'Link request approved',
      data: link,
    });
  } catch (error: any) {
    console.error('Approve link request error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/parent-child/reject/:linkId
 * @desc    Reject a parent-child link request
 * @access  Private (Student only)
 */
router.post('/reject/:linkId', authenticate(['student']), async (req, res): Promise<void> => {
  try {
    const { linkId } = req.params;
    const studentId = req.user!.userId;

    await rejectLinkRequest(linkId, studentId);

    res.json({
      success: true,
      message: 'Link request rejected',
    });
  } catch (error: any) {
    console.error('Reject link request error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/parent-child/remove/:linkId
 * @desc    Remove an approved parent-child link
 * @access  Private (Parent or Student)
 */
router.delete('/remove/:linkId', authenticate(), async (req, res): Promise<void> => {
  try {
    const { linkId } = req.params;
    const userId = req.user!.userId;

    await removeLink(linkId, userId);

    res.json({
      success: true,
      message: 'Link removed successfully',
    });
  } catch (error: any) {
    console.error('Remove link error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/parent-child/children
 * @desc    Get all children for a parent
 * @access  Private (Parent only)
 */
router.get('/children', authenticate(['parent']), async (req, res): Promise<void> => {
  try {
    const parentId = req.user!.userId;
    const children = await getParentChildren(parentId);

    res.json({
      success: true,
      message: 'Children retrieved successfully',
      data: children,
    });
  } catch (error: any) {
    console.error('Get children error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/parent-child/parents
 * @desc    Get all parents for a child (student)
 * @access  Private (Student only)
 */
router.get('/parents', authenticate(['student']), async (req, res): Promise<void> => {
  try {
    const childId = req.user!.userId;
    const parents = await getChildParents(childId);

    res.json({
      success: true,
      message: 'Parents retrieved successfully',
      data: parents,
    });
  } catch (error: any) {
    console.error('Get parents error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/parent-child/:linkId
 * @desc    Get link details with parent and child info
 * @access  Private
 */
router.get('/:linkId', authenticate(), async (req, res): Promise<void> => {
  try {
    const { linkId } = req.params;
    const userId = req.user!.userId;

    const link = await getLinkWithDetails(linkId);

    if (!link) {
      res.status(404).json({
        success: false,
        message: 'Link not found',
      });
      return;
    }

    // Verify user is either parent or child
    if (link.parent?.userId !== userId && link.child?.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    res.json({
      success: true,
      data: link,
    });
  } catch (error: any) {
    console.error('Get link details error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
