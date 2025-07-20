export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean; // Indique si l'erreur est opérationnelle (attendue) ou inattendue (programmation, serveur, etc.)
  errors?: Record<string, any> | any[]; // Erreurs de validation Zod ou Prisma

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true,
    errors?: Record<string, any> | any[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
