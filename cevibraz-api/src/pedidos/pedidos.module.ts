import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';

import { Pedido } from './pedido.entity';
import { Quadro } from './quadro.entity';
import { QuadroMoldura } from './quadro-moldura.entity';
import { QuadroMaterial } from './quadro-material.entity';

import { ClientesModule } from '../clientes/clientes.module';
import { MoldurasModule } from '../molduras/molduras.module';
import { MateriaisModule } from '../materiais/materiais.module';
import { CalculoModule } from '../calculo/calculo.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, Quadro, QuadroMoldura, QuadroMaterial]),
    ClientesModule,
    MoldurasModule,
    MateriaisModule,
    CalculoModule,
    PdfModule,
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
