// Em: cevibraz-api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const storagePath = join(__dirname, '..', '..', 'storage');

  app.use('/static', express.static(storagePath));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
