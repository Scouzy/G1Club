import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/emailService';

export const getClubSettings = async (req: Request, res: Response) => {
  try {
    // Try to get clubId from JWT if authenticated, otherwise return first club (public fallback)
    const authReq = req as AuthRequest;
    const clubId = authReq.user?.clubId;

    if (!clubId) {
      return res.json({ id: '', clubName: 'G1Club', name: 'G1Club', logoUrl: null });
    }

    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      return res.json({ id: '', clubName: 'G1Club', name: 'G1Club', logoUrl: null });
    }

    res.json({ ...club, clubName: club.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get all clubs — super admin only
export const getAllClubs = async (req: Request, res: Response) => {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        _count: { select: { users: true, categories: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(clubs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get all clubs with their users — super admin only
export const getAllClubsWithUsers = async (req: Request, res: Response) => {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: { name: 'asc' },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, clubId: true, createdAt: true }
        }
      }
    });
    res.json(clubs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Find a club by name (public, for login page)
export const findClubByName = async (req: Request, res: Response) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ message: 'Nom requis' });

    const clubs = await prisma.club.findMany({
      where: { name: { contains: name as string } },
      select: { id: true, name: true, logoUrl: true },
      take: 10,
    });

    res.json(clubs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Register a new club with its first admin user
export const registerClub = async (req: Request, res: Response) => {
  try {
    const { clubName, adminName, adminEmail, adminPassword } = req.body;
    if (!clubName || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    if (adminPassword.length < 6) {
      return res.status(400).json({ message: 'Mot de passe trop court (min 6 caractères)' });
    }

    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) {
      return res.status(400).json({ message: 'Un compte avec cet email existe déjà' });
    }

    const club = await prisma.club.create({ data: { name: clubName } });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        clubId: club.id,
        emailVerified: false,
        emailVerifyToken,
      },
      include: { club: true }
    });

    try {
      await sendVerificationEmail(adminEmail, adminName, emailVerifyToken);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
    }

    res.status(201).json({
      message: 'Club créé avec succès. Vérifiez votre email pour activer votre compte.',
      clubId: club.id,
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateClubSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { clubName, logoUrl, address, city, email, phone, website, facebook, instagram, twitter, youtube, tiktok, linkedin } = req.body;
    let clubId = req.user?.clubId;

    // Super admin has no clubId in JWT — resolve it from the DB
    if (!clubId && req.user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { clubId: true } });
      clubId = dbUser?.clubId ?? undefined;
    }

    if (!clubId) return res.status(400).json({ message: 'Club non associé à cet utilisateur' });

    const club = await prisma.club.update({
      where: { id: clubId },
      data: {
        ...(clubName !== undefined && { name: clubName }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(facebook !== undefined && { facebook }),
        ...(instagram !== undefined && { instagram }),
        ...(twitter !== undefined && { twitter }),
        ...(youtube !== undefined && { youtube }),
        ...(tiktok !== undefined && { tiktok }),
        ...(linkedin !== undefined && { linkedin }),
      }
    });

    res.json({ ...club, clubName: club.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
