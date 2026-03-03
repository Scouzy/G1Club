import express from 'express';
import { createCheckoutSession, stripeWebhook, createPortalSession } from '../controllers/stripeController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

// Webhook Stripe — raw body, pas d'auth JWT
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Routes protégées ADMIN
router.post('/create-checkout-session', authenticateToken, authorizeRole(['ADMIN']), createCheckoutSession);
router.get('/portal', authenticateToken, authorizeRole(['ADMIN']), createPortalSession);

export default router;
