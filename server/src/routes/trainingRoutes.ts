import express from 'express';
import { getTrainings, getTrainingById, createTraining, updateTraining, deleteTraining, updateAttendance } from '../controllers/trainingController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

// Read access
router.get('/', authorizeRole(['ADMIN', 'COACH', 'SPORTIF']), getTrainings);
router.get('/:id', authorizeRole(['ADMIN', 'COACH', 'SPORTIF']), getTrainingById);

// Write access (Coach & Admin)
router.post('/', authorizeRole(['ADMIN', 'COACH']), createTraining);
router.put('/:id', authorizeRole(['ADMIN', 'COACH']), updateTraining);
router.delete('/:id', authorizeRole(['ADMIN', 'COACH']), deleteTraining);

// Attendance
router.put('/:trainingId/attendance', authorizeRole(['ADMIN', 'COACH']), updateAttendance);

export default router;
