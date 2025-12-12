// Em: cevibraz-api/src/pedidos/pedidos.controller.ts
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
import { PedidosService } from './pedidos.service';
import {
  CreatePedidoDto,
  UpdatePedidoDto,
  UpdateStatusDto,
  QuadroParaPdf,
} from './pedido.dto';
import { PdfService } from '../pdf/pdf.service';

@Controller('api/pedidos')
export class PedidosController {
  private readonly logger = new Logger(PedidosController.name);

  constructor(
    private readonly pedidosService: PedidosService,
    private readonly pdfService: PdfService,
  ) {}

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(error);
  }

  @Post()
  async create(@Body() createPedidoDto: CreatePedidoDto) {
    try {
      return await this.pedidosService.create(createPedidoDto);
    } catch (error) {
      this.logger.error('Erro no controller ao criar pedido:', error);
      throw new InternalServerErrorException(this.getErrorMessage(error));
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
      this.logger.error('Erro no controller ao buscar pedidos:', error);
      throw new InternalServerErrorException(this.getErrorMessage(error));
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.pedidosService.findOneForEdit(+id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro no controller ao buscar pedido ${id}:`, error);
      throw new InternalServerErrorException(this.getErrorMessage(error));
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro no controller ao atualizar pedido ${id}:`, error);
      throw new InternalServerErrorException(this.getErrorMessage(error));
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro no controller ao atualizar status do pedido ${id}:`,
        error,
      );
      throw new InternalServerErrorException(this.getErrorMessage(error));
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.pedidosService.remove(+id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro no controller ao deletar pedido ${id}:`, error);
      throw new InternalServerErrorException(this.getErrorMessage(error));
    }
  }

  @Get(':id/pdf')
  async getPdfPedido(
    @Param('id') id: string,
    @Query('valor_editado') valor_editado: string,
    @Res() res: Response,
  ) {
    try {
      const pedidoFormatado = await this.pedidosService.findOneForEdit(+id);
      const pedidoEntity = await this.pedidosService.findEntityById(+id);

      if (!pedidoEntity) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      const valorFinal = valor_editado
        ? parseFloat(valor_editado)
        : pedidoEntity.valor_final;

      const quadrosParaPdf: QuadroParaPdf[] = pedidoFormatado.quadros.map(
        (q) => ({
          ...q,
          id: 0,
          altura_cm: q.altura,
          largura_cm: q.largura,
          molduras: q.moldurasSelecionadas.map((n) => ({ nome: n, codigo: n })),
          materiais: q.materiaisSelecionados.map((n) => ({
            nome: n,
            espessura_paspatur_cm:
              n.toLowerCase() === 'paspatur' ? q.espessuraPaspatur : undefined,
          })),
          detalhesCalculo: { total: q.valorCalculado, detalhes: [] },
        }),
      );

      const pdfBuffer = await this.pdfService.gerarPdfPedidoBuffer(
        pedidoEntity,
        quadrosParaPdf,
        valorFinal,
      );

      const filename = `pedido_${pedidoEntity.numero_pedido}.pdf`;

      res.json({
        success: true,
        pdfData: pdfBuffer.toString('base64'),
        filename,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao gerar PDF do Pedido ${id}:`,
        (error as Error).stack,
      );
      res.status(500).json({
        message: `Erro ao gerar PDF do Pedido: ${this.getErrorMessage(error)}`,
      });
    }
  }

  @Get(':id/os/pdf')
  async getPdfOs(@Param('id') id: string, @Res() res: Response) {
    try {
      const pedidoFormatado = await this.pedidosService.findOneForEdit(+id);
      const pedidoEntity = await this.pedidosService.findEntityById(+id);

      if (!pedidoEntity) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      const quadrosParaPdf: QuadroParaPdf[] = pedidoFormatado.quadros.map(
        (q) => ({
          ...q,
          id: 0,
          altura_cm: q.altura,
          largura_cm: q.largura,
          molduras: q.moldurasSelecionadas.map((n) => ({ nome: n, codigo: n })),
          materiais: q.materiaisSelecionados.map((n) => ({
            nome: n,
            espessura_paspatur_cm:
              n.toLowerCase() === 'paspatur' ? q.espessuraPaspatur : undefined,
          })),
          detalhesCalculo: { total: q.valorCalculado, detalhes: [] },
        }),
      );

      const pdfBuffer = await this.pdfService.gerarPdfOsBuffer(
        pedidoEntity,
        quadrosParaPdf,
      );

      const filename = `os_${pedidoEntity.numero_pedido}.pdf`;

      res.json({
        success: true,
        pdfData: pdfBuffer.toString('base64'),
        filename,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao gerar PDF da OS ${id}:`,
        (error as Error).stack,
      );
      res.status(500).json({
        message: `Erro ao gerar PDF da OS: ${this.getErrorMessage(error)}`,
      });
    }
  }
}
