import app from './app';
import config from './config';
import { logger } from './lib/winston';

const PORT = config.PORT || 3000;

const server = app.listen(PORT, async () => {
  try {
    console.info(`🚀 Server is running on port ${PORT}`);
    console.info(`🌐 API available at http://localhost:${PORT}`);
    console.info(`🌱 Environment: ${config.NODE_ENV}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }

  process.on('unhandledRejection', (err: Error) => {
    logger.info('UNCAUGHT REJECTION !!');
    logger.info(err.name, err.message);
    server.close(() => {
      logger.info('server are closed');
      process.exit(1);
    });
  });

  process.on('uncaughtException', (err: Error) => {
    logger.info('UNCAUGHT EXCEPTION !!');
    logger.info(err.name, err.message);
    server.close(() => {
      logger.info('server are closed');
      process.exit(1);
    });
  });
});
