import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './material.entity';
import { MateriaisController } from './materiais.controller';
import { MateriaisService } from './materiais.service';

@Module({
  imports: [TypeOrmModule.forFeature([Material])],
  controllers: [MateriaisController],
  providers: [MateriaisService],
  exports: [TypeOrmModule],
})
export class MateriaisModule {}
