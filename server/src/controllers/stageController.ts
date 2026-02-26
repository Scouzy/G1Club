import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

const includeParticipants = {
  participants: {
    include: {
      sportif: {
        select: {
          id: true, firstName: true, lastName: true, photoUrl: true,
          category: { select: { id: true, name: true, color: true } },
        },
      },
      payments: { orderBy: { installment: 'asc' as const } },
    },
  },
};

// GET /stages
export const getStages = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    const stages = await prisma.stage.findMany({
      where: clubId ? { clubId } : {},
      include: {
        _count: { select: { participants: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    res.json(stages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /stages/:id
export const getStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const stage = await prisma.stage.findUnique({
      where: { id },
      include: includeParticipants,
    });
    if (!stage) return res.status(404).json({ message: 'Stage non trouvé' });
    res.json(stage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /stages
export const createStage = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    if (!clubId) return res.status(400).json({ message: 'Club requis' });

    const { name, description, startDate, endDate, startTime, endTime, location, price, maxSpots, status, notes } = req.body;
    if (!name || !startDate || !endDate || !startTime || !endTime || price === undefined) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    const stage = await prisma.stage.create({
      data: {
        clubId, name, description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime, endTime, location,
        price: parseFloat(price),
        maxSpots: maxSpots ? parseInt(maxSpots) : null,
        status: status || 'OPEN',
        notes,
      },
      include: { _count: { select: { participants: true } } },
    });
    res.status(201).json(stage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /stages/:id
export const updateStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate, startTime, endTime, location, price, maxSpots, status, notes } = req.body;

    const stage = await prisma.stage.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(location !== undefined && { location }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(maxSpots !== undefined && { maxSpots: maxSpots ? parseInt(maxSpots) : null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: { _count: { select: { participants: true } } },
    });
    res.json(stage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /stages/:id
export const deleteStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.stage.delete({ where: { id } });
    res.json({ message: 'Stage supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /stages/:id/participants
export const addParticipant = async (req: AuthRequest, res: Response) => {
  try {
    const { id: stageId } = req.params;
    const { sportifId, installmentCount, totalAmount, firstDueDate } = req.body;

    if (!sportifId) return res.status(400).json({ message: 'sportifId requis' });

    const existing = await prisma.stageParticipant.findUnique({ where: { stageId_sportifId: { stageId, sportifId } } });
    if (existing) return res.status(409).json({ message: 'Ce sportif est déjà inscrit' });

    const participant = await prisma.stageParticipant.create({
      data: { stageId, sportifId },
      include: {
        sportif: { select: { id: true, firstName: true, lastName: true, photoUrl: true, category: { select: { id: true, name: true, color: true } } } },
        payments: true,
      },
    });

    // Auto-generate payments if requested
    if (installmentCount && totalAmount && firstDueDate) {
      const count = parseInt(installmentCount);
      const amount = Math.round((parseFloat(totalAmount) / count) * 100) / 100;
      const firstDate = new Date(firstDueDate);

      await Promise.all(
        Array.from({ length: count }, (_, i) => {
          const dueDate = new Date(firstDate);
          dueDate.setMonth(dueDate.getMonth() + i);
          return prisma.stagePayment.create({
            data: { participantId: participant.id, installment: i + 1, amount, dueDate, status: 'PENDING' },
          });
        })
      );

      const updated = await prisma.stageParticipant.findUnique({
        where: { id: participant.id },
        include: {
          sportif: { select: { id: true, firstName: true, lastName: true, photoUrl: true, category: { select: { id: true, name: true, color: true } } } },
          payments: { orderBy: { installment: 'asc' } },
        },
      });
      return res.status(201).json(updated);
    }

    res.status(201).json(participant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /stages/:id/participants/:participantId
export const removeParticipant = async (req: AuthRequest, res: Response) => {
  try {
    const { participantId } = req.params;
    await prisma.stageParticipant.delete({ where: { id: participantId } });
    res.json({ message: 'Participant retiré' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /stages/:id/participants/:participantId/payments/:paymentId
export const updateStagePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { status, paidDate, method, reference, notes, amount, dueDate } = req.body;

    const payment = await prisma.stagePayment.update({
      where: { id: paymentId },
      data: {
        ...(status !== undefined && { status }),
        ...(paidDate !== undefined && { paidDate: paidDate ? new Date(paidDate) : null }),
        ...(method !== undefined && { method }),
        ...(reference !== undefined && { reference }),
        ...(notes !== undefined && { notes }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
      },
    });
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
