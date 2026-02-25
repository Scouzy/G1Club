import express from 'express';
import { getClubSettings, updateClubSettings, registerClub, findClubByName, getAllClubs, getAllClubsWithUsers } from '../controllers/clubController';
import { authenticateToken, authorizeRole, optionalAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', optionalAuth, getClubSettings);
router.get('/all', authenticateToken, getAllClubs);
router.get('/all-with-users', authenticateToken, getAllClubsWithUsers);
router.get('/search', findClubByName);
router.post('/register', registerClub);
router.put('/', authenticateToken, authorizeRole(['ADMIN']), updateClubSettings);

export default router;
