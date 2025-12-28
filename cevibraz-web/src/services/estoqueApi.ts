import axios, { AxiosError } from "axios";
import type {
  DashboardData,
  ItemEstoque,
  Movimentacao,
  ParsedXml,
  EntradaManualDto,
  AjusteEstoqueDto,
  VincularItemXmlDto,
} from "../types/estoque.types";

const API_URL = import.meta.env.VITE_API_URL || "https://cevibraz-api.onrender.com";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError) {
      console.error("API Error:", error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error("API Error:", error.message);
    } else {
      console.error("API Error:", error);
    }
    return Promise.reject(error);
  }
);

export const fetchDashboard = async (): Promise<DashboardData> => {
  try {
    const response = await apiClient.get<DashboardData>("/api/estoque/dashboard");
    return response.data;
  } catch (error) {
    throw new Error("Falha ao carregar dashboard do estoque");
  }
};

export const fetchItensEstoque = async (): Promise<ItemEstoque[]> => {
  try {
    const response = await apiClient.get<ItemEstoque[]>("/api/estoque/itens");
    // Corrigir URLs das imagens das molduras
    return response.data.map(item => ({
      ...item,
      imagem_url: item.imagem_url ? `${API_URL}${item.imagem_url}` : undefined,
    }));
  } catch (error) {
    throw new Error("Falha ao carregar itens do estoque");
  }
};

export const fetchMovimentacoes = async (
  limite: number = 100
): Promise<Movimentacao[]> => {
  try {
    const response = await apiClient.get<Movimentacao[]>("/api/estoque/movimentacoes", {
      params: { limite },
    });
    return response.data;
  } catch (error) {
    throw new Error("Falha ao carregar movimentações");
  }
};

export const fetchMovimentacoesPorItem = async (
  tipo: "moldura" | "material",
  id: number
): Promise<Movimentacao[]> => {
  try {
    const response = await apiClient.get<Movimentacao[]>(
      "/api/estoque/movimentacoes/item",
      {
        params: { tipo, id },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Falha ao carregar histórico do item");
  }
};

export const registrarEntrada = async (dto: EntradaManualDto): Promise<unknown> => {
  try {
    const response = await apiClient.post("/api/estoque/entrada", dto);
    return response.data;
  } catch (error) {
    throw new Error("Falha ao registrar entrada");
  }
};

export const registrarBaixa = async (
  tipo_item: "moldura" | "material",
  item_id: number,
  quantidade: number,
  descricao?: string
): Promise<unknown> => {
  try {
    const response = await apiClient.post("/api/estoque/baixa", {
      tipo_item,
      item_id,
      quantidade,
      descricao,
    });
    return response.data;
  } catch (error) {
    throw new Error("Falha ao registrar baixa");
  }
};

export const ajustarEstoque = async (dto: AjusteEstoqueDto): Promise<unknown> => {
  try {
    const response = await apiClient.post("/api/estoque/ajuste", dto);
    return response.data;
  } catch (error) {
    throw new Error("Falha ao ajustar estoque");
  }
};

export const parseXml = async (file: File): Promise<ParsedXml> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ParsedXml>("/api/estoque/xml/parse", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Falha ao processar arquivo XML");
  }
};

export const vincularItemXml = async (dto: VincularItemXmlDto): Promise<unknown> => {
  try {
    const response = await apiClient.post("/api/estoque/xml/vincular", dto);
    return response.data;
  } catch (error) {
    throw new Error("Falha ao vincular item XML");
  }
};

export default apiClient;
