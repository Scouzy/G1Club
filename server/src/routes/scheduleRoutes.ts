import express from 'express';
import { getAllSchedules, getSchedulesByCategory, createSchedule, updateSchedule, deleteSchedule } from '../controllers/scheduleController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();
router.use(authenticateToken);

router.get('/', getAllSchedules);
router.get('/category/:categoryId', getSchedulesByCategory);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;
