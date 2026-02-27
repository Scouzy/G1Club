import express from 'express';
import multer from 'multer';
import { getSportifs, getSportifById, createSportif, updateSportif, deleteSportif, getMyself, updateMyPhoto, importSportifs, exportSportifs } from '../controllers/sportifController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticateToken);

router.get('/', authorizeRole(['ADMIN', 'COACH']), getSportifs);
router.get('/me', authorizeRole(['SPORTIF', 'ADMIN']), getMyself);
router.get('/export', authorizeRole(['ADMIN', 'COACH']), exportSportifs);
router.put('/me/photo', authorizeRole(['SPORTIF']), updateMyPhoto);
router.get('/:id', authorizeRole(['ADMIN', 'COACH', 'SPORTIF']), getSportifById);

router.post('/', authorizeRole(['ADMIN', 'COACH']), createSportif);
router.post('/import', authorizeRole(['ADMIN', 'COACH']), upload.single('file'), importSportifs);
router.put('/:id', authorizeRole(['ADMIN', 'COACH']), updateSportif);
router.delete('/:id', authorizeRole(['ADMIN', 'COACH']), deleteSportif);

export default router;
