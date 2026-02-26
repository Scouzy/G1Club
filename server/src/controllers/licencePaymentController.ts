import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

// GET /licences/:licenceId/payments
export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { licenceId } = req.params;
    const payments = await prisma.licencePayment.findMany({
      where: { licenceId },
      orderBy: { installment: 'asc' },
    });
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /licences/:licenceId/payments/generate
// Génère automatiquement N versements égaux
export const generatePayments = async (req: AuthRequest, res: Response) => {
  try {
    const { licenceId } = req.params;
    const { installmentCount, totalAmount, firstDueDate } = req.body;

    if (!installmentCount || !totalAmount || !firstDueDate) {
      return res.status(400).json({ message: 'installmentCount, totalAmount et firstDueDate sont requis' });
    }

    const count = parseInt(installmentCount);
    if (count < 1 || count > 12) {
      return res.status(400).json({ message: 'Le nombre de versements doit être entre 1 et 12' });
    }

    // Supprimer les anciens versements PENDING avant de régénérer
    await prisma.licencePayment.deleteMany({
      where: { licenceId, status: 'PENDING' },
    });

    const amountPerInstallment = Math.round((parseFloat(totalAmount) / count) * 100) / 100;
    const firstDate = new Date(firstDueDate);

    const payments = await Promise.all(
      Array.from({ length: count }, (_, i) => {
        const dueDate = new Date(firstDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        return prisma.licencePayment.create({
          data: {
            licenceId,
            installment: i + 1,
            amount: amountPerInstallment,
            dueDate,
            status: 'PENDING',
          },
        });
      })
    );

    // Mettre à jour le totalAmount sur la licence
    await prisma.licence.update({
      where: { id: licenceId },
      data: { totalAmount: parseFloat(totalAmount) },
    });

    res.status(201).json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /licences/:licenceId/payments — ajouter un versement manuel
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { licenceId } = req.params;
    const { installment, amount, dueDate, status, method, reference, notes } = req.body;

    if (!amount || !dueDate) {
      return res.status(400).json({ message: 'amount et dueDate sont requis' });
    }

    // Calculer le prochain numéro de versement si non fourni
    let installmentNumber = installment;
    if (!installmentNumber) {
      const last = await prisma.licencePayment.findFirst({
        where: { licenceId },
        orderBy: { installment: 'desc' },
      });
      installmentNumber = (last?.installment ?? 0) + 1;
    }

    const payment = await prisma.licencePayment.create({
      data: {
        licenceId,
        installment: installmentNumber,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: status || 'PENDING',
        method,
        reference,
        notes,
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /licences/:licenceId/payments/:id — modifier un versement (ex: marquer payé)
export const updatePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paidDate, method, reference, notes, amount, dueDate } = req.body;

    const payment = await prisma.licencePayment.update({
      where: { id },
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

// DELETE /licences/:licenceId/payments/:id
export const deletePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.licencePayment.delete({ where: { id } });
    res.json({ message: 'Versement supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
