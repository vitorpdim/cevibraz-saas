// =======================================
// Imports externos
// =======================================

import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  NotFoundException,
  InternalServerErrorException,
  Res,
  Query,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

// =======================================
// Imports internos
// =======================================

import { PedidosService } from './pedidos.service';
import {
  CreatePedidoDto,
  UpdatePedidoDto,
  UpdateStatusDto,
  QuadroParaPdf,
  QuadroDtoWithExtras,
} from './pedido.dto';
import { PdfService } from '../pdf/pdf.service';

// =======================================
// Controller
// =======================================

@Controller('api/pedidos')
export class PedidosController {
  private readonly logger = new Logger(PedidosController.name);

  constructor(
    private readonly pedidosService: PedidosService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  async create(@Body() createPedidoDto: CreatePedidoDto) {
    try {
      return await this.pedidosService.create(createPedidoDto);
    } catch (error) {
      this.logger.error('Falha ao criar pedido.', error);
      throw new InternalServerErrorException(this.extrairMensagemErro(error));
    }
  }

  @Get()
  async findAll() {
    try {
      const pedidos = await this.pedidosService.findAll();
      return pedidos.map((p) => ({
        ...p,
        cliente_nome: p.cliente?.nome || 'N/A',
        pdf_filename: p.pdf_pedido_url ? `pedido_${p.numero_pedido}.pdf` : null,
        pdf_os_filename: p.pdf_os_url ? `os_${p.numero_pedido}.pdf` : null,
      }));
    } catch (error) {
      this.logger.error('Falha ao listar pedidos.', error);
      throw new InternalServerErrorException(this.extrairMensagemErro(error));
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.pedidosService.findOneForEdit(+id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Falha ao buscar pedido ${id}.`, error);
      throw new InternalServerErrorException(this.extrairMensagemErro(error));
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePedidoDto: UpdatePedidoDto,
  ) {
    try {
      return await this.pedidosService.update(+id, updatePedidoDto);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Falha ao atualizar pedido ${id}.`, error);
      throw new InternalServerErrorException(this.extrairMensagemErro(error));
    }
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    try {
      return await this.pedidosService.updateStatus(+id, updateStatusDto);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Falha ao atualizar status do pedido ${id}.`, error);
      throw new InternalServerErrorException(this.extrairMensagemErro(error));
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.pedidosService.remove(+id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Falha ao remover pedido ${id}.`, error);
      throw new InternalServerErrorException(this.extrairMensagemErro(error));
    }
  }

  @Get(':id/pdf')
  async getPdfPedido(
    @Param('id') id: string,
    @Query('valor_editado') valor_editado: string,
    @Res() res: Response,
  ) {
    try {
      const [pedidoFormatado, pedidoEntity] = await Promise.all([
        this.pedidosService.findOneForEdit(+id),
        this.pedidosService.findEntityById(+id),
      ]);

      if (!pedidoEntity) {
        throw new NotFoundException(`Pedido ${id} não encontrado.`);
      }

      const valorFinal = valor_editado
        ? parseFloat(valor_editado)
        : pedidoEntity.valor_final;

      const quadrosParaPdf = this.mapQuadrosParaPdf(
        pedidoFormatado.quadros as QuadroDtoWithExtras[],
      );

      const pdfBuffer = await this.pdfService.gerarPdfPedidoBuffer(
        pedidoEntity,
        quadrosParaPdf,
        valorFinal,
      );

      res.json({
        success: true,
        pdfData: pdfBuffer.toString('base64'),
        filename: `pedido_${pedidoEntity.numero_pedido}.pdf`,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Falha ao gerar PDF do pedido ${id}.`,
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        error instanceof Error ? error.stack : String(error),
      );
      res.status(500).json({
        message: `Falha ao gerar PDF do pedido: ${this.extrairMensagemErro(error)}`,
      });
    }
  }

  @Get(':id/os/pdf')
  async getPdfOs(@Param('id') id: string, @Res() res: Response) {
    try {
      const [pedidoFormatado, pedidoEntity] = await Promise.all([
        this.pedidosService.findOneForEdit(+id),
        this.pedidosService.findEntityById(+id),
      ]);

      if (!pedidoEntity) {
        throw new NotFoundException(`Pedido ${id} não encontrado.`);
      }

      const quadrosParaPdf = this.mapQuadrosParaPdf(
        pedidoFormatado.quadros as QuadroDtoWithExtras[],
      );

      const pdfBuffer = await this.pdfService.gerarPdfOsBuffer(
        pedidoEntity,
        quadrosParaPdf,
      );

      res.json({
        success: true,
        pdfData: pdfBuffer.toString('base64'),
        filename: `os_${pedidoEntity.numero_pedido}.pdf`,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Falha ao gerar PDF da OS ${id}.`,
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        error instanceof Error ? error.stack : String(error),
      );
      res.status(500).json({
        message: `Falha ao gerar PDF da OS: ${this.extrairMensagemErro(error)}`,
      });
    }
  }

  // =======================================
  // Métodos privados
  // =======================================

  private extrairMensagemErro(error: unknown): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return error instanceof Error ? error.message : String(error);
  }

  private mapQuadrosParaPdf(quadros: QuadroDtoWithExtras[]): QuadroParaPdf[] {
    return quadros.map((q) => {
      const detalhes = Array.isArray(q.detalhesCalculo)
        ? q.detalhesCalculo
        : [];
      const espessura =
        typeof q.espessuraPaspatur === 'number' ? q.espessuraPaspatur : 0;
      const acrescimo = Number(q.acrescimo_cm ?? 0);

      return {
        id: 0,
        altura_cm: q.altura,
        largura_cm: q.largura,
        molduras: (q.moldurasSelecionadas ?? []).map((n) => ({
          nome: n,
          codigo: n,
        })),
        materiais: (q.materiaisSelecionados ?? []).map((n) => ({
          nome: n,
          espessura_paspatur_cm:
            n.toLowerCase() === 'paspatur' ? espessura : undefined,
        })),
        detalhesCalculo: { total: q.valorCalculado, detalhes },
        valorCalculado: q.valorCalculado,
        acrescimo_cm: acrescimo,
        altura: q.altura,
        largura: q.largura,
        moldurasSelecionadas: q.moldurasSelecionadas,
        materiaisSelecionados: q.materiaisSelecionados,
        espessuraPaspatur: espessura,
        limpezaSelecionada: q.limpezaSelecionada,
        medidaFornecidaCliente: q.medidaFornecidaCliente,
      };
    });
  }
}
