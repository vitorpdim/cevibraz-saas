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
  // habilita null p resetar
  onValorFinalManualChange?: (valor: number | null) => void;
  isEditing: boolean;
  isSalvando: boolean;
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
  } = props;

  const formatarDescricaoQuadro = (quadro: QuadroNoEstado): string => {
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
  return desc;
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

  // valor mostrado no "VALOR TOTAL"
  const valorFinalExibido = valorFinalManual ?? valorTotalPedido;

  // valor no input se o valorFinalManual for null vai usar o total
  const valorInput = valorFinalManual ?? valorTotalPedido;

  return (
    <section className="card resumo-card">
      <h3>Resumo do pedido</h3>

      <div className="quadros-lista">
        {quadros.length === 0 ? (
          <p className="empty-state">Nenhum quadro adicionado ainda.</p>
        ) : (
          <ul className="quadros-list">
            {quadros.map((quadro, index) => (
              <li key={quadro.id} className="quadro-item">
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
        </div>
      )}

      <div className="form-actions">
        <button className="btn btn-danger" onClick={onLimparPedido}>
          {isEditing ? "Cancelar Edição" : "Limpar Pedido"}
        </button>
        <button
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
