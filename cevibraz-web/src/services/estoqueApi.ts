// =======================================
// Imports externos
// =======================================

import axios, { AxiosError } from 'axios';

// =======================================
// Imports de tipos
// =======================================

import type {
  DashboardData,
  ItemEstoque,
  Movimentacao,
  ParsedXml,
  EntradaManualDto,
  AjusteEstoqueDto,
  VincularItemXmlDto,
} from '../types/estoque.types';

// =======================================
// configuração do cliente HTTP
// =======================================

const API_URL = import.meta.env.VITE_API_URL || 'https://cevibraz-api.onrender.com';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const mensagem =
      error instanceof AxiosError
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : 'Erro desconhecido na comunicação com a API.';

    console.error('[EstoqueAPI]', mensagem);
    return Promise.reject(error);
  },
);

// =======================================
// ENDPOINT — consulta
// =======================================

export const fetchDashboard = async (): Promise<DashboardData> => {
  try {
    const { data } = await apiClient.get<DashboardData>('/api/estoque/dashboard');
    return data;
  } catch {
    throw new Error('Falha ao carregar o painel de estoque.');
  }
};

export const fetchItensEstoque = async (): Promise<ItemEstoque[]> => {
  try {
    const { data } = await apiClient.get<ItemEstoque[]>('/api/estoque/itens');
    return data.map((item) => ({
      ...item,
      imagem_url: item.imagem_url ? `${API_URL}${item.imagem_url}` : undefined,
    }));
  } catch {
    throw new Error('Falha ao carregar os itens do estoque.');
  }
};

export const fetchMovimentacoes = async (limite = 100): Promise<Movimentacao[]> => {
  try {
    const { data } = await apiClient.get<Movimentacao[]>('/api/estoque/movimentacoes', {
      params: { limite },
    });
    return data;
  } catch {
    throw new Error('Falha ao carregar o histórico de movimentações.');
  }
};

export const fetchMovimentacoesPorItem = async (
  tipo: 'moldura' | 'material',
  id: number,
): Promise<Movimentacao[]> => {
  try {
    const { data } = await apiClient.get<Movimentacao[]>('/api/estoque/movimentacoes/item', {
      params: { tipo, id },
    });
    return data;
  } catch {
    throw new Error('Falha ao carregar o histórico do item.');
  }
};

// =======================================
// ENDPOINT — mutação
// =======================================

export const registrarEntrada = async (dto: EntradaManualDto): Promise<unknown> => {
  try {
    const { data } = await apiClient.post('/api/estoque/entrada', dto);
    return data;
  } catch {
    throw new Error('Falha ao registrar entrada no estoque.');
  }
};

export const registrarBaixa = async (
  tipo_item: 'moldura' | 'material',
  item_id: number,
  quantidade: number,
  descricao?: string,
): Promise<unknown> => {
  try {
    const { data } = await apiClient.post('/api/estoque/baixa', {
      tipo_item,
      item_id,
      quantidade,
      descricao,
    });
    return data;
  } catch {
    throw new Error('Falha ao registrar baixa no estoque.');
  }
};

export const ajustarEstoque = async (dto: AjusteEstoqueDto): Promise<unknown> => {
  try {
    const { data } = await apiClient.post('/api/estoque/ajuste', dto);
    return data;
  } catch {
    throw new Error('Falha ao ajustar o saldo do estoque.');
  }
};

export const parseXml = async (file: File): Promise<ParsedXml> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<ParsedXml>('/api/estoque/xml/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch {
    throw new Error('Falha ao processar o arquivo XML da NFe.');
  }
};

export const vincularItemXml = async (dto: VincularItemXmlDto): Promise<unknown> => {
  try {
    const { data } = await apiClient.post('/api/estoque/xml/vincular', dto);
    return data;
  } catch {
    throw new Error('Falha ao vincular item da NFe ao estoque.');
  }
};

export default apiClient;
