import { UserRole } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/winston';

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (req.user === undefined) {
      res.status(403).json({
        success: false,
        message: 'an error occured',
      });
      return;
    }

    const userRole = (req.user as { user_role: UserRole }).user_role;

    if (userRole !== UserRole.ADMIN) {
      logger.warn(`Accès refusé. Accès reservé seulement à l'administrateur. Votre rôle: ${userRole}`);
      res.status(403).json({
        success: false,
        message:
          "Accès refusé. Accès reservé seulement à l'administrateur. Votre rôle: " + userRole,
      });
      return;
    }

    next();
  } catch (err) {
    console.error('Error in authorizeAdmin middleware:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur survenu lors de la vérification du role.',
    });
  }
};

