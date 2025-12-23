export interface DashboardData {
  valor_total_estoque: number;
  itens_estoque_baixo: number;
  total_molduras: number;
  total_materiais: number;
  movimentacoes_recentes: number;
}

export interface ItemEstoque {
  id: number;
  tipo: "moldura" | "material";
  nome: string;
  codigo?: string;
  estoque_atual: number;
  estoque_minimo: number;
  unidade_medida: string;
  valor_unitario: number;
  valor_total: number;
  status: "ok" | "baixo" | "critico";
  imagem_url?: string;
}

export interface Movimentacao {
  id: number;
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE";
  origem: "MANUAL" | "XML" | "PEDIDO" | "AJUSTE_INVENTARIO";
  quantidade: number;
  saldo_anterior: number;
  saldo_novo: number;
  descricao: string;
  data: string | Date;
  item_nome: string;
  item_tipo: "moldura" | "material";
  usuario?: string;
  pedido_id?: number;
}

export interface ItemXml {
  codigo: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  unidade: string;
}

export interface ParsedXml {
  numero_nfe: string;
  items: ItemXml[];
}

export interface EntradaManualDto {
  tipo_item: "moldura" | "material";
  item_id: number;
  quantidade: number;
  descricao?: string;
  usuario?: string;
}

export interface AjusteEstoqueDto {
  tipo_item: "moldura" | "material";
  item_id: number;
  novo_saldo: number;
  motivo: string;
  usuario?: string;
}

export interface VincularItemXmlDto {
  item_xml: ItemXml;
  tipo_item: "moldura" | "material";
  item_id: number;
  numero_nfe: string;
}
