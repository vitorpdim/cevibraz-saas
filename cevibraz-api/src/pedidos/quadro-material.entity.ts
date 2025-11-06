import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Quadro } from './quadro.entity';
import { Material } from '../materiais/material.entity';

@Entity('quadro_materiais')
export class QuadroMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  espessura_paspatur_cm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_calculado_material: number;

  @ManyToOne(() => Quadro, (quadro) => quadro.quadroMateriais, {
    onDelete: 'CASCADE',
  })
  quadro: Quadro;

  @ManyToOne(() => Material, (material) => material.quadroMateriais, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  material: Material;
}
