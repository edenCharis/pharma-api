import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import config from './config';
import { logger } from './lib/winston';
import { StatusCodes } from 'http-status-codes';
import { AppError } from './core/utils/appError';
import globalErrorHandler from './middlewares/error.middleware';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
import router from './feature/admin/routes/auth.route';


const app = express();

if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const corsOptions: import('cors').CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.WHITELIST_ORIGIN.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error:${origin} is not allowed by cors`), false);
      logger.info(`CORS Error:${origin} is not allowed by cors`);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cookieParser());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));



app.use(`${config.API_PREFIX}/auth`, router);

app.use((req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, StatusCodes.NOT_FOUND);
  next(err);
});


app.use(
  globalErrorHandler as (err: Error, req: Request, res: Response, next: NextFunction) => void,
);

export default app;
