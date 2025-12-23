import { QuadroMoldura } from '../pedidos/quadro-moldura.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('molduras')
export class Moldura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigo: string;

  @Column()
  nome: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_metro_linear: number;

  @Column({ type: 'text', nullable: true })
  imagem_url: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estoque_atual: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 10 })
  estoque_minimo: number;

  @OneToMany(() => QuadroMoldura, (quadroMoldura) => quadroMoldura.moldura)
  quadroMolduras: QuadroMoldura[];
}
