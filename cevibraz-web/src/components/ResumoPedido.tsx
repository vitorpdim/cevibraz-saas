import React, { useState } from "react";
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
  onValorFinalManualChange?: (valor: number | null) => void;
  onQuadrosChange?: (quadros: QuadroNoEstado[]) => void;
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
    onQuadrosChange,
    isEditing,
    isSalvando,
    ocultarValoresUnitarios,
    onOcultarValoresUnitariosChange,
  } = props;

  const [aplicarValorFinal, setAplicarValorFinal] = useState(false);

  const calcularValorProporcional = (quadro: QuadroNoEstado): number => {
    if (!aplicarValorFinal || valorFinalManual === undefined || valorFinalManual === null) {
      return quadro.valorCalculado;
    }

    const totalCalculado = quadros.reduce((acc, q) => acc + q.valorCalculado, 0);
    if (totalCalculado === 0) return 0;

    return (quadro.valorCalculado / totalCalculado) * valorFinalManual;
  };

  const handleAplicarValorFinal = () => {
    const novoEstado = !aplicarValorFinal;
    setAplicarValorFinal(novoEstado);

    if (novoEstado && valorFinalManual !== undefined && valorFinalManual !== null) {
      // proporcionaliza valores em cada quadro
      const quadrosAtualizados = quadros.map((q) => ({
        ...q,
        valorCalculado: calcularValorProporcional(q),
      }));
      onQuadrosChange?.(quadrosAtualizados);
    } else if (!novoEstado) {
      // volta aos valores originais (recarregar do estado ou manter?)
      // Por enquanto, mantemos como está
    }
  };

  const handleManualValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onValorFinalManualChange) {
      const valorStr = e.target.value;
      if (valorStr === "") {
        onValorFinalManualChange(null);
        setAplicarValorFinal(false);
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
            {quadros.map((quadro, index) => {
              const valorExibido = aplicarValorFinal 
                ? calcularValorProporcional(quadro) 
                : quadro.valorCalculado;
              
              return (
                <li
                  key={quadro.id}
                  className="quadro-item"
                  style={{ alignItems: "flex-start" }}
                >
                  <div className="quadro-info">
                    <span className="quadro-desc">
                      Quadro {quadro.altura}cm x {quadro.largura}cm
                    </span>
                    <span className="quadro-valor" style={{ marginTop: "8px" }}>
                      Total: R$ {valorExibido.toFixed(2)}
                    </span>
                  </div>
                  <button
                    className="btn-icon-danger"
                    onClick={() => onDeleteQuadro(index)}
                    aria-label="Excluir quadro"
                    style={{ marginTop: "4px" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
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

      {onValorFinalManualChange && (
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAplicarValorFinal}
            disabled={valorFinalManual === null || valorFinalManual === undefined}
          >
            {aplicarValorFinal 
              ? "Voltar aos valores originais" 
              : "Aplicar valor final na descrição"}
          </button>
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
