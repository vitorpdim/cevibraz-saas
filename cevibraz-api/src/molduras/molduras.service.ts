// =======================================
// Imports externos
// =======================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';

// =======================================
// Imports internos
// =======================================

import { Moldura } from './moldura.entity';
import { CreateMolduraDto, UpdateMolduraDto } from './moldura.dto';

// =======================================
// Service
// =======================================

@Injectable()
export class MoldurasService {
  private readonly logger = new Logger(MoldurasService.name);
  private readonly storagePath = process.env.STORAGE_PATH || './storage';

  constructor(
    @InjectRepository(Moldura)
    private readonly moldurasRepository: Repository<Moldura>,
  ) {}

  findAll(): Promise<Moldura[]> {
    return this.moldurasRepository.find({ order: { nome: 'ASC' } });
  }

  async create(
    createDto: CreateMolduraDto,
    file?: Express.Multer.File,
  ): Promise<Moldura> {
    const moldura = this.moldurasRepository.create({
      ...createDto,
      imagem_url: file ? `/static/molduras/${file.filename}` : null,
    });

    return this.moldurasRepository.save(moldura);
  }

  async update(
    id: number,
    updateDto: UpdateMolduraDto,
    file?: Express.Multer.File,
  ): Promise<Moldura> {
    const moldura = await this.moldurasRepository.findOne({ where: { id } });

    if (!moldura) {
      throw new NotFoundException(`Moldura com ID ${id} não encontrada.`);
    }

    if (file) {
      await this.removerImagemDisco(moldura.imagem_url);
      moldura.imagem_url = `/static/molduras/${file.filename}`;
    }

    Object.assign(moldura, updateDto);
    return this.moldurasRepository.save(moldura);
  }

  async remove(id: number): Promise<{ message: string }> {
    const moldura = await this.moldurasRepository.findOne({ where: { id } });

    if (!moldura) {
      throw new NotFoundException(`Moldura com ID ${id} não encontrada.`);
    }

    await this.removerImagemDisco(moldura.imagem_url);
    await this.moldurasRepository.remove(moldura);

    return { message: 'Moldura removida com sucesso.' };
  }

  async removeMany(ids: number[]): Promise<{ message: string }> {
    if (!ids || ids.length === 0) {
      return { message: 'Nenhum ID fornecido.' };
    }

    const molduras = await this.moldurasRepository.findBy({ id: In(ids) });

    await Promise.allSettled(
      molduras.map((m) => this.removerImagemDisco(m.imagem_url)),
    );

    await this.moldurasRepository.remove(molduras);

    return {
      message: `${molduras.length} moldura(s) removida(s) com sucesso.`,
    };
  }

  // =======================================
  // Métodos privados
  // =======================================

  private async removerImagemDisco(imagemUrl: string | null): Promise<void> {
    if (!imagemUrl) return;

    const filePath = join(this.storagePath, imagemUrl.replace('/static/', ''));

    try {
      await unlink(filePath);
    } catch {
      this.logger.warn(`Imagem não encontrada para remoção: ${filePath}`);
    }
  }
}
