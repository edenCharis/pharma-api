import { Prisma } from '@prisma/client';
import { NextFunction, Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { AppError } from '../core/utils/appError';
import { logger } from '../lib/winston';
import config from '../config';

interface ErrorResponse {
  success: boolean;
  message: string;
  statusCode: number;
  stack?: string;
  errors?: Record<string, any> | any[];
  errorCode?: string;
}

const handleZodError = (err: ZodError): AppError => {
  const errors = err.issues.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  }));
  const message = 'Validation failed';
  logger.warn(`Zod Validation Error: ${JSON.stringify(errors)}`);
  return new AppError(message, StatusCodes.BAD_REQUEST, true, errors);
};

const handlePrismaClientKnownRequestError = (
  err: Prisma.PrismaClientKnownRequestError,
): AppError => {
  let message: string;
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let isOperational = false; // Par défaut, les erreurs Prisma non gérées spécifiquement sont des erreurs de programmation

  logger.error(`Prisma Known Error Code: ${err.code}, Meta: ${JSON.stringify(err.meta)}`);

  switch (err.code) {
    case 'P2002': {
      // Unique constraint failed
      // err.meta.target est un array des champs qui ont causé l'erreur
      const fields = (err.meta?.target as string[])?.join(', ');
      message = `A record with this ${fields} already exists.`;
      statusCode = StatusCodes.CONFLICT;
      isOperational = true;
      break;
    }
    case 'P2025': // Record to update or delete does not exist
      message = `The requested resource was not found. It may have been deleted.`;
      // err.meta.cause contient souvent plus de détails, par exemple "Record to delete not found."
      // message = (err.meta?.cause as string) || 'Resource not found.';
      statusCode = StatusCodes.NOT_FOUND;
      isOperational = true;
      break;
    // Ajoutez d'autres codes d'erreur Prisma spécifiques ici
    // https://www.prisma.io/docs/reference/api-reference/error-reference#prisma-client-query-engine
    default:
      message = `Database operation failed. Code: ${err.code}`;
      // Pour les autres erreurs Prisma connues, on peut les considérer comme non opérationnelles
      // car elles pourraient indiquer un problème dans la logique de la requête.
      break;
  }
  return new AppError(message, statusCode, isOperational, { errorCode: err.code });
};

const handleJWTError = (errName: string): AppError => {
  let message = 'Authentication error';
  const statusCode = StatusCodes.UNAUTHORIZED;
  if (errName === 'JsonWebTokenError') {
    message = 'Invalid token. Please log in again.';
  } else if (errName === 'TokenExpiredError') {
    message = 'Your session has expired. Please log in again.';
  }
  return new AppError(message, statusCode, true);
};

const sendErrorDev = (err: AppError | Error, res: Response) => {
  const statusCode = err instanceof AppError ? err.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  const response: ErrorResponse = {
    success: false,
    statusCode,
    message: err.message,
    stack: err.stack,
  };
  if (err instanceof AppError && err.errors) {
    response.errors = err.errors;
  }
  if ('code' in err && err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(`Prisma Error Code: ${err.code}`);
    response.errorCode = err.code;
  }

  logger.error('DEV ERROR:', err);
  res.status(statusCode).json(response);
};

const sendErrorProd = (err: AppError, res: Response) => {
  const response: ErrorResponse = {
    success: false,
    statusCode: err.statusCode,
    message: err.message,
  };

  if (err.isOperational) {
    if (err.errors) {
      response.errors = err.errors; // Erreurs de validation Zod
    }
    logger.warn(`PROD OPERATIONAL ERROR: ${err.message}`, {
      statusCode: err.statusCode,
      errors: err.errors,
    });
    res.status(err.statusCode).json(response);
  } else {
    // Erreurs de programmation ou inconnues
    logger.error('PROD UNEXPECTED ERROR:', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went very wrong! Our team has been notified.',
      erreur: err,
    });
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorHandler = (
  err:
    | Error
    | AppError
    | ZodError
    | Prisma.PrismaClientKnownRequestError
    | Prisma.PrismaClientValidationError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error = err;

  if (error instanceof ZodError) {
    error = handleZodError(error);
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaClientKnownRequestError(error);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    // Erreur de validation Prisma (par exemple, type de données incorrect pour un champ)
    logger.warn(`Prisma Validation Error: ${error.message}`);
    error = new AppError(
      `Invalid data provided for database operation. ${error.message.split('\n').pop()?.trim()}`,
      StatusCodes.BAD_REQUEST,
      true,
    );
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    error = handleJWTError(error.name);
  } else if (!(error instanceof AppError)) {
    logger.error('UNHANDLED GENERIC ERROR:', error);
    error = new AppError('An unexpected error occurred.', StatusCodes.INTERNAL_SERVER_ERROR, false);
  }

  const appErrorInstance = error as AppError;

  if (config.NODE_ENV === 'development') {
    return sendErrorDev(appErrorInstance, res);
  }

  // Production error handling
  if (!(appErrorInstance instanceof AppError)) {
    // Fallback pour les erreurs qui n'ont pas été correctement converties en AppError
    logger.error('CRITICAL: Error not converted to AppError in production', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'An internal server error occurred. Please try again later.',
    });
  }

  sendErrorProd(appErrorInstance, res);
};

export default globalErrorHandler;
