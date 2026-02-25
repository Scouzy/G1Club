import express from 'express';
import { getCoaches, getCoachProfile, getCurrentCoachProfile, updateCoachProfile, createCoach, deleteCoach, updateCoachCategories } from '../controllers/coachController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken, getCoaches);
router.get('/me', authenticateToken, authorizeRole(['COACH', 'ADMIN']), getCurrentCoachProfile);
router.get('/:id', authenticateToken, getCoachProfile);
router.post('/', authenticateToken, authorizeRole(['ADMIN']), createCoach);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'COACH']), updateCoachProfile);
router.put('/:id/categories', authenticateToken, authorizeRole(['ADMIN']), updateCoachCategories);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), deleteCoach);

export default router;
