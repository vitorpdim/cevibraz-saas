import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clientesRepository: Repository<Cliente>,
  ) {}

  async findOrCreate(nome: string, telefone: string): Promise<Cliente> {
    const nomeNormalizado = nome.trim();

    const telefoneNormalizado = telefone?.trim() || undefined;

    let cliente = await this.clientesRepository.findOneBy({
      nome: nomeNormalizado,
    });

    if (cliente) {
      if (
        telefoneNormalizado !== undefined &&
        cliente.telefone !== telefoneNormalizado
      ) {
        cliente.telefone = telefoneNormalizado;
        return this.clientesRepository.save(cliente);
      }
    } else {
      cliente = this.clientesRepository.create({
        nome: nomeNormalizado,
        telefone: telefoneNormalizado,
      });
      return this.clientesRepository.save(cliente);
    }
    return cliente;
  }
}
