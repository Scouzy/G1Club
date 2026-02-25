import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

// Get all sportifs
export const getSportifs = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId } = req.query;
    const clubId = req.user?.clubId;

    const whereClause: any = {};
    if (categoryId) whereClause.categoryId = categoryId as string;
    if (clubId) whereClause.category = { clubId };

    const sportifs = await prisma.sportif.findMany({
      where: whereClause,
      include: {
        category: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
    res.json(sportifs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get sportif by ID — scoped to club via category
export const getSportifById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clubId = req.user?.clubId;
    const sportif = await prisma.sportif.findFirst({
      where: { id: id as string, ...(clubId ? { category: { clubId } } : {}) },
      include: {
        category: true,
        user: { select: { email: true, name: true } },
        annotations: true,
        evaluations: true,
        attendances: {
          include: { training: true },
          orderBy: { training: { date: 'desc' } }
        }
      }
    });

    if (!sportif) {
      return res.status(404).json({ message: 'Sportif non trouvé' });
    }

    res.json(sportif);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get authenticated user's sportif profile
export const getMyself = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const sportif = await prisma.sportif.findUnique({
            where: { userId },
            include: {
                category: true,
                annotations: true, // Maybe filter visibility?
                evaluations: true,
                attendances: {
                    include: { training: true },
                    take: 20,
                    orderBy: { training: { date: 'desc' } }
                }
            }
        });

        if (!sportif) {
            return res.status(404).json({ message: 'Profil sportif non trouvé' });
        }

        res.json(sportif);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Create Sportif — category must belong to same club
export const createSportif = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, birthDate, height, weight, position, categoryId, userId } = req.body;
    const clubId = req.user?.clubId;

    // Validate category belongs to club
    const category = await prisma.category.findFirst({
      where: { id: categoryId, ...(clubId ? { clubId } : {}) }
    });
    if (!category) {
      return res.status(400).json({ message: 'ID de catégorie invalide' });
    }

    const sportifData: any = {
      firstName,
      lastName,
      birthDate: new Date(birthDate),
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      position,
      categoryId
    };

    if (userId) {
        // Check if user exists and is not already linked
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(400).json({ message: 'ID utilisateur invalide' });
        sportifData.userId = userId;
    }

    const sportif = await prisma.sportif.create({
      data: sportifData
    });

    res.status(201).json(sportif);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update Sportif — scoped to club
export const updateSportif = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, birthDate, height, weight, position, categoryId } = req.body;
    const clubId = req.user?.clubId;

    // Verify sportif belongs to club
    const existing = await prisma.sportif.findFirst({
      where: { id: id as string, ...(clubId ? { category: { clubId } } : {}) }
    });
    if (!existing) return res.status(404).json({ message: 'Sportif non trouvé' });

    const sportif = await prisma.sportif.update({
      where: { id: id as string },
      data: {
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        position,
        categoryId
      }
    });

    res.json(sportif);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Delete Sportif — scoped to club
export const deleteSportif = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clubId = req.user?.clubId;

    const existing = await prisma.sportif.findFirst({
      where: { id: id as string, ...(clubId ? { category: { clubId } } : {}) }
    });
    if (!existing) return res.status(404).json({ message: 'Sportif non trouvé' });

    await prisma.sportif.delete({ where: { id: id as string } });

    res.json({ message: 'Sportif supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
