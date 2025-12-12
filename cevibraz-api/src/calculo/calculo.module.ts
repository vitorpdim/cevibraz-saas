import { Module } from '@nestjs/common';
import { CalculoService } from './calculo.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Moldura } from '../molduras/moldura.entity';
import { Material } from '../materiais/material.entity';
import { MoldurasModule } from '../molduras/molduras.module';
import { MateriaisModule } from '../materiais/materiais.module';
import { CalculoController } from './calculo.controller';

@Module({
  imports: [
    MoldurasModule,
    MateriaisModule,
    TypeOrmModule.forFeature([Moldura, Material]),
  ],
  providers: [CalculoService],
  exports: [CalculoService],
  controllers: [CalculoController],
})
export class CalculoModule {}
