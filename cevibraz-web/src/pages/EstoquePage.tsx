import React, { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Activity,
  Upload,
  Plus,
  Settings,
  History,
  X,
} from "lucide-react";
import "./EstoquePage.css";
import {
  fetchDashboard,
  fetchItensEstoque,
  fetchMovimentacoes,
  fetchMovimentacoesPorItem,
  registrarEntrada,
  ajustarEstoque,
  parseXml,
  vincularItemXml,
} from "../services/estoqueApi";
import type {
  DashboardData,
  ItemEstoque,
  Movimentacao,
  ParsedXml,
  ItemXml,
  EntradaManualDto,
  AjusteEstoqueDto,
  VincularItemXmlDto,
} from "../types/estoque.types";

type TabAtiva = "itens" | "movimentacoes" | "importar";

interface ModalState {
  tipo: "entrada" | "ajuste" | "historico" | null;
  item: ItemEstoque | null;
}

interface FormDataState {
  quantidade: string;
  motivo: string;
  descricao: string;
}

export function EstoquePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>("itens");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ok" | "baixo" | "critico"
  >("todos");
  const [filtroTipo, setFiltroTipo] = useState<
    "todos" | "moldura" | "material"
  >("todos");

  const [modalState, setModalState] = useState<ModalState>({
    tipo: null,
    item: null,
  });
  const [formData, setFormData] = useState<FormDataState>({
    quantidade: "",
    motivo: "",
    descricao: "",
  });

  const [xmlData, setXmlData] = useState<ParsedXml | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [vinculacoes, setVinculacoes] = useState<
    Map<string, { tipo: "moldura" | "material"; id: number }>
  >(new Map());
  const [itensVinculados, setItensVinculados] = useState<Set<string>>(
    new Set()
  );
  const [historicoItem, setHistoricoItem] = useState<Movimentacao[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const [dashData, itensData, movData] = await Promise.all([
        fetchDashboard(),
        fetchItensEstoque(),
        fetchMovimentacoes(50),
      ]);
      setDashboard(dashData);
      setItens(itensData);
      setMovimentacoes(movData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados do estoque");
    } finally {
      setIsLoading(false);
    }
  };

  const abrirModal = (
    tipo: "entrada" | "ajuste" | "historico",
    item: ItemEstoque
  ) => {
    setModalState({ tipo, item });
    setFormData({ quantidade: "", motivo: "", descricao: "" });

    if (tipo === "historico") {
      carregarHistoricoItem(item);
    }
  };

  const fecharModal = () => {
    setModalState({ tipo: null, item: null });
    setFormData({ quantidade: "", motivo: "", descricao: "" });
    setHistoricoItem([]);
  };

  const carregarHistoricoItem = async (item: ItemEstoque) => {
    try {
      const historico = await fetchMovimentacoesPorItem(item.tipo, item.id);
      setHistoricoItem(historico);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      alert("Erro ao carregar histórico do item");
    }
  };

  const handleSubmitEntrada = async () => {
    if (!modalState.item || !formData.quantidade) return;

    const dto: EntradaManualDto = {
      tipo_item: modalState.item.tipo,
      item_id: modalState.item.id,
      quantidade: parseFloat(formData.quantidade),
      descricao: formData.descricao || undefined,
    };

    try {
      await registrarEntrada(dto);
      alert("Entrada registrada com sucesso!");
      fecharModal();
      await carregarDados();
    } catch (error) {
      console.error("Erro ao registrar entrada:", error);
      alert("Erro ao registrar entrada");
    }
  };

  const handleSubmitAjuste = async () => {
    if (!modalState.item || !formData.quantidade || !formData.motivo) return;

    const dto: AjusteEstoqueDto = {
      tipo_item: modalState.item.tipo,
      item_id: modalState.item.id,
      novo_saldo: parseFloat(formData.quantidade),
      motivo: formData.motivo,
    };

    try {
      await ajustarEstoque(dto);
      alert("Estoque ajustado com sucesso!");
      fecharModal();
      await carregarDados();
    } catch (error) {
      console.error("Erro ao ajustar estoque:", error);
      alert("Erro ao ajustar estoque");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      alert("Por favor, envie um arquivo XML válido");
      return;
    }

    try {
      const parsed = await parseXml(file);
      setXmlData(parsed);
      setVinculacoes(new Map());
      setItensVinculados(new Set());
    } catch (error) {
      console.error("Erro ao processar XML:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao processar arquivo XML"
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleVincular = async (itemXml: ItemXml) => {
    const vinculacao = vinculacoes.get(itemXml.codigo);
    if (!vinculacao || !xmlData) return;

    const dto: VincularItemXmlDto = {
      item_xml: itemXml,
      tipo_item: vinculacao.tipo,
      item_id: vinculacao.id,
      numero_nfe: xmlData.numero_nfe,
    };

    try {
      await vincularItemXml(dto);
      setItensVinculados((prev) => new Set(prev).add(itemXml.codigo));
      alert(`Item "${itemXml.nome}" vinculado com sucesso!`);
      await carregarDados();
    } catch (error) {
      console.error("Erro ao vincular item:", error);
      alert("Erro ao vincular item");
    }
  };

  const itensFiltrados = itens.filter((item) => {
    const matchSearch =
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.codigo &&
        item.codigo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus =
      filtroStatus === "todos" || item.status === filtroStatus;
    const matchTipo = filtroTipo === "todos" || item.tipo === filtroTipo;
    return matchSearch && matchStatus && matchTipo;
  });

  if (isLoading) {
    return (
      <div className="modulo-estoque">
        <div className="loading-container">
          <div className="loading-spinner" />
          <div className="loading-text">Carregando estoque...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modulo-estoque">
      <div className="estoque-header">
        <h1 className="estoque-title">Gerenciamento de Estoque</h1>
        <div className="estoque-actions">
          <button
            className="btn-primary"
            onClick={() => setTabAtiva("importar")}
          >
            <Upload size={18} />
            Importar XML
          </button>
        </div>
      </div>

      {dashboard && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div className="dashboard-icon primary">
                <Package size={24} />
              </div>
              <div>
                <div className="dashboard-card-label">Valor Total</div>
                <div className="dashboard-card-value">
                  R$ {dashboard.valor_total_estoque.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div className="dashboard-icon warning">
                <AlertTriangle size={24} />
              </div>
              <div>
                <div className="dashboard-card-label">Estoque Baixo</div>
                <div className="dashboard-card-value">
                  {dashboard.itens_estoque_baixo}
                </div>
                <div className="dashboard-card-trend">
                  itens precisam reposição
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div className="dashboard-icon info">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="dashboard-card-label">Total de Itens</div>
                <div className="dashboard-card-value">
                  {dashboard.total_molduras + dashboard.total_materiais}
                </div>
                <div className="dashboard-card-trend">
                  {dashboard.total_molduras} molduras,{" "}
                  {dashboard.total_materiais} materiais
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div className="dashboard-icon success">
                <Activity size={24} />
              </div>
              <div>
                <div className="dashboard-card-label">Movimentações</div>
                <div className="dashboard-card-value">
                  {dashboard.movimentacoes_recentes}
                </div>
                <div className="dashboard-card-trend">últimos 30 dias</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="estoque-tabs">
        <button
          className={`estoque-tab ${tabAtiva === "itens" ? "active" : ""}`}
          onClick={() => setTabAtiva("itens")}
        >
          Itens em Estoque
        </button>
        <button
          className={`estoque-tab ${
            tabAtiva === "movimentacoes" ? "active" : ""
          }`}
          onClick={() => setTabAtiva("movimentacoes")}
        >
          Histórico de Movimentações
        </button>
        <button
          className={`estoque-tab ${tabAtiva === "importar" ? "active" : ""}`}
          onClick={() => setTabAtiva("importar")}
        >
          Importar NFe
        </button>
      </div>

      {tabAtiva === "itens" && (
        <div className="estoque-table-container">
          <div className="estoque-filters">
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              className="filter-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="filter-select"
              value={filtroStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFiltroStatus(e.target.value as "todos" | "ok" | "baixo" | "critico")
              }
            >
              <option value="todos">Todos os status</option>
              <option value="ok">✓ OK</option>
              <option value="baixo">⚠ Baixo</option>
              <option value="critico">✖ Crítico</option>
            </select>
            <select
              className="filter-select"
              value={filtroTipo}
              onChange={(e) =>
                setFiltroTipo(e.target.value as "todos" | "moldura" | "material")
              }
            >
              <option value="todos">Todos os tipos</option>
              <option value="moldura">Molduras</option>
              <option value="material">Materiais</option>
            </select>
          </div>

          <table className="estoque-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Estoque Atual</th>
                <th>Estoque Mínimo</th>
                <th>Valor Unit.</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {itensFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <Package size={48} className="empty-state-icon" />
                      <div className="empty-state-text">
                        Nenhum item encontrado
                      </div>
                      <div className="empty-state-hint">
                        Ajuste os filtros ou cadastre novos itens
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                itensFiltrados.map((item) => (
                  <tr key={`${item.tipo}-${item.id}`}>
                    <td>
                      <div className="item-info">
                        {item.imagem_url ? (
                          <img
                            src={item.imagem_url}
                            alt={item.nome}
                            className="item-image"
                          />
                        ) : (
                          <div className="item-image-placeholder">
                            <Package size={20} />
                          </div>
                        )}
                        <div className="item-details">
                          <div className="item-name">{item.nome}</div>
                          {item.codigo && (
                            <div className="item-code">Cód: {item.codigo}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{item.estoque_atual.toFixed(2)}</strong>{" "}
                      {item.unidade_medida}
                    </td>
                    <td>
                      {item.estoque_minimo.toFixed(2)} {item.unidade_medida}
                    </td>
                    <td>R$ {item.valor_unitario.toFixed(2)}</td>
                    <td>
                      <strong>R$ {item.valor_total.toFixed(2)}</strong>
                    </td>
                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status === "ok" && "✓ OK"}
                        {item.status === "baixo" && "⚠ Baixo"}
                        {item.status === "critico" && "✖ Crítico"}
                      </span>
                    </td>
                    <td>
                      <div className="item-actions">
                        <button
                          className="btn-action btn-entrada"
                          onClick={() => abrirModal("entrada", item)}
                        >
                          <Plus size={14} />
                          Entrada
                        </button>
                        <button
                          className="btn-action btn-ajuste"
                          onClick={() => abrirModal("ajuste", item)}
                        >
                          <Settings size={14} />
                          Ajustar
                        </button>
                        <button
                          className="btn-action btn-historico"
                          onClick={() => abrirModal("historico", item)}
                        >
                          <History size={14} />
                          Histórico
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tabAtiva === "movimentacoes" && (
        <div className="estoque-table-container">
          <div className="historico-timeline">
            {movimentacoes.length === 0 ? (
              <div className="empty-state">
                <Activity size={48} className="empty-state-icon" />
                <div className="empty-state-text">
                  Nenhuma movimentação registrada
                </div>
              </div>
            ) : (
              movimentacoes.map((mov) => (
                <div
                  key={mov.id}
                  className={`historico-item ${mov.tipo.toLowerCase()}`}
                >
                  <div className="historico-header">
                    <div className="historico-tipo">
                      {mov.tipo === "ENTRADA" && "↑ Entrada"}
                      {mov.tipo === "SAIDA" && "↓ Saída"}
                      {mov.tipo === "AJUSTE" && "⚙ Ajuste"}
                      {" - "}
                      {mov.item_nome}
                    </div>
                    <div className="historico-data">
                      {new Date(mov.data).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="historico-descricao">{mov.descricao}</div>
                  <div className="historico-valores">
                    <span className="historico-valor">
                      Qtd: <strong>{mov.quantidade.toFixed(2)}</strong>
                    </span>
                    <span className="historico-valor">
                      Saldo Anterior:{" "}
                      <strong>{mov.saldo_anterior.toFixed(2)}</strong>
                    </span>
                    <span className="historico-valor">
                      Saldo Novo: <strong>{mov.saldo_novo.toFixed(2)}</strong>
                    </span>
                    {mov.usuario && (
                      <span className="historico-valor">
                        Usuário: <strong>{mov.usuario}</strong>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tabAtiva === "importar" && (
        <div className="estoque-table-container">
          {!xmlData ? (
            <div
              className={`xml-upload-zone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("xml-file-input")?.click()}
            >
              <Upload size={48} className="xml-upload-icon" />
              <div className="xml-upload-text">
                Arraste o arquivo XML da NFe aqui
              </div>
              <div className="xml-upload-hint">ou clique para selecionar</div>
              <input
                id="xml-file-input"
                type="file"
                accept=".xml"
                style={{ display: "none" }}
                onChange={(e) =>
                  e.target.files?.[0] && handleFileUpload(e.target.files[0])
                }
              />
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, color: "var(--color-text-dark)" }}>
                    NFe: {xmlData.numero_nfe}
                  </h3>
                  <p style={{ margin: "4px 0 0 0", color: "#94a3b8" }}>
                    {xmlData.items.length} itens encontrados
                  </p>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => setXmlData(null)}
                >
                  <X size={18} />
                  Cancelar
                </button>
              </div>

              <div className="xml-items-list">
                {xmlData.items.map((item) => {
                  const vinculado = itensVinculados.has(item.codigo);
                  return (
                    <div
                      key={item.codigo}
                      className={`xml-item-card ${
                        vinculado ? "xml-item-vinculado" : ""
                      }`}
                    >
                      <div className="xml-item-header">
                        <div className="xml-item-info">
                          <h4>{item.nome}</h4>
                          <p>
                            Código: {item.codigo} | Qtd: {item.quantidade}{" "}
                            {item.unidade}
                          </p>
                          <p>Valor Unit: R$ {item.valor_unitario.toFixed(2)}</p>
                        </div>
                      </div>
                      {!vinculado ? (
                        <div className="xml-item-footer">
                          <select
                            onChange={(e) => {
                              const [tipo, id] = e.target.value.split("-");
                              if (tipo && id) {
                                setVinculacoes((prev) =>
                                  new Map(prev).set(item.codigo, {
                                    tipo: tipo as "moldura" | "material",
                                    id: parseInt(id),
                                  })
                                );
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="">
                              Selecione o item do sistema...
                            </option>
                            <optgroup label="Molduras">
                              {itens
                                .filter((i) => i.tipo === "moldura")
                                .map((i) => (
                                  <option
                                    key={`m-${i.id}`}
                                    value={`moldura-${i.id}`}
                                  >
                                    {i.nome} ({i.codigo || "sem código"})
                                  </option>
                                ))}
                            </optgroup>
                            <optgroup label="Materiais">
                              {itens
                                .filter((i) => i.tipo === "material")
                                .map((i) => (
                                  <option
                                    key={`mat-${i.id}`}
                                    value={`material-${i.id}`}
                                  >
                                    {i.nome}
                                  </option>
                                ))}
                            </optgroup>
                          </select>
                          <button
                            className="btn-vincular"
                            disabled={!vinculacoes.has(item.codigo)}
                            onClick={() => handleVincular(item)}
                          >
                            Vincular
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            color: "#10b981",
                            fontWeight: 600,
                            marginTop: "12px",
                          }}
                        >
                          ✓ Item vinculado e estoque atualizado
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {modalState.tipo && modalState.item && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modalState.tipo === "entrada" && "Registrar Entrada"}
                {modalState.tipo === "ajuste" && "Ajustar Estoque"}
                {modalState.tipo === "historico" && "Histórico do Item"}
                {" - "}
                {modalState.item.nome}
              </h2>
              <button className="modal-close" onClick={fecharModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {modalState.tipo === "entrada" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Quantidade</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder={`Quantidade em ${modalState.item.unidade_medida}`}
                      value={formData.quantidade}
                      onChange={(e) =>
                        setFormData({ ...formData, quantidade: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descrição (opcional)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Ex: Compra do fornecedor X, NF 12345"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                    />
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      background: "rgba(72, 187, 120, 0.1)",
                      borderRadius: "10px",
                      marginTop: "16px",
                    }}
                  >
                    <p style={{ margin: 0, color: "var(--color-text)" }}>
                      Saldo atual:{" "}
                      <strong>
                        {modalState.item.estoque_atual.toFixed(2)}{" "}
                        {modalState.item.unidade_medida}
                      </strong>
                    </p>
                    {formData.quantidade && (
                      <p
                        style={{
                          margin: "8px 0 0 0",
                          color: "var(--color-primary)",
                          fontWeight: 600,
                        }}
                      >
                        Novo saldo:{" "}
                        {(
                          modalState.item.estoque_atual +
                          parseFloat(formData.quantidade || "0")
                        ).toFixed(2)}{" "}
                        {modalState.item.unidade_medida}
                      </p>
                    )}
                  </div>
                </>
              )}

              {modalState.tipo === "ajuste" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Novo Saldo</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder={`Saldo correto em ${modalState.item.unidade_medida}`}
                      value={formData.quantidade}
                      onChange={(e) =>
                        setFormData({ ...formData, quantidade: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Motivo do Ajuste</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Ex: Inventário físico, produto danificado, correção de erro"
                      value={formData.motivo}
                      onChange={(e) =>
                        setFormData({ ...formData, motivo: e.target.value })
                      }
                    />
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      background: "rgba(59, 130, 246, 0.1)",
                      borderRadius: "10px",
                      marginTop: "16px",
                    }}
                  >
                    <p style={{ margin: 0, color: "var(--color-text)" }}>
                      Saldo atual:{" "}
                      <strong>
                        {modalState.item.estoque_atual.toFixed(2)}{" "}
                        {modalState.item.unidade_medida}
                      </strong>
                    </p>
                    {formData.quantidade && (
                      <p
                        style={{
                          margin: "8px 0 0 0",
                          color: "#3b82f6",
                          fontWeight: 600,
                        }}
                      >
                        Diferença:{" "}
                        {(
                          parseFloat(formData.quantidade || "0") -
                          modalState.item.estoque_atual
                        ).toFixed(2)}{" "}
                        {modalState.item.unidade_medida}
                      </p>
                    )}
                  </div>
                </>
              )}

              {modalState.tipo === "historico" && (
                <div className="historico-timeline">
                  {historicoItem.length === 0 ? (
                    <div className="empty-state">
                      <Activity size={48} className="empty-state-icon" />
                      <div className="empty-state-text">
                        Nenhuma movimentação encontrada
                      </div>
                    </div>
                  ) : (
                    historicoItem.map((mov) => (
                      <div
                        key={mov.id}
                        className={`historico-item ${mov.tipo.toLowerCase()}`}
                      >
                        <div className="historico-header">
                          <div className="historico-tipo">
                            {mov.tipo === "ENTRADA" && "↑ Entrada"}
                            {mov.tipo === "SAIDA" && "↓ Saída"}
                            {mov.tipo === "AJUSTE" && "⚙ Ajuste"}
                          </div>
                          <div className="historico-data">
                            {new Date(mov.data).toLocaleString("pt-BR")}
                          </div>
                        </div>
                        <div className="historico-descricao">
                          {mov.descricao}
                        </div>
                        <div className="historico-valores">
                          <span className="historico-valor">
                            Qtd: <strong>{mov.quantidade.toFixed(2)}</strong>
                          </span>
                          <span className="historico-valor">
                            Saldo:{" "}
                            <strong>
                              {mov.saldo_anterior.toFixed(2)} →{" "}
                              {mov.saldo_novo.toFixed(2)}
                            </strong>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {modalState.tipo !== "historico" && (
              <div className="modal-footer">
                <button className="btn-secondary" onClick={fecharModal}>
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={
                    modalState.tipo === "entrada"
                      ? handleSubmitEntrada
                      : handleSubmitAjuste
                  }
                  disabled={
                    !formData.quantidade ||
                    (modalState.tipo === "ajuste" && !formData.motivo)
                  }
                >
                  {modalState.tipo === "entrada"
                    ? "Registrar Entrada"
                    : "Confirmar Ajuste"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EstoquePage;
