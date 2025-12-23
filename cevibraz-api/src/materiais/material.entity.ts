import { QuadroMaterial } from '../pedidos/quadro-material.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('materiais')
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nome: string;

  @Column({
    type: 'enum',
    enum: ['metro_linear', 'metro_quadrado'],
  })
  tipo_calculo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_base: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estoque_atual: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 5 })
  estoque_minimo: number;

  @Column({ type: 'varchar', length: 10, default: 'un' })
  unidade: string;

  @OneToMany(() => QuadroMaterial, (quadroMaterial) => quadroMaterial.material)
  quadroMateriais: QuadroMaterial[];
}
