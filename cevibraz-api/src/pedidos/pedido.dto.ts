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
  nomeAtendente: string;
  nomeCliente: string;
  telefoneCliente: string;
  observacoes: string;
  quadros: QuadroDto[];
  valor_final_calculado: number;
}

// DTO p atualizar um pedido
export class UpdatePedidoDto {
  observacoes: string;
  quadros: QuadroDto[];
  valor_final_calculado: number;
}

// DTO p atualizar so o status
export class UpdateStatusDto {
  status: 'A Fazer' | 'Já Feito' | 'Entregue';
}

// DTO p os dados que o gerador de pdf espera
export interface QuadroParaPdf extends QuadroDto {
  id: number;
  altura_cm: number;
  largura_cm: number;
  molduras: { nome: string; codigo: string }[];
  materiais: { nome: string; espessura_paspatur_cm: number | undefined }[];
  detalhesCalculo: { total: number; detalhes: string[] };
}

export interface GrupoQuadro {
  quantidade: number;
  detalhes: QuadroParaPdf;
}
