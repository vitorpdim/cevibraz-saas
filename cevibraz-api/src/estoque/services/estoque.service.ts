// =======================================
// imports externos
// =======================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, MoreThan } from 'typeorm';

// =======================================
// Imports internos
// =======================================

import { MovimentacaoEstoque } from '../entities/movimentacao-estoque.entity';
import { Moldura } from '../../molduras/moldura.entity';
import { Material } from '../../materiais/material.entity';
import {
  EntradaManualDto,
  AjusteEstoqueDto,
  BaixaEstoqueDto,
  VincularItemXmlDto,
  DashboardEstoqueDto,
  ItemEstoqueDto,
  MovimentacaoDto,
} from '../dto/estoque.dto';

// =======================================
// Tipos
// =======================================

type TipoItem = 'moldura' | 'material';
type StatusEstoque = 'ok' | 'baixo' | 'critico';

interface MovimentacaoBase {
  saldoAnterior: number;
  saldoNovo: number;
}

// =======================================
// Service
// =======================================

@Injectable()
export class EstoqueService {
  private readonly logger = new Logger(EstoqueService.name);

  constructor(
    private readonly entityManager: EntityManager,
    @InjectRepository(MovimentacaoEstoque)
    private readonly movimentacoesRepository: Repository<MovimentacaoEstoque>,
    @InjectRepository(Moldura)
    private readonly moldurasRepository: Repository<Moldura>,
    @InjectRepository(Material)
    private readonly materiaisRepository: Repository<Material>,
  ) {}

  // =======================================
  // Métodos Públicos — Mutação de Estoque
  // =======================================

  async registrarEntradaManual(dto: EntradaManualDto): Promise<unknown> {
    return this.entityManager.transaction(async (manager) => {
      const {
        tipo_item,
        item_id,
        quantidade,
        descricao,
        referencia_externa,
        usuario,
      } = dto;

      const item = await this.buscarItem(manager, tipo_item, item_id);
      const { saldoAnterior, saldoNovo } = this.calcularSaldos(
        item,
        quantidade,
        'entrada',
      );

      const movimentacao = manager.create(MovimentacaoEstoque, {
        tipo: 'ENTRADA',
        origem: referencia_externa ? 'XML' : 'MANUAL',
        quantidade,
        saldo_anterior: saldoAnterior,
        saldo_novo: saldoNovo,
        descricao: descricao || `Entrada manual de ${tipo_item}`,
        referencia_externa,
        usuario,
        [tipo_item]: item,
      });

      await manager.save(movimentacao);
      item.estoque_atual = saldoNovo;
      await manager.save(item);

      this.logger.log(
        `Entrada registrada: ${tipo_item} #${item_id}, +${quantidade} (${saldoAnterior} → ${saldoNovo})`,
      );

      return {
        message: 'Entrada registrada com sucesso.',
        movimentacao_id: movimentacao.id,
        saldo_novo: saldoNovo,
      };
    });
  }

  async registrarBaixa(dto: BaixaEstoqueDto): Promise<unknown> {
    return this.entityManager.transaction(async (manager) => {
      const { tipo_item, item_id, quantidade, pedido_id, descricao } = dto;

      const item = await this.buscarItem(manager, tipo_item, item_id);
      const saldoAnterior = Number(item.estoque_atual || 0);

      if (saldoAnterior < quantidade) {
        throw new BadRequestException(
          `Estoque insuficiente. Disponível: ${saldoAnterior}, solicitado: ${quantidade}.`,
        );
      }

      const saldoNovo = saldoAnterior - quantidade;

      const movimentacao = manager.create(MovimentacaoEstoque, {
        tipo: 'SAIDA',
        origem: pedido_id ? 'PEDIDO' : 'MANUAL',
        quantidade,
        saldo_anterior: saldoAnterior,
        saldo_novo: saldoNovo,
        descricao:
          descricao ||
          (pedido_id
            ? `Baixa automática - Pedido #${pedido_id}`
            : 'Baixa manual'),
        pedido_id,
        [tipo_item]: item,
      });

      await manager.save(movimentacao);
      item.estoque_atual = saldoNovo;
      await manager.save(item);

      this.logger.log(
        `Baixa registrada: ${tipo_item} #${item_id}, -${quantidade} (${saldoAnterior} → ${saldoNovo})`,
      );

      return {
        message: 'Baixa registrada com sucesso.',
        movimentacao_id: movimentacao.id,
        saldo_novo: saldoNovo,
      };
    });
  }

  async ajustarEstoque(dto: AjusteEstoqueDto): Promise<unknown> {
    return this.entityManager.transaction(async (manager) => {
      const { tipo_item, item_id, novo_saldo, motivo, usuario } = dto;

      const item = await this.buscarItem(manager, tipo_item, item_id);
      const saldoAnterior = Number(item.estoque_atual || 0);
      const diferenca = novo_saldo - saldoAnterior;

      const movimentacao = manager.create(MovimentacaoEstoque, {
        tipo: 'AJUSTE',
        origem: 'AJUSTE_INVENTARIO',
        quantidade: Math.abs(diferenca),
        saldo_anterior: saldoAnterior,
        saldo_novo: novo_saldo,
        descricao: `Ajuste de inventário: ${motivo}`,
        usuario,
        [tipo_item]: item,
      });

      await manager.save(movimentacao);
      item.estoque_atual = novo_saldo;
      await manager.save(item);

      this.logger.log(
        `Ajuste registrado: ${tipo_item} #${item_id}, ${diferenca >= 0 ? '+' : ''}${diferenca} (${saldoAnterior} → ${novo_saldo})`,
      );

      return {
        message: 'Ajuste registrado com sucesso.',
        movimentacao_id: movimentacao.id,
        saldo_anterior: saldoAnterior,
        saldo_novo: novo_saldo,
        diferenca,
      };
    });
  }

  async vincularItemXml(dto: VincularItemXmlDto): Promise<unknown> {
    const { item_xml, tipo_item, item_id, numero_nfe } = dto;

    const entradaDto: EntradaManualDto = {
      tipo_item,
      item_id,
      quantidade: item_xml.quantidade,
      descricao: `Entrada via NFe ${numero_nfe} - ${item_xml.nome}`,
      referencia_externa: `NFe-${numero_nfe}-${item_xml.codigo}`,
    };

    return this.registrarEntradaManual(entradaDto);
  }

  // =======================================
  // Métodos Públicos — Consulta
  // =======================================

  async getDashboard(): Promise<DashboardEstoqueDto> {
    const [molduras, materiais] = await Promise.all([
      this.moldurasRepository.find(),
      this.materiaisRepository.find(),
    ]);

    const itens = [
      ...molduras.map((m) => ({
        estoque: Number(m.estoque_atual || 0),
        minimo: Number(m.estoque_minimo || 0),
        valor: Number(m.valor_metro_linear || 0),
      })),
      ...materiais.map((m) => ({
        estoque: Number(m.estoque_atual || 0),
        minimo: Number(m.estoque_minimo || 0),
        valor: Number(m.valor_base || 0),
      })),
    ];

    const valorTotal = itens.reduce((sum, i) => sum + i.estoque * i.valor, 0);
    const itensBaixo = itens.filter(
      (i) => i.estoque <= i.minimo && i.estoque > 0,
    ).length;
    const movimentacoesRecentes = await this.movimentacoesRepository.count({
      where: {
        data: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      },
    });

    return {
      valor_total_estoque: parseFloat(valorTotal.toFixed(2)),
      itens_estoque_baixo: itensBaixo,
      total_molduras: molduras.length,
      total_materiais: materiais.length,
      movimentacoes_recentes: movimentacoesRecentes,
    };
  }

  async getItensEstoque(): Promise<ItemEstoqueDto[]> {
    const [molduras, materiais] = await Promise.all([
      this.moldurasRepository.find(),
      this.materiaisRepository.find(),
    ]);

    const itensMolduras: ItemEstoqueDto[] = molduras.map((m) => {
      const estoque = Number(m.estoque_atual || 0);
      const minimo = Number(m.estoque_minimo || 0);
      const valor = Number(m.valor_metro_linear || 0);

      return {
        id: m.id,
        tipo: 'moldura',
        nome: m.nome,
        codigo: m.codigo,
        estoque_atual: estoque,
        estoque_minimo: minimo,
        unidade_medida: 'm',
        valor_unitario: valor,
        valor_total: parseFloat((estoque * valor).toFixed(2)),
        status: this.resolverStatusEstoque(estoque, minimo),
        imagem_url: m.imagem_url,
      };
    });

    const itensMateriais: ItemEstoqueDto[] = materiais.map((m) => {
      const estoque = Number(m.estoque_atual || 0);
      const minimo = Number(m.estoque_minimo || 0);
      const valor = Number(m.valor_base || 0);

      return {
        id: m.id,
        tipo: 'material',
        nome: m.nome,
        estoque_atual: estoque,
        estoque_minimo: minimo,
        unidade_medida: m.unidade || 'un',
        valor_unitario: valor,
        valor_total: parseFloat((estoque * valor).toFixed(2)),
        status: this.resolverStatusEstoque(estoque, minimo),
      };
    });

    return [...itensMolduras, ...itensMateriais].sort(
      this.ordenarPorCriticidade,
    );
  }

  async getMovimentacoes(limite = 100): Promise<MovimentacaoDto[]> {
    const movimentacoes = await this.movimentacoesRepository.find({
      relations: ['moldura', 'material'],
      order: { data: 'DESC' },
      take: limite,
    });

    return movimentacoes.map(this.mapearMovimentacao);
  }

  async getMovimentacoesPorItem(
    tipo: TipoItem,
    itemId: number,
  ): Promise<MovimentacaoDto[]> {
    const where =
      tipo === 'moldura'
        ? { moldura: { id: itemId } }
        : { material: { id: itemId } };

    const movimentacoes = await this.movimentacoesRepository.find({
      where,
      relations: ['moldura', 'material'],
      order: { data: 'DESC' },
      take: 50,
    });

    return movimentacoes.map(this.mapearMovimentacao);
  }

  // =======================================
  // Métodos privados
  // =======================================

  private calcularSaldos(
    item: Moldura | Material,
    quantidade: number,
    operacao: 'entrada',
  ): MovimentacaoBase {
    const saldoAnterior = Number(item.estoque_atual || 0);
    const saldoNovo =
      operacao === 'entrada'
        ? saldoAnterior + quantidade
        : saldoAnterior - quantidade;
    return { saldoAnterior, saldoNovo };
  }

  private resolverStatusEstoque(
    estoque: number,
    minimo: number,
  ): StatusEstoque {
    if (estoque === 0) return 'critico';
    if (estoque <= minimo) return 'baixo';
    return 'ok';
  }

  private readonly ordenarPorCriticidade = (
    a: ItemEstoqueDto,
    b: ItemEstoqueDto,
  ): number => {
    const prioridade: Record<StatusEstoque, number> = {
      critico: 0,
      baixo: 1,
      ok: 2,
    };
    return prioridade[a.status] - prioridade[b.status];
  };

  private readonly mapearMovimentacao = (
    m: MovimentacaoEstoque,
  ): MovimentacaoDto => ({
    id: m.id,
    tipo: m.tipo,
    origem: m.origem,
    quantidade: Number(m.quantidade),
    saldo_anterior: Number(m.saldo_anterior),
    saldo_novo: Number(m.saldo_novo),
    descricao: m.descricao || '',
    data: m.data,
    item_nome: m.moldura?.nome || m.material?.nome || 'Item removido',
    item_tipo: m.moldura ? 'moldura' : 'material',
    usuario: m.usuario || undefined,
    pedido_id: m.pedido_id || undefined,
  });

  private async buscarItem(
    manager: EntityManager,
    tipo: TipoItem,
    id: number,
  ): Promise<Moldura | Material> {
    const target =
      tipo === 'moldura'
        ? this.moldurasRepository.target
        : this.materiaisRepository.target;
    const item = (await manager.findOne(
      target as Parameters<typeof manager.findOne>[0],
      {
        where: { id },
      },
    )) as Moldura | Material | null;

    if (!item) {
      throw new NotFoundException(`${tipo} com ID ${id} não encontrado.`);
    }

    return item;
  }
}
