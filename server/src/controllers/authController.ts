import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { sendVerificationEmail } from '../utils/emailService';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'SPORTIF',
        emailVerified: false,
        emailVerifyToken,
      },
    });

    // Create specific profile based on role
    if (user.role === 'COACH') {
      await prisma.coach.create({ data: { userId: user.id } });
    }

    try {
      await sendVerificationEmail(email, name, emailVerifyToken);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
    }

    res.status(201).json({ message: 'Compte créé. Vérifiez votre email pour activer votre compte.', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email }, include: { club: true } });
    if (!user) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Veuillez confirmer votre adresse email avant de vous connecter.', emailNotVerified: true });
    }

    const isSuperAdmin = user.email === 'admin@sportemergence.com';
    const effectiveClubId = isSuperAdmin ? null : user.clubId;

    const token = jwt.sign(
      { id: user.id, role: user.role, clubId: effectiveClubId },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clubId: effectiveClubId,
        club: user.club ? { id: user.club.id, name: user.club.name, logoUrl: user.club.logoUrl } : null,
        isSuperAdmin,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Token invalide' });
    }

    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) {
      return res.status(400).json({ message: 'Lien de vérification invalide ou expiré' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });

    res.json({ message: 'Email confirmé avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Aucun compte trouvé avec cet email' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email déjà vérifié' });

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken } });

    try {
      await sendVerificationEmail(email, user.name, emailVerifyToken);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
      return res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
    }

    res.json({ message: 'Email de vérification renvoyé.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
