import React, { useState, useEffect, useMemo } from "react";
import type { PedidoBacklog } from "../types";
import {
  fetchPedidos,
  updatePedidoStatus,
  deletePedido,
  fetchPdfBase64,
} from "../services/api";
import { Link } from "react-router-dom";

type AbaStatus = "a-fazer" | "ja-feito" | "entregue";

const getProximoStatus = (status: AbaStatus) => {
  if (status === "a-fazer") return "Já Feito";
  if (status === "ja-feito") return "Entregue";
  return null;
};

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
    } catch (err: unknown) {
      console.error("Erro ao carregar pedidos:", err);
      setError("Falha ao carregar pedidos. Verifique a API.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const handleMudarStatus = async (id: number, statusAtual: AbaStatus) => {
    const proximoStatus = getProximoStatus(statusAtual);
    if (!proximoStatus) return;

    if (!confirm(`Mover pedido para "${proximoStatus}"?`)) return;

    try {
      await updatePedidoStatus(id, proximoStatus);
      await carregarPedidos();
    } catch (err) {
      console.error("Erro ao mudar status:", err);
      alert("Erro ao mudar o status.");
    }
  };

  const handleDelete = async (id: number, numeroPedido: string) => {
    if (
      !confirm(
        `Tem certeza que deseja DELETAR o pedido ${numeroPedido}? Esta ação é irreversível.`
      )
    ) {
      return;
    }
    try {
      await deletePedido(id);
      await carregarPedidos();
    } catch (err) {
      console.error("Erro ao deletar pedido:", err);
      alert("Erro ao deletar o pedido.");
    }
  };

  const handleDownloadPDF = async (
    id: number,
    tipo: "pdf" | "os",
    filename: string | null
  ) => {
    if (!filename) return;

    try {
      const base64Data = await fetchPdfBase64(id, tipo);

      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${base64Data}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Erro ao gerar o PDF. Verifique o console.");
      console.error(err);
    }
  };

  // --- renderiza ---

  const { pedidosAFazer, pedidosJaFeito, pedidosEntregue } = useMemo(() => {
    return {
      pedidosAFazer: pedidos.filter((p) => p.status === "A Fazer"),
      pedidosJaFeito: pedidos.filter((p) => p.status === "Já Feito"),
      pedidosEntregue: pedidos.filter((p) => p.status === "Entregue"),
    };
  }, [pedidos]);

  const renderTabelaLinhas = (
    lista: PedidoBacklog[],
    statusAtual: AbaStatus
  ) => {
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
          <td colSpan={6}>Nenhum pedido encontrado nesta aba.</td>
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
                }
              >
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

  return (
    <div className="container">
      <h1>Backlog de Pedidos</h1>

      <div className="tab-container">
        <div className="tab-buttons">
          <button
            className={`tab-button ${abaAtiva === "a-fazer" ? "active" : ""}`}
            onClick={() => setAbaAtiva("a-fazer")}
          >
            A Fazer
          </button>
          <button
            className={`tab-button ${abaAtiva === "ja-feito" ? "active" : ""}`}
            onClick={() => setAbaAtiva("ja-feito")}
          >
            Já Feito
          </button>
          <button
            className={`tab-button ${abaAtiva === "entregue" ? "active" : ""}`}
            onClick={() => setAbaAtiva("entregue")}
          >
            Entregue
          </button>
        </div>

        <div className="tab-content">
          <div
            id="a-fazer"
            className={`tab-pane ${abaAtiva === "a-fazer" ? "active" : ""}`}
          >
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
              <tbody>{renderTabelaLinhas(pedidosAFazer, "a-fazer")}</tbody>
            </table>
          </div>

          <div
            id="ja-feito"
            className={`tab-pane ${abaAtiva === "ja-feito" ? "active" : ""}`}
          >
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
              <tbody>{renderTabelaLinhas(pedidosJaFeito, "ja-feito")}</tbody>
            </table>
          </div>

          <div
            id="entregue"
            className={`tab-pane ${abaAtiva === "entregue" ? "active" : ""}`}
          >
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
              <tbody>{renderTabelaLinhas(pedidosEntregue, "entregue")}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
