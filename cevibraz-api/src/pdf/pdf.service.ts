import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { Pedido } from '../pedidos/pedido.entity';
import { GrupoQuadro, QuadroParaPdf } from '../pedidos/pedido.dto';
import PDFDocument from 'pdfkit';

const MARGEM_ESQUERDA = 72;
const MARGEM_DIREITA = 72;
const MARGEM_TOPO = 72;
const MARGEM_FUNDO = 72;
const LARGURA_DOC_A4 = 612;
const ALTURA_DOC_A4 = 792;
const LARGURA_CONTEUDO = LARGURA_DOC_A4 - MARGEM_ESQUERDA - MARGEM_DIREITA;

type PDFDoc = PDFKit.PDFDocument;

@Injectable()
export class PdfService implements OnModuleInit {
  private readonly logger = new Logger(PdfService.name);
  private logoBuffer: Buffer | null = null;
  private iconeWhatsappBuffer: Buffer | null = null;

  public readonly storageDir: string;
  public readonly pdfDir: string;
  private readonly assetsDir: string;

  constructor() {
    // APONTA PARA PASTA RAIZ
    this.storageDir = path.join(__dirname, '..', '..', '..', 'storage');
    this.pdfDir = path.join(this.storageDir, 'pdfs');
    this.assetsDir = path.join(__dirname, '..', 'assets');
  }

  async onModuleInit() {
    try {
      await fsPromises.mkdir(this.pdfDir, { recursive: true });
      await this.loadAssets();
      this.logger.log('PdfService (PDFKit) inicializado com sucesso.');
    } catch (error: unknown) {
      this.logger.error(
        'Erro fatal na inicialização do PdfService',
        (error as Error).stack,
      );
    }
  }

  private async loadAssets() {
    const originalLogoPath = path.join(this.assetsDir, 'logo_base64.txt');
    const originalIconePath = path.join(
      this.assetsDir,
      'icone_whatsapp_base64.txt',
    );

    try {
      const [logoBase64, iconeBase64] = await Promise.all([
        fsPromises.readFile(originalLogoPath, 'utf8'),
        fsPromises.readFile(originalIconePath, 'utf8'),
      ]);

      this.logoBuffer = Buffer.from(logoBase64.trim(), 'base64');
      this.iconeWhatsappBuffer = Buffer.from(iconeBase64.trim(), 'base64');
    } catch (error) {
      this.logger.error(
        `Falha ao carregar assets: ${(error as Error).message}`,
      );
    }
  }

  async gerarPdfPedido(
    pedidoData: Pedido,
    quadrosParaPdf: QuadroParaPdf[],
    valorFinalEditado?: number,
  ): Promise<string> {
    const valorFinal = valorFinalEditado ?? pedidoData.valor_final;
    const filename = `pedido_${pedidoData.numero_pedido}.pdf`;
    const filePath = path.join(this.pdfDir, filename);

    try {
      const buffer = await this.gerarPdfPedidoBuffer(
        pedidoData,
        quadrosParaPdf,
        valorFinal,
      );
      await fsPromises.writeFile(filePath, buffer);
      return `/static/pdfs/${filename}`;
    } catch (error) {
      this.logger.error(
        `Falha ao gerar PDF (Pedido) ${filename}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Falha ao gerar PDF do Pedido.');
    }
  }

  async gerarPdfOs(
    pedidoData: Pedido,
    quadrosParaPdf: QuadroParaPdf[],
  ): Promise<string> {
    const filename = `os_${pedidoData.numero_pedido}.pdf`;
    const filePath = path.join(this.pdfDir, filename);

    try {
      const buffer = await this.gerarPdfOsBuffer(pedidoData, quadrosParaPdf);
      await fsPromises.writeFile(filePath, buffer);
      return `/static/pdfs/${filename}`;
    } catch (error) {
      this.logger.error(
        `Falha ao gerar PDF (OS) ${filename}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Falha ao gerar PDF da OS.');
    }
  }

  async gerarPdfPedidoBuffer(
    pedidoData: Pedido,
    quadrosParaPdf: QuadroParaPdf[],
    valorFinal: number | string,
  ): Promise<Buffer> {
    const doc: PDFDoc = new PDFDocument({
      size: 'A4',
      margins: {
        top: MARGEM_TOPO,
        bottom: MARGEM_FUNDO,
        left: MARGEM_ESQUERDA,
        right: MARGEM_DIREITA,
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    const grupos = this.agruparQuadrosParaPDF(quadrosParaPdf);

    this.desenharHeaderPedido(doc);
    let y = this.desenharInfoClientePedido(doc, pedidoData, 180);
    y = this.desenharTabelaQuadrosPedido(
      doc,
      grupos,
      y + 15,
      pedidoData.ocultar_valores_unitarios ?? false,
    );
    this.desenharFooterPedido(doc, pedidoData, valorFinal, y);

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));
    });
  }

  async gerarPdfOsBuffer(
    pedidoData: Pedido,
    quadrosParaPdf: QuadroParaPdf[],
  ): Promise<Buffer> {
    const doc: PDFDoc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    const grupos = this.agruparQuadrosParaPDF(quadrosParaPdf);
    this.desenharHeaderOS(doc);
    let y = this.desenharInfoClienteOS(doc, pedidoData, 170);
    if (pedidoData.observacoes) {
      y = this.desenharObservacoesOS(doc, pedidoData.observacoes, y + 5);
    }
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('black')
      .text('Itens do Pedido', MARGEM_ESQUERDA, y + 10);
    y = this.desenharListaQuadrosOS(doc, grupos, y + 25);

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));
    });
  }

  private desenharHeaderPedido(doc: PDFDoc) {
    const yInicio = MARGEM_TOPO - 40;

    if (this.logoBuffer) {
      doc.image(this.logoBuffer, MARGEM_ESQUERDA, yInicio, {
        fit: [150, 80],
      });
    }

    const xDireitaStart = LARGURA_DOC_A4 / 2;
    const widthDireita = LARGURA_DOC_A4 / 2 - MARGEM_DIREITA;

    doc.font('Helvetica-Bold').fontSize(14).fillColor('black');
    doc.text('CEVIBRAZ ESQUADRIAS E VIDROS', xDireitaStart, yInicio + 10, {
      align: 'right',
      width: widthDireita,
    });

    doc.font('Helvetica').fontSize(8);
    doc.text('ESQUADRIAS DE ALUMÍNIO', xDireitaStart, doc.y, {
      align: 'right',
      width: widthDireita,
    });
    doc.text('TODOS OS TIPOS DE VIDRO', xDireitaStart, doc.y, {
      align: 'right',
      width: widthDireita,
    });
    doc.text('QUADROS E MOLDURAS', xDireitaStart, doc.y, {
      align: 'right',
      width: widthDireita,
    });

    doc.moveDown(0.3);
    doc
      .font('Helvetica-Bold')
      .text('CNPJ: 35.594.834/0001-57', xDireitaStart, doc.y, {
        align: 'right',
        width: widthDireita,
      });

    const yAddress = yInicio + 95;

    doc.font('Helvetica').fontSize(9);
    doc.text(
      'Av. Prisciliana de Castilho n° 422 - Bairro: Centro - Caraguatatuba/SP - CEP: 11660-330',
      MARGEM_ESQUERDA,
      yAddress,
      { align: 'center', width: LARGURA_CONTEUDO },
    );

    const phoneText = 'Telefone: (12) 99143-5644';
    const textWidth = doc.widthOfString(phoneText);
    const xTextStart = (LARGURA_DOC_A4 - textWidth) / 2;
    const yPhone = yAddress + 12;

    if (this.iconeWhatsappBuffer) {
      doc.image(this.iconeWhatsappBuffer, xTextStart - 15, yPhone - 1, {
        width: 10,
      });
    }
    doc.text(phoneText, MARGEM_ESQUERDA, yPhone, {
      align: 'center',
      width: LARGURA_CONTEUDO,
    });

    doc
      .moveTo(MARGEM_ESQUERDA, yPhone + 15)
      .lineTo(LARGURA_DOC_A4 - MARGEM_DIREITA, yPhone + 15)
      .strokeColor('#ccc')
      .stroke();
  }

  private desenharInfoClientePedido(
    doc: PDFDoc,
    pedido: Pedido,
    y: number,
  ): number {
    const colWidth = LARGURA_CONTEUDO / 3;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('black');

    doc.text('DATA:', MARGEM_ESQUERDA, y);
    doc.text('Nº PEDIDO:', MARGEM_ESQUERDA + colWidth, y);
    doc.text('ATENDENTE:', MARGEM_ESQUERDA + colWidth * 2, y);

    doc.font('Helvetica').fontSize(10);
    const dataStr = new Date(pedido.data_criacao).toLocaleDateString('pt-BR');
    doc.text(dataStr, MARGEM_ESQUERDA, y + 12);

    doc.font('Helvetica-Bold').fillColor('#c00');
    doc.text(pedido.numero_pedido, MARGEM_ESQUERDA + colWidth, y + 12);

    doc.font('Helvetica').fillColor('black');
    doc.text(pedido.atendente, MARGEM_ESQUERDA + colWidth * 2, y + 12);

    y += 35;

    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('CLIENTE:', MARGEM_ESQUERDA, y);
    const xTelefone = MARGEM_ESQUERDA + LARGURA_CONTEUDO * 0.65;
    doc.text('TELEFONE:', xTelefone, y);

    doc.font('Helvetica').fontSize(10);
    doc.text(pedido.cliente?.nome || 'N/A', MARGEM_ESQUERDA, y + 12, {
      width: LARGURA_CONTEUDO * 0.6,
      lineBreak: false,
      ellipsis: true,
    });
    doc.text(pedido.cliente?.telefone || '(XX) XXXX-XXXX', xTelefone, y + 12);

    y += 25;
    doc
      .moveTo(MARGEM_ESQUERDA, y)
      .lineTo(LARGURA_DOC_A4 - MARGEM_DIREITA, y)
      .strokeColor('#000')
      .stroke();

    return y;
  }

  private desenharTabelaQuadrosPedido(
    doc: PDFDoc,
    grupos: GrupoQuadro[],
    y: number,
    ocultarPrecosIndividuais: boolean,
  ): number {
    const tableTop = y + 20;
    const colWidths = [30, 80, 248, 40, 70];
    const colPositions = [MARGEM_ESQUERDA];
    colWidths.reduce((acc, width) => {
      colPositions.push(acc + width);
      return acc + width;
    }, MARGEM_ESQUERDA);

    doc.font('Helvetica-Bold').fontSize(8);
    doc
      .rect(colPositions[0], tableTop, LARGURA_CONTEUDO, 20)
      .fillAndStroke('#f2f2f2', '#000');
    doc.fillColor('#000');

    doc.text('Item', colPositions[0] + 5, tableTop + 7, {
      width: colWidths[0] - 10,
      align: 'center',
    });
    doc.text('Produto', colPositions[1] + 5, tableTop + 7, {
      width: colWidths[1] - 10,
      align: 'center',
    });
    doc.text('Descrição', colPositions[2] + 5, tableTop + 7, {
      width: colWidths[2] - 10,
      align: 'center',
    });
    doc.text('Quant.', colPositions[3] + 5, tableTop + 7, {
      width: colWidths[3] - 10,
      align: 'center',
    });
    doc.text('Valor Total', colPositions[4] + 5, tableTop + 7, {
      width: colWidths[4] - 10,
      align: 'center',
    });

    let yAtual = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    grupos.forEach((grupo, index) => {
      const desc = this.formatarDescricaoQuadro(
        grupo.detalhes,
        true,
        ocultarPrecosIndividuais,
      );
      const valorUnit = parseFloat(String(grupo.detalhes.valorCalculado || 0));
      const valorTotalGrupo = valorUnit * grupo.quantidade;

      const descHeight = doc.heightOfString(desc, { width: colWidths[2] - 10 });
      const currentLineHeight = Math.max(40, descHeight + 15);

      if (yAtual + currentLineHeight > ALTURA_DOC_A4 - MARGEM_FUNDO - 120) {
        doc.addPage();
        yAtual = MARGEM_TOPO;

        doc.font('Helvetica-Bold').fontSize(8);
        doc
          .rect(colPositions[0], yAtual, LARGURA_CONTEUDO, 20)
          .fillAndStroke('#f2f2f2', '#000');
        doc.fillColor('#000');
        doc.text('Item', colPositions[0] + 5, yAtual + 7, {
          width: colWidths[0] - 10,
          align: 'center',
        });
        doc.text('Produto', colPositions[1] + 5, yAtual + 7, {
          width: colWidths[1] - 10,
          align: 'center',
        });
        doc.text('Descrição', colPositions[2] + 5, yAtual + 7, {
          width: colWidths[2] - 10,
          align: 'center',
        });
        doc.text('Quant.', colPositions[3] + 5, yAtual + 7, {
          width: colWidths[3] - 10,
          align: 'center',
        });
        doc.text('Valor Total', colPositions[4] + 5, yAtual + 7, {
          width: colWidths[4] - 10,
          align: 'center',
        });

        yAtual += 20;
        doc.font('Helvetica').fontSize(8);
      }

      const yCell = yAtual + 7;

      doc.text((index + 1).toString(), colPositions[0] + 5, yCell, {
        width: colWidths[0] - 10,
        align: 'center',
      });
      doc.text('Quadro', colPositions[1] + 5, yCell, {
        width: colWidths[1] - 10,
        align: 'left',
      });
      doc.text(desc, colPositions[2] + 5, yCell, {
        width: colWidths[2] - 10,
        align: 'left',
      });
      doc.text(grupo.quantidade.toString(), colPositions[3] + 5, yCell, {
        width: colWidths[3] - 10,
        align: 'center',
      });

      const textoValor = ocultarPrecosIndividuais
        ? '---'
        : valorTotalGrupo.toFixed(2);
      doc.text(textoValor, colPositions[4] + 5, yCell, {
        width: colWidths[4] - 10,
        align: 'right',
      });

      doc.strokeColor('#ccc');
      for (let i = 0; i <= colWidths.length; i++) {
        doc
          .moveTo(colPositions[i], yAtual)
          .lineTo(colPositions[i], yAtual + currentLineHeight)
          .stroke();
      }
      doc
        .moveTo(MARGEM_ESQUERDA, yAtual + currentLineHeight)
        .lineTo(LARGURA_DOC_A4 - MARGEM_DIREITA, yAtual + currentLineHeight)
        .stroke();

      yAtual += currentLineHeight;
    });

    doc.strokeColor('#000');
    return yAtual;
  }

  private desenharFooterPedido(
    doc: PDFDoc,
    pedido: Pedido,
    valorFinal: number | string,
    y: number,
  ) {
    const colEsquerdaWidth = LARGURA_CONTEUDO * 0.6;
    const colDireitaWidth = LARGURA_CONTEUDO * 0.4;
    const xDireita = MARGEM_ESQUERDA + colEsquerdaWidth;
    const alturaCaixa = 100;
    const yFooterStart = y + 20;

    if (yFooterStart + alturaCaixa > ALTURA_DOC_A4 - MARGEM_FUNDO) {
      doc.addPage();
      y = MARGEM_TOPO;
    } else {
      y = yFooterStart;
    }

    const valorFinalNumerico = parseFloat(String(valorFinal)) || 0;

    doc.font('Helvetica').fontSize(8).fillColor('#333');

    // Caixa Esquerda
    doc.rect(MARGEM_ESQUERDA, y, colEsquerdaWidth, alturaCaixa).stroke();

    let yAtualEsquerda = y + 5;

    doc.font('Helvetica-Bold');
    const labelCondicao = 'CONDIÇÃO DE PAGAMENTO:';
    doc.text(labelCondicao, MARGEM_ESQUERDA + 5, yAtualEsquerda);

    const larguraLabel = doc.widthOfString(labelCondicao);

    doc.font('Helvetica');
    doc.text(
      pedido.condicao_pagamento || '',
      MARGEM_ESQUERDA + 5 + larguraLabel + 5,
      yAtualEsquerda,
      {
        width: colEsquerdaWidth - (5 + larguraLabel + 5) - 5,
      },
    );

    yAtualEsquerda += 20;

    doc.font('Helvetica-Bold');
    doc.text('Observações:', MARGEM_ESQUERDA + 5, yAtualEsquerda);

    yAtualEsquerda += 10;
    doc.font('Helvetica');
    doc.text(pedido.observacoes || '', MARGEM_ESQUERDA + 5, yAtualEsquerda, {
      width: colEsquerdaWidth - 10,
    });

    doc.rect(xDireita, y, colDireitaWidth, alturaCaixa).stroke();

    let yAtualDireita = y + 15;
    const xTextoDireita = xDireita + 5;

    const optionsDireita = {
      align: 'right' as const,
      width: colDireitaWidth - 10,
    };

    doc.font('Helvetica').fontSize(10);
    doc.text('Total da Mercadoria:', xTextoDireita, yAtualDireita);
    doc.text(
      `R$ ${valorFinalNumerico.toFixed(2)}`,
      xTextoDireita,
      yAtualDireita,
      optionsDireita,
    );

    yAtualDireita += 30;
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('TOTAL GERAL:', xTextoDireita, yAtualDireita);
    doc.text(
      `R$ ${valorFinalNumerico.toFixed(2)}`,
      xTextoDireita,
      yAtualDireita,
      optionsDireita,
    );
  }

  private desenharHeaderOS(doc: PDFDoc) {
    const yInicio = 40;
    doc
      .rect(MARGEM_ESQUERDA - 10, yInicio, LARGURA_CONTEUDO + 20, 110)
      .stroke();
    if (this.logoBuffer) {
      doc.image(this.logoBuffer, MARGEM_ESQUERDA, yInicio + 10, {
        fit: [150, 80],
      });
    }
    const xDireita = LARGURA_DOC_A4 - MARGEM_DIREITA;
    doc.font('Helvetica-Bold').fontSize(14).fillColor('black');
    doc.text('CEVIBRAZ ESQUADRIAS E VIDROS', 0, yInicio + 15, {
      align: 'right',
      width: xDireita - MARGEM_ESQUERDA,
    });
    doc.font('Helvetica').fontSize(8);
    doc.text('ESQUADRIAS DE ALUMÍNIO', 0, yInicio + 35, {
      align: 'right',
      width: xDireita - MARGEM_ESQUERDA,
    });
    doc.text('TODOS OS TIPOS DE VIDRO', 0, yInicio + 48, {
      align: 'right',
      width: xDireita - MARGEM_ESQUERDA,
    });
    doc.text('QUADROS E MOLDURAS', 0, yInicio + 61, {
      align: 'right',
      width: xDireita - MARGEM_ESQUERDA,
    });
    const yLinha = yInicio + 85;
    doc
      .moveTo(MARGEM_ESQUERDA, yLinha)
      .lineTo(LARGURA_DOC_A4 - MARGEM_DIREITA, yLinha)
      .stroke();
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('Ordem de serviço', MARGEM_ESQUERDA, yLinha + 8, { align: 'left' });
  }

  private desenharInfoClienteOS(
    doc: PDFDoc,
    pedido: Pedido,
    y: number,
  ): number {
    const xLabel = MARGEM_ESQUERDA;
    const xValor = MARGEM_ESQUERDA + 100;
    const xLabel2 = 350;
    const xValor2 = 450;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('black');
    doc.text('Data:', xLabel, y);
    doc.text('Número do pedido:', xLabel2, y);
    doc.text('Cliente:', xLabel, y + 15);
    doc.font('Helvetica');
    doc.text(
      new Date(pedido.data_criacao).toLocaleDateString('pt-BR'),
      xValor,
      y,
    );
    doc.font('Helvetica-Bold').fillColor('red');
    doc.text(pedido.numero_pedido, xValor2, y);
    doc.fillColor('black').font('Helvetica');
    doc.text(pedido.cliente?.nome || 'N/A', xValor, y + 15);
    return y + 30;
  }

  private desenharListaQuadrosOS(
    doc: PDFDoc,
    grupos: GrupoQuadro[],
    y: number,
  ): number {
    doc.font('Helvetica').fontSize(8);
    for (const grupo of grupos) {
      const desc = this.formatarDescricaoQuadro(grupo.detalhes, false);
      const descHeight = doc.heightOfString(desc, {
        width: LARGURA_CONTEUDO - 20,
      });
      const currentLineHeight = descHeight + 35;

      if (y + currentLineHeight > ALTURA_DOC_A4 - MARGEM_FUNDO) {
        doc.addPage();
        y = MARGEM_TOPO;
      }
      doc
        .rect(MARGEM_ESQUERDA, y, LARGURA_CONTEUDO, currentLineHeight)
        .fillAndStroke('#f9f9f9', '#ccc');
      doc.fillColor('#333');
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`${grupo.quantidade}x Quadro`, MARGEM_ESQUERDA + 8, y + 8);
      doc
        .moveTo(MARGEM_ESQUERDA + 8, y + 22)
        .lineTo(LARGURA_DOC_A4 - MARGEM_DIREITA - 8, y + 22)
        .dash(1, { space: 2 })
        .stroke();
      doc
        .font('Helvetica')
        .fontSize(8)
        .text(desc, MARGEM_ESQUERDA + 8, y + 30, {
          width: LARGURA_CONTEUDO - 16,
          lineGap: 2,
        });
      y += currentLineHeight + 8;
    }
    return y;
  }

  private desenharObservacoesOS(
    doc: PDFDoc,
    observacoes: string,
    y: number,
  ): number {
    doc.fillColor('black');
    const obsHeight =
      doc.heightOfString(observacoes, { width: LARGURA_CONTEUDO - 20 }) + 30;
    if (y + obsHeight > ALTURA_DOC_A4 - MARGEM_FUNDO) {
      doc.addPage();
      y = MARGEM_TOPO;
    }
    doc
      .rect(MARGEM_ESQUERDA, y, LARGURA_CONTEUDO, obsHeight)
      .fillAndStroke('#f8f8f8', '#ddd');
    doc
      .moveTo(MARGEM_ESQUERDA, y)
      .lineTo(MARGEM_ESQUERDA, y + obsHeight)
      .strokeColor('#000')
      .lineWidth(3)
      .stroke();
    doc.lineWidth(1).strokeColor('#000');
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('Observações Gerais do Pedido:', MARGEM_ESQUERDA + 10, y + 6);
    doc
      .font('Helvetica')
      .fontSize(8)
      .text(observacoes, MARGEM_ESQUERDA + 10, y + 20, {
        width: LARGURA_CONTEUDO - 20,
      });
    return y + obsHeight;
  }

  // helper p formatar números com casas decimais
  private formatarDecimal(valor: number | string, casas = 1): string {
    const n = parseFloat(String(valor ?? 0));
    return n.toFixed(casas);
  }

  // substitui o método anterior formatarDescricaoQuadro
  private formatarDescricaoQuadro(
    quadro: QuadroParaPdf,
    incluirValores: boolean,
    ocultarPrecosIndividuais: boolean = false,
  ): string {
    const listaDesc: string[] = [];
    const altura = this.formatarDecimal(quadro.altura_cm);
    const largura = this.formatarDecimal(quadro.largura_cm);

    // verifica se tem acréscimo p mostrar na desc principal
    const acrescimo = quadro.acrescimo_cm
      ? parseFloat(String(quadro.acrescimo_cm))
      : 0;
    let textoDimensoes = `Quadro: ${altura}cm x ${largura}cm`;

    if (acrescimo > 0) {
      textoDimensoes += ` (+${acrescimo}cm folga)`;
    }

    listaDesc.push(textoDimensoes);

    // se tiver detalhes e não for p ocultar, mostra tudo
    if (
      incluirValores &&
      quadro.detalhesCalculo &&
      quadro.detalhesCalculo.detalhes &&
      !ocultarPrecosIndividuais
    ) {
      const detalhesCompletos = [...(quadro.detalhesCalculo?.detalhes || [])];
      return listaDesc[0] + '\n' + detalhesCompletos.join('\n');
    }

    // se for p ocultar os preços, monta so os nomes
    const listaItens: string[] = [];

    if (quadro.molduras && quadro.molduras.length > 0) {
      const nomes = quadro.molduras.map((m) => m.nome || m.codigo).join(', ');
      listaItens.push(`Molduras: ${nomes}`);
    }

    if (quadro.materiais && quadro.materiais.length > 0) {
      quadro.materiais.forEach((m) => {
        let itemDesc = m.nome;
        if (m.nome.toLowerCase() === 'paspatur' && m.espessura_paspatur_cm) {
          itemDesc += ` (${this.formatarDecimal(m.espessura_paspatur_cm, 1)}cm)`;
        }
        listaItens.push(itemDesc);
      });
    }

    if (listaItens.length > 0) {
      listaDesc.push(listaItens.join(' + '));
    }

    return listaDesc.join('\n');
  }

  private agruparQuadrosParaPDF(
    quadrosComDetalhes: QuadroParaPdf[],
  ): GrupoQuadro[] {
    const grupos: Record<string, GrupoQuadro> = {};
    (quadrosComDetalhes ?? []).forEach((quadro) => {
      const moldurasOrdenadas = (quadro.molduras || [])
        .map((m) => m.nome || m.codigo)
        .sort()
        .join(',');
      const materiaisOrdenados = (quadro.materiais || [])
        .map((m) => {
          const espessura = parseFloat(String(m.espessura_paspatur_cm ?? 0));
          const espessuraKey = espessura > 0 ? `-${espessura}` : '';
          return `${m.nome}${
            m.nome.toLowerCase() === 'paspatur' ? espessuraKey : ''
          }`;
        })
        .sort()
        .join(',');

      const valorChave = parseFloat(
        quadro.valorCalculado?.toString() || '0',
      ).toFixed(2);

      const chave = [
        parseFloat(quadro.altura_cm?.toString() || '0').toFixed(2),
        parseFloat(quadro.largura_cm?.toString() || '0').toFixed(2),
        moldurasOrdenadas,
        materiaisOrdenados,
        quadro.medidaFornecidaCliente,
        quadro.limpezaSelecionada,
        valorChave,
      ].join('|');

      if (grupos[chave]) {
        grupos[chave].quantidade++;
      } else {
        grupos[chave] = { quantidade: 1, detalhes: quadro };
      }
    });
    return Object.values(grupos);
  }
}
