import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

// Get annotations
export const getAnnotations = async (req: AuthRequest, res: Response) => {
  try {
    const { sportifId, coachId } = req.query;
    
    const whereClause: any = {};
    if (sportifId) whereClause.sportifId = sportifId as string;
    if (coachId) whereClause.coachId = coachId as string;

    const annotations = await prisma.annotation.findMany({
      where: whereClause,
      include: {
        coach: {
          include: {
            user: { select: { name: true } }
          }
        },
        sportif: {
            select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(annotations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Create annotation
export const createAnnotation = async (req: AuthRequest, res: Response) => {
  try {
    const { content, type, sportifId } = req.body;
    
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
    
    const coach = await prisma.coach.findUnique({ where: { userId: req.user.id } });
    if (!coach && req.user.role !== 'ADMIN') {
        return res.status(400).json({ message: 'Profil coach requis' });
    }
    
    // Admin might need to specify coachId or we assume logged in admin has a coach profile or we handle it differently.
    // Assuming for now the creator is a coach.
    
    const annotation = await prisma.annotation.create({
      data: {
        content,
        type, // TECHNIQUE, POINT_FORT, POINT_FAIBLE, RECOMMANDATION
        coachId: coach!.id, // Force unwrapping safely due to check above (or TS ignore if admin without profile)
        sportifId
      }
    });

    res.status(201).json(annotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Delete annotation
export const deleteAnnotation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const annotationId = id as string;
    
    // Optional: Check ownership (only the coach who created it or admin can delete)
    const annotation = await prisma.annotation.findUnique({ where: { id: annotationId } });
    if (!annotation) return res.status(404).json({ message: 'Annotation non trouvée' });
    
    if (req.user?.role !== 'ADMIN') {
         const coach = await prisma.coach.findUnique({ where: { userId: req.user?.id } });
         if (annotation.coachId !== coach?.id) {
             return res.status(403).json({ message: 'Non autorisé à supprimer cette annotation' });
         }
    }

    await prisma.annotation.delete({ where: { id: annotationId } });
    res.json({ message: 'Annotation supprimée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
