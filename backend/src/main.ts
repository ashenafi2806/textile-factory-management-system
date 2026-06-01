import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import morgan from 'morgan';
import type { INestApplication } from '@nestjs/common';

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

  const parseMiddleware = cookieParser.default
    ? cookieParser.default()
    : (cookieParser as unknown as () => unknown)();
  app.use(parseMiddleware);
  app.enableCors({
    origin: '*', //accept from all
    credentials: true,
  });

  // Swagger / OpenAPI setup (enabled by default; set ENABLE_SWAGGER=false to disable).
  if (process.env.ENABLE_SWAGGER !== 'false') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const swaggerConfig = new DocumentBuilder()
        .setTitle('Textile Factory Management System API')
        .setDescription('Backend API documentation')
        .setVersion('1.0')
        .addBearerAuth(
          { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          'jwt',
        )
        .build();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const document = SwaggerModule.createDocument(app as INestApplication, swaggerConfig);
      // Expose docs on both /docs and /api/docs so Next.js rewrites or direct access both work
      SwaggerModule.setup('docs', app as INestApplication, document);
      SwaggerModule.setup('api/docs', app as INestApplication, document);
      // Helpful log for developers
      console.log('Swagger docs available at /docs and /api/docs');
    } catch (e) {
      // If swagger modules aren't installed or scanning fails, avoid crashing the app.
      // Developers can enable Swagger later by setting ENABLE_SWAGGER=true.
      console.warn('Swagger initialization skipped:', e);
    }
  } else {
    console.log('Swagger disabled (set ENABLE_SWAGGER=true to enable)');
  }
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
