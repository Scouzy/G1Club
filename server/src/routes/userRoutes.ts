import express from 'express';
import multer from 'multer';
import { getUsers, getUserById, createUser, updateUser, deleteUser, importUsers, exportUsers } from '../controllers/userController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.get('/', getUsers);
router.get('/export', exportUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.post('/import', upload.single('file'), importUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
