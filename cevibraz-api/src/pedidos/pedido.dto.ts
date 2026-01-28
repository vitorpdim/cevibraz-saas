/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsIn,
  IsBoolean,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- DTO DO QUADRO ---
export class QuadroDto {
  // ✅ SOLUÇÃO DO CONFLITO FRONTEND/BACKEND
  // Permitimos receber 'id' (para o Frontend não quebrar a tipagem),
  // mas marcamos como @IsOptional. O Service ignora esse campo naturalmente
  // ao mapear campo por campo durante a criação.
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  altura: number;

  @IsNumber()
  largura: number;

  @IsArray()
  @IsString({ each: true })
  moldurasSelecionadas: string[];

  @IsArray()
  @IsString({ each: true })
  materiaisSelecionados: string[];

  @IsNumber()
  @Min(0)
  espessuraPaspatur: number;

  @IsBoolean()
  medidaFornecidaCliente: boolean;

  @IsBoolean()
  limpezaSelecionada: boolean;

  @IsNumber()
  @Min(0)
  valorCalculado: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  acrescimo_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantidade?: number;
}

// interface auxiliar (não afeta validação)
export interface QuadroDtoWithExtras
  extends Omit<QuadroDto, 'espessuraPaspatur' | 'materiaisSelecionados'> {
  espessuraPaspatur?: number;
  materiaisSelecionados: string[];
  detalhesCalculo?: string[];
  acrescimo_cm?: number;
}

// --- DTO CRIAÇÃO PEDIDO ---
export class CreatePedidoDto {
  @IsString()
  nomeAtendente: string;

  @IsString()
  nomeCliente: string;

  @IsString()
  telefoneCliente: string;

  @IsString()
  observacoes: string;

  @IsOptional()
  @IsString()
  condicao_pagamento?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuadroDto)
  quadros: QuadroDto[];

  @IsNumber()
  @Min(0)
  valor_final_calculado: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_final_manual?: number;

  @IsOptional()
  @IsBoolean()
  ocultar_valores_unitarios?: boolean;
}

// --- DTO ATUALIZAÇÃO PEDIDO ---
export class UpdatePedidoDto {
  @IsString()
  observacoes: string;

  @IsOptional()
  @IsString()
  condicao_pagamento?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuadroDto)
  quadros: QuadroDto[];

  @IsNumber()
  @Min(0)
  valor_final_calculado: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_final_manual?: number;

  @IsOptional()
  @IsBoolean()
  ocultar_valores_unitarios?: boolean;
}

// --- DTO STATUS ---
export class UpdateStatusDto {
  @IsString()
  @IsIn(['A Fazer', 'Já Feito', 'Entregue'])
  status: 'A Fazer' | 'Já Feito' | 'Entregue';
}

// --- INTERFACES PDF ---
export interface QuadroParaPdf {
  id: number;
  altura: number;
  largura: number;
  altura_cm: number;
  largura_cm: number;
  moldurasSelecionadas?: string[];
  materiaisSelecionados?: string[];
  espessuraPaspatur: number;
  medidaFornecidaCliente: boolean;
  limpezaSelecionada: boolean;
  valorCalculado: number;
  acrescimo_cm?: number;
  quantidade?: number;
  molduras: { nome: string; codigo: string }[];
  materiais: { nome: string; espessura_paspatur_cm: number | undefined }[];
  detalhesCalculo: { total: number; detalhes: string[] };
}

export interface GrupoQuadro {
  quantidade: number;
  detalhes: QuadroParaPdf;
}

export interface PedidoParaEdicao {
  id: number;
  numero_pedido: string;
  atendente: string;
  clienteNome: string;
  clienteTelefone: string;
  observacoes: string;
  condicao_pagamento?: string;
  quadros: QuadroDtoWithExtras[];
  valor_final_salvo: number;
  ocultar_valores_unitarios?: boolean;
}
