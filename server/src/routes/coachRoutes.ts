import express from 'express';
import multer from 'multer';
import { getCoaches, getCoachProfile, getCurrentCoachProfile, updateCoachProfile, createCoach, deleteCoach, updateCoachCategories, exportCoaches, importCoaches } from '../controllers/coachController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', authenticateToken, getCoaches);
router.get('/me', authenticateToken, authorizeRole(['COACH', 'ADMIN']), getCurrentCoachProfile);
router.get('/export', authenticateToken, authorizeRole(['ADMIN']), exportCoaches);
router.post('/import', authenticateToken, authorizeRole(['ADMIN']), upload.single('file'), importCoaches);
router.get('/:id', authenticateToken, getCoachProfile);
router.post('/', authenticateToken, authorizeRole(['ADMIN']), createCoach);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'COACH']), updateCoachProfile);
router.put('/:id/categories', authenticateToken, authorizeRole(['ADMIN']), updateCoachCategories);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), deleteCoach);

export default router;
