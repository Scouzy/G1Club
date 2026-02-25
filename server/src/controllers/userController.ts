import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// Get all users — filtered by clubId
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    let clubId = req.user?.clubId;
    if (!clubId && req.user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { clubId: true } });
      clubId = dbUser?.clubId ?? undefined;
    }
    const users = await prisma.user.findMany({
      where: clubId ? { clubId } : {},
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clubId: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get user by ID — scoped to club
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clubId = req.user?.clubId;
    if (!id) return res.status(400).json({ message: 'ID requis' });

    const user = await prisma.user.findFirst({
      where: { id: id as string, ...(clubId ? { clubId } : {}) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clubId: true,
        createdAt: true,
        coachProfile: true,
        sportifProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Create User — assigned to admin's club
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    const clubId = req.user?.clubId;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'SPORTIF',
        clubId: clubId ?? null,
      },
    });

    if (user.role === 'COACH') {
      await prisma.coach.create({ data: { userId: user.id } });
    }

    res.status(201).json({ message: 'Utilisateur créé avec succès', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update User — scoped to club
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const clubId = req.user?.clubId;

    // Verify user belongs to same club
    const existing = await prisma.user.findFirst({ where: { id: id as string, ...(clubId ? { clubId } : {}) } });
    if (!existing) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    if (email && email !== existing.email) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: id as string },
      data: { name, email, role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Delete User — scoped to club
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clubId = req.user?.clubId;

    // Verify user belongs to same club before deleting
    const existing = await prisma.user.findFirst({ where: { id: id as string, ...(clubId ? { clubId } : {}) } });
    if (!existing) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    await prisma.user.delete({ where: { id: id as string } });

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
