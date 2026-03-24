// =======================================
// Imports Externos
// =======================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// =======================================
// Imports Internos
// =======================================
import { Cliente } from './cliente.entity';

// =======================================
// Service
// =======================================
@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clientesRepository: Repository<Cliente>,
  ) {}

  async findOrCreate(nome: string, telefone: string): Promise<Cliente> {
    const nomeNormalizado = nome.trim();
    const telefoneNormalizado = telefone?.trim() || undefined;

    const clienteExistente = await this.clientesRepository.findOneBy({
      nome: nomeNormalizado,
    });

    if (clienteExistente) {
      const deveAtualizarTelefone =
        telefoneNormalizado !== undefined &&
        clienteExistente.telefone !== telefoneNormalizado;

      if (deveAtualizarTelefone) {
        clienteExistente.telefone = telefoneNormalizado;
        return this.clientesRepository.save(clienteExistente);
      }

      return clienteExistente;
    }

    const novoCliente = this.clientesRepository.create({
      nome: nomeNormalizado,
      telefone: telefoneNormalizado,
    });

    return this.clientesRepository.save(novoCliente);
  }
}
