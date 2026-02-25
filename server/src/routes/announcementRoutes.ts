import express from 'express';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../controllers/announcementController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAnnouncements);
router.post('/', createAnnouncement);
router.delete('/:id', deleteAnnouncement);

export default router;
