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
    <div className="form-section-wrapper">
      <section className="card">
        <h3>Informações do Atendimento</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="atendente">Atendente</label>
            <input
              type="text"
              className="form-control"
              id="atendente"
              value={atendente}
              onChange={(e) => onAtendenteChange(e.target.value)}
              placeholder="Nome do atendente"
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
              placeholder="Nome do cliente"
            />
          </div>
          <div className="form-group">
            <label htmlFor="telefone">Telefone</label>
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
      </section>

      <section className="card">
        <h3>Quadro - Dimensões e Materiais</h3>

        <div className="form-row">
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

        <div className="form-check-group">
          <input
            className="form-check-input"
            type="checkbox"
            id="medida-cliente"
            checked={medidaCliente}
            onChange={(e) => onMedidaClienteChange(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="medida-cliente">
            Medida fornecida pelo cliente
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="molduraSelect">Moldura</label>
          <div className="input-group">
            <select
              className="form-control"
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
            <button className="btn btn-primary" onClick={onAddMoldura}>
              Adicionar
            </button>
            <button
              className="btn btn-secondary"
              onClick={onRemoveUltimaMoldura}
            >
              Remover
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Materiais</label>
          <div className="materials-grid">
            {materiaisList.map((material) => (
              <div className="form-check-group" key={material.id}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={material.nome}
                  id={`material-${material.id}`}
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
            ))}
          </div>

          {isPaspaturVisivel && (
            <div className="form-group paspatur-input">
              <label htmlFor="paspaturEspessura">
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
                placeholder="0"
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="resumoQuadro">Resumo do Quadro</label>
          <textarea
            className="form-control"
            id="resumoQuadro"
            rows={4}
            readOnly
            value={resumoDoQuadro}
          ></textarea>
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onLimparCampos}>
            Limpar Campos
          </button>
          <button className="btn btn-success" onClick={onAdicionarQuadro}>
            Adicionar Quadro
          </button>
        </div>
      </section>
    </div>
  );
};
