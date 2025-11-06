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
  status: string; // a Fazer, já Feito, entregue

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_final: number;

  // --- campos novos urls ---
  @Column({ type: 'text', nullable: true })
  pdf_pedido_url: string;

  @Column({ type: 'text', nullable: true })
  pdf_os_url: string;

  // --- relações ---
  @ManyToOne(() => Cliente, (cliente) => cliente.pedidos, {
    onDelete: 'SET NULL',
  })
  cliente: Cliente;

  @OneToMany(() => Quadro, (quadro) => quadro.pedido, { cascade: true })
  quadros: Quadro[];
}
