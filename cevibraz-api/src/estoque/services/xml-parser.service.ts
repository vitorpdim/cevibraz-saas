import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { ItemXmlDto } from '../dto/estoque.dto';

interface XmlProd {
  cProd?: string;
  cEAN?: string;
  xProd?: string;
  qCom?: string | number;
  qTrib?: string | number;
  vUnCom?: string | number;
  vUnTrib?: string | number;
  uCom?: string;
  uTrib?: string;
}

interface XmlDet {
  prod: XmlProd;
}

interface XmlInfNFe {
  ide?: {
    nNF?: string;
  };
  det: XmlDet | XmlDet[];
}

interface XmlNFe {
  infNFe?: XmlInfNFe;
}

@Injectable()
export class XmlParserService {
  private readonly logger = new Logger(XmlParserService.name);
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
  }

  parseNFeXml(xmlContent: string): {
    numero_nfe: string;
    items: ItemXmlDto[];
  } {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsed = this.parser.parse(xmlContent);
      const rootNode = this.getRootNode(parsed);
      const nfe: XmlNFe = rootNode.infNFe ? rootNode : rootNode.NFe || rootNode;
      const infNFe: XmlInfNFe = (nfe.infNFe || nfe) as XmlInfNFe;

      if (!infNFe || !infNFe.det) {
        throw new BadRequestException(
          'XML inválido: estrutura de produtos (det) não encontrada',
        );
      }

      const det = infNFe.det;
      const numeroNFe = String(infNFe.ide?.nNF || 'SEM_NUMERO');
      const detArray: XmlDet[] = Array.isArray(det) ? det : [det];

      const items: ItemXmlDto[] = detArray.map((item: XmlDet) => {
        const prod: XmlProd = item.prod;

        return {
          codigo: String(prod.cProd || prod.cEAN || 'SEM_CODIGO'),
          nome: String(prod.xProd || 'Produto sem nome'),
          quantidade: parseFloat(String(prod.qCom || prod.qTrib || '0')),
          valor_unitario: parseFloat(
            String(prod.vUnCom || prod.vUnTrib || '0'),
          ),
          unidade: String(prod.uCom || prod.uTrib || 'UN'),
        };
      });

      this.logger.log(
        `XML parseado com sucesso. NFe: ${numeroNFe}, Items: ${items.length}`,
      );

      return {
        numero_nfe: numeroNFe,
        items: items.filter((i) => i.quantidade > 0),
      };
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Erro ao parsear XML:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao processar XML: ${errorMessage}`);
    }
  }

  private getRootNode(parsed: unknown): Record<string, unknown> {
    if (typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, unknown>;
      return (
        (obj.nfeProc as Record<string, unknown>) ||
        (obj.NFe as Record<string, unknown>) ||
        obj
      );
    }
    return parsed as Record<string, unknown>;
  }

  parseXmlString(xmlContent: string): unknown {
    try {
      return this.parser.parse(xmlContent);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('XML malformado:', error);
      throw new BadRequestException('XML malformado ou inválido');
    }
  }
}
