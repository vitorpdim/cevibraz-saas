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
  onDeleteQuadro: (index: number) => void;
  onValorFinalManualChange?: (valor: number) => void;
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
  } = props;

  const formatarDescricaoQuadro = (quadro: QuadroNoEstado): string => {
    let desc = `${quadro.altura}cm x ${quadro.largura}cm. `;
    desc += `Molduras: ${quadro.moldurasSelecionadas.join(", ") || "N/A"}. `;
    desc += `Materiais: ${quadro.materiaisSelecionados.join(", ") || "N/A"}.`;
    if (quadro.espessuraPaspatur > 0) {
      desc += ` Paspatur: ${quadro.espessuraPaspatur}cm.`;
    }
    return desc;
  };

  return (
    <section className="card resumo-card">
      <h3>Resumo do Pedido</h3>

      <div className="quadros-lista">
        {quadros.length === 0 ? (
          <p className="empty-state">Nenhum quadro adicionado ainda.</p>
        ) : (
          <ul className="quadros-list">
            {quadros.map((quadro, index) => (
              <li key={index} className="quadro-item">
                <div className="quadro-info">
                  <span className="quadro-desc">
                    {formatarDescricaoQuadro(quadro)}
                  </span>
                  <span className="quadro-valor">
                    R$ {quadro.valorCalculado.toFixed(2)}
                  </span>
                </div>
                <button
                  className="btn-icon-danger"
                  onClick={() => onDeleteQuadro(index)}
                  aria-label="Excluir quadro"
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
        <span className="total-value">
          R$ {valorFinalManual !== undefined ? valorFinalManual.toFixed(2) : valorTotalPedido.toFixed(2)}
        </span>
      </div>

      {onValorFinalManualChange && (
        <div className="form-group" style={{ marginTop: 8 }}>
          <label htmlFor="valorFinalManual">Editar Valor Final (opcional)</label>
          <input
            type="number"
            className="form-control"
            id="valorFinalManual"
            value={valorFinalManual ?? valorTotalPedido}
            onChange={(e) => onValorFinalManualChange(Number(e.target.value))}
            min={0}
            step={0.01}
          />
        </div>
      )}

      <div className="form-actions">
        <button className="btn btn-danger" onClick={onLimparPedido}>
          Limpar Pedido
        </button>
        <button className="btn btn-success" onClick={onSalvarPedido}>
          Salvar e Gerar PDF
        </button>
      </div>
    </section>
  );
};
