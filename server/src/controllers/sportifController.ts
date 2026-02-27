import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';
import * as XLSX from 'xlsx';

// Get all sportifs
export const getSportifs = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId } = req.query;
    const clubId = req.user?.clubId;

    const whereClause: any = {};
    if (categoryId) whereClause.categoryId = categoryId as string;
    if (clubId) whereClause.category = { clubId };

    const sportifs = await prisma.sportif.findMany({
      where: whereClause,
      include: {
        category: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
    res.json(sportifs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get sportif by ID — scoped to club via category
export const getSportifById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clubId = req.user?.clubId;
    const sportif = await prisma.sportif.findFirst({
      where: { id: id as string, ...(clubId ? { category: { clubId } } : {}) },
      include: {
        category: true,
        user: { select: { email: true, name: true } },
        annotations: true,
        evaluations: true,
        attendances: {
          include: { training: true },
          orderBy: { training: { date: 'desc' } }
        }
      }
    });

    if (!sportif) {
      return res.status(404).json({ message: 'Sportif non trouvé' });
    }

    res.json(sportif);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get authenticated user's sportif profile
export const getMyself = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const sportif = await prisma.sportif.findUnique({
            where: { userId },
            include: {
                category: true,
                annotations: true, 
                evaluations: {
                  include: {
                    coach: { include: { user: { select: { name: true } } } },
                    training: { select: { id: true, date: true, type: true, opponent: true, result: true } }
                  },
                  orderBy: { date: 'desc' }
                },
                attendances: {
                    include: { training: true },
                    take: 20,
                    orderBy: { training: { date: 'desc' } }
                }
            }
        });

        if (!sportif) {
            return res.status(404).json({ message: 'Profil sportif non trouvé' });
        }

        res.json(sportif);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Create Sportif — category must belong to same club
export const createSportif = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, birthDate, height, weight, position, categoryId, userId } = req.body;
    const clubId = req.user?.clubId;

    // Validate category belongs to club
    const category = await prisma.category.findFirst({
      where: { id: categoryId, ...(clubId ? { clubId } : {}) }
    });
    if (!category) {
      return res.status(400).json({ message: 'ID de catégorie invalide' });
    }

    const sportifData: any = {
      firstName,
      lastName,
      birthDate: new Date(birthDate),
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      position,
      categoryId
    };

    if (userId) {
        // Check if user exists and is not already linked
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(400).json({ message: 'ID utilisateur invalide' });
        sportifData.userId = userId;
    }

    const sportif = await prisma.sportif.create({
      data: sportifData
    });

    res.status(201).json(sportif);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update own photo — SPORTIF role only
export const updateMyPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { photoUrl } = req.body;
    if (!userId) return res.status(401).json({ message: 'Non autorisé' });

    const sportif = await prisma.sportif.findUnique({ where: { userId } });
    if (!sportif) return res.status(404).json({ message: 'Profil sportif non trouvé' });

    const updated = await prisma.sportif.update({
      where: { id: sportif.id },
      data: { photoUrl: photoUrl ?? null }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update Sportif — scoped to club
export const updateSportif = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, birthDate, height, weight, position, categoryId, photoUrl } = req.body;
    const clubId = req.user?.clubId;

    // Verify sportif belongs to club
    const existing = await prisma.sportif.findFirst({
      where: { id: id as string, ...(clubId ? { category: { clubId } } : {}) }
    });
    if (!existing) return res.status(404).json({ message: 'Sportif non trouvé' });

    const sportif = await prisma.sportif.update({
      where: { id: id as string },
      data: {
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        position,
        categoryId,
        ...(photoUrl !== undefined && { photoUrl })
      }
    });

    res.json(sportif);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Delete Sportif — scoped to club
export const deleteSportif = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clubId = req.user?.clubId;

    const existing = await prisma.sportif.findFirst({
      where: { id: id as string, ...(clubId ? { category: { clubId } } : {}) }
    });
    if (!existing) return res.status(404).json({ message: 'Sportif non trouvé' });

    await prisma.sportif.delete({ where: { id: id as string } });

    res.json({ message: 'Sportif supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Import sportifs from Excel/CSV file
export const importSportifs = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) return res.status(400).json({ message: 'Fichier vide ou format invalide' });

    // For COACH: restrict to their assigned categories only
    let allowedCategoryIds: string[] | null = null;
    if (role === 'COACH') {
      const coach = await prisma.coach.findUnique({
        where: { userId },
        include: { categories: { select: { id: true } } }
      });
      allowedCategoryIds = (coach?.categories || []).map(c => c.id);
      if (allowedCategoryIds.length === 0) {
        return res.status(403).json({ message: 'Aucune catégorie assignée à ce coach' });
      }
    }

    // Fetch categories scoped to club (and coach if applicable)
    const categories = await prisma.category.findMany({
      where: {
        ...(clubId ? { clubId } : {}),
        ...(allowedCategoryIds ? { id: { in: allowedCategoryIds } } : {}),
      }
    });
    const catMap = new Map(categories.map(c => [c.name.trim().toLowerCase(), c.id]));

    const FIELD_ALIASES: Record<string, string[]> = {
      firstName: ['prénom', 'prenom', 'firstname', 'first_name', 'first name'],
      lastName:  ['nom', 'lastname', 'last_name', 'last name', 'name'],
      birthDate: ['date de naissance', 'datenaissance', 'birthdate', 'birth_date', 'naissance', 'date_naissance'],
      category:  ['catégorie', 'categorie', 'category', 'cat'],
      position:  ['poste', 'position'],
    };

    const normalize = (s: string) => s?.toString().trim().toLowerCase();

    const resolveField = (row: any, field: string): string => {
      const aliases = FIELD_ALIASES[field] || [field];
      for (const key of Object.keys(row)) {
        if (aliases.includes(normalize(key))) return row[key]?.toString().trim() || '';
      }
      return '';
    };

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const firstName = resolveField(row, 'firstName');
      const lastName  = resolveField(row, 'lastName');
      const birthDateRaw = resolveField(row, 'birthDate');
      const categoryName = resolveField(row, 'category');
      const position = resolveField(row, 'position');

      if (!firstName || !lastName) {
        results.errors.push(`Ligne ${i + 2} : Prénom ou Nom manquant`);
        results.skipped++;
        continue;
      }

      const categoryId = catMap.get(normalize(categoryName));
      if (!categoryId) {
        results.errors.push(`Ligne ${i + 2} : Catégorie "${categoryName}" introuvable`);
        results.skipped++;
        continue;
      }

      let birthDate: Date | null = null;
      if (birthDateRaw) {
        const d = new Date(birthDateRaw);
        if (!isNaN(d.getTime())) birthDate = d;
      }

      await prisma.sportif.create({
        data: {
          firstName,
          lastName,
          birthDate: birthDate ?? new Date('2000-01-01'),
          categoryId,
          position: position || null,
        }
      });
      results.created++;
    }

    res.json({
      message: `Import terminé : ${results.created} sportif(s) créé(s), ${results.skipped} ignoré(s)`,
      ...results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'import' });
  }
};

// Export sportifs to Excel
export const exportSportifs = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    const userId = req.user?.id;
    const role = req.user?.role;

    // For COACH: restrict to their assigned categories only
    let allowedCategoryIds: string[] | null = null;
    if (role === 'COACH') {
      const coach = await prisma.coach.findUnique({
        where: { userId },
        include: { categories: { select: { id: true } } }
      });
      allowedCategoryIds = (coach?.categories || []).map(c => c.id);
    }

    const sportifs = await prisma.sportif.findMany({
      where: {
        ...(clubId ? { category: { clubId } } : {}),
        ...(allowedCategoryIds ? { categoryId: { in: allowedCategoryIds } } : {}),
      },
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { lastName: 'asc' }],
    });

    const data = sportifs.map(s => ({
      'Prénom':            s.firstName,
      'Nom':               s.lastName,
      'Date de naissance': s.birthDate ? new Date(s.birthDate).toLocaleDateString('fr-FR') : '',
      'Catégorie':         s.category?.name || '',
      'Poste':             s.position || '',
      'Taille (cm)':       s.height ?? '',
      'Poids (kg)':        s.weight ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sportifs');

    // Column widths
    ws['!cols'] = [20, 20, 20, 15, 15, 12, 12].map(w => ({ wch: w }));

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sportifs.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'export' });
  }
};
