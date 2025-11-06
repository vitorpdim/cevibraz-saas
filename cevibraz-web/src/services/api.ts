import axios from "axios";
import type {
    Moldura,
    Material,
    CalcularQuadroDto,
    CalculoResponse,
    CreatePedidoDto,
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

export default apiClient;
