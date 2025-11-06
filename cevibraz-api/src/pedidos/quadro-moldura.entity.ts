import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Quadro } from './quadro.entity';
import { Moldura } from '../molduras/moldura.entity';

@Entity('quadro_molduras')
export class QuadroMoldura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_calculado_moldura: number;

  @ManyToOne(() => Quadro, (quadro) => quadro.quadroMolduras, {
    onDelete: 'CASCADE',
  })
  quadro: Quadro;

  @ManyToOne(() => Moldura, (moldura) => moldura.quadroMolduras, {
    onDelete: 'SET NULL', // se a moldura for deletada nao vai arregassar o pedido
    nullable: true,
  })
  moldura: Moldura;
}
