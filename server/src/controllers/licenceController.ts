import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

// GET /licences — liste toutes les licences du club
export const getLicences = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    const { sportifId, status, categoryId } = req.query;

    const where: any = {
      sportif: {
        category: clubId ? { clubId } : undefined,
        ...(categoryId ? { categoryId: categoryId as string } : {}),
        ...(sportifId ? { id: sportifId as string } : {}),
      },
      ...(status ? { status: status as string } : {}),
    };

    const licences = await prisma.licence.findMany({
      where,
      include: {
        sportif: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            category: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    res.json(licences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /licences — créer une licence
export const createLicence = async (req: AuthRequest, res: Response) => {
  try {
    const { sportifId, number, type, status, startDate, expiryDate, federation, notes } = req.body;

    if (!sportifId || !number || !type || !startDate || !expiryDate) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    const licence = await prisma.licence.create({
      data: {
        sportifId,
        number,
        type,
        status: status || 'ACTIVE',
        startDate: new Date(startDate),
        expiryDate: new Date(expiryDate),
        federation,
        notes,
      },
      include: {
        sportif: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            category: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    res.status(201).json(licence);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /licences/:id — mettre à jour une licence
export const updateLicence = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { number, type, status, startDate, expiryDate, federation, notes } = req.body;

    const licence = await prisma.licence.update({
      where: { id },
      data: {
        ...(number !== undefined && { number }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(expiryDate !== undefined && { expiryDate: new Date(expiryDate) }),
        ...(federation !== undefined && { federation }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        sportif: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            category: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    res.json(licence);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /licences/:id — supprimer une licence
export const deleteLicence = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.licence.delete({ where: { id } });
    res.json({ message: 'Licence supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /licences/stats — statistiques des licences du club
export const getLicenceStats = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    const whereBase = { sportif: { category: clubId ? { clubId } : undefined } };

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const [total, active, expired, suspended, expiringSoon] = await Promise.all([
      prisma.licence.count({ where: whereBase }),
      prisma.licence.count({ where: { ...whereBase, status: 'ACTIVE' } }),
      prisma.licence.count({ where: { ...whereBase, status: 'EXPIRED' } }),
      prisma.licence.count({ where: { ...whereBase, status: 'SUSPENDED' } }),
      prisma.licence.count({
        where: {
          ...whereBase,
          status: 'ACTIVE',
          expiryDate: { gte: now, lte: in30Days },
        },
      }),
    ]);

    res.json({ total, active, expired, suspended, expiringSoon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
