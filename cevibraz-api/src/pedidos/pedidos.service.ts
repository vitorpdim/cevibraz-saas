import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { Pedido } from './pedido.entity';
import { Quadro } from './quadro.entity';
import { QuadroMoldura } from './quadro-moldura.entity';
import { QuadroMaterial } from './quadro-material.entity';
import { Moldura } from '../molduras/moldura.entity';
import { Material } from '../materiais/material.entity';
import { ClientesService } from '../clientes/clientes.service';
import { CalculoService } from '../calculo/calculo.service';
import { CalcularQuadroDto } from '../calculo/calculo.dto';
import {
  CreatePedidoDto,
  UpdatePedidoDto,
  UpdateStatusDto,
  QuadroDto,
  QuadroParaPdf,
} from './pedido.dto';
import { PdfService } from '../pdf/pdf.service';
import { EstoqueService } from '../estoque/services/estoque.service';

interface MaxPedidoResult {
  max_num: number | null;
}

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name);

  constructor(
    private readonly entityManager: EntityManager,
    @InjectRepository(Pedido) private pedidosRepository: Repository<Pedido>,
    @InjectRepository(Moldura) private moldurasRepository: Repository<Moldura>,
    @InjectRepository(Material)
    private materiaisRepository: Repository<Material>,
    @InjectRepository(Quadro) private quadrosRepository: Repository<Quadro>,
    @InjectRepository(QuadroMoldura)
    private qmMolduraRepository: Repository<QuadroMoldura>,
    @InjectRepository(QuadroMaterial)
    private qmMaterialRepository: Repository<QuadroMaterial>,
    private clientesService: ClientesService,
    private calculoService: CalculoService,
    private pdfService: PdfService,
    private estoqueService: EstoqueService,
  ) {}

  async findEntityById(id: number): Promise<Pedido | null> {
    return this.pedidosRepository.findOne({
      where: { id },
      relations: ['cliente'],
    });
  }

  async create(dto: CreatePedidoDto) {
    const {
      nomeCliente,
      telefoneCliente,
      nomeAtendente,
      observacoes,
      quadros,
      valor_final_calculado,
      valor_final_manual,
      ocultar_valores_unitarios,
    } = dto;

    const valorFinalParaSalvar = valor_final_manual ?? valor_final_calculado;
    return this.entityManager.transaction(async (manager) => {
      const cliente = await this.clientesService.findOrCreate(
        nomeCliente,
        telefoneCliente,
      );

      const [lastPedido] = await manager.query<MaxPedidoResult[]>(
        "SELECT MAX(CAST(NULLIF(regexp_replace(numero_pedido, '[^0-9]', '', 'g'), '') AS INTEGER)) as max_num FROM pedidos",
      );
      const proximoNumero = (lastPedido?.max_num || 0) + 1;
      const numeroPedidoFormatado = String(proximoNumero).padStart(4, '0');

      const novoPedido = manager.create(Pedido, {
        numero_pedido: numeroPedidoFormatado,
        cliente: cliente,
        atendente: nomeAtendente,
        observacoes: observacoes,
        condicao_pagamento: dto.condicao_pagamento,
        valor_final: valorFinalParaSalvar,
        status: 'A Fazer',
        ocultar_valores_unitarios: ocultar_valores_unitarios ?? false,
      });
      await manager.save(novoPedido);

      const quadrosParaPdf = await this.salvarQuadrosParaPedido(
        manager,
        novoPedido,
        quadros,
      );

      this.logger.log(
        `Gerando PDFs para o pedido ${novoPedido.numero_pedido}...`,
      );
      const [pedidoUrl, osUrl] = await Promise.all([
        this.pdfService.gerarPdfPedido(
          novoPedido,
          quadrosParaPdf,
          valorFinalParaSalvar,
        ),
        this.pdfService.gerarPdfOs(novoPedido, quadrosParaPdf),
      ]);

      novoPedido.pdf_pedido_url = pedidoUrl;
      novoPedido.pdf_os_url = osUrl;
      await manager.save(novoPedido);

      return {
        message: 'Pedido criado com sucesso!',
        pedidoId: novoPedido.id,
        numeroPedido: novoPedido.numero_pedido,
        valorTotal: novoPedido.valor_final,
        pdf_pedido_url: pedidoUrl,
        pdf_os_url: osUrl,
      };
    });
  }

  async update(id: number, dto: UpdatePedidoDto) {
    const {
      observacoes,
      quadros,
      valor_final_calculado,
      valor_final_manual,
      ocultar_valores_unitarios,
    } = dto;

    const valorFinalParaSalvar = valor_final_manual ?? valor_final_calculado;

    return this.entityManager.transaction(async (manager) => {
      const pedido = await manager.findOne(Pedido, {
        where: { id },
        relations: ['cliente', 'quadros'],
      });
      if (!pedido) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      // 1-- presta atencao que aqui é importante: nois atualiza os campos basicos do pedido
      pedido.observacoes = observacoes;
      pedido.condicao_pagamento = dto.condicao_pagamento;
      pedido.ocultar_valores_unitarios = ocultar_valores_unitarios ?? false;
      pedido.valor_final = valorFinalParaSalvar;

      // 2 -- limpa tudao (é uma segurança contra duplicação)
      await manager.delete(Quadro, { pedido: { id } });

      // 3 -- recriacao limpinha
      const quadrosParaPdf = await this.salvarQuadrosParaPedido(
        manager,
        pedido,
        quadros,
      );

      this.logger.log(
        `Regerando PDFs para o pedido ${pedido.numero_pedido}...`,
      );
      const [pedidoUrl, osUrl] = await Promise.all([
        this.pdfService.gerarPdfPedido(
          pedido,
          quadrosParaPdf,
          valorFinalParaSalvar,
        ),
        this.pdfService.gerarPdfOs(pedido, quadrosParaPdf),
      ]);

      pedido.pdf_pedido_url = pedidoUrl;
      pedido.pdf_os_url = osUrl;
      await manager.save(pedido);

      return {
        message: `Pedido ${pedido.numero_pedido} atualizado com sucesso!`,
      };
    });
  }

  async findAll() {
    return this.pedidosRepository.find({
      select: {
        id: true,
        numero_pedido: true,
        atendente: true,
        data_criacao: true,
        status: true,
        valor_final: true,
        pdf_pedido_url: true,
        pdf_os_url: true,
        cliente: {
          nome: true,
        },
      },
      relations: {
        cliente: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findOneForEdit(id: number) {
    const pedido = await this.pedidosRepository.findOne({
      where: { id },
      relations: [
        'cliente',
        'quadros',
        'quadros.quadroMolduras',
        'quadros.quadroMolduras.moldura',
        'quadros.quadroMateriais',
        'quadros.quadroMateriais.material',
      ],
      order: {
        quadros: { id: 'ASC' },
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    const quadrosParaAppJs = await Promise.all(
      pedido.quadros.map(async (q) => {
        const paspatur = q.quadroMateriais.find(
          (qm) => qm.material?.nome.toLowerCase() === 'paspatur',
        );

        const acrescimoNum = Number(q.acrescimo_cm ?? 0);
        const quantidadeNum = Number(q.quantidade ?? 1);

        const dtoSimulado: CalcularQuadroDto = {
          altura: Number(q.altura_cm),
          largura: Number(q.largura_cm),
          medidaFornecidaCliente: Boolean(q.medida_fornecida_cliente),
          limpezaSelecionada: Boolean(q.limpeza_flag),
          moldurasSelecionadas: q.quadroMolduras.map(
            (qm) => qm.moldura?.nome || 'Moldura Removida',
          ),
          materiaisSelecionados: q.quadroMateriais.map(
            (qm) => qm.material?.nome || 'Material Removido',
          ),
          espessuraPaspatur: paspatur?.espessura_paspatur_cm
            ? Number(paspatur.espessura_paspatur_cm)
            : 0,
          acrescimo_cm: acrescimoNum,
        };

        const calculo =
          await this.calculoService.calcularPrecoQuadro(dtoSimulado);

        return {
          id: q.id,
          ...dtoSimulado,
          espessuraPaspatur: dtoSimulado.espessuraPaspatur,
          valorCalculado: calculo.total,
          detalhesCalculo: calculo.detalhes,
          acrescimo_cm: acrescimoNum,
          quantidade: quantidadeNum,
        };
      }),
    );

    return {
      id: pedido.id,
      numero_pedido: pedido.numero_pedido,
      atendente: pedido.atendente,
      clienteNome: pedido.cliente?.nome || 'Cliente Removido',
      clienteTelefone: pedido.cliente?.telefone || '',
      observacoes: pedido.observacoes,
      condicao_pagamento: pedido.condicao_pagamento,
      quadros: quadrosParaAppJs,
      valor_final_salvo: Number(pedido.valor_final),
      ocultar_valores_unitarios: pedido.ocultar_valores_unitarios ?? false,
    };
  }

  async remove(id: number) {
    const result = await this.entityManager.delete(Pedido, id);
    if (result.affected === 0) {
      throw new NotFoundException('Pedido não encontrado.');
    }
    return { message: `Pedido ${id} excluído com sucesso.` };
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    const pedido = await this.pedidosRepository.findOne({
      where: { id },
      relations: [
        'quadros',
        'quadros.quadroMolduras',
        'quadros.quadroMolduras.moldura',
        'quadros.quadroMateriais',
        'quadros.quadroMateriais.material',
      ],
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    if (dto.status === 'Já Feito' && pedido.status !== 'Já Feito') {
      await this.realizarBaixaDeEstoque(pedido);
    }

    const result = await this.entityManager.update(Pedido, id, {
      status: dto.status,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    return {
      message: `Status do pedido ${id} atualizado para "${dto.status}" com sucesso.`,
    };
  }

  private async salvarQuadrosParaPedido(
    manager: EntityManager,
    pedido: Pedido,
    quadrosDto: QuadroDto[],
  ): Promise<QuadroParaPdf[]> {
    const todosNomesMolduras = quadrosDto.flatMap(
      (q) => q.moldurasSelecionadas || [],
    );
    const todosNomesMateriais = quadrosDto.flatMap(
      (q) => q.materiaisSelecionados || [],
    );

    const [moldurasDB, materiaisDB] = await Promise.all([
      this.moldurasRepository.findBy(
        [
          { nome: todosNomesMolduras.length > 0 ? undefined : { nome: '' } },
          {
            codigo: todosNomesMolduras.length > 0 ? undefined : { codigo: '' },
          },
        ].filter(Boolean) as any,
      ),
      this.materiaisRepository.findBy(
        todosNomesMateriais.length > 0 ? { nome: In(todosNomesMateriais) } : {},
      ),
    ]);

    const moldurasMap = new Map<string, Moldura>();
    moldurasDB.forEach((m) => {
      moldurasMap.set(m.nome.toLowerCase(), m);
      moldurasMap.set(m.codigo.toLowerCase(), m);
    });

    const materiaisMap = new Map<string, Material>();
    materiaisDB.forEach((m) => {
      materiaisMap.set(m.nome.toLowerCase(), m);
    });

    const quadrosParaPdf: QuadroParaPdf[] = [];

    for (const quadroDto of quadrosDto) {
      const acrescimoValue = Number(quadroDto.acrescimo_cm ?? 0);
      const quantidadeValue = Number(quadroDto.quantidade ?? 1);

      const novoQuadro = manager.create(Quadro, {
        pedido: pedido,
        altura_cm: quadroDto.altura,
        largura_cm: quadroDto.largura,
        acrescimo_cm: acrescimoValue,
        medida_fornecida_cliente: quadroDto.medidaFornecidaCliente,
        limpeza_flag: quadroDto.limpezaSelecionada,
        quantidade: quantidadeValue,
      });
      await manager.save(novoQuadro);

      const qmPromises: Promise<any>[] = [];
      const moldurasSalvas: { nome: string; codigo: string }[] = [];
      const materiaisSalvos: {
        nome: string;
        espessura_paspatur_cm: number | undefined;
      }[] = [];

      for (const nomeMoldura of quadroDto.moldurasSelecionadas || []) {
        const moldura = moldurasMap.get(nomeMoldura.toLowerCase());
        if (moldura) {
          moldurasSalvas.push({ nome: moldura.nome, codigo: moldura.codigo });
          const qm = manager.create(QuadroMoldura, {
            quadro: novoQuadro,
            moldura: moldura,
          });
          qmPromises.push(manager.save(qm));
        }
      }

      for (const nomeMaterial of quadroDto.materiaisSelecionados || []) {
        const material = materiaisMap.get(nomeMaterial.toLowerCase());
        if (material) {
          let esp: number | undefined = undefined;
          if (nomeMaterial.toLowerCase() === 'paspatur') {
            const raw = quadroDto.espessuraPaspatur;
            if (
              raw !== null &&
              raw !== undefined &&
              (typeof raw !== 'string' || raw !== '')
            ) {
              const parsed = Number(raw);
              if (!Number.isNaN(parsed)) {
                esp = parsed;
              }
            }
          }

          materiaisSalvos.push({
            nome: material.nome,
            espessura_paspatur_cm: esp,
          });

          const qm = manager.create(QuadroMaterial, {
            quadro: novoQuadro,
            material: material,
            espessura_paspatur_cm: esp,
          });
          qmPromises.push(manager.save(qm));
        }
      }

      await Promise.all(qmPromises);

      const detalhesCalculo = await this.calculoService.calcularPrecoQuadro({
        altura: quadroDto.altura,
        largura: quadroDto.largura,
        medidaFornecidaCliente: quadroDto.medidaFornecidaCliente,
        limpezaSelecionada: quadroDto.limpezaSelecionada,
        moldurasSelecionadas: quadroDto.moldurasSelecionadas || [],
        materiaisSelecionados: quadroDto.materiaisSelecionados || [],
        espessuraPaspatur: quadroDto.espessuraPaspatur,
        acrescimo_cm: acrescimoValue,
      });

      novoQuadro.valor_calculado = detalhesCalculo.total;
      novoQuadro.detalhes_calculo = detalhesCalculo.detalhes;
      await manager.save(novoQuadro);

      quadrosParaPdf.push({
        ...quadroDto,
        id: novoQuadro.id,
        altura_cm: novoQuadro.altura_cm,
        largura_cm: novoQuadro.largura_cm,
        acrescimo_cm: acrescimoValue,
        molduras: moldurasSalvas,
        materiais: materiaisSalvos,
        detalhesCalculo: detalhesCalculo,
        quantidade: quantidadeValue,
      });
    }

    return quadrosParaPdf;
  }

  private async realizarBaixaDeEstoque(pedido: Pedido) {
    this.logger.log(
      `Iniciando baixa de estoque para pedido #${pedido.numero_pedido}`,
    );

    for (const quadro of pedido.quadros) {
      const quantidadeQuadros = quadro.quantidade || 1;

      // 1. baixa molduras
      const perimetroMetros =
        ((Number(quadro.altura_cm) + Number(quadro.largura_cm)) * 2) / 100;
      const consumoUnitario = perimetroMetros * 1.1;

      for (const qm of quadro.quadroMolduras) {
        if (qm.moldura) {
          try {
            await this.estoqueService.registrarBaixa({
              tipo_item: 'moldura',
              item_id: qm.moldura.id,
              quantidade: parseFloat(
                (consumoUnitario * quantidadeQuadros).toFixed(2),
              ),
              pedido_id: pedido.id,
              descricao: `Baixa Pedido ${pedido.numero_pedido} (Qtd: ${quantidadeQuadros})`,
            });
          } catch (e) {
            this.logger.error(`Erro baixa moldura: ${e}`);
          }
        }
      }

      // 2. baixa materiais
      const areaM2 =
        (Number(quadro.altura_cm) * Number(quadro.largura_cm)) / 10000;

      for (const qmat of quadro.quadroMateriais) {
        if (qmat.material) {
          try {
            let consumoMat = areaM2;
            if (qmat.material.unidade === 'un') {
              consumoMat = 1;
            }

            await this.estoqueService.registrarBaixa({
              tipo_item: 'material',
              item_id: qmat.material.id,
              quantidade: parseFloat(
                (consumoMat * quantidadeQuadros).toFixed(2),
              ),
              pedido_id: pedido.id,
              descricao: `Baixa pedido ${pedido.numero_pedido}`,
            });
          } catch (e) {
            this.logger.error(`Erro baixa material: ${e}`);
          }
        }
      }
    }
  }
}
