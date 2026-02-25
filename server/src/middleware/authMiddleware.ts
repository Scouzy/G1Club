import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; clubId?: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Accès refusé' });

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });

    // Super admin can override clubId via X-Club-Id header
    const xClubId = req.headers['x-club-id'] as string | undefined;
    if (xClubId && !user.clubId) {
      user.clubId = xClubId;
    }

    req.user = user;
    next();
  });
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();
  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (!err && user) {
      const xClubId = req.headers['x-club-id'] as string | undefined;
      if (xClubId && !user.clubId) user.clubId = xClubId;
      req.user = user;
    }
    next();
  });
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Permissions insuffisantes' });
    }
    next();
  };
};
