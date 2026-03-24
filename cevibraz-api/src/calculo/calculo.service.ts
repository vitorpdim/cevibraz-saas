// =======================================
// Imports externos
// =======================================

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

// =======================================
// Imports internos
// =======================================

import { Moldura } from '../molduras/moldura.entity';
import { Material } from '../materiais/material.entity';
import { CalcularQuadroDto } from './calculo.dto';
import {
  calcularDimensoes,
  calcularValorMaterial,
} from '../utils/calculo.helpers';

// =======================================
// Tipos
// =======================================

export interface ResultadoCalculo {
  total: number;
  detalhes: string[];
}

// =======================================
// Service
// =======================================

@Injectable()
export class CalculoService {
  constructor(
    @InjectRepository(Moldura)
    private readonly moldurasRepository: Repository<Moldura>,
    @InjectRepository(Material)
    private readonly materiaisRepository: Repository<Material>,
  ) {}

  async calcularPrecoQuadro(dto: CalcularQuadroDto): Promise<ResultadoCalculo> {
    const {
      altura,
      largura,
      moldurasSelecionadas,
      materiaisSelecionados = [],
      espessuraPaspatur = 0,
      limpezaSelecionada,
      acrescimo_cm = 0,
    } = dto;

    const nomesMateriais = [...materiaisSelecionados];
    if (limpezaSelecionada && !nomesMateriais.includes('Limpeza')) {
      nomesMateriais.push('Limpeza');
    }

    const [materiaisDoDB, moldurasDoDB] = await Promise.all([
      this.materiaisRepository.findBy({ nome: In(nomesMateriais) }),
      this.moldurasRepository.findBy([
        { nome: In(moldurasSelecionadas) },
        { codigo: In(moldurasSelecionadas) },
      ]),
    ]);

    const materiaisMap = new Map<string, Material>(
      materiaisDoDB.map((m) => [m.nome.toLowerCase(), m]),
    );
    const moldurasMap = new Map<string, Moldura>();
    moldurasDoDB.forEach((m) => {
      moldurasMap.set(m.nome.toLowerCase(), m);
      moldurasMap.set(m.codigo.toLowerCase(), m);
    });

    const temPaspatur =
      materiaisSelecionados.includes('Paspatur') && espessuraPaspatur > 0;

    const dimensoes = calcularDimensoes(
      altura,
      largura,
      acrescimo_cm,
      espessuraPaspatur,
      temPaspatur,
    );

    let valorTotal = 0;
    const detalhes: string[] = [];

    if (acrescimo_cm > 0) {
      detalhes.push(`Acréscimo aplicado: +${acrescimo_cm}cm`);
    }

    for (const materialNome of materiaisSelecionados) {
      const material = materiaisMap.get(materialNome.toLowerCase());
      if (!material) continue;

      const valorBase = parseFloat(material.valor_base.toString());
      const valorMaterial = calcularValorMaterial(
        material.tipo_calculo,
        valorBase,
        dimensoes,
      );

      if (valorMaterial > 0) {
        valorTotal += valorMaterial;
        detalhes.push(`${material.nome}: R$ ${valorMaterial.toFixed(2)}`);
      }
    }

    for (const molduraNome of moldurasSelecionadas) {
      const moldura = moldurasMap.get(molduraNome.toLowerCase());
      if (!moldura) continue;

      const valorBase = parseFloat(moldura.valor_metro_linear.toString());
      const valorMoldura = dimensoes.perimetroExterno_m * valorBase;
      valorTotal += valorMoldura;
      detalhes.push(`Moldura (${moldura.nome}): R$ ${valorMoldura.toFixed(2)}`);
    }

    if (limpezaSelecionada) {
      const materialLimpeza = materiaisMap.get('limpeza');
      if (materialLimpeza) {
        const valorLimpeza =
          dimensoes.areaExterna_m2 *
          parseFloat(materialLimpeza.valor_base.toString());
        valorTotal += valorLimpeza;
        detalhes.push(`Limpeza: R$ ${valorLimpeza.toFixed(2)}`);
      }
    }

    return { total: valorTotal, detalhes };
  }
}
