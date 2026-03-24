// =======================================
// Imports externos
// =======================================

import axios from 'axios';

// =======================================
// Imports de tipos
// =======================================

import type {
  Moldura,
  Material,
  CalcularQuadroDto,
  CalculoResponse,
  PedidoApiDto,
  PedidoUpdateDto,
  PedidoBacklog,
  SimpleApiResponse,
  SalvarPedidoResponse,
  PedidoParaEdicao,
} from '../types';

// =======================================
// Configuração do cliente HTTP
// =======================================

const API_URL = import.meta.env.VITE_API_URL || 'https://cevibraz-api.onrender.com';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// =======================================
// ENDPOINT — molduras
// =======================================

export const fetchMolduras = async (): Promise<Moldura[]> => {
  const { data } = await apiClient.get<Moldura[]>('/api/molduras');
  return data;
};

export const createMoldura = async (formData: FormData): Promise<Moldura> => {
  const { data } = await apiClient.post<Moldura>('/api/molduras', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const updateMoldura = async (id: number, formData: FormData): Promise<Moldura> => {
  const { data } = await apiClient.put<Moldura>(`/api/molduras/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteMoldura = async (id: number): Promise<SimpleApiResponse> => {
  const { data } = await apiClient.delete<SimpleApiResponse>(`/api/molduras/${id}`);
  return data;
};

export const deleteMoldurasBatch = async (ids: number[]): Promise<void> => {
  if (!ids || ids.length === 0) return;
  await apiClient.delete(`/api/molduras/batch?ids=${encodeURIComponent(ids.join(','))}`);
};

// =======================================
// ENDPOINT — materiais
// =======================================

export const fetchMateriais = async (): Promise<Material[]> => {
  const { data } = await apiClient.get<Material[]>('/api/materiais');
  return data;
};

export const updateMaterial = async (id: number, valor_base: number): Promise<Material> => {
  const { data } = await apiClient.put<Material>(`/api/materiais/${id}`, { valor_base });
  return data;
};

// =======================================
// ENDPOINT — cálculo
// =======================================

export const calcularPrecoQuadro = async (dto: CalcularQuadroDto): Promise<CalculoResponse> => {
  const { data } = await apiClient.post<CalculoResponse>('/api/quadro/calcular', dto);
  return data;
};

// =======================================
// ENDPOINT — pedidos
// =======================================

export const salvarPedido = async (dto: PedidoApiDto): Promise<SalvarPedidoResponse> => {
  const { data } = await apiClient.post<SalvarPedidoResponse>('/api/pedidos', dto);
  return data;
};

export const fetchPedidos = async (): Promise<PedidoBacklog[]> => {
  const { data } = await apiClient.get<PedidoBacklog[]>('/api/pedidos');
  return data;
};

export const fetchPedidoById = async (id: number): Promise<PedidoParaEdicao> => {
  const { data } = await apiClient.get<PedidoParaEdicao>(`/api/pedidos/${id}`);
  return data;
};

export const updatePedido = async (id: number, pedido: PedidoUpdateDto): Promise<PedidoParaEdicao> => {
  const { data } = await apiClient.put<PedidoParaEdicao>(`/api/pedidos/${id}`, pedido);
  return data;
};

export const updatePedidoStatus = async (
  id: number,
  status: 'A Fazer' | 'Já Feito' | 'Entregue',
): Promise<SimpleApiResponse> => {
  const { data } = await apiClient.put<SimpleApiResponse>(`/api/pedidos/${id}/status`, { status });
  return data;
};

export const deletePedido = async (id: number): Promise<SimpleApiResponse> => {
  const { data } = await apiClient.delete<SimpleApiResponse>(`/api/pedidos/${id}`);
  return data;
};

export const fetchPdfBase64 = async (id: number, tipo: 'pdf' | 'os'): Promise<string> => {
  const url = tipo === 'pdf' ? `/api/pedidos/${id}/pdf` : `/api/pedidos/${id}/os/pdf`;
  const { data } = await apiClient.get<{ pdfData: string }>(url);
  return data.pdfData;
};

export default apiClient;
