import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors();

  const storagePath = configService.get<string>(
    'STORAGE_PATH',
    join(__dirname, '..', '..', 'storage'),
  );

  app.use('/static', express.static(storagePath));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
