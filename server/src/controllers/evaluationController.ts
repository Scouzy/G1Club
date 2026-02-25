import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

// Get evaluations
export const getEvaluations = async (req: AuthRequest, res: Response) => {
  try {
    const { sportifId, type } = req.query;
    
    const whereClause: any = {};
    if (sportifId) whereClause.sportifId = sportifId as string;
    if (type) whereClause.type = type as string;

    const evaluations = await prisma.evaluation.findMany({
      where: whereClause,
      include: {
        coach: { include: { user: { select: { name: true } } } },
        sportif: { select: { firstName: true, lastName: true } },
        training: { select: { id: true, date: true, type: true, opponent: true, result: true } }
      },
      orderBy: { date: 'desc' }
    });

    res.json(evaluations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get evaluation by ID
export const getEvaluationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: id as string },
      include: {
        coach: {
            include: { user: { select: { name: true } } }
        },
        sportif: true
      }
    });

    if (!evaluation) return res.status(404).json({ message: 'Évaluation non trouvée' });

    res.json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Create evaluation
export const createEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const { sportifId, type, ratings, comment, trainingId } = req.body;
    
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
    
    const coach = await prisma.coach.findUnique({ where: { userId: req.user.id } });
    if (!coach && req.user.role !== 'ADMIN') {
        return res.status(400).json({ message: 'Profil coach requis' });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        sportifId,
        coachId: coach!.id,
        type,
        ratings: JSON.stringify(ratings),
        comment,
        ...(trainingId ? { trainingId } : {})
      }
    });

    res.status(201).json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update evaluation
export const updateEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { ratings, comment, trainingId } = req.body;

    const evaluation = await prisma.evaluation.update({
      where: { id: id as string },
      data: {
        ratings: ratings ? JSON.stringify(ratings) : undefined,
        comment,
        ...(trainingId !== undefined ? { trainingId: trainingId || null } : {})
      }
    });

    res.json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Delete evaluation
export const deleteEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.evaluation.delete({ where: { id: id as string } });
    res.json({ message: 'Évaluation supprimée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
