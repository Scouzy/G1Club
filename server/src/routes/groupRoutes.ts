import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  getGroups, createGroup, deleteGroup, updateGroup,
  addMember, removeMember,
  getGroupMessages, sendGroupMessage,
} from '../controllers/groupController';

const router = Router();

router.use(authenticateToken);

router.get('/', getGroups);
router.post('/', createGroup);
router.patch('/:id', updateGroup);
router.delete('/:id', deleteGroup);

router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

router.get('/:id/messages', getGroupMessages);
router.post('/:id/messages', sendGroupMessage);

export default router;
