import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';
import * as XLSX from 'xlsx';
import multer from 'multer';

export const upload = multer({ storage: multer.memoryStorage() });

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
    const id = req.params.id as string;
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
    const id = req.params.id as string;
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
    const id = req.params.id as string;
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
    const stageId = req.params.id as string;
    const { sportifId, installmentCount, totalAmount, firstDueDate } = req.body;

    if (!sportifId) return res.status(400).json({ message: 'sportifId requis' });

    const existing = await prisma.stageParticipant.findUnique({ where: { stageId_sportifId: { stageId: stageId as string, sportifId: sportifId as string } } });
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
    const participantId = req.params.participantId as string;
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
    const paymentId = req.params.paymentId as string;
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

// GET /stages/export — export Excel
export const exportStages = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    const stages = await prisma.stage.findMany({
      where: clubId ? { clubId } : {},
      include: { _count: { select: { participants: true } } },
      orderBy: { startDate: 'desc' },
    });

    const rows = stages.map(s => ({
      Nom: s.name,
      Description: s.description || '',
      'Date début': new Date(s.startDate).toLocaleDateString('fr-FR'),
      'Date fin': new Date(s.endDate).toLocaleDateString('fr-FR'),
      'Heure début': s.startTime,
      'Heure fin': s.endTime,
      Lieu: s.location || '',
      'Prix (€)': s.price,
      'Places max': s.maxSpots ?? '',
      Statut: s.status,
      Participants: s._count.participants,
      Notes: s.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stages');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="stages.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur export' });
  }
};

// POST /stages/import — import Excel
export const importStages = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    if (!clubId) return res.status(400).json({ message: 'Club requis' });
    if (!req.file) return res.status(400).json({ message: 'Fichier manquant' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);

    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2;
      try {
        const name = String(row['Nom'] || '').trim();
        const startDateRaw = row['Date début'];
        const endDateRaw = row['Date fin'];
        const price = parseFloat(row['Prix (€)'] || '0');

        if (!name || !startDateRaw || !endDateRaw) {
          errors.push(`Ligne ${lineNum} : données manquantes (Nom, Date début, Date fin)`);
          continue;
        }

        const startDate = startDateRaw instanceof Date ? startDateRaw : new Date(startDateRaw);
        const endDate = endDateRaw instanceof Date ? endDateRaw : new Date(endDateRaw);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errors.push(`Ligne ${lineNum} : dates invalides`);
          continue;
        }

        await prisma.stage.create({
          data: {
            clubId,
            name,
            description: String(row['Description'] || '').trim() || null,
            startDate,
            endDate,
            startTime: String(row['Heure début'] || '09:00').trim(),
            endTime: String(row['Heure fin'] || '17:00').trim(),
            location: String(row['Lieu'] || '').trim() || null,
            price: isNaN(price) ? 0 : price,
            maxSpots: row['Places max'] ? parseInt(row['Places max']) : null,
            status: String(row['Statut'] || 'OPEN').trim(),
            notes: String(row['Notes'] || '').trim() || null,
          },
        });
        created++;
      } catch (err: any) {
        errors.push(`Ligne ${lineNum} : ${err.message}`);
      }
    }

    res.json({ created, skipped: rows.length - created - errors.length, errors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur import' });
  }
};
