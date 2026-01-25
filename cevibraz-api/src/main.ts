import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // SERVE TUDO DA PASTA STORAGE (imagens E PDFs)
  const storagePath = join(__dirname, '..', '..', 'storage');
  app.use('/static', express.static(storagePath));

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`API rodando na porta: ${port}`);
}
bootstrap();
