import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class EntradaManualDto {
  @IsEnum(['moldura', 'material'])
  tipo_item: 'moldura' | 'material';

  @IsNumber()
  item_id: number;

  @IsNumber()
  @Min(0.01)
  quantidade: number;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  referencia_externa?: string;

  @IsString()
  @IsOptional()
  usuario?: string;
}

export class AjusteEstoqueDto {
  @IsEnum(['moldura', 'material'])
  tipo_item: 'moldura' | 'material';

  @IsNumber()
  item_id: number;

  @IsNumber()
  @Min(0)
  novo_saldo: number;

  @IsString()
  motivo: string;

  @IsString()
  @IsOptional()
  usuario?: string;
}

export class BaixaEstoqueDto {
  @IsEnum(['moldura', 'material'])
  tipo_item: 'moldura' | 'material';

  @IsNumber()
  item_id: number;

  @IsNumber()
  @Min(0.01)
  quantidade: number;

  @IsNumber()
  @IsOptional()
  pedido_id?: number;

  @IsString()
  @IsOptional()
  descricao?: string;
}

export interface ItemXmlDto {
  codigo: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  unidade: string;
}

export interface ProcessarXmlDto {
  items: ItemXmlDto[];
  numero_nfe: string;
  usuario?: string;
}

export interface VincularItemXmlDto {
  item_xml: ItemXmlDto;
  tipo_item: 'moldura' | 'material';
  item_id: number;
  numero_nfe: string;
}

export interface DashboardEstoqueDto {
  valor_total_estoque: number;
  itens_estoque_baixo: number;
  total_molduras: number;
  total_materiais: number;
  movimentacoes_recentes: number;
}

export interface ItemEstoqueDto {
  id: number;
  tipo: 'moldura' | 'material';
  nome: string;
  codigo?: string;
  estoque_atual: number;
  estoque_minimo: number;
  unidade_medida: string;
  valor_unitario: number;
  valor_total: number;
  status: 'ok' | 'baixo' | 'critico';
  imagem_url?: string;
}

export interface MovimentacaoDto {
  id: number;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  origem: 'MANUAL' | 'XML' | 'PEDIDO' | 'AJUSTE_INVENTARIO';
  quantidade: number;
  saldo_anterior: number;
  saldo_novo: number;
  descricao: string;
  data: Date;
  item_nome: string;
  item_tipo: 'moldura' | 'material';
  usuario?: string;
  pedido_id?: number;
}
