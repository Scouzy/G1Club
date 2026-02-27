import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';

// Create Coach (Admin only)
export const createCoach = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, phone, address, qualifications, experience, bio, specialties } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe requis' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'COACH', clubId: req.user?.clubId }
    });
    const coach = await prisma.coach.create({
      data: { userId: user.id, phone, address, qualifications, experience, bio, specialties },
      include: { user: { select: { name: true, email: true, role: true } }, categories: true }
    });
    res.status(201).json(coach);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Delete Coach (Admin only)
export const deleteCoach = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const coach = await prisma.coach.findUnique({ where: { id } });
    if (!coach) return res.status(404).json({ message: 'Coach non trouvé' });
    await prisma.coach.delete({ where: { id } });
    await prisma.user.delete({ where: { id: coach.userId } });
    res.json({ message: 'Coach supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get Coach Profile (by ID or current user)
export const getCoachProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // If id is provided, fetch specific coach (e.g., admin viewing a coach)
    // If not, it might be fetching by query or this route is intended for /me
    // Let's assume /:id or /me is handled in routes
    
    let coach;
    
    if (id) {
        coach = await prisma.coach.findUnique({
            where: { id: id as string },
            include: {
                user: {
                    select: { name: true, email: true, role: true }
                },
                categories: true,
                _count: {
                    select: { trainings: true }
                }
            }
        });
    } 

    if (!coach) {
        return res.status(404).json({ message: 'Coach non trouvé' });
    }

    res.json(coach);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get Current Coach Profile (for the logged in coach)
export const getCurrentCoachProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
        
        let coach = await prisma.coach.findUnique({
            where: { userId: req.user.id },
            include: {
                user: {
                    select: { name: true, email: true, role: true }
                },
                categories: true
            }
        });

        // If Admin and no direct coach profile, fetch the first one for preview
        if (!coach && req.user.role === 'ADMIN') {
            coach = await prisma.coach.findFirst({
                include: {
                    user: {
                        select: { name: true, email: true, role: true }
                    },
                    categories: true
                }
            });
        }

        if (!coach) return res.status(404).json({ message: 'Profil coach non trouvé' });

        res.json(coach);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

// Update Coach Profile
export const updateCoachProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // If admin updating
    const { phone, address, qualifications, experience, bio, specialties, photoUrl } = req.body;

    // Check permissions: Admin can update anyone, Coach can update self
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });

    let coachIdToUpdate = id;

    if (req.user.role === 'COACH') {
        const coach = await prisma.coach.findUnique({ where: { userId: req.user.id } });
        if (!coach) return res.status(404).json({ message: 'Profil non trouvé' });
        // If id provided and differs, deny? Or just ignore id and use own?
        // Let's assume standard route /coaches/:id for updates
        if (id && id !== coach.id) {
            return res.status(403).json({ message: 'Action non autorisée' });
        }
        coachIdToUpdate = coach.id;
    } else if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Action non autorisée' });
    }

    if (!coachIdToUpdate) {
        return res.status(400).json({ message: 'ID requis' });
    }

    const updatedCoach = await prisma.coach.update({
      where: { id: coachIdToUpdate as string },
      data: {
        phone,
        address,
        qualifications,
        experience,
        bio,
        specialties,
        photoUrl
      }
    });

    res.json(updatedCoach);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update Coach Categories (Admin only)
export const updateCoachCategories = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { categoryIds } = req.body; // array of category IDs

    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({ message: 'categoryIds doit être un tableau' });
    }

    const coach = await prisma.coach.update({
      where: { id: id as string },
      data: {
        categories: {
          set: categoryIds.map((cid: string) => ({ id: cid }))
        }
      },
      include: {
        categories: true,
        user: { select: { name: true, email: true, role: true } }
      }
    });

    res.json(coach);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get All Coaches (for Admin/Lists)
export const getCoaches = async (req: AuthRequest, res: Response) => {
    try {
        const clubId = req.user?.clubId;
        const coaches = await prisma.coach.findMany({
            where: clubId ? { user: { clubId } } : undefined,
            include: {
                user: {
                    select: { name: true, email: true }
                },
                categories: true
            }
        });
        res.json(coaches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

// Export Coaches — ADMIN only
export const exportCoaches = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    const coaches = await prisma.coach.findMany({
      where: clubId ? { user: { clubId } } : undefined,
      include: {
        user: { select: { name: true, email: true } },
        categories: true,
      },
    });

    const rows = coaches.map(c => ({
      Nom:            c.user.name,
      Email:          c.user.email,
      Téléphone:      c.phone         ?? '',
      Adresse:        c.address       ?? '',
      Qualifications: c.qualifications ?? '',
      Expérience:     c.experience    ?? '',
      Spécialités:    c.specialties   ?? '',
      Bio:            c.bio           ?? '',
      Catégories:     (c.categories ?? []).map(cat => cat.name).join(', '),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Coachs');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="coachs.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Import Coaches — ADMIN only
export const importCoaches = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Fichier manquant' });
    const clubId = req.user?.clubId;

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

    const normalize = (s: string) => s.trim().toLowerCase();

    const alias = (row: Record<string, any>, ...keys: string[]): string => {
      for (const k of keys) {
        const found = Object.keys(row).find(rk => normalize(rk) === normalize(k));
        if (found && row[found] !== '') return String(row[found]).trim();
      }
      return '';
    };

    const results = { created: 0, skipped: 0, errors: [] as string[] };
    const seenEmails = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2;

      const name  = alias(row, 'nom', 'name', 'prénom nom', 'prenom nom');
      const email = alias(row, 'email', 'e-mail', 'mail', 'courriel');

      if (!name || !email) {
        results.errors.push(`Ligne ${lineNum} : Nom et Email requis`);
        continue;
      }

      const emailLow = normalize(email);
      if (seenEmails.has(emailLow)) {
        results.errors.push(`Ligne ${lineNum} : Email en doublon dans le fichier (${email})`);
        results.skipped++;
        continue;
      }
      seenEmails.add(emailLow);

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        results.errors.push(`Ligne ${lineNum} : Email déjà utilisé (${email})`);
        results.skipped++;
        continue;
      }

      const phone          = alias(row, 'téléphone', 'telephone', 'tel', 'phone');
      const address        = alias(row, 'adresse', 'address');
      const qualifications = alias(row, 'qualifications', 'diplomes', 'diplômes');
      const experience     = alias(row, 'expérience', 'experience');
      const specialties    = alias(row, 'spécialités', 'specialites', 'specialties');
      const bio            = alias(row, 'bio', 'biographie');

      const rawPwd = alias(row, 'mot de passe', 'password', 'mdp') || 'ChangeMe123!';
      const hashedPassword = await bcrypt.hash(rawPwd, 10);

      try {
        const user = await prisma.user.create({
          data: { name, email, password: hashedPassword, role: 'COACH', clubId: clubId ?? undefined },
        });
        await prisma.coach.create({
          data: { userId: user.id, phone, address, qualifications, experience, specialties, bio },
        });
        results.created++;
      } catch (err) {
        results.errors.push(`Ligne ${lineNum} : Erreur création (${email})`);
      }
    }

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'import' });
  }
};
