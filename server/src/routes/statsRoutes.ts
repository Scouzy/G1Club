import express from 'express';
import { getGlobalStats, getCategoryStats, getSportifStats, getAllClubsStats } from '../controllers/statsController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/all-clubs', authorizeRole(['ADMIN']), getAllClubsStats);
router.get('/global', authorizeRole(['ADMIN', 'COACH']), getGlobalStats);
router.get('/categories', authorizeRole(['ADMIN', 'COACH']), getCategoryStats);
router.get('/sportif', authorizeRole(['SPORTIF', 'ADMIN']), getSportifStats);

export default router;
