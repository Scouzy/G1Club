import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

// GET /announcements — all announcements for the user's club
export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });

    let clubId = req.user.clubId;
    if (!clubId && req.user.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { clubId: true } });
      clubId = dbUser?.clubId ?? undefined;
    }
    if (!clubId) return res.status(400).json({ message: 'Club non trouvé' });

    const announcements = await prisma.clubAnnouncement.findMany({
      where: { clubId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        author: { select: { id: true, name: true } }
      }
    });

    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /announcements — create announcement (ADMIN only)
export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' });

    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Titre et contenu requis' });
    }

    let clubId = req.user.clubId;
    if (!clubId && req.user.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { clubId: true } });
      clubId = dbUser?.clubId ?? undefined;
    }
    if (!clubId) return res.status(400).json({ message: 'Club non trouvé' });

    const announcement = await prisma.clubAnnouncement.create({
      data: { title: title.trim(), content: content.trim(), clubId, authorId: req.user.id },
      include: { author: { select: { id: true, name: true } } }
    });

    res.status(201).json(announcement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /announcements/:id — delete announcement (ADMIN only)
export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' });

    const id = req.params.id as string;
    let clubId = req.user.clubId;
    if (!clubId && req.user.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { clubId: true } });
      clubId = dbUser?.clubId ?? undefined;
    }

    const existing = await prisma.clubAnnouncement.findFirst({ where: { id, ...(clubId ? { clubId } : {}) } });
    if (!existing) return res.status(404).json({ message: 'Annonce non trouvée' });

    await prisma.clubAnnouncement.delete({ where: { id } });
    res.json({ message: 'Annonce supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
