import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';
import * as XLSX from 'xlsx';
import multer from 'multer';

export const upload = multer({ storage: multer.memoryStorage() });

// GET /licences — liste toutes les licences du club
export const getLicences = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    const { sportifId, status, categoryId } = req.query;

    const where: any = {
      sportif: {
        category: clubId ? { clubId } : undefined,
        ...(categoryId ? { categoryId: categoryId as string } : {}),
        ...(sportifId ? { id: sportifId as string } : {}),
      },
      ...(status ? { status: status as string } : {}),
    };

    const licences = await prisma.licence.findMany({
      where,
      include: {
        sportif: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            category: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    res.json(licences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /licences — créer une licence
export const createLicence = async (req: AuthRequest, res: Response) => {
  try {
    const { sportifId, number, type, status, startDate, expiryDate, federation, notes } = req.body;

    if (!sportifId || !number || !type || !startDate || !expiryDate) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    const licence = await prisma.licence.create({
      data: {
        sportifId,
        number,
        type,
        status: status || 'ACTIVE',
        startDate: new Date(startDate),
        expiryDate: new Date(expiryDate),
        federation,
        notes,
      },
      include: {
        sportif: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            category: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    res.status(201).json(licence);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /licences/:id — mettre à jour une licence
export const updateLicence = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { number, type, status, startDate, expiryDate, federation, notes } = req.body;

    const licence = await prisma.licence.update({
      where: { id },
      data: {
        ...(number !== undefined && { number }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(expiryDate !== undefined && { expiryDate: new Date(expiryDate) }),
        ...(federation !== undefined && { federation }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        sportif: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            category: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    res.json(licence);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /licences/:id — supprimer une licence
export const deleteLicence = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.licence.delete({ where: { id } });
    res.json({ message: 'Licence supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /licences/export — export Excel
export const exportLicences = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    const licences = await prisma.licence.findMany({
      where: { sportif: { category: clubId ? { clubId } : undefined } },
      include: { sportif: { select: { firstName: true, lastName: true, category: { select: { name: true } } } } },
      orderBy: { expiryDate: 'asc' },
    });

    const rows = licences.map(l => ({
      Prénom: l.sportif.firstName,
      Nom: l.sportif.lastName,
      Catégorie: l.sportif.category.name,
      'N° Licence': l.number,
      Type: l.type,
      Statut: l.status,
      'Date début': new Date(l.startDate).toLocaleDateString('fr-FR'),
      Expiration: new Date(l.expiryDate).toLocaleDateString('fr-FR'),
      Fédération: l.federation || '',
      'Montant (€)': l.totalAmount ?? '',
      Notes: l.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Licences');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="licences.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur export' });
  }
};

// POST /licences/import — import Excel
export const importLicences = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    if (!req.file) return res.status(400).json({ message: 'Fichier manquant' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);

    let created = 0; const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2;
      try {
        const firstName = String(row['Prénom'] || '').trim();
        const lastName = String(row['Nom'] || '').trim();
        const number = String(row['N° Licence'] || '').trim();
        const type = String(row['Type'] || 'Compétition').trim();
        const status = String(row['Statut'] || 'ACTIVE').trim();
        const startDateRaw = row['Date début'];
        const expiryDateRaw = row['Expiration'];

        if (!firstName || !lastName || !number || !startDateRaw || !expiryDateRaw) {
          errors.push(`Ligne ${lineNum} : données manquantes`);
          continue;
        }

        const startDate = startDateRaw instanceof Date ? startDateRaw : new Date(startDateRaw);
        const expiryDate = expiryDateRaw instanceof Date ? expiryDateRaw : new Date(expiryDateRaw);

        if (isNaN(startDate.getTime()) || isNaN(expiryDate.getTime())) {
          errors.push(`Ligne ${lineNum} : dates invalides`);
          continue;
        }

        const sportif = await prisma.sportif.findFirst({
          where: { firstName, lastName, category: clubId ? { clubId } : undefined },
        });
        if (!sportif) {
          errors.push(`Ligne ${lineNum} : sportif "${firstName} ${lastName}" introuvable`);
          continue;
        }

        await prisma.licence.create({
          data: {
            sportifId: sportif.id,
            number,
            type,
            status,
            startDate,
            expiryDate,
            federation: String(row['Fédération'] || '').trim() || null,
            notes: String(row['Notes'] || '').trim() || null,
            totalAmount: row['Montant (€)'] ? parseFloat(row['Montant (€)']) : null,
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

// GET /licences/stats — statistiques des licences du club
export const getLicenceStats = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    const whereBase = { sportif: { category: clubId ? { clubId } : undefined } };

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const [total, active, expired, suspended, expiringSoon] = await Promise.all([
      prisma.licence.count({ where: whereBase }),
      prisma.licence.count({ where: { ...whereBase, status: 'ACTIVE' } }),
      prisma.licence.count({ where: { ...whereBase, status: 'EXPIRED' } }),
      prisma.licence.count({ where: { ...whereBase, status: 'SUSPENDED' } }),
      prisma.licence.count({
        where: {
          ...whereBase,
          status: 'ACTIVE',
          expiryDate: { gte: now, lte: in30Days },
        },
      }),
    ]);

    res.json({ total, active, expired, suspended, expiringSoon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
