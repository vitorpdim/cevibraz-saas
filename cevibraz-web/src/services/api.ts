import axios from "axios";
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
    PedidoParaEdicao
} from "../types";

const API_URL = "https://cevibraz-api.onrender.com";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const fetchMolduras = async (): Promise<Moldura[]> => {
  const response = await apiClient.get("/api/molduras");
  return response.data;
};

export const fetchMateriais = async (): Promise<Material[]> => {
  const response = await apiClient.get("/api/materiais");
  return response.data;
};

export const calcularPrecoQuadro = async (
  dto: CalcularQuadroDto
): Promise<CalculoResponse> => {
  const response = await apiClient.post("/api/quadro/calcular", dto);
  return response.data;
};

export const salvarPedido = async (dto: PedidoApiDto): Promise<SalvarPedidoResponse> => {
  const response = await apiClient.post('/api/pedidos', dto);
  return response.data;
};

export const fetchPedidos = async (): Promise<PedidoBacklog[]> => {
  const response = await apiClient.get('/api/pedidos');
  return response.data;
};

export const updatePedidoStatus = async (
  id: number, 
  status: 'A Fazer' | 'Já Feito' | 'Entregue'
): Promise<SimpleApiResponse> => {
  const response = await apiClient.put(`/api/pedidos/${id}/status`, { status });
  return response.data;
};

export const deletePedido = async (id: number): Promise<SimpleApiResponse> => {
  const response = await apiClient.delete(`/api/pedidos/${id}`);
  return response.data;
};

export const fetchPdfBase64 = async (
  id: number, 
  tipo: 'pdf' | 'os'
): Promise<string> => {
  const url = tipo === 'pdf' ? `/api/pedidos/${id}/pdf` : `/api/pedidos/${id}/os/pdf`;
  const response = await apiClient.get(url);
  return response.data.pdfData;
};

export const fetchPedidoById = async (id: number): Promise<PedidoParaEdicao> => {
  const response = await apiClient.get(`/api/pedidos/${id}`);
  return response.data;
};

export const updatePedido = async (id: number, pedido: PedidoUpdateDto) => {
  const response = await apiClient.put(`/api/pedidos/${id}`, pedido);
  return response.data;
};

export const createMoldura = async (formData: FormData): Promise<Moldura> => {
  const response = await apiClient.post('/api/molduras', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateMoldura = async (id: number, formData: FormData): Promise<Moldura> => {
  const response = await apiClient.put(`/api/molduras/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteMoldura = async (id: number): Promise<SimpleApiResponse> => {
  const response = await apiClient.delete(`/api/molduras/${id}`);
  return response.data;
};

export const deleteMoldurasBatch = async (ids: number[]): Promise<void> => {
  if (!ids || ids.length === 0) return;
  const idsString = ids.join(',');
  await apiClient.delete(`/api/molduras/batch?ids=${encodeURIComponent(idsString)}`);
};

export const updateMaterial = async (id: number, valor_base: number): Promise<Material> => {
  const response = await apiClient.put(`/api/materiais/${id}`, { valor_base });
  return response.data;
};

export default apiClient;

