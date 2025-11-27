/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsNumber, IsOptional, IsArray, IsIn } from 'class-validator';

export class QuadroDto {
  altura: number;
  largura: number;
  moldurasSelecionadas: string[];
  materiaisSelecionados: string[];
  espessuraPaspatur: number;
  medidaFornecidaCliente: boolean;
  limpezaSelecionada: boolean;
  valorCalculado: number;
}

// DTO p criar um novo pedido
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
  condicao_pagamento: string;

  @IsArray()
  quadros: QuadroDto[];

  @IsNumber()
  valor_final_calculado: number;

  @IsOptional()
  @IsNumber()
  valor_final_manual?: number;
}

// DTO p atualizar um pedido
export class UpdatePedidoDto {
  @IsString()
  observacoes: string;

  @IsOptional()
  @IsString()
  condicao_pagamento: string;

  @IsArray()
  quadros: QuadroDto[];

  @IsNumber()
  valor_final_calculado: number;

  @IsOptional()
  @IsNumber()
  valor_final_manual?: number;
}

// DTO p atualizar so o status
export class UpdateStatusDto {
  @IsString()
  @IsIn(['A Fazer', 'Já Feito', 'Entregue'])
  status: 'A Fazer' | 'Já Feito' | 'Entregue';
}

// DTO p os dados que o gerador de pdf espera
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
  molduras: { nome: string; codigo: string }[];
  materiais: { nome: string; espessura_paspatur_cm: number | undefined }[];
  detalhesCalculo: { total: number; detalhes: string[] };
}

export interface GrupoQuadro {
  quantidade: number;
  detalhes: QuadroParaPdf;
}
