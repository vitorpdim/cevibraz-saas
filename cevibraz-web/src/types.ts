export interface Moldura {
  id: number;
  codigo: string;
  nome: string;
  valor_metro_linear: number;
  imagem_url: string | null;
}

export interface Material {
  id: number;
  nome: string;
  tipo_calculo: "metro_linear" | "metro_quadrado";
  valor_base: number;
}

export interface CalcularQuadroDto {
  altura: number;
  largura: number;
  moldurasSelecionadas: string[];
  materiaisSelecionados: string[];
  espessuraPaspatur: number;
  limpezaSelecionada: boolean;
  medidaFornecidaCliente: boolean;
}

export interface CalculoResponse {
  total: number;
  detalhes: string[];
}

export interface QuadroNoEstado {
  id: number;
  altura: number;
  largura: number;
  moldurasSelecionadas: string[];
  materiaisSelecionados: string[];
  espessuraPaspatur: number;
  medidaFornecidaCliente: boolean;
  limpezaSelecionada: boolean;
  valorCalculado: number;
  detalhesCalculo?: string[];
}

// p criar/atualizar pedido envia p api
export interface PedidoApiDto {
  nomeAtendente: string;
  nomeCliente: string;
  telefoneCliente: string;
  observacoes: string;
  condicao_pagamento?: string;
  quadros: QuadroNoEstado[];
  valor_final_calculado: number;
  valor_final_manual?: number;
}

// resposta em salvar pedido
export interface SalvarPedidoResponse {
  message: string;
  pedidoId: number;
  numeroPedido: string;
  valorTotal: number;
  pdf_pedido_url?: string;
  pdf_os_url?: string;
}

// pedido p exibir no backlog
export interface PedidoBacklog {
  id: number;
  numero_pedido: string;
  atendente: string;
  data_criacao: string;
  status: 'A Fazer' | 'Já Feito' | 'Entregue';
  valor_final: number;
  cliente_nome: string;
  pdf_filename: string | null;
  pdf_os_filename: string | null;
  pdf_pedido_url: string | null;
  pdf_os_url: string | null;
}

// p edição carregar na tela de orçamento
export interface PedidoParaEdicao {
  id: number;
  atendente: string;
  clienteNome: string;
  clienteTelefone: string;
  observacoes: string;
  condicao_pagamento?: string;
  quadros: QuadroNoEstado[];
  valor_final_salvo: number;
}

export interface SimpleApiResponse {
  message: string;
}


export interface PedidoParaEdicao {
  id: number;
  atendente: string;
  clienteNome: string;
  clienteTelefone: string;
  observacoes: string;
  quadros: QuadroNoEstado[];
  valor_final_salvo: number;
}

export interface CreateMolduraDto {
  codigo: string;
  nome: string;
  valor_metro_linear: number;
}

export interface UpdateMolduraDto {
  codigo?: string;
  nome?: string;
  valor_metro_linear?: number;
}

export interface PedidoUpdateDto {
  observacoes: string;
  condicao_pagamento?: string;
  quadros: QuadroNoEstado[];
  valor_final_calculado: number;
  valor_final_manual?: number;
}