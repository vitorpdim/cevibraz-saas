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
    } = dto;

    return this.entityManager.transaction(async (manager) => {
      const cliente = await this.clientesService.findOrCreate(
        nomeCliente,
        telefoneCliente,
      );

      const [lastPedido] = await manager.query<MaxPedidoResult[]>(
        'SELECT MAX(CAST(numero_pedido AS INTEGER)) as max_num FROM pedidos',
      );
      const proximoNumero = (lastPedido?.max_num || 0) + 1;
      const numeroPedidoFormatado = String(proximoNumero).padStart(4, '0');

      const novoPedido = manager.create(Pedido, {
        numero_pedido: numeroPedidoFormatado,
        cliente: cliente,
        atendente: nomeAtendente,
        observacoes: observacoes,
        valor_final: valor_final_calculado,
        status: 'A Fazer',
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
          valor_final_calculado,
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
    const { observacoes, quadros, valor_final_calculado } = dto;

    return this.entityManager.transaction(async (manager) => {
      const pedido = await manager.findOne(Pedido, {
        where: { id },
        relations: ['cliente'],
      });
      if (!pedido) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      await manager.delete(Quadro, { pedido: { id: id } });
      const quadrosParaPdf = await this.salvarQuadrosParaPedido(
        manager,
        pedido,
        quadros,
      );

      pedido.observacoes = observacoes;
      pedido.valor_final = valor_final_calculado;

      this.logger.log(
        `Regerando PDFs para o pedido ${pedido.numero_pedido}...`,
      );
      const [pedidoUrl, osUrl] = await Promise.all([
        this.pdfService.gerarPdfPedido(
          pedido,
          quadrosParaPdf,
          valor_final_calculado,
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

        const dtoSimulado: CalcularQuadroDto = {
          altura: q.altura_cm,
          largura: q.largura_cm,
          medidaFornecidaCliente: q.medida_fornecida_cliente,
          limpezaSelecionada: q.limpeza_flag,
          moldurasSelecionadas: q.quadroMolduras.map(
            (qm) => qm.moldura?.nome || 'Moldura Removida',
          ),
          materiaisSelecionados: q.quadroMateriais.map(
            (qm) => qm.material?.nome || 'Material Removido',
          ),
          espessuraPaspatur: paspatur?.espessura_paspatur_cm || 0,
        };

        const calculo =
          await this.calculoService.calcularPrecoQuadro(dtoSimulado);

        return {
          ...dtoSimulado,
          espessuraPaspatur: dtoSimulado.espessuraPaspatur,
          valorCalculado: calculo.total,
        };
      }),
    );

    return {
      atendente: pedido.atendente,
      clienteNome: pedido.cliente?.nome || 'Cliente Removido',
      clienteTelefone: pedido.cliente?.telefone || '',
      observacoes: pedido.observacoes,
      quadros: quadrosParaAppJs,
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
      (q) => q.moldurasSelecionadas,
    );
    const todosNomesMateriais = quadrosDto.flatMap(
      (q) => q.materiaisSelecionados,
    );

    const [moldurasDB, materiaisDB] = await Promise.all([
      this.moldurasRepository.findBy([
        { nome: In(todosNomesMolduras) },
        { codigo: In(todosNomesMolduras) },
      ]),
      this.materiaisRepository.findBy({ nome: In(todosNomesMateriais) }),
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
      const novoQuadro = manager.create(Quadro, {
        pedido: pedido,
        altura_cm: quadroDto.altura,
        largura_cm: quadroDto.largura,
        medida_fornecida_cliente: quadroDto.medidaFornecidaCliente,
        limpeza_flag: quadroDto.limpezaSelecionada,
      });
      await manager.save(novoQuadro);

      const qmPromises: Promise<any>[] = [];
      const moldurasSalvas: { nome: string; codigo: string }[] = [];
      // espessura TEM q ser number | undefined
      const materiaisSalvos: {
        nome: string;
        espessura_paspatur_cm: number | undefined;
      }[] = [];

      for (const nomeMoldura of quadroDto.moldurasSelecionadas) {
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

      for (const nomeMaterial of quadroDto.materiaisSelecionados) {
        const material = materiaisMap.get(nomeMaterial.toLowerCase());
        if (material) {
          const esp =
            nomeMaterial.toLowerCase() === 'paspatur'
              ? quadroDto.espessuraPaspatur
              : undefined;

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
        ...quadroDto,
      });

      quadrosParaPdf.push({
        ...quadroDto,
        id: novoQuadro.id,
        altura_cm: novoQuadro.altura_cm,
        largura_cm: novoQuadro.largura_cm,
        molduras: moldurasSalvas,
        materiais: materiaisSalvos,
        detalhesCalculo: detalhesCalculo,
      });
    }

    return quadrosParaPdf;
  }
}
