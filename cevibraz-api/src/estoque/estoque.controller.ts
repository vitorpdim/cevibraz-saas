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
import { EstoqueService } from './services/estoque.service';
import { XmlParserService } from './services/xml-parser.service';
import {
  EntradaManualDto,
  AjusteEstoqueDto,
  BaixaEstoqueDto,
} from './dto/estoque.dto';
import type { VincularItemXmlDto } from './dto/estoque.dto';

@Controller('api/estoque')
export class EstoqueController {
  constructor(
    private readonly estoqueService: EstoqueService,
    private readonly xmlParserService: XmlParserService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    return this.estoqueService.getDashboard();
  }

  @Get('itens')
  async getItens() {
    return this.estoqueService.getItensEstoque();
  }

  @Get('movimentacoes')
  async getMovimentacoes(@Query('limite') limite?: string) {
    const limit = limite ? parseInt(limite, 10) : 100;
    return this.estoqueService.getMovimentacoes(limit);
  }

  @Get('movimentacoes/item')
  async getMovimentacoesPorItem(
    @Query('tipo') tipo: 'moldura' | 'material',
    @Query('id') id: string,
  ) {
    if (!tipo || !id) {
      throw new BadRequestException('Parâmetros tipo e id são obrigatórios');
    }
    return this.estoqueService.getMovimentacoesPorItem(tipo, parseInt(id, 10));
  }

  @Post('entrada')
  async registrarEntrada(@Body() dto: EntradaManualDto) {
    return this.estoqueService.registrarEntradaManual(dto);
  }

  @Post('baixa')
  async registrarBaixa(@Body() dto: BaixaEstoqueDto) {
    return this.estoqueService.registrarBaixa(dto);
  }

  @Post('ajuste')
  async ajustarEstoque(@Body() dto: AjusteEstoqueDto) {
    return this.estoqueService.ajustarEstoque(dto);
  }

  @Post('xml/parse')
  @UseInterceptors(FileInterceptor('file'))
  parseXml(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Arquivo XML não enviado');
    }

    const xmlContent = file.buffer.toString('utf-8');
    return this.xmlParserService.parseNFeXml(xmlContent);
  }

  @Post('xml/vincular')
  async vincularItemXml(@Body() dto: VincularItemXmlDto) {
    return this.estoqueService.vincularItemXml(dto);
  }
}
