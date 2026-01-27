import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Moldura } from './moldura.entity';
import { MoldurasService } from './molduras.service';
import { MoldurasController } from './molduras.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Moldura]),
    MulterModule.registerAsync({
      useFactory: () => {
        // Usa STORAGE_PATH da env, com fallback para desenvolvimento local
        const uploadPath = join(
          process.env.STORAGE_PATH || join(process.cwd(), 'storage'),
          'molduras',
        );
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }

        return {
          storage: diskStorage({
            destination: uploadPath,
            filename: (req, file, cb) => {
              const uniqueSuffix =
                Date.now() + '-' + Math.round(Math.random() * 1e9);
              const ext = extname(file.originalname);
              cb(null, `moldura-${uniqueSuffix}${ext}`);
            },
          }),
          limits: {
            fileSize: 5 * 1024 * 1024,
          },
          fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
              cb(null, true);
            } else {
              cb(new Error('Apenas imagens são permitidas!'), false);
            }
          },
        };
      },
    }),
  ],
  controllers: [MoldurasController],
  providers: [MoldurasService],
  exports: [TypeOrmModule],
})
export class MoldurasModule {}
