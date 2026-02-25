import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

// Get stats for all clubs — super admin only
export const getAllClubsStats = async (req: AuthRequest, res: Response) => {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, logoUrl: true }
    });

    const now = new Date();

    const stats = await Promise.all(clubs.map(async club => {
      const [sportifs, coaches, categories, upcomingTrainings] = await Promise.all([
        prisma.sportif.count({ where: { category: { clubId: club.id } } }),
        prisma.coach.count({ where: { user: { clubId: club.id } } }),
        prisma.category.count({ where: { clubId: club.id } }),
        prisma.training.findMany({
          where: { category: { clubId: club.id }, date: { gte: now } },
          orderBy: { date: 'asc' },
          take: 3,
          include: { category: { select: { name: true } } }
        })
      ]);
      return {
        club,
        counts: { sportifs, coaches, categories, upcomingTrainings: upcomingTrainings.length },
        nextTrainings: upcomingTrainings
      };
    }));

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get global statistics (Admin/Coach)
export const getGlobalStats = async (req: AuthRequest, res: Response) => {
  try {
    const clubId = req.user?.clubId;
    let whereCategory: any = clubId ? { clubId } : {};
    let whereTraining: any = clubId ? { category: { clubId } } : {};
    let whereSportif: any = clubId ? { category: { clubId } } : {};
    let whereCoach: any = clubId ? { user: { clubId } } : {};

    // Filter for COACH role
    if (req.user?.role === 'COACH') {
        const coachProfile = await prisma.coach.findUnique({
            where: { userId: req.user.id },
            include: { categories: { select: { id: true } } }
        });
        
        const categoryIds = coachProfile?.categories.map(c => c.id) || [];
        
        whereCategory = { id: { in: categoryIds } };
        whereSportif = { categoryId: { in: categoryIds } };
        whereTraining = { categoryId: { in: categoryIds } };
    }

    const [sportifsCount, coachesCount, trainingsCount, categoriesCount] = await Promise.all([
      prisma.sportif.count({ where: whereSportif }),
      prisma.coach.count({ where: whereCoach }),
      prisma.training.count({ where: { ...whereTraining, date: { gte: new Date() } } }),
      prisma.category.count({ where: whereCategory })
    ]);

    // Recent activity (e.g., last 5 trainings)
    const recentTrainings = await prisma.training.findMany({
        where: { ...whereTraining, date: { lt: new Date() } },
        take: 5,
        orderBy: { date: 'desc' },
        include: {
            category: true,
            _count: { select: { attendances: true } }
        }
    });

    // Upcoming trainings (all)
    const nextTrainings = await prisma.training.findMany({
        where: { ...whereTraining, date: { gte: new Date() } },
        orderBy: { date: 'asc' },
        include: {
            category: true,
        }
    });

    // Recent match results
    const recentMatches = await prisma.training.findMany({
        where: { 
            ...whereTraining,
            type: { in: ['Match', 'Tournoi'] },
            date: { lt: new Date() },
            result: { not: null }
        },
        take: 5,
        orderBy: { date: 'desc' },
        include: {
            category: true
        }
    });

    // Calculate Attendance Rate (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // For coach, attendance rate of THEIR sportifs in THEIR trainings
    // The previous implementation was global.
    const totalAttendances = await prisma.attendance.count({
        where: { training: { ...whereTraining, date: { gte: thirtyDaysAgo } } }
    });
    
    const presentAttendances = await prisma.attendance.count({
        where: { 
            training: { ...whereTraining, date: { gte: thirtyDaysAgo } },
            present: true
        }
    });

    const attendanceRate = totalAttendances > 0 
        ? Math.round((presentAttendances / totalAttendances) * 100) 
        : 0;

    // Activity Trend (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of month

    const trainingsTrend = await prisma.training.groupBy({
        by: ['date'],
        where: { 
            ...whereTraining,
            date: { gte: sixMonthsAgo }
        },
    });

    // Group by Month manually since SQLite might not support complex date grouping easily via Prisma
    const monthlyStats = new Map<string, number>();
    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleString('fr-FR', { month: 'short' });
        monthlyStats.set(key, 0);
    }

    trainingsTrend.forEach(t => {
        const key = new Date(t.date).toLocaleString('fr-FR', { month: 'short' });
        if (monthlyStats.has(key)) {
            monthlyStats.set(key, (monthlyStats.get(key) || 0) + 1);
        }
    });

    // Convert to array for Recharts, reversed to show chronological order
    const activityData = Array.from(monthlyStats.entries()).map(([name, count]) => ({ name, count })).reverse();

    res.json({
      counts: {
        sportifs: sportifsCount,
        coaches: coachesCount,
        trainings: trainingsCount,
        categories: categoriesCount
      },
      attendanceRate,
      recentTrainings,
      nextTrainings,
      recentMatches,
      activityData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get stats for connected Sportif
export const getSportifStats = async (req: AuthRequest, res: Response) => {
    try {
        // Allow Admin to access for preview
        if (!req.user || (req.user.role !== 'SPORTIF' && req.user.role !== 'ADMIN')) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        let sportif = await prisma.sportif.findUnique({
            where: { userId: req.user.id },
            include: { category: true }
        });

        // If Admin and no direct sportif profile, fetch the first one for preview
        if (!sportif && req.user.role === 'ADMIN') {
            sportif = await prisma.sportif.findFirst({
                include: { category: true }
            });
        }

        if (!sportif) {
            return res.status(404).json({ message: 'Profil sportif non trouvé' });
        }

        // 1. Attendance Rate (Last 30 days & All time)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendances = await prisma.attendance.findMany({
            where: { sportifId: sportif.id, training: { date: { lt: new Date() } } },
            include: { training: true }
        });

        const totalPastTrainings = attendances.length;
        const presentCount = attendances.filter(a => a.present).length;
        const globalAttendanceRate = totalPastTrainings > 0 ? Math.round((presentCount / totalPastTrainings) * 100) : 0;
        
        const recentAttendances = attendances.filter(a => new Date(a.training.date) >= thirtyDaysAgo);
        const recentPresentCount = recentAttendances.filter(a => a.present).length;
        const recentAttendanceRate = recentAttendances.length > 0 ? Math.round((recentPresentCount / recentAttendances.length) * 100) : 0;

        // 2. Upcoming Trainings
        const nextTrainings = await prisma.training.findMany({
            where: { 
                categoryId: sportif.categoryId,
                date: { gte: new Date() }
            },
            take: 3,
            orderBy: { date: 'asc' },
            include: { coach: { include: { user: { select: { name: true } } } } }
        });

        // 3. Last Evaluations
        const recentEvaluations = await prisma.evaluation.findMany({
            where: { sportifId: sportif.id },
            take: 3,
            orderBy: { date: 'desc' },
            include: { coach: { include: { user: { select: { name: true } } } } }
        });

        // 4. Match Stats (Goals, etc. if we had them, for now just match participation)
        const matchParticipations = await prisma.attendance.count({
            where: { 
                sportifId: sportif.id, 
                present: true,
                training: { type: { in: ['Match', 'Tournoi'] } }
            }
        });

        res.json({
            attendance: {
                global: globalAttendanceRate,
                recent: recentAttendanceRate,
                totalSessions: totalPastTrainings,
                presentSessions: presentCount
            },
            nextTrainings,
            recentEvaluations,
            matchParticipations,
            sportif
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Get stats per category (for charts)
export const getCategoryStats = async (req: AuthRequest, res: Response) => {
    try {
        const clubId = req.user?.clubId;
        const categories = await prisma.category.findMany({
            where: clubId ? { clubId } : undefined,
            include: {
                _count: {
                    select: { sportifs: true, trainings: true }
                }
            }
        });

        const data = categories.map(cat => ({
            name: cat.name,
            sportifs: cat._count.sportifs,
            trainings: cat._count.trainings
        }));

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}
