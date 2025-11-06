import React from "react";
import type { QuadroParaSalvar } from "../types";

interface ResumoPedidoProps {
  quadros: QuadroParaSalvar[];
  observacoes: string;
  valorTotalPedido: number;
  onObservacoesChange: (value: string) => void;
  onLimparPedido: () => void;
  onSalvarPedido: () => void;
  onDeleteQuadro: (index: number) => void;
}

export const ResumoPedido: React.FC<ResumoPedidoProps> = (props) => {
  const {
    quadros,
    observacoes,
    valorTotalPedido,
    onObservacoesChange,
    onLimparPedido,
    onSalvarPedido,
    onDeleteQuadro,
  } = props;

  // func helper para formatar a descrição do quadro
  const formatarDescricaoQuadro = (quadro: QuadroParaSalvar): string => {
    let desc = `${quadro.altura}cm x ${quadro.largura}cm. `;
    desc += `Molduras: ${quadro.moldurasSelecionadas.join(", ") || "N/A"}. `;
    desc += `Materiais: ${quadro.materiaisSelecionados.join(", ") || "N/A"}.`;
    if (quadro.espessuraPaspatur > 0) {
      desc += ` Paspatur: ${quadro.espessuraPaspatur}cm.`;
    }
    return desc;
  };

  return (
    <div className="container-resumo-pedido">
      <h2 className="titulo-form">Resumo do Pedido</h2>

      {/* */}
      <div className="mb-3" id="quadros-adicionados-lista">
        {quadros.length === 0 ? (
          <p>Nenhum quadro adicionado.</p>
        ) : (
          <ul className="list-group">
            {quadros.map((quadro, index) => (
              <li
                key={index}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{formatarDescricaoQuadro(quadro)}</strong>
                  <br />
                  <span className="text-success">
                    Valor: R$ {quadro.valorCalculado.toFixed(2)}
                  </span>
                </div>
                <div>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onDeleteQuadro(index)}
                  >
                    Excluir
                  </button>
                  {/* btn de editar vai vir no futuro */}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* */}
      <div className="mb-3" id="observacoes-pedido">
        <label htmlFor="observacoes" className="form-label">
          Observações Gerais do Pedido
        </label>
        <textarea
          className="form-control"
          id="observacoes"
          rows={3}
          value={observacoes}
          onChange={(e) => onObservacoesChange(e.target.value)}
        ></textarea>
      </div>

      {/* */}
      <div className="container-total" id="container-total">
        <h3>VALOR TOTAL:</h3>
        <h3 id="valorTotalPedido">R$ {valorTotalPedido.toFixed(2)}</h3>
      </div>

      {/* */}
      <div className="botoes-acao-pedido" id="botoes-acao-pedido">
        <button
          type="button"
          className="btn btn-danger me-2"
          onClick={onLimparPedido}
        >
          Limpar Pedido
        </button>
        <button
          type="button"
          className="btn btn-success"
          onClick={onSalvarPedido}
        >
          Salvar Pedido e Gerar PDF
        </button>
      </div>

      {/* modal vai ser reimplementado dps */}
    </div>
  );
};
