import React from "react";
import { Trash2 } from "lucide-react";
import type { QuadroNoEstado } from "../types";

interface ResumoPedidoProps {
  quadros: QuadroNoEstado[];
  observacoes: string;
  valorTotalPedido: number;
  valorFinalManual?: number;
  onObservacoesChange: (value: string) => void;
  onLimparPedido: () => void;
  onSalvarPedido: () => void;
  onDeleteQuadro: (id: number) => void;
  onValorFinalManualChange?: (valor: number | null) => void;
  isEditing: boolean;
  isSalvando: boolean;
  ocultarValoresUnitarios?: boolean;
  onOcultarValoresUnitariosChange?: (checked: boolean) => void;
}

export const ResumoPedido: React.FC<ResumoPedidoProps> = (props) => {
  const {
    quadros,
    observacoes,
    valorTotalPedido,
    valorFinalManual,
    onObservacoesChange,
    onLimparPedido,
    onSalvarPedido,
    onDeleteQuadro,
    onValorFinalManualChange,
    isEditing,
    isSalvando,
    ocultarValoresUnitarios,
    onOcultarValoresUnitariosChange,
  } = props;

  const formatarDescricaoQuadro = (quadro: QuadroNoEstado): React.ReactNode => {
    if (quadro.detalhesCalculo && quadro.detalhesCalculo.length > 0) {
      return (
        <div style={{ fontSize: "0.9rem" }}>
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>
            Quadro {quadro.altura}cm x {quadro.largura}cm
          </div>
          <ul
            style={{
              paddingLeft: "20px",
              margin: 0,
              color: "var(--color-text-secondary)",
              fontSize: "0.85rem",
            }}
          >
            {quadro.detalhesCalculo.map((detalhe, idx) => (
              <li key={idx}>{detalhe}</li>
            ))}
          </ul>
        </div>
      );
    }

    let desc = `${quadro.altura}cm x ${quadro.largura}cm. `;
    if (quadro.moldurasSelecionadas.length > 0) {
      desc += `Molduras: ${quadro.moldurasSelecionadas.join(", ")}. `;
    }
    if (quadro.materiaisSelecionados.length > 0) {
      desc += `Materiais: ${quadro.materiaisSelecionados.join(", ")}. `;
    }
    if (quadro.espessuraPaspatur > 0) {
      desc += ` Paspatur: ${quadro.espessuraPaspatur}cm.`;
    }

    return <span>{desc}</span>;
  };

  const handleManualValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onValorFinalManualChange) {
      const valorStr = e.target.value;
      if (valorStr === "") {
        onValorFinalManualChange(null);
        return;
      }
      const valorNum = parseFloat(valorStr);
      if (!isNaN(valorNum)) {
        onValorFinalManualChange(valorNum);
      }
    }
  };

  const valorFinalExibido = valorFinalManual ?? valorTotalPedido;
  const valorInput = valorFinalManual ?? valorTotalPedido;

  return (
    <section className="card resumo-card">
      <h3>Resumo do Pedido</h3>

      <div className="quadros-lista">
        {quadros.length === 0 ? (
          <p className="empty-state">Nenhum quadro adicionado ainda.</p>
        ) : (
          <ul className="quadros-list">
            {quadros.map((quadro) => (
              <li
                key={quadro.id}
                className="quadro-item"
                style={{ alignItems: "flex-start" }}
              >
                <div className="quadro-info">
                  <span className="quadro-desc">
                    {formatarDescricaoQuadro(quadro)}
                  </span>
                  <span className="quadro-valor" style={{ marginTop: "8px" }}>
                    Total: R$ {quadro.valorCalculado.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-icon-danger"
                  onClick={() => onDeleteQuadro(quadro.id)}
                  aria-label="Excluir quadro"
                  style={{ marginTop: "4px" }}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="observacoes">Observações</label>
        <textarea
          className="form-control"
          id="observacoes"
          rows={3}
          value={observacoes}
          onChange={(e) => onObservacoesChange(e.target.value)}
          placeholder="Observações gerais do pedido..."
        ></textarea>
      </div>

      <div className="total-container">
        <span className="total-label">VALOR TOTAL:</span>
        <span className="total-value">R$ {valorFinalExibido.toFixed(2)}</span>
      </div>

      {onValorFinalManualChange && (
        <div className="form-group" style={{ marginTop: 8 }}>
          <label htmlFor="valorFinalManual">
            Editar valor final (opcional)
          </label>
          <input
            type="number"
            className="form-control"
            id="valorFinalManual"
            value={valorInput}
            onChange={handleManualValueChange}
            min={0}
            step={0.01}
          />

          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id="ocultarValores"
              checked={!!ocultarValoresUnitarios}
              onChange={(e) => onOcultarValoresUnitariosChange?.(e.target.checked)}
            />
            <label htmlFor="ocultarValores" style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              Ocultar preços dos itens no PDF
            </label>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-danger"
          onClick={onLimparPedido}
        >
          {isEditing ? "Cancelar Edição" : "Limpar Pedido"}
        </button>
        <button
          type="submit"
          className="btn btn-success"
          onClick={onSalvarPedido}
          disabled={isSalvando}
        >
          {isSalvando
            ? "Salvando..."
            : isEditing
            ? "Atualizar Pedido"
            : "Salvar e Gerar PDF"}
        </button>
      </div>
    </section>
  );
};
