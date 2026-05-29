import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // resolve repository root (two levels up from backend/src)
  const repoRoot = path.resolve(__dirname, '..', '..');
  const logsDir = path.join(repoRoot, 'logs');
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (e) {
    // ignore errors creating logs dir
  }

  // create a write stream (in append mode) for access logs in repo-root `logs`
  const accessLogPath = path.join(logsDir, 'access.log');
  const accessLogStream = fs.createWriteStream(accessLogPath, { flags: 'a' });

  // use morgan for HTTP request logging
  app.use(morgan('combined', { stream: accessLogStream }));

  app.use(
    cookieParser.default ? cookieParser.default() : (cookieParser as any)(),
  );
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
