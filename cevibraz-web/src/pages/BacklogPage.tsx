// =======================================
// Imports externos
// =======================================

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

// =======================================
// Imports internos
// =======================================

import type { PedidoBacklog } from "../types";
import {
  fetchPedidos,
  updatePedidoStatus,
  deletePedido,
  fetchPdfBase64,
} from "../services/api";
import { downloadBase64ComoPdf } from "../utils/formatters";

// =======================================
// Tipos
// =======================================

type AbaStatus = "a-fazer" | "ja-feito" | "entregue";

type StatusLabel = "A Fazer" | "Já Feito" | "Entregue";

// =======================================
// Helpers
// =======================================

const PROXIMO_STATUS: Partial<Record<AbaStatus, StatusLabel>> = {
  "a-fazer": "Já Feito",
  "ja-feito": "Entregue",
};

// =======================================
// Componente
// =======================================

export const BacklogPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [pedidos, setPedidos] = useState<PedidoBacklog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<AbaStatus>("a-fazer");

  const carregarPedidos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchPedidos();
      setPedidos(data);
    } catch {
      setError("Falha ao carregar pedidos. Verifique a conexão com a API!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const handleMudarStatus = async (id: number, statusAtual: AbaStatus) => {
    const proximoStatus = PROXIMO_STATUS[statusAtual];
    if (!proximoStatus) return;
    if (!confirm(`Mover pedido para "${proximoStatus}"?`)) return;

    try {
      await updatePedidoStatus(id, proximoStatus);
      await carregarPedidos();
    } catch {
      alert("Falha ao atualizar o status do pedido.");
    }
  };

  const handleDelete = async (id: number, numeroPedido: string) => {
    if (
      !confirm(
        `Deseja remover permanentemente o pedido ${numeroPedido}? Esta ação é irreversível.`,
      )
    ) {
      return;
    }
    try {
      await deletePedido(id);
      await carregarPedidos();
    } catch {
      alert("Falha ao remover o pedido.");
    }
  };

  const handleDownloadPDF = async (
    id: number,
    tipo: "pdf" | "os",
    filename: string | null,
  ) => {
    if (!filename) return;
    try {
      const base64Data = await fetchPdfBase64(id, tipo);
      downloadBase64ComoPdf(base64Data, filename);
    } catch {
      alert("Falha ao gerar o PDF. Tente novamente.");
    }
  };

  const { pedidosAFazer, pedidosJaFeito, pedidosEntregue } = useMemo(
    () => ({
      pedidosAFazer: pedidos.filter((p) => p.status === "A Fazer"),
      pedidosJaFeito: pedidos.filter((p) => p.status === "Já Feito"),
      pedidosEntregue: pedidos.filter((p) => p.status === "Entregue"),
    }),
    [pedidos],
  );

  const renderLinhas = (lista: PedidoBacklog[], statusAtual: AbaStatus) => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={6}>Carregando pedidos...</td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td colSpan={6}>{error}</td>
        </tr>
      );
    }
    if (lista.length === 0) {
      return (
        <tr>
          <td colSpan={6}>Nenhum pedido nesta etapa.</td>
        </tr>
      );
    }

    return lista.map((pedido) => {
      const valorFinal =
        typeof pedido.valor_final === "string"
          ? parseFloat(pedido.valor_final)
          : pedido.valor_final;

      return (
        <tr key={pedido.id}>
          <td>{pedido.cliente_nome}</td>
          <td>{pedido.numero_pedido}</td>
          <td>{new Date(pedido.data_criacao).toLocaleDateString("pt-BR")}</td>
          <td>R$ {valorFinal.toFixed(2)}</td>
          
          <td className="action-cell">
            {pedido.pdf_filename && (
              
              <button
                className="btn-pdf"
                onClick={() =>
                  handleDownloadPDF(pedido.id, "pdf", pedido.pdf_filename)
                }>
                Pedido PDF
              </button>
            )}

            {pedido.pdf_os_filename && (
              <button
                className="btn-os"
                onClick={() =>
                  handleDownloadPDF(pedido.id, "os", pedido.pdf_os_filename)
                }
              >
                OS PDF
              </button>
            )} 
          </td>

          <td className="action-cell">
            {statusAtual !== "entregue" && (
              <button
                className="btn-avancar"
                onClick={() => handleMudarStatus(pedido.id, statusAtual)}
              >
                Avançar
              </button>
            )}
            <Link
              to={`/orcamento/${pedido.id}`}
              className="btn btn-success"
              style={{ marginRight: 8 }}
            >
              Editar
            </Link>
            <button
              className="btn-delete"
              onClick={() => handleDelete(pedido.id, pedido.numero_pedido)}
            >
              Excluir
            </button>
          </td>
        </tr>
      );
    });
  };

  const renderTabela = (lista: PedidoBacklog[], statusAtual: AbaStatus) => (
    <table>
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Nº Pedido</th>
          <th>Data</th>
          <th>Valor</th>
          <th>Downloads</th>
          <th className="action-cell">Ações</th>
        </tr>
      </thead>
      <tbody>{renderLinhas(lista, statusAtual)}</tbody>
    </table>
  );

  const abas: { id: AbaStatus; label: string; lista: PedidoBacklog[] }[] = [
    { id: "a-fazer", label: "A Fazer", lista: pedidosAFazer },
    { id: "ja-feito", label: "Já Feito", lista: pedidosJaFeito },
    { id: "entregue", label: "Entregue", lista: pedidosEntregue },
  ];

  return (
    <div className="container">
      <h1>Backlog de Pedidos</h1>

      <div className="tab-container">
        <div className="tab-buttons">
          {abas.map((aba) => (
            <button
              key={aba.id}
              className={`tab-button ${abaAtiva === aba.id ? "active" : ""}`}
              onClick={() => setAbaAtiva(aba.id)}
            >
              {aba.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {abas.map((aba) => (
            <div
              key={aba.id}
              id={aba.id}
              className={`tab-pane ${abaAtiva === aba.id ? "active" : ""}`}
            >
              {renderTabela(aba.lista, aba.id)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
