import React from "react";
import type { Moldura, Material } from "../types";

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
    onRemoveUltimaMoldura,
    onMaterialChange,
    onEspessuraPaspaturChange,
    onLimparCampos,
    onAdicionarQuadro,
  } = props;

  return (
    <div className="form-orcamento">
      <h2 className="titulo-form">Cálculo de Orçamento</h2>

      {/* */}
      <div className="mb-3 secao-form">
        <div className="row">
          <div className="col-md-4">
            <label htmlFor="atendente" className="form-label">
              Atendente
            </label>
            <input
              type="text"
              className="form-control"
              id="atendente"
              value={atendente}
              onChange={(e) => onAtendenteChange(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="cliente" className="form-label">
              Cliente
            </label>
            <input
              type="text"
              className="form-control"
              id="cliente"
              value={cliente}
              onChange={(e) => onClienteChange(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="telefone" className="form-label">
              Telefone
            </label>
            <input
              type="text"
              className="form-control"
              id="telefone"
              placeholder="(XX) XXXXX-XXXX"
              value={telefone}
              onChange={(e) => onTelefoneChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* */}
      <div className="mb-3 secao-form">
        <div className="row align-items-end">
          <div className="col-md-3">
            <label htmlFor="altura" className="form-label">
              Altura (cm)
            </label>
            <input
              type="number"
              className="form-control"
              id="altura"
              value={altura}
              onChange={(e) => onAlturaChange(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="largura" className="form-label">
              Largura (cm)
            </label>
            <input
              type="number"
              className="form-control"
              id="largura"
              value={largura}
              onChange={(e) => onLarguraChange(e.target.value)}
            />
          </div>
          <div className="col-md-6 d-flex align-items-center mt-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="medida-cliente"
                checked={medidaCliente}
                onChange={(e) => onMedidaClienteChange(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="medida-cliente">
                Medida fornecida pelo cliente (não arredondar)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* */}
      <div className="mb-3 secao-form">
        <label htmlFor="molduraSelect" className="form-label">
          Selecionar Moldura
        </label>
        <div className="input-group">
          <select
            className="form-select"
            id="molduraSelect"
            value={molduraSelecionada}
            onChange={(e) => onMolduraSelecionadaChange(e.target.value)}
          >
            <option value="">Selecione uma moldura...</option>
            {moldurasList.map((moldura) => (
              <option key={moldura.id} value={moldura.nome}>
                {moldura.nome} (Cod: {moldura.codigo})
              </option>
            ))}
          </select>
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={onAddMoldura}
          >
            Adicionar
          </button>
          <button
            className="btn btn-outline-danger"
            type="button"
            onClick={onRemoveUltimaMoldura}
          >
            Remover Última
          </button>
        </div>
      </div>

      {/* */}
      <div className="mb-3 secao-form">
        <label className="form-label">Selecionar Materiais</label>
        <div id="materiaisCheckboxes" className="row">
          {materiaisList.map((material) => (
            <div className="col-md-3" key={material.id}>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={material.nome}
                  id={`material-${material.id}`}
                  data-tipo={material.tipo_calculo}
                  checked={materiaisDoQuadro.includes(material.nome)}
                  onChange={(e) =>
                    onMaterialChange(e.target.value, e.target.checked)
                  }
                />
                <label
                  className="form-check-label"
                  htmlFor={`material-${material.id}`}
                >
                  {material.nome}
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* renderizaçao condicional do paspatur */}
        {isPaspaturVisivel && (
          <div id="container-paspatur" className="mt-2">
            <label htmlFor="paspaturEspessura" className="form-label">
              Espessura do Paspatur (cm)
            </label>
            <input
              type="number"
              className="form-control"
              id="paspaturEspessura"
              step="0.5"
              min="0"
              value={espessuraPaspatur}
              onChange={(e) => onEspessuraPaspaturChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* */}
      <div className="mb-3 secao-form">
        <label htmlFor="resumoQuadro" className="form-label">
          Resumo do Quadro Atual
        </label>
        <textarea
          className="form-control"
          id="resumoQuadro"
          rows={4}
          readOnly
          value={resumoDoQuadro}
        ></textarea>
      </div>

      {/* */}
      <div className="mb-3 d-flex justify-content-end">
        <button
          type="button"
          className="btn btn-secondary me-2"
          onClick={onLimparCampos}
        >
          Limpar Campos
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onAdicionarQuadro}
        >
          Adicionar Quadro ao Pedido
        </button>
      </div>
    </div>
  );
};
