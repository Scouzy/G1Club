import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

// Resolve the effective clubId for a user.
// Priority: 1) jwtClubId (already includes X-Club-Id override from middleware), 2) DB lookup
const resolveClubId = async (userId: string, jwtClubId?: string): Promise<string | null> => {
  if (jwtClubId) return jwtClubId;
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { clubId: true } });
  return dbUser?.clubId ?? null;
};

// Send a direct message (1-to-1)
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, content } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
    const senderId = req.user.id;
    const clubId = await resolveClubId(senderId, req.user.clubId);

    if (!receiverId || !content) {
        return res.status(400).json({ message: 'Destinataire et contenu requis' });
    }

    // Validate receiver exists and belongs to the same club (if sender has a club)
    const receiver = await prisma.user.findFirst({
      where: { id: receiverId, ...(clubId ? { clubId } : {}) }
    });
    if (!receiver) {
        return res.status(404).json({ message: 'Destinataire non trouvé' });
    }

    const message = await prisma.message.create({
      data: { content, senderId, receiverId },
      include: {
          sender: { select: { id: true, name: true, role: true } },
          receiver: { select: { id: true, name: true, role: true } }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Send a broadcast message to a category
export const sendCategoryMessage = async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = req.params.categoryId as string;
    const { content } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
    const senderId = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Contenu requis' });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(404).json({ message: 'Catégorie non trouvée' });

    const message = await prisma.message.create({
      data: { content, senderId, categoryId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get broadcast messages for a category
export const getCategoryMessages = async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = req.params.categoryId as string;
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });

    const messages = await prisma.message.findMany({
      where: { categoryId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true } }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Send a broadcast message to a team
export const sendTeamMessage = async (req: AuthRequest, res: Response) => {
  try {
    const teamId = req.params.teamId as string;
    const { content } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
    const senderId = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Contenu requis' });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    const message = await prisma.message.create({
      data: { content, senderId, teamId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        team: { select: { id: true, name: true, categoryId: true } }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get broadcast messages for a team
export const getTeamMessages = async (req: AuthRequest, res: Response) => {
  try {
    const teamId = req.params.teamId as string;
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });

    const messages = await prisma.message.findMany({
      where: { teamId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        team: { select: { id: true, name: true } }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get all contacts for the coach (coaches + sportifs of their categories)
// Also handles SPORTIF role: returns their category's coaches + teammates with userId
export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
    const clubId = req.user.clubId;

    // ── SPORTIF role ──────────────────────────────────────────────────────
    if (req.user.role === 'SPORTIF') {
      const sportifProfile = await prisma.sportif.findUnique({
        where: { userId: req.user.id },
        include: {
          category: { select: { id: true, name: true } },
          team:     { select: { id: true, name: true } }
        }
      });

      if (!sportifProfile || !sportifProfile.categoryId) {
        return res.json({ coaches: [], admins: [], sportifs: [], categories: [], teams: [] });
      }

      const categoryId = sportifProfile.categoryId;
      const teamId     = sportifProfile.teamId ?? null;

      // Coaches assigned to this category
      const coaches = await prisma.coach.findMany({
        where: { categories: { some: { id: categoryId } } },
        include: {
          user: { select: { id: true, name: true, role: true, email: true } },
          categories: { select: { id: true, name: true } }
        }
      });

      // Teammates: members of the same TEAM (if any), otherwise same category
      const sportifs = await prisma.sportif.findMany({
        where: {
          ...(teamId ? { teamId } : { categoryId }),
          userId: { not: null },
          id: { not: sportifProfile.id }
        },
        include: {
          user: { select: { id: true, name: true, role: true, email: true } },
          category: { select: { id: true, name: true } },
          team:     { select: { id: true, name: true } }
        }
      });

      // Admin of the club
      const admins = await prisma.user.findMany({
        where: { clubId: clubId ?? undefined, role: 'ADMIN' },
        select: { id: true, name: true, role: true, email: true }
      });

      // Teams (the sportif's own team for context)
      const teams = teamId && sportifProfile.team
        ? [{ id: sportifProfile.team.id, name: sportifProfile.team.name, categoryId }]
        : [];

      return res.json({ coaches, admins, sportifs, categories: [sportifProfile.category], teams });
    }

    // ── COACH / ADMIN role ────────────────────────────────────────────────
    let coachCategoryIds: string[] = [];
    if (req.user.role === 'COACH') {
      const coachProfile = await prisma.coach.findUnique({
        where: { userId: req.user.id },
        include: { categories: { select: { id: true } } }
      });
      coachCategoryIds = coachProfile?.categories.map(c => c.id) ?? [];
    }

    // All coaches in the club
    const coaches = await prisma.coach.findMany({
      where: { user: { clubId: clubId ?? undefined } },
      include: { user: { select: { id: true, name: true, role: true, email: true } }, categories: { select: { id: true, name: true } } }
    });

    // Admins of the club (so coaches can receive/reply to admin messages)
    const admins = await prisma.user.findMany({
      where: { clubId: clubId ?? undefined, role: 'ADMIN', id: { not: req.user.id } },
      select: { id: true, name: true, role: true, email: true }
    });

    // Sportifs in the coach's categories (only own categories)
    const sportifs = coachCategoryIds.length > 0
      ? await prisma.sportif.findMany({
          where: { categoryId: { in: coachCategoryIds }, userId: { not: null } },
          include: {
            user: { select: { id: true, name: true, role: true, email: true } },
            category: { select: { id: true, name: true } }
          }
        })
      : [];

    // Categories the coach manages
    const categories = coachCategoryIds.length > 0
      ? await prisma.category.findMany({ where: { id: { in: coachCategoryIds } } })
      : [];

    // Teams within the coach's categories
    const teams = coachCategoryIds.length > 0
      ? await prisma.team.findMany({
          where: { categoryId: { in: coachCategoryIds } },
          include: { category: { select: { id: true, name: true } } },
          orderBy: [{ categoryId: 'asc' }, { name: 'asc' }]
        })
      : [];

    res.json({ coaches, admins, sportifs, categories, teams });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get unread direct message count for the current user
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
    const count = await prisma.message.count({
      where: { receiverId: req.user.id, isRead: false }
    });
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get unread count grouped by sender — for contact-list views (Coach, Sportif)
export const getUnreadPerSender = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
    const rows = await prisma.message.groupBy({
      by: ['senderId'],
      where: { receiverId: req.user.id, isRead: false },
      _count: { id: true },
    });
    // Return as { [senderId]: count }
    const result: Record<string, number> = {};
    rows.forEach(r => { result[r.senderId] = r._count.id; });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get conversation with a specific user
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params; // The other person's ID
    const targetUserId = userId as string;
    if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
    const currentUserId = req.user.id;
    const clubId = await resolveClubId(currentUserId, req.user.clubId);

    // Verify the target user belongs to the same club
    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, ...(clubId ? { clubId } : {}) }
    });
    if (!targetUser) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Mark messages from the other user as read
    await prisma.message.updateMany({
      where: { senderId: targetUserId, receiverId: currentUserId, isRead: false },
      data: { isRead: true }
    });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
          sender: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get list of recent conversations — scoped to same club
export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Non autorisé' });
        const currentUserId = req.user.id;
        const clubId = await resolveClubId(currentUserId, req.user.clubId);

        // Get IDs of all users in the same club to filter conversations
        const clubUserIds = clubId
            ? (await prisma.user.findMany({ where: { clubId }, select: { id: true } })).map(u => u.id)
            : null;

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    {
                        senderId: currentUserId,
                        receiverId: { not: null, ...(clubUserIds ? { in: clubUserIds } : {}) }
                    },
                    {
                        receiverId: currentUserId,
                        ...(clubUserIds ? { senderId: { in: clubUserIds } } : {})
                    }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, name: true, role: true } },
                receiver: { select: { id: true, name: true, role: true } }
            }
        });

        // Extract unique contacts
        const conversations = new Map();
        messages.forEach(msg => {
            const isSender = msg.senderId === currentUserId;
            const contact = isSender ? msg.receiver : msg.sender;
            if (contact && !conversations.has(contact.id)) {
                conversations.set(contact.id, { contact, lastMessage: msg });
            }
        });

        // Compute unread count per contact
        const conversationList = Array.from(conversations.values());
        const unreadCounts = await Promise.all(
            conversationList.map(conv =>
                prisma.message.count({
                    where: { senderId: conv.contact.id, receiverId: currentUserId, isRead: false }
                })
            )
        );
        const result = conversationList.map((conv, i) => ({ ...conv, unreadCount: unreadCounts[i] }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
