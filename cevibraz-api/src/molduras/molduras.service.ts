import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Moldura } from './moldura.entity';

@Injectable()
export class MoldurasService {
  constructor(
    @InjectRepository(Moldura)
    private moldurasRepository: Repository<Moldura>,
  ) {}

  findAll(): Promise<Moldura[]> {
    return this.moldurasRepository.find({
      order: {
        nome: 'ASC', // order by pra msm ordem do sql e ordena por nome
      },
    });
  }
}
