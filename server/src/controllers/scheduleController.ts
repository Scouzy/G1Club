import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

// Get all schedules for a category — scoped to club
export const getSchedulesByCategory = async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = req.params.categoryId as string;
    const clubId = req.user?.clubId;

    // Verify category belongs to club
    const category = await prisma.category.findFirst({
      where: { id: categoryId, ...(clubId ? { clubId } : {}) }
    });
    if (!category) return res.status(404).json({ message: 'Catégorie non trouvée' });

    const schedules = await prisma.trainingSchedule.findMany({
      where: { categoryId },
      orderBy: { dayOfWeek: 'asc' }
    });
    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get all schedules — scoped to club
export const getAllSchedules = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    const schedules = await prisma.trainingSchedule.findMany({
      where: clubId ? { category: { clubId } } : undefined,
      include: { category: true },
      orderBy: [{ categoryId: 'asc' }, { dayOfWeek: 'asc' }]
    });
    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Create a schedule slot
export const createSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, dayOfWeek, startTime, duration, location } = req.body;
    if (!categoryId || dayOfWeek === undefined || !startTime || !duration) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }
    const schedule = await prisma.trainingSchedule.create({
      data: { categoryId, dayOfWeek: parseInt(dayOfWeek), startTime, duration: parseInt(duration), location }
    });
    res.status(201).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update a schedule slot
export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { dayOfWeek, startTime, duration, location } = req.body;
    const schedule = await prisma.trainingSchedule.update({
      where: { id },
      data: {
        dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : undefined,
        startTime,
        duration: duration !== undefined ? parseInt(duration) : undefined,
        location
      }
    });
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Delete a schedule slot
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.trainingSchedule.delete({ where: { id } });
    res.json({ message: 'Créneau supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
