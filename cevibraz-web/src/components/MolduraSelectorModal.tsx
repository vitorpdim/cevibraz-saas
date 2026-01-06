import React, { useState, useEffect, useMemo } from "react";
import { X, Search, Image as ImageIcon } from "lucide-react";
import type { Moldura } from "../types";
import { fetchMolduras } from "../services/api";

const API_URL =
  import.meta.env.VITE_API_URL || "https://cevibraz-api.onrender.com";

interface MolduraSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (moldura: Moldura) => void;
  moldurasJaSelecionadas?: string[];
}

export const MolduraSelectorModal: React.FC<MolduraSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [molduras, setMolduras] = useState<Moldura[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPreview, setSelectedPreview] = useState<Moldura | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchMolduras()
        .then((data) => {
          setMolduras(data);
          if (data.length > 0) setSelectedPreview(data[0]);
        })
        .catch((err) => console.error("Erro ao carregar molduras", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // filtro de busca
  const filteredMolduras = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return molduras.filter(
      (m) =>
        m.nome.toLowerCase().includes(lowerTerm) ||
        m.codigo.toLowerCase().includes(lowerTerm)
    );
  }, [molduras, searchTerm]);

  // Função para determinar o status do estoque
  const getEstoqueStatus = (estoque: number | undefined) => {
    if (estoque === undefined || estoque === null) {
      return { tipo: "desconhecido", label: "Sem dados", cor: "#94a3b8" };
    }
    const estoqueNum =
      typeof estoque === "string" ? parseFloat(estoque) : estoque;
    if (isNaN(estoqueNum)) {
      return { tipo: "desconhecido", label: "Sem dados", cor: "#94a3b8" };
    }
    if (estoqueNum <= 0) {
      return { tipo: "critico", label: "Estoque Zerado", cor: "#ef4444" };
    }
    if (estoqueNum < 10) {
      return { tipo: "baixo", label: "Estoque Baixo", cor: "#f59e0b" };
    }
    return { tipo: "ok", label: "Em Estoque", cor: "#10b981" };
  };

  const statusEstoque = selectedPreview
    ? getEstoqueStatus(selectedPreview.estoque_atual)
    : null;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "900px" }}
      >
        {/* --- HEADER --- */}
        <div className="modal-header">
          <h2>Selecionar Moldura</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>

        <div
          className="moldura-selector-container"
          style={{ margin: "24px", border: "none", background: "transparent" }}
        >
          <div className="moldura-selector-layout">
            {/* --- LADO ESQUERDO --- */}
            <div className="moldura-preview-section">
              <div className="moldura-preview-card">
                <div
                  className="moldura-preview-image"
                  style={{ position: "relative", overflow: "hidden" }}
                >
                  {selectedPreview?.imagem_url ? (
                    <>
                      <img
                        src={`${API_URL}${selectedPreview.imagem_url}`}
                        alt={selectedPreview.nome}
                      />
                      {/* Badge de Estoque no Preview */}
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          backgroundColor: statusEstoque?.cor,
                          color: "white",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                          backdropFilter: "blur(4px)",
                          border:
                            statusEstoque?.tipo === "critico"
                              ? "2px solid #fff"
                              : "none",
                        }}
                      >
                        {statusEstoque?.label}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="no-image">
                        <ImageIcon size={40} />
                        <span>Sem imagem</span>
                      </div>
                      {selectedPreview && (
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            backgroundColor: statusEstoque?.cor,
                            color: "white",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                          }}
                        >
                          {statusEstoque?.label}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {selectedPreview && (
                  <div className="moldura-preview-info">
                    <div className="moldura-preview-item">
                      <span className="moldura-preview-label">Código:</span>
                      <span className="moldura-preview-value">
                        {selectedPreview.codigo}
                      </span>
                    </div>
                    <div className="moldura-preview-item">
                      <span className="moldura-preview-label">Preço:</span>
                      <span className="moldura-preview-value">
                        R${" "}
                        {parseFloat(
                          selectedPreview.valor_metro_linear.toString()
                        ).toFixed(2)}
                        /m
                      </span>
                    </div>
                    <div className="moldura-preview-item">
                      <span className="moldura-preview-label">Estoque:</span>
                      <span
                        className="moldura-preview-value"
                        style={{
                          color: statusEstoque?.cor,
                          fontWeight: 700,
                        }}
                      >
                        {selectedPreview.estoque_atual !== undefined
                          ? `${parseFloat(
                              String(selectedPreview.estoque_atual)
                            ).toFixed(2)}m`
                          : "N/A"}
                      </span>
                    </div>
                    {selectedPreview.estoque_atual !== undefined &&
                      parseFloat(String(selectedPreview.estoque_atual)) <=
                        0 && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "10px",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid #ef4444",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            color: "#dc2626",
                            fontWeight: 600,
                            textAlign: "center",
                          }}
                        >
                          ⚠️ Estoque zerado - Será necessário encomendar
                        </div>
                      )}
                    {selectedPreview.estoque_atual !== undefined &&
                      parseFloat(String(selectedPreview.estoque_atual)) > 0 &&
                      parseFloat(String(selectedPreview.estoque_atual)) <
                        10 && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "10px",
                            backgroundColor: "rgba(245, 158, 11, 0.1)",
                            border: "1px solid #f59e0b",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            color: "#d97706",
                            fontWeight: 600,
                            textAlign: "center",
                          }}
                        >
                          ⚠️ Estoque baixo - Verifique disponibilidade
                        </div>
                      )}
                    <button
                      className="btn btn-success"
                      style={{
                        width: "100%",
                        padding: "12px",
                        marginTop: "16px",
                      }}
                      onClick={() => {
                        onSelect(selectedPreview);
                        onClose();
                      }}
                    >
                      Confirmar Seleção
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* --- LADO DIREITO --- */}
            <div className="moldura-list-section">
              <div style={{ position: "relative", marginBottom: "1rem" }}>
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-secondary)",
                  }}
                />
                <input
                  type="text"
                  className="moldura-search-input"
                  style={{ paddingLeft: "2.5rem", margin: 0 }}
                  placeholder="Filtrar por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="moldura-list">
                {loading ? (
                  <p style={{ textAlign: "center", padding: "2rem" }}>
                    Carregando...
                  </p>
                ) : filteredMolduras.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Nenhuma moldura encontrada.
                  </p>
                ) : (
                  filteredMolduras.map((moldura) => {
                    const statusItem = getEstoqueStatus(moldura.estoque_atual);
                    const isSelected = selectedPreview?.id === moldura.id;

                    return (
                      <div
                        key={moldura.id}
                        className={`moldura-list-item ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedPreview(moldura);
                        }}
                        style={{
                          cursor: "pointer",
                          position: "relative",
                          opacity: statusItem.tipo === "critico" ? 0.8 : 1,
                          backgroundColor: isSelected
                            ? "rgba(72, 187, 120, 0.15)"
                            : "transparent",
                        }}
                      >
                        {/* Indicador de Estoque na Lista */}
                        <div
                          style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: statusItem.cor,
                            boxShadow: `0 0 8px ${statusItem.cor}`,
                          }}
                        />

                        <div
                          className="moldura-list-item-info"
                          style={{ marginLeft: "16px" }}
                        >
                          <div className="moldura-list-item-name">
                            {moldura.nome}
                          </div>
                          <div className="moldura-list-item-code">
                            {moldura.codigo}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "4px 8px",
                              backgroundColor: statusItem.cor,
                              color: "white",
                              borderRadius: "4px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {statusItem.label}
                          </span>
                          <div className="moldura-list-item-price">
                            R${" "}
                            {parseFloat(
                              moldura.valor_metro_linear.toString()
                            ).toFixed(2)}
                            /m
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
