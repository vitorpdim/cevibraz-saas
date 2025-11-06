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

  @OneToMany(() => QuadroMaterial, (quadroMaterial) => quadroMaterial.material)
  quadroMateriais: QuadroMaterial[];
}
