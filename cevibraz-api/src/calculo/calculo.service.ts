import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Moldura } from '../molduras/moldura.entity';
import { Material } from '../materiais/material.entity';
import { In, Repository } from 'typeorm';
import { CalcularQuadroDto } from './calculo.dto';

@Injectable()
export class CalculoService {
  constructor(
    @InjectRepository(Moldura)
    private moldurasRepository: Repository<Moldura>,
    @InjectRepository(Material)
    private materiaisRepository: Repository<Material>,
  ) {}

  private arredondarParaCinco(medida: number): number {
    return Math.ceil(medida / 5) * 5;
  }

  private cmParaMetro(valorCm: number): number {
    return valorCm / 100;
  }

  async calcularPrecoQuadro(
    dto: CalcularQuadroDto,
  ): Promise<{ total: number; detalhes: string[] }> {
    let valorTotal = 0;
    const detalhes: string[] = [];

    const {
      altura,
      largura,
      moldurasSelecionadas,
      materiaisSelecionados = [],
      quantidadeMateriais = {},
      espessuraPaspatur,
      limpezaSelecionada,
      acrescimo_cm = 0,
    } = dto;

    // 1 - lista de nomes de materiais p buscar
    const nomesMateriais = [...materiaisSelecionados];
    if (limpezaSelecionada && !nomesMateriais.includes('Limpeza')) {
      nomesMateriais.push('Limpeza');
    }

    // 2 - busca todos os materiais e molduras
    const [materiaisDoDB, moldurasDoDB] = await Promise.all([
      this.materiaisRepository.findBy({ nome: In(nomesMateriais) }),
      this.moldurasRepository.findBy([
        { nome: In(moldurasSelecionadas) },
        { codigo: In(moldurasSelecionadas) },
      ]),
    ]);

    // 3 - mapeia os resultados na memória
    const materiaisMap = new Map<string, Material>();
    materiaisDoDB.forEach((m) => {
      materiaisMap.set(m.nome.toLowerCase(), m);
    });
    const moldurasMap = new Map<string, Moldura>();
    moldurasDoDB.forEach((m) => {
      moldurasMap.set(m.nome.toLowerCase(), m);
      moldurasMap.set(m.codigo.toLowerCase(), m);
    });

    // 1. aplicamos acrescimo às medidas antes de arredondar (folga)
    const alturaComAcre = altura + (acrescimo_cm || 0);
    const larguraComAcre = largura + (acrescimo_cm || 0);

    const alturaArredondadaQuadro = this.arredondarParaCinco(alturaComAcre);
    const larguraArredondadaQuadro = this.arredondarParaCinco(larguraComAcre);

    const temPaspatur =
      materiaisSelecionados.includes('Paspatur') &&
      (espessuraPaspatur || 0) > 0;
    const espessuraRealPaspatur = Math.max(espessuraPaspatur || 0, 2);

    // 2. calcula dimensões
    const alturaInterna_m = this.cmParaMetro(alturaArredondadaQuadro);
    const larguraInterna_m = this.cmParaMetro(larguraArredondadaQuadro);
    const perimetroInterno_m = (alturaInterna_m + larguraInterna_m) * 2;

    const alturaExterna_cm_base = temPaspatur
      ? alturaArredondadaQuadro + 2 * espessuraRealPaspatur
      : alturaArredondadaQuadro;
    const larguraExterna_cm_base = temPaspatur
      ? larguraArredondadaQuadro + 2 * espessuraRealPaspatur
      : larguraArredondadaQuadro;

    const alturaExterna_m = this.cmParaMetro(alturaExterna_cm_base);
    const larguraExterna_m = this.cmParaMetro(larguraExterna_cm_base);
    const perimetroExterna_m = (alturaExterna_m + larguraExterna_m) * 2;
    const areaExterna_m2 = alturaExterna_m * larguraExterna_m;

    if ((acrescimo_cm || 0) > 0) {
      detalhes.push(`Acréscimo aplicado: +${acrescimo_cm}cm`);
    }

    // 3. calcular custos de materiais (usa areaExterna_m2 / perimetroInterno_m etc)
    for (const materialNome of materiaisSelecionados) {
      const material = materiaisMap.get(materialNome.toLowerCase());
      if (material) {
        const materialPrice = parseFloat(material.valor_base.toString());
        const quantidadeDoMaterial = quantidadeMateriais[materialNome] || 1;

        let valorMaterial = 0;

        if (material.tipo_calculo === 'metro_quadrado') {
          valorMaterial = areaExterna_m2 * materialPrice * quantidadeDoMaterial;
        } else if (material.tipo_calculo === 'metro_linear') {
          valorMaterial =
            perimetroInterno_m * materialPrice * quantidadeDoMaterial;
        }

        if (valorMaterial > 0) {
          valorTotal += valorMaterial;
          const textoQtd =
            quantidadeDoMaterial > 1 ? ` (x${quantidadeDoMaterial})` : '';
          detalhes.push(
            `${material.nome}${textoQtd}: R$ ${valorMaterial.toFixed(2)}`,
          );
        }
      }
    }

    // 4. calcular custos de molduras
    if (moldurasSelecionadas && moldurasSelecionadas.length > 0) {
      for (const molduraNome of moldurasSelecionadas) {
        const moldura = moldurasMap.get(molduraNome.toLowerCase());
        if (moldura) {
          const molduraPrice = parseFloat(
            moldura.valor_metro_linear.toString(),
          );
          const valorMoldura = perimetroExterna_m * molduraPrice;
          valorTotal += valorMoldura;
          detalhes.push(
            `Moldura (${moldura.nome}): R$ ${valorMoldura.toFixed(2)}`,
          );
        }
      }
    }

    // 5. calcular limpeza pegano do banco
    if (limpezaSelecionada) {
      const materialLimpeza = materiaisMap.get('limpeza');
      if (materialLimpeza) {
        const valorLimpeza =
          areaExterna_m2 * parseFloat(materialLimpeza.valor_base.toString());
        valorTotal += valorLimpeza;
        detalhes.push(`Limpeza: R$ ${valorLimpeza.toFixed(2)}`);
      }
    }

    return { total: valorTotal, detalhes };
  }
}

console.log('');
