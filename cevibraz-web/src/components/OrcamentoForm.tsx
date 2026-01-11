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
  molduraSelecionada: string;
  materiaisDoQuadro: Record<string, number>; // mudou de string[] p mapa nome -> quantidade
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
  onMaterialChange: (materialNome: string, quantidade: number) => void; // agr ta recebendo quantidade
  onEspessuraPaspaturChange: (value: string) => void;
  onLimparCampos: () => void;
  onAdicionarQuadro: () => void;
  condicaoPagamento: string;
  onCondicaoPagamentoChange: (val: string) => void;
  acrescimo: string;
  onAcrescimoChange: (value: string) => void;
  quantidade: string;
  onQuantidadeChange: (value: string) => void;
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
    materiaisDoQuadro,
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
    condicaoPagamento,
    onCondicaoPagamentoChange,
    acrescimo,
    onAcrescimoChange,
    quantidade,
    onQuantidadeChange,
  } = props;

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const molduraObj = useMemo(() => {
    return moldurasList.find((m) => m.nome === molduraSelecionada);
  }, [molduraSelecionada, moldurasList]);

  return (
    <div className="form-section-wrapper">
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
          <div className="form-group" style={{ marginTop: '1rem' }}>
           <label htmlFor="pagamento">Condição de Pagamento</label>
           <input
             type="text"
             className="form-control"
             id="pagamento"
             value={condicaoPagamento}
             onChange={(e) => onCondicaoPagamentoChange(e.target.value)}
             placeholder="Ex: cartão de crédito, Pix ou À vista"
           />
        </div>
        </div>
      </section>

      {/* section do quadro */}
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

        <div className="form-group">
          <label>Moldura Selecionada</label>

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
                  <ImageIcon size={18} /> Abrir catálogo de molduras
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Materiais e acabamentos</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            {materiaisList.map((material) => {
              const quantidade = materiaisDoQuadro[material.nome] || 0;
              return (
                <div
                  key={material.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 6 }} />
                    <span style={{ fontSize: "0.9rem", color: "var(--color-text)" }}>
                      {material.nome}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="form-control"
                      style={{ width: 80 }}
                      value={quantidade}
                      onChange={(e) =>
                        onMaterialChange(material.nome, Math.max(0, Number(e.target.value || 0)))
                      }
                    />
                  </div>
                </div>
              );
            })}
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

        <div className="form-group" style={{ marginTop: "1.5rem" }}>
          <label>Resumo do cálculo</label>
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
              
        <div className="form-group">
          <label htmlFor="acrescimo">Acréscimo / folga (cm)</label>
          <input
            type="number"
            className="form-control"
            id="acrescimo"
            value={acrescimo}
            onChange={(e) => onAcrescimoChange(e.target.value)}
            placeholder="0"
            step="0.5"
            min="0"
          />
          <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
            Aumenta a área de cálculo (vidro/fundo) sem mudar a medida nominal.
          </small>
        </div>

        <div className="form-group" style={{ marginTop: "1.5rem" }}>
          <label htmlFor="quantidade">Quantidade de quadros iguais</label>
          <input
            type="number"
            className="form-control"
            id="quantidade"
            value={quantidade}
            onChange={(e) => onQuantidadeChange(e.target.value)}
            placeholder="1"
            min="1"
            step="1"
          />
          <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
            Adicione múltiplos quadros com as mesmas medidas e materiais de uma vez
          </small>
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
            <Plus size={20} /> Adicionar ao pedido
          </button>
        </div>
      </section>

      <MolduraSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={(m) => onMolduraSelecionadaChange(m.nome)}
      />
    </div>
  );
};
