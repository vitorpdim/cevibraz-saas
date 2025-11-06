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

// oq enviar pro calculo.dto.ts
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

export interface QuadroParaSalvar {
  altura: number;
  largura: number;
  moldurasSelecionadas: string[];
  materiaisSelecionados: string[];
  espessuraPaspatur: number;
  medidaFornecidaCliente: boolean;
  limpezaSelecionada: boolean;
  valorCalculado: number; // preco final desse quadro
}

export interface CreatePedidoDto {
  nomeAtendente: string;
  nomeCliente: string;
  telefoneCliente: string;
  observacoes: string;
  quadros: QuadroParaSalvar[];
  valor_final_calculado: number;
}

export interface SalvarPedidoResponse {
  message: string;
  pedidoId: number;
  numeroPedido: string;
  valorTotal: number;
}