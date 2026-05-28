import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    cookieParser.default ? cookieParser.default() : (cookieParser as any)(),
  );
  app.enableCors({
    origin: '*', //accept from all
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 5000,"0.0.0.0");
}
bootstrap();
