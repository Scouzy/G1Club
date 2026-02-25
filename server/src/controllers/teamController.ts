import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

// Get all teams for a category
export const getTeamsByCategory = async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = req.params.categoryId as string;
    const teams = await prisma.team.findMany({
      where: { categoryId },
      include: {
        sportifs: {
          select: { id: true, firstName: true, lastName: true, position: true, teamId: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Create a team
export const createTeam = async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = req.params.categoryId as string;
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Nom requis' });

    const existing = await prisma.team.findUnique({ where: { categoryId_name: { categoryId, name: name.trim() } } });
    if (existing) return res.status(409).json({ message: 'Une équipe avec ce nom existe déjà dans cette catégorie' });

    const team = await prisma.team.create({
      data: { name: name.trim(), categoryId },
      include: { sportifs: { select: { id: true, firstName: true, lastName: true, position: true } } }
    });
    res.status(201).json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Delete a team
export const deleteTeam = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    // Unassign all sportifs from this team first
    await prisma.sportif.updateMany({ where: { teamId: id }, data: { teamId: null } });
    await prisma.team.delete({ where: { id } });
    res.json({ message: 'Équipe supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Assign a sportif to a team (or remove from team if teamId is null)
export const assignSportifToTeam = async (req: AuthRequest, res: Response) => {
  try {
    const sportifId = req.params.sportifId as string;
    const { teamId } = req.body; // null to unassign

    const sportif = await prisma.sportif.update({
      where: { id: sportifId },
      data: { teamId: teamId ?? null },
      select: { id: true, firstName: true, lastName: true, teamId: true }
    });
    res.json(sportif);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
