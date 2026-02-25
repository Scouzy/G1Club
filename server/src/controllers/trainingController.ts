import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

// Get trainings (with filters)
export const getTrainings = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, coachId, fromDate, toDate } = req.query;
    const clubId = req.user?.clubId;

    const whereClause: any = {};

    if (categoryId) whereClause.categoryId = categoryId as string;
    if (coachId) whereClause.coachId = coachId as string;
    if (clubId && !categoryId) whereClause.category = { clubId };
    
    if (fromDate || toDate) {
      whereClause.date = {};
      if (fromDate) whereClause.date.gte = new Date(fromDate as string);
      if (toDate) whereClause.date.lte = new Date(toDate as string);
    }

    const trainings = await prisma.training.findMany({
      where: whereClause,
      include: {
        category: true,
        coach: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: { attendances: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(trainings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get training by ID
export const getTrainingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const training = await prisma.training.findUnique({
      where: { id: id as string },
      include: {
        category: true,
        coach: {
            include: {
                user: { select: { name: true } }
            }
        },
        attendances: {
          include: {
            sportif: true
          }
        }
      }
    });

    if (!training) {
      return res.status(404).json({ message: 'Entraînement non trouvé' });
    }

    res.json(training);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Create Training
export const createTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { date, duration, type, objectives, report, categoryId, location, opponent, result } = req.body;
    
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
    const userId = req.user.id;
    const clubId = req.user.clubId;

    // Find coach profile for current user
    const coach = await prisma.coach.findUnique({ where: { userId } });

    let finalCoachId = coach?.id;

    if (!finalCoachId && req.user.role === 'ADMIN') {
        if (req.body.coachId) {
            finalCoachId = req.body.coachId;
        } else {
            const firstCoach = await prisma.coach.findFirst({
                where: clubId ? { user: { clubId } } : undefined
            });
            if (!firstCoach) return res.status(400).json({ message: 'Aucun profil coach trouvé en base' });
            finalCoachId = firstCoach.id;
        }
    }

    if (!finalCoachId) {
        return res.status(400).json({ message: 'Profil coach non trouvé pour cet utilisateur' });
    }

    const training = await prisma.training.create({
      data: {
        date: new Date(date),
        duration: parseInt(duration),
        type,
        objectives,
        report,
        location,
        opponent,
        result,
        categoryId,
        coachId: finalCoachId as string
      }
    });
    
    // Auto-create attendance records for all sportifs in the category
    const sportifs = await prisma.sportif.findMany({ where: { categoryId } });
    if (sportifs.length > 0) {
        await prisma.attendance.createMany({
            data: sportifs.map(s => ({
                trainingId: training.id,
                sportifId: s.id,
                present: false 
            }))
        });
    }

    res.status(201).json(training);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update Training
export const updateTraining = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, duration, type, objectives, report, categoryId, location, opponent, result } = req.body;

    const training = await prisma.training.update({
      where: { id: id as string },
      data: {
        date: date ? new Date(date) : undefined,
        duration: duration ? parseInt(duration) : undefined,
        type,
        objectives,
        report,
        location,
        opponent,
        result,
        categoryId
      }
    });

    res.json(training);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Delete Training
export const deleteTraining = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.attendance.deleteMany({ where: { trainingId: id as string } });
    await prisma.training.delete({ where: { id: id as string } });
    res.json({ message: 'Entraînement supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update Attendance
export const updateAttendance = async (req: Request, res: Response) => {
    try {
        const { trainingId } = req.params;
        const { attendances } = req.body; // Array of { sportifId, present, reason, id? }
        
        await prisma.$transaction(
            attendances.map((att: any) => {
                if (att.id) {
                     return prisma.attendance.update({
                        where: { id: att.id },
                        data: { present: att.present, reason: att.reason }
                     });
                } else {
                    return prisma.attendance.create({
                        data: {
                            trainingId: trainingId as string,
                            sportifId: att.sportifId,
                            present: att.present,
                            reason: att.reason
                        }
                    })
                }
            })
        );

        res.json({ message: 'Présences mises à jour' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}
