import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Swagger / OpenAPI setup (optional).
  if (process.env.ENABLE_SWAGGER === 'true') {
    try {
      const swaggerConfig = new DocumentBuilder()
        .setTitle('Textile Factory Management System API')
        .setDescription('Backend API documentation')
        .setVersion('1.0')
        .addBearerAuth(
          { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          'jwt',
        )
        .build();

      const document = SwaggerModule.createDocument(app, swaggerConfig);
      // Expose docs on both /docs and /api/docs so Next.js rewrites or direct access both work
      SwaggerModule.setup('docs', app, document);
      SwaggerModule.setup('api/docs', app, document);
      // Helpful log for developers
      // eslint-disable-next-line no-console
      console.log('Swagger docs available at /docs and /api/docs');
    } catch (e) {
      // If swagger modules aren't installed or scanning fails, avoid crashing the app.
      // Developers can enable Swagger later by setting ENABLE_SWAGGER=true.
      // eslint-disable-next-line no-console
      console.warn('Swagger initialization skipped:',  e);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('Swagger disabled (set ENABLE_SWAGGER=true to enable)');
  }
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
