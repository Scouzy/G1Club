import express from 'express';
import { getSportifs, getSportifById, createSportif, updateSportif, deleteSportif, getMyself, updateMyPhoto } from '../controllers/sportifController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

// All authenticated users can potentially view basic lists (maybe restricted later)
// For now, Coaches and Admins have full access. Sportifs might see their own.
router.get('/', authorizeRole(['ADMIN', 'COACH']), getSportifs);
router.get('/me', authorizeRole(['SPORTIF', 'ADMIN']), getMyself);
router.put('/me/photo', authorizeRole(['SPORTIF']), updateMyPhoto);
router.get('/:id', authorizeRole(['ADMIN', 'COACH', 'SPORTIF']), getSportifById);

// Modifications restricted to ADMIN and COACH
router.post('/', authorizeRole(['ADMIN', 'COACH']), createSportif);
router.put('/:id', authorizeRole(['ADMIN', 'COACH']), updateSportif);
router.delete('/:id', authorizeRole(['ADMIN', 'COACH']), deleteSportif);

export default router;
