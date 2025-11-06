import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './material.entity';

@Injectable()
export class MateriaisService {
  constructor(
    @InjectRepository(Material)
    private materiaisRepository: Repository<Material>,
  ) {}

  findAll(): Promise<Material[]> {
    return this.materiaisRepository.find({
      order: {
        nome: 'ASC',
      },
    });
  }
}
