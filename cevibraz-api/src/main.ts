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

  // IMAGENS E PDFs
  const pdfPath = join(__dirname, '..', 'static');
  const imgPath = join(__dirname, '..', 'storage');

  app.use('/static', express.static(pdfPath));
  app.use('/static', express.static(imgPath));

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 API rodando na porta ${port}`);
}
bootstrap();
