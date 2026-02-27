import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import * as XLSX from 'xlsx';

// Get all users — filtered by clubId
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    let clubId = req.user?.clubId;
    if (!clubId && req.user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { clubId: true } });
      clubId = dbUser?.clubId ?? undefined;
    }
    const users = await prisma.user.findMany({
      where: clubId ? { clubId } : {},
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clubId: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get user by ID — scoped to club
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clubId = req.user?.clubId;
    if (!id) return res.status(400).json({ message: 'ID requis' });

    const user = await prisma.user.findFirst({
      where: { id: id as string, ...(clubId ? { clubId } : {}) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clubId: true,
        createdAt: true,
        coachProfile: true,
        sportifProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Create User — assigned to admin's club
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    const clubId = req.user?.clubId;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'SPORTIF',
        clubId: clubId ?? null,
      },
    });

    if (user.role === 'COACH') {
      await prisma.coach.create({ data: { userId: user.id } });
    }

    res.status(201).json({ message: 'Utilisateur créé avec succès', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update User — scoped to club
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const clubId = req.user?.clubId;

    // Verify user belongs to same club
    const existing = await prisma.user.findFirst({ where: { id: id as string, ...(clubId ? { clubId } : {}) } });
    if (!existing) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    if (email && email !== existing.email) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: id as string },
      data: { name, email, role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Delete User — scoped to club
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clubId = req.user?.clubId;

    // Verify user belongs to same club before deleting
    const existing = await prisma.user.findFirst({ where: { id: id as string, ...(clubId ? { clubId } : {}) } });
    if (!existing) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    await prisma.user.delete({ where: { id: id as string } });

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Import users from Excel/CSV
export const importUsers = async (req: AuthRequest, res: Response) => {
  try {
    let clubId = req.user?.clubId;
    if (!clubId && req.user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { clubId: true } });
      clubId = dbUser?.clubId ?? undefined;
    }
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) return res.status(400).json({ message: 'Fichier vide ou format invalide' });

    const FIELD_ALIASES: Record<string, string[]> = {
      name:     ['prénom nom', 'nom complet', 'name', 'nom', 'prenom', 'prénom'],
      firstName: ['prénom', 'prenom', 'firstname', 'first name', 'first_name'],
      lastName:  ['nom', 'lastname', 'last name', 'last_name'],
      email:    ['email', 'e-mail', 'mail', 'adresse mail', 'adresse email'],
      password: ['mot de passe', 'password', 'mdp', 'pass'],
      role:     ['profil', 'rôle', 'role', 'type'],
    };

    const ROLE_MAP: Record<string, string> = {
      'dirigeant': 'ADMIN', 'admin': 'ADMIN',
      'coach': 'COACH', 'entraîneur': 'COACH', 'entraineur': 'COACH',
      'sportif': 'SPORTIF', 'joueur': 'SPORTIF', 'athlete': 'SPORTIF', 'athlète': 'SPORTIF',
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
      const lineNum = i + 2;

      // Resolve name: accept "Prénom Nom" combined or separate
      let name = resolveField(row, 'name');
      const firstName = resolveField(row, 'firstName');
      const lastName  = resolveField(row, 'lastName');
      if (!name && firstName && lastName) name = `${firstName} ${lastName}`;
      if (!name && firstName) name = firstName;

      const email    = resolveField(row, 'email');
      const password = resolveField(row, 'password');
      const roleRaw  = resolveField(row, 'role');
      const role     = ROLE_MAP[normalize(roleRaw)] || 'SPORTIF';

      if (!name) { results.errors.push(`Ligne ${lineNum} : Nom manquant`); results.skipped++; continue; }
      if (!email) { results.errors.push(`Ligne ${lineNum} : Email manquant`); results.skipped++; continue; }
      if (!password) { results.errors.push(`Ligne ${lineNum} : Mot de passe manquant`); results.skipped++; continue; }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) { results.errors.push(`Ligne ${lineNum} : Email "${email}" déjà utilisé`); results.skipped++; continue; }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name, role, clubId: clubId ?? null },
      });

      if (user.role === 'COACH') {
        await prisma.coach.create({ data: { userId: user.id } });
      }

      results.created++;
    }

    res.json({
      message: `Import terminé : ${results.created} utilisateur(s) créé(s), ${results.skipped} ignoré(s)`,
      ...results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'import" });
  }
};

// Export users to Excel
export const exportUsers = async (req: AuthRequest, res: Response) => {
  try {
    let clubId = req.user?.clubId;
    if (!clubId && req.user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { clubId: true } });
      clubId = dbUser?.clubId ?? undefined;
    }

    const users = await prisma.user.findMany({
      where: clubId ? { clubId } : {},
      select: { name: true, email: true, role: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    const ROLE_LABEL: Record<string, string> = { ADMIN: 'Dirigeant', COACH: 'Coach', SPORTIF: 'Sportif' };

    const data = users.map(u => ({
      'Nom complet':    u.name,
      'Adresse email':  u.email,
      'Mot de passe':   '(non exporté)',
      'Profil':         ROLE_LABEL[u.role] || u.role,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [25, 30, 20, 15].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="utilisateurs.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'export" });
  }
};
