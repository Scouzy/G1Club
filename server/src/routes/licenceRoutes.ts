import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';
import { getLicences, createLicence, updateLicence, deleteLicence, getLicenceStats } from '../controllers/licenceController';
import { getPayments, generatePayments, createPayment, updatePayment, deletePayment } from '../controllers/licencePaymentController';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.get('/', getLicences);
router.get('/stats', getLicenceStats);
router.post('/', createLicence);
router.put('/:id', updateLicence);
router.delete('/:id', deleteLicence);

// Paiements
router.get('/:licenceId/payments', getPayments);
router.post('/:licenceId/payments/generate', generatePayments);
router.post('/:licenceId/payments', createPayment);
router.put('/:licenceId/payments/:id', updatePayment);
router.delete('/:licenceId/payments/:id', deletePayment);

export default router;
