import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Pedido } from './pedido.entity';
import { QuadroMoldura } from './quadro-moldura.entity';
import { QuadroMaterial } from './quadro-material.entity';

@Entity('quadros')
export class Quadro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  altura_cm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  largura_cm: number;

  @Column({ default: false })
  medida_fornecida_cliente: boolean;

  @Column({ default: false })
  limpeza_flag: boolean;

  // --- Relações ---
  @ManyToOne(() => Pedido, (pedido) => pedido.quadros, { onDelete: 'CASCADE' })
  pedido: Pedido;

  @OneToMany(() => QuadroMoldura, (qm) => qm.quadro, { cascade: true })
  quadroMolduras: QuadroMoldura[];

  @OneToMany(() => QuadroMaterial, (qm) => qm.quadro, { cascade: true })
  quadroMateriais: QuadroMaterial[];
}
