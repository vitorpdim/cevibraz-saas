import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Moldura } from './moldura.entity';
import { CreateMolduraDto, UpdateMolduraDto } from './moldura.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MoldurasService {
  constructor(
    @InjectRepository(Moldura)
    private moldurasRepository: Repository<Moldura>,
  ) {}

  findAll(): Promise<Moldura[]> {
    return this.moldurasRepository.find({
      order: {
        nome: 'ASC',
      },
    });
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
      throw new NotFoundException(`Moldura com ID ${id} não encontrada`);
    }

    if (file) {
      if (moldura.imagem_url) {
        const oldPath = join(
          process.env.STORAGE_PATH || './storage',
          moldura.imagem_url.replace('/static/', ''),
        );
        try {
          await unlink(oldPath);
        } catch (error) {
          console.error('Erro ao deletar imagem antiga:', error);
        }
      }
      moldura.imagem_url = `/static/molduras/${file.filename}`;
    }

    Object.assign(moldura, updateDto);
    return this.moldurasRepository.save(moldura);
  }

  async remove(id: number): Promise<{ message: string }> {
    const moldura = await this.moldurasRepository.findOne({ where: { id } });

    if (!moldura) {
      throw new NotFoundException(`Moldura com ID ${id} não encontrada`);
    }

    if (moldura.imagem_url) {
      const filePath = join(
        process.env.STORAGE_PATH || './storage',
        moldura.imagem_url.replace('/static/', ''),
      );
      try {
        await unlink(filePath);
      } catch (error) {
        console.error('Erro ao deletar imagem:', error);
      }
    }

    await this.moldurasRepository.remove(moldura);
    return { message: 'Moldura deletada com sucesso' };
  }
}
