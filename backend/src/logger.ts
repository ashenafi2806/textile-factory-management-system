import { createLogger, format, transports } from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// resolve repo root and ensure logs dir exists
const repoRoot = path.resolve(__dirname, '..', '..');
const logsDir = path.join(repoRoot, 'logs');
try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch (e) {
  // ignore
}

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.File({
      filename: path.join(logsDir, 'attendance.log'),
      level: 'info',
    }),
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
  ],
});

// In non-production, also log to console for convenience
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  );
}

export default logger;
