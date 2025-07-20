import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { logger } from '../lib/winston';
import { AppError } from '../core/utils/appError';
import { StatusCodes } from 'http-status-codes';

export const validate =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }); // Validating the request body, query, and params
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(`Validation Error in validateRequest: ${error.message}`, {
          errors: error.issues,
        });
        // On passe l'erreur Zod telle quelle pour que le errorHandler la traite.
        return next(error);
      } else {
        logger.error('Unexpected error during request validation:', error);
        next(
          new AppError(
            'An unexpected error occurred during request validation.',
            StatusCodes.INTERNAL_SERVER_ERROR,
            false,
          ),
        );
      }
    }
  };
