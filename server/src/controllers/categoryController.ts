import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

// Get all categories
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    const categories = await prisma.category.findMany({
      where: clubId ? { clubId } : undefined,
      include: {
        _count: {
          select: { sportifs: true, coaches: true }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Create Category
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, color } = req.body;
    const clubId = req.user?.clubId;
    if (!clubId) return res.status(400).json({ message: 'Club non associé à cet utilisateur' });

    const existingCategory = await prisma.category.findUnique({ where: { clubId_name: { clubId, name } } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Cette catégorie existe déjà' });
    }

    const category = await prisma.category.create({
      data: { name, clubId, ...(color ? { color } : {}) }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update Category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const category = await prisma.category.update({
      where: { id: id as string },
      data: { name, ...(color !== undefined ? { color } : {}) }
    });

    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Delete Category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({ where: { id: id as string } });

    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
