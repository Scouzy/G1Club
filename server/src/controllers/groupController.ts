import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

const MAX_MEMBERS = 10;

// GET /groups — liste les groupes du club où l'utilisateur est membre
export const getGroups = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const clubId = req.user?.clubId;

    const groups = await prisma.group.findMany({
      where: {
        clubId: clubId ?? undefined,
        members: { some: { userId } },
      },
      include: {
        members: true,
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /groups — créer un groupe
export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const clubId = req.user?.clubId;
    const { name, memberIds } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: 'Nom requis' });
    if (!Array.isArray(memberIds)) return res.status(400).json({ message: 'memberIds requis' });

    // Le créateur + membres ne doit pas dépasser MAX_MEMBERS
    const allMembers = Array.from(new Set([userId, ...memberIds]));
    if (allMembers.length > MAX_MEMBERS) {
      return res.status(400).json({ message: `Un groupe ne peut pas dépasser ${MAX_MEMBERS} membres` });
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        clubId: clubId ?? '',
        creatorId: userId,
        members: {
          create: allMembers.map((uid: string) => ({ userId: uid })),
        },
      },
      include: {
        members: true,
        _count: { select: { messages: true } },
      },
    });

    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /groups/:id — supprimer un groupe (créateur seulement)
export const deleteGroup = async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const userId = req.user!.id;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ message: 'Groupe non trouvé' });
    if (group.creatorId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await prisma.group.delete({ where: { id: groupId } });
    res.json({ message: 'Groupe supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /groups/:id — renommer un groupe
export const updateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const userId = req.user!.id;
    const { name } = req.body;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ message: 'Groupe non trouvé' });
    if (group.creatorId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: { name: name.trim(), updatedAt: new Date() },
      include: { members: true, _count: { select: { messages: true } } },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /groups/:id/members — ajouter un membre
export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const { userId: newUserId } = req.body;

    const count = await prisma.groupMember.count({ where: { groupId } });
    if (count >= MAX_MEMBERS) {
      return res.status(400).json({ message: `Limite de ${MAX_MEMBERS} membres atteinte` });
    }

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: newUserId } },
    });
    if (existing) return res.status(409).json({ message: 'Membre déjà dans le groupe' });

    await prisma.groupMember.create({ data: { groupId, userId: newUserId } });
    await prisma.group.update({ where: { id: groupId }, data: { updatedAt: new Date() } });

    res.status(201).json({ message: 'Membre ajouté' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /groups/:id/members/:userId — retirer un membre
export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const targetUserId = req.params.userId as string;
    const requesterId = req.user!.id;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ message: 'Groupe non trouvé' });

    // Seul le créateur, un admin, ou soi-même peut quitter/retirer
    if (group.creatorId !== requesterId && req.user?.role !== 'ADMIN' && targetUserId !== requesterId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    res.json({ message: 'Membre retiré' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /groups/:id/messages — messages d'un groupe
export const getGroupMessages = async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const userId = req.user!.id;

    // Vérifier que l'utilisateur est membre
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) return res.status(403).json({ message: 'Non autorisé' });

    const messages = await prisma.groupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /groups/:id/messages — envoyer un message dans un groupe
export const sendGroupMessage = async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const userId = req.user!.id;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ message: 'Contenu requis' });

    // Vérifier membership
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) return res.status(403).json({ message: 'Non autorisé' });

    const senderName = req.user?.name ?? 'Inconnu';

    const message = await prisma.groupMessage.create({
      data: { groupId, senderId: userId, senderName, content: content.trim() },
    });

    await prisma.group.update({ where: { id: groupId }, data: { updatedAt: new Date() } });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
