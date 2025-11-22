import React, { useState, useMemo } from "react";
import { Plus, Image as ImageIcon, Edit } from "lucide-react";
import type { Moldura, Material } from "../types";
import { MolduraSelectorModal } from "./MolduraSelectorModal";

const API_URL =
  import.meta.env.VITE_API_URL || "https://cevibraz-api.onrender.com";

interface OrcamentoFormProps {
  moldurasList: Moldura[];
  materiaisList: Material[];
  atendente: string;
  cliente: string;
  telefone: string;
  altura: string;
  largura: string;
  medidaCliente: boolean;
  molduraSelecionada: string; // Nome da moldura selecionada
  materiaisDoQuadro: string[];
  espessuraPaspatur: string;
  isPaspaturVisivel: boolean;
  resumoDoQuadro: string;

  onAtendenteChange: (value: string) => void;
  onClienteChange: (value: string) => void;
  onTelefoneChange: (value: string) => void;
  onAlturaChange: (value: string) => void;
  onLarguraChange: (value: string) => void;
  onMedidaClienteChange: (checked: boolean) => void;
  onMolduraSelecionadaChange: (value: string) => void;
  onAddMoldura: () => void;
  onRemoveUltimaMoldura: () => void;
  onMaterialChange: (materialNome: string, isChecked: boolean) => void;
  onEspessuraPaspaturChange: (value: string) => void;
  onLimparCampos: () => void;
  onAdicionarQuadro: () => void;
}

export const OrcamentoForm: React.FC<OrcamentoFormProps> = (props) => {
  const {
    moldurasList,
    materiaisList,
    atendente,
    cliente,
    telefone,
    altura,
    largura,
    medidaCliente,
    molduraSelecionada,
    materiaisDoQuadro, // Lista de molduras já adicionadas ao quadro (array de strings)
    espessuraPaspatur,
    isPaspaturVisivel,
    resumoDoQuadro,
    onAtendenteChange,
    onClienteChange,
    onTelefoneChange,
    onAlturaChange,
    onLarguraChange,
    onMedidaClienteChange,
    onMolduraSelecionadaChange,
    onAddMoldura,
    onMaterialChange,
    onEspessuraPaspaturChange,
    onLimparCampos,
    onAdicionarQuadro,
  } = props;

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Encontra o objeto completo da moldura selecionada (pelo nome) para mostrar preview
  const molduraObj = useMemo(() => {
    return moldurasList.find((m) => m.nome === molduraSelecionada);
  }, [molduraSelecionada, moldurasList]);

  return (
    <div className="form-section-wrapper">
      {/* Seção 1: Cliente */}
      <section className="card form-card">
        <h3>Informações do Atendimento</h3>
        <div className="form-grid-3">
          <div className="form-group">
            <label htmlFor="atendente">Atendente</label>
            <input
              type="text"
              className="form-control"
              id="atendente"
              value={atendente}
              onChange={(e) => onAtendenteChange(e.target.value)}
              placeholder="Nome"
            />
          </div>
          <div className="form-group">
            <label htmlFor="cliente">Cliente</label>
            <input
              type="text"
              className="form-control"
              id="cliente"
              value={cliente}
              onChange={(e) => onClienteChange(e.target.value)}
              placeholder="Nome"
            />
          </div>
          <div className="form-group">
            <label htmlFor="telefone">Telefone</label>
            <input
              type="text"
              className="form-control"
              id="telefone"
              value={telefone}
              onChange={(e) => onTelefoneChange(e.target.value)}
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>
        </div>
      </section>

      {/* Seção 2: Quadro */}
      <section className="card form-card" style={{ marginTop: "1.5rem" }}>
        <h3>Composição do Quadro</h3>

        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="altura">Altura (cm)</label>
            <input
              type="number"
              className="form-control"
              id="altura"
              value={altura}
              onChange={(e) => onAlturaChange(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="largura">Largura (cm)</label>
            <input
              type="number"
              className="form-control"
              id="largura"
              value={largura}
              onChange={(e) => onLarguraChange(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={medidaCliente}
              onChange={(e) => onMedidaClienteChange(e.target.checked)}
            />
            <span> Medida exata fornecida pelo cliente</span>
          </label>
        </div>

        {/* NOVA SELEÇÃO DE MOLDURA */}
        <div className="form-group">
          <label>Moldura Selecionada</label>

          {/* Box de Seleção Visual */}
          <div
            style={{
              border: "2px dashed var(--color-border)",
              borderRadius: "12px",
              padding: "1rem",
              backgroundColor: "var(--color-bg-light)",
              marginBottom: "1rem",
            }}
          >
            {molduraObj ? (
              <div
                style={{ display: "flex", gap: "1rem", alignItems: "center" }}
              >
                {/* Mini Preview */}
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "var(--color-card-bg)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {molduraObj.imagem_url ? (
                    <img
                      src={`${API_URL}${molduraObj.imagem_url}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      alt=""
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-text)",
                        opacity: 0.5,
                      }}
                    >
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>

                {/* Informações */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontWeight: "bold", color: "var(--color-text)" }}
                  >
                    {molduraObj.nome}
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--color-text)",
                      opacity: 0.7,
                    }}
                  >
                    {molduraObj.codigo}
                  </div>
                  <div
                    style={{
                      color: "var(--color-primary)",
                      fontWeight: "bold",
                    }}
                  >
                    R${" "}
                    {parseFloat(
                      molduraObj.valor_metro_linear.toString()
                    ).toFixed(2)}
                    /m
                  </div>
                </div>

                {/* Botões de Ação */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "0.9rem" }}
                    onClick={() => setIsSelectorOpen(true)}
                    title="Trocar"
                  >
                    <Edit size={16} /> Trocar
                  </button>
                  <button
                    className="btn btn-success"
                    style={{ padding: "6px 12px", fontSize: "0.9rem" }}
                    onClick={onAddMoldura}
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem" }}>
                <p
                  style={{
                    color: "var(--color-text)",
                    opacity: 0.6,
                    marginBottom: "1rem",
                  }}
                >
                  Nenhuma moldura selecionada
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsSelectorOpen(true)}
                >
                  <ImageIcon size={18} /> Abrir Catálogo de Molduras
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Materiais (Checkboxes) */}
        <div className="form-group">
          <label>Materiais e Acabamentos</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            {materiaisList.map((material) => (
              <label
                key={material.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: materiaisDoQuadro.includes(material.nome)
                    ? "rgba(72, 187, 120, 0.1)"
                    : "transparent",
                  borderColor: materiaisDoQuadro.includes(material.nome)
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                  transition: "all 0.2s",
                }}
              >
                <input
                  type="checkbox"
                  checked={materiaisDoQuadro.includes(material.nome)}
                  onChange={(e) =>
                    onMaterialChange(material.nome, e.target.checked)
                  }
                />
                <span
                  style={{ fontSize: "0.81rem", color: "var(--color-text)" }}
                >
                  {material.nome}
                </span>
              </label>
            ))}
          </div>
        </div>

        {isPaspaturVisivel && (
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label htmlFor="paspatur">Espessura do Paspatur (cm)</label>
            <input
              type="number"
              className="form-control"
              id="paspatur"
              value={espessuraPaspatur}
              onChange={(e) => onEspessuraPaspaturChange(e.target.value)}
              step="0.5"
              min="0"
            />
          </div>
        )}

        {/* Resumo e Ações Finais */}
        <div className="form-group" style={{ marginTop: "1.5rem" }}>
          <label>Resumo do Cálculo</label>
          <textarea
            className="form-control"
            readOnly
            rows={3}
            value={resumoDoQuadro}
            style={{
              fontFamily: "monospace",
              backgroundColor: "var(--color-bg-light)",
              color: "var(--color-text)",
            }}
          />
        </div>

        <div
          className="form-actions"
          style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}
        >
          <button
            className="btn btn-secondary"
            onClick={onLimparCampos}
            style={{ flex: 1 }}
          >
            Limpar
          </button>
          <button
            className="btn btn-success"
            onClick={onAdicionarQuadro}
            style={{ flex: 1 }}
          >
            <Plus size={20} /> Adicionar ao Pedido
          </button>
        </div>
      </section>

      {/* Modal de Seleção Integrado */}
      <MolduraSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={(m) => onMolduraSelecionadaChange(m.nome)}
      />
    </div>
  );
};
