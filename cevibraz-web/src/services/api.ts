import axios from "axios";
import type {
    Moldura,
    Material,
    CalcularQuadroDto,
    CalculoResponse,
    CreatePedidoDto,
    PedidoBacklog,
    SimpleApiResponse,
    SalvarPedidoResponse
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

export const salvarPedido = async (dto: CreatePedidoDto): Promise<SalvarPedidoResponse> => {
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

export default apiClient;
