import { QuadroMoldura } from '../pedidos/quadro-moldura.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'; // Adicione OneToMany

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

  @OneToMany(() => QuadroMoldura, (quadroMoldura) => quadroMoldura.moldura)
  quadroMolduras: QuadroMoldura[];
}
