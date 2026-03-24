// =======================================
// Imports externos
// =======================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// =======================================
// Imports internos
// =======================================

import { Material } from './material.entity';

// =======================================
// Service
// =======================================

@Injectable()
export class MateriaisService {
  constructor(
    @InjectRepository(Material)
    private readonly materiaisRepository: Repository<Material>,
  ) {}

  findAll(): Promise<Material[]> {
    return this.materiaisRepository.find({ order: { nome: 'ASC' } });
  }

  async update(
    id: number,
    dadosAtualizados: Partial<Material>,
  ): Promise<Material> {
    const material = await this.materiaisRepository.findOne({ where: { id } });

    if (!material) {
      throw new NotFoundException(`Material com ID ${id} não encontrado.`);
    }

    Object.assign(material, dadosAtualizados);
    return this.materiaisRepository.save(material);
  }
}
