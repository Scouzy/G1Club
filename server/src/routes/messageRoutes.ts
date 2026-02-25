import express from 'express';
import { sendMessage, getMessages, getConversations, sendCategoryMessage, getCategoryMessages, getContacts, sendTeamMessage, getTeamMessages, getUnreadCount } from '../controllers/messageController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/contacts', getContacts);
router.get('/unread-count', getUnreadCount);
router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.post('/category/:categoryId', sendCategoryMessage);
router.get('/category/:categoryId', getCategoryMessages);
router.post('/team/:teamId', sendTeamMessage);
router.get('/team/:teamId', getTeamMessages);
router.get('/:userId', getMessages);

export default router;
