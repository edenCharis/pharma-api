import winston from 'winston';
import config from '../config';

const { combine, timestamp, printf, json, align, colorize, errors } = winston.format;

// Define the transports array to hold different logging transports
const transports: winston.transport[] = [];

// if the application is not running in production, add console transport
if (config.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }), // Add colors to log levels
        timestamp({ format: 'YYYY-MM-DD hh:mm:ss A' }), // Add timestamp to logs
        align(), // align log messages
        printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level.toLocaleUpperCase()}]: ${message}${metaStr}`;
        }),
      ),
    }),
  );
}

// Create a logger instance using winston
const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info', // set the default logging level
  format: combine(timestamp(), errors({ stack: true }), json()), // format logs as JSON with timestamp and error stack
  transports, // use the defined transports
  silent: config.NODE_ENV === 'test', // disable logging in test environment
});

export { logger };
