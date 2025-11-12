import React, { useState, useMemo } from "react";
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

  // Estado local para o texto digitado no autocomplete
  const [molduraInput, setMolduraInput] = useState("");

  // Atualiza o input e o valor selecionado
  const handleMolduraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMolduraInput(e.target.value);
    onMolduraSelecionadaChange(e.target.value);
  };

  // Filtra as molduras conforme o texto digitado
  const moldurasFiltradas = useMemo(() => {
    const texto = molduraInput.trim().toLowerCase();
    if (!texto) return moldurasList;
    return moldurasList.filter(
      (m) =>
        m.nome.toLowerCase().includes(texto) ||
        m.codigo.toLowerCase().includes(texto)
    );
  }, [molduraInput, moldurasList]);

  // Quando seleciona uma moldura da lista
  const handleSelectMoldura = (nome: string) => {
    setMolduraInput(nome);
    onMolduraSelecionadaChange(nome);
  };

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
          <div className="input-group" style={{ position: "relative" }}>
            <input
              type="text"
              className="form-control"
              id="molduraSelect"
              placeholder="Digite para buscar moldura..."
              value={molduraInput}
              onChange={handleMolduraInputChange}
              autoComplete="off"
            />
            <button
              className="btn btn-primary"
              onClick={onAddMoldura}
              type="button"
            >
              Adicionar
            </button>
            <button
              className="btn btn-secondary"
              onClick={onRemoveUltimaMoldura}
              type="button"
            >
              Remover
            </button>
            {/* Lista de sugestões */}
            {molduraInput && moldurasFiltradas.length > 0 && (
              <ul
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: "0 0 8px 8px",
                  maxHeight: 180,
                  overflowY: "auto",
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              >
                {moldurasFiltradas.map((moldura) => (
                  <li
                    key={moldura.id}
                    style={{
                      padding: "8px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      background:
                        moldura.nome === molduraSelecionada ? "#f0f8e8" : "#fff",
                    }}
                    onClick={() => handleSelectMoldura(moldura.nome)}
                  >
                    {moldura.nome} (Cod: {moldura.codigo})
                  </li>
                ))}
              </ul>
            )}
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
