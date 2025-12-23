import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Moldura } from '../../molduras/moldura.entity';
import { Material } from '../../materiais/material.entity';

@Entity('movimentacoes_estoque')
export class MovimentacaoEstoque {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ['ENTRADA', 'SAIDA', 'AJUSTE'],
  })
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';

  @Column({
    type: 'enum',
    enum: ['MANUAL', 'XML', 'PEDIDO', 'AJUSTE_INVENTARIO'],
  })
  origem: 'MANUAL' | 'XML' | 'PEDIDO' | 'AJUSTE_INVENTARIO';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantidade: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  saldo_anterior: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  saldo_novo: number;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia_externa?: string;

  @Column({ type: 'int', nullable: true })
  pedido_id?: number;

  @CreateDateColumn()
  data: Date;

  @ManyToOne(() => Moldura, { nullable: true, onDelete: 'SET NULL' })
  moldura?: Moldura | null;

  @ManyToOne(() => Material, { nullable: true, onDelete: 'SET NULL' })
  material?: Material | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  usuario?: string;
}
