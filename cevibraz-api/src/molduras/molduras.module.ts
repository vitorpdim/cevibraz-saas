import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Moldura } from './moldura.entity';
import { MoldurasService } from './molduras.service';
import { MoldurasController } from './molduras.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Moldura]),
    MulterModule.register({
      storage: diskStorage({
        destination: process.env.STORAGE_PATH || './storage/molduras',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `moldura-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Apenas imagens são permitidas!'), false);
        }
      },
    }),
  ],
  controllers: [MoldurasController],
  providers: [MoldurasService],
  exports: [TypeOrmModule],
})
export class MoldurasModule {}
