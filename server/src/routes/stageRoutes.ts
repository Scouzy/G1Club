import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';
import {
  getStages, getStage, createStage, updateStage, deleteStage,
  addParticipant, removeParticipant, updateStagePayment,
} from '../controllers/stageController';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.get('/', getStages);
router.get('/:id', getStage);
router.post('/', createStage);
router.put('/:id', updateStage);
router.delete('/:id', deleteStage);

router.post('/:id/participants', addParticipant);
router.delete('/:id/participants/:participantId', removeParticipant);
router.put('/:id/participants/:participantId/payments/:paymentId', updateStagePayment);

export default router;
