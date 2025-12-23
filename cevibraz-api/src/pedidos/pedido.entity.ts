import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';
import { Quadro } from './quadro.entity';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  numero_pedido: string;

  @Column()
  atendente: string;

  @CreateDateColumn()
  data_criacao: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'A Fazer',
  })
  status: string; // a fazer, já feito, entregue

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  condicao_pagamento: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_final: number;

  @Column({ type: 'text', nullable: true })
  pdf_pedido_url: string;

  @Column({ type: 'text', nullable: true })
  pdf_os_url: string;

  @Column({ type: 'boolean', default: false })
  ocultar_valores_unitarios: boolean;

  // --- relações ---
  @ManyToOne(() => Cliente, (cliente) => cliente.pedidos, {
    onDelete: 'SET NULL',
  })
  cliente: Cliente;

  @OneToMany(() => Quadro, (quadro) => quadro.pedido, { cascade: true })
  quadros: Quadro[];
}
