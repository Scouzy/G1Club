import express from 'express';
import { getEvaluations, getEvaluationById, createEvaluation, updateEvaluation, deleteEvaluation } from '../controllers/evaluationController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

// Read
router.get('/', getEvaluations);
router.get('/:id', getEvaluationById);

// Write (Coach & Admin)
router.post('/', authorizeRole(['ADMIN', 'COACH']), createEvaluation);
router.put('/:id', authorizeRole(['ADMIN', 'COACH']), updateEvaluation);
router.delete('/:id', authorizeRole(['ADMIN', 'COACH']), deleteEvaluation);

export default router;
