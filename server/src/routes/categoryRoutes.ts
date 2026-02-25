import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

// Public (authenticated) read access? Or strict? 
// Coaches probably need to see categories.
router.get('/', getCategories);

// Admin only for modifications
router.post('/', authorizeRole(['ADMIN']), createCategory);
router.put('/:id', authorizeRole(['ADMIN']), updateCategory);
router.delete('/:id', authorizeRole(['ADMIN']), deleteCategory);

export default router;
