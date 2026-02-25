import express from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
