import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { chatWithOllama, getOllamaStatus } from '../controllers/chatController';

const router = Router();

router.use(authenticateToken);

router.post('/', chatWithOllama);
router.get('/status', getOllamaStatus);

export default router;
