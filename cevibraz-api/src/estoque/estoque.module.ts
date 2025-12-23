import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstoqueController } from './estoque.controller';
import { EstoqueService } from './services/estoque.service';
import { XmlParserService } from './services/xml-parser.service';
import { MovimentacaoEstoque } from './entities/movimentacao-estoque.entity';
import { Moldura } from '../molduras/moldura.entity';
import { Material } from '../materiais/material.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MovimentacaoEstoque, Moldura, Material])],
  controllers: [EstoqueController],
  providers: [EstoqueService, XmlParserService] as Provider[],
  exports: [EstoqueService, XmlParserService] as Provider[],
})
export class EstoqueModule {}
