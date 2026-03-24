// =======================================
// Imports externos
// =======================================

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

// =======================================
// Imports internos
// =======================================

import { EstoqueService } from './services/estoque.service';
import { XmlParserService } from './services/xml-parser.service';
import * as estoqueDto from './dto/estoque.dto';

// =======================================
// Controller
// =======================================
@Controller('api/estoque')
export class EstoqueController {
  constructor(
    private readonly estoqueService: EstoqueService,
    private readonly xmlParserService: XmlParserService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.estoqueService.getDashboard();
  }

  @Get('itens')
  getItens() {
    return this.estoqueService.getItensEstoque();
  }

  @Get('movimentacoes')
  getMovimentacoes(@Query('limite') limite?: string) {
    const limit = limite ? parseInt(limite, 10) : 100;
    return this.estoqueService.getMovimentacoes(limit);
  }

  @Get('movimentacoes/item')
  getMovimentacoesPorItem(
    @Query('tipo') tipo: 'moldura' | 'material',
    @Query('id') id: string,
  ) {
    if (!tipo || !id) {
      throw new BadRequestException(
        'Os parâmetros "tipo" e "id" são obrigatórios.',
      );
    }
    return this.estoqueService.getMovimentacoesPorItem(tipo, parseInt(id, 10));
  }

  @Post('entrada')
  registrarEntrada(@Body() dto: estoqueDto.EntradaManualDto) {
    return this.estoqueService.registrarEntradaManual(dto);
  }

  @Post('baixa')
  registrarBaixa(@Body() dto: estoqueDto.BaixaEstoqueDto) {
    return this.estoqueService.registrarBaixa(dto);
  }

  @Post('ajuste')
  ajustarEstoque(@Body() dto: estoqueDto.AjusteEstoqueDto) {
    return this.estoqueService.ajustarEstoque(dto);
  }

  @Post('xml/parse')
  @UseInterceptors(FileInterceptor('file'))
  parseXml(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Arquivo XML não enviado.');
    }
    const xmlContent = file.buffer.toString('utf-8');
    return this.xmlParserService.parseNFeXml(xmlContent);
  }

  @Post('xml/vincular')
  vincularItemXml(@Body() dto: estoqueDto.VincularItemXmlDto) {
    return this.estoqueService.vincularItemXml(dto);
  }
}
