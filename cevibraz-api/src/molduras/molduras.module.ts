import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Moldura } from './moldura.entity';
import { MoldurasController } from './molduras.controller';
import { MoldurasService } from './molduras.service';

@Module({
  imports: [TypeOrmModule.forFeature([Moldura])],
  controllers: [MoldurasController],
  providers: [MoldurasService],
})
export class MoldurasModule {}
