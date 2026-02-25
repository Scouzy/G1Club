import express from 'express';
import { register, login, verifyEmail, resendVerificationEmail } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

export default router;
