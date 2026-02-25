import express from 'express';
import { getAnnotations, createAnnotation, deleteAnnotation } from '../controllers/annotationController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

// Read
router.get('/', getAnnotations);

// Write (Coach & Admin)
router.post('/', authorizeRole(['ADMIN', 'COACH']), createAnnotation);
router.delete('/:id', authorizeRole(['ADMIN', 'COACH']), deleteAnnotation);

export default router;
