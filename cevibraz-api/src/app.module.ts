import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // 1. Importar
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MoldurasModule } from './molduras/molduras.module';
import { MateriaisModule } from './materiais/materiais.module';
import { ClientesModule } from './clientes/clientes.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { CalculoModule } from './calculo/calculo.module';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'dpg-d432sjpr0fns73ekaq60-a.oregon-postgres.render.com',
      port: 5432,
      username: 'cevibraz_db_user',
      password: 'IRmPz2k9gOeoT1lZEomr6ppR9YLfHEss',
      database: 'cevibraz_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    MoldurasModule,
    MateriaisModule,
    ClientesModule,
    PedidosModule,
    CalculoModule,
    PdfModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
