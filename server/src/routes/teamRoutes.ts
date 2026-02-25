import express from 'express';
import { getTeamsByCategory, createTeam, deleteTeam, assignSportifToTeam } from '../controllers/teamController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole(['ADMIN', 'COACH']));

router.get('/category/:categoryId', getTeamsByCategory);
router.post('/category/:categoryId', createTeam);
router.delete('/:id', deleteTeam);
router.put('/sportif/:sportifId', assignSportifToTeam);

export default router;
