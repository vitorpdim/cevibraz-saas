import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";
import type { Moldura } from "../types";
import {
  fetchMolduras,
  createMoldura,
  updateMoldura,
  deleteMoldura,
  deleteMoldurasBatch,
} from "../services/api";
import { MolduraFormModal } from "../components/MolduraFormModal";

const API_URL =
  import.meta.env.VITE_API_URL || "https://cevibraz-api.onrender.com";

export const MoldurasPage: React.FC = () => {
  const [molduras, setMolduras] = useState<Moldura[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedMoldura, setSelectedMoldura] = useState<Moldura | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const carregarMolduras = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchMolduras();
      setMolduras(data);
      setSelectedIds([]);
    } catch (err) {
      console.error("Erro:", err);
      setError("Falha ao carregar molduras.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarMolduras();
  }, []);

  const handleCreateClick = () => {
    setSelectedMoldura(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleEditClick = (moldura: Moldura) => {
    setSelectedMoldura(moldura);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleSave = async (formData: FormData) => {
    try {
      if (modalMode === "create") {
        await createMoldura(formData);
      } else if (selectedMoldura) {
        await updateMoldura(selectedMoldura.id, formData);
      }
      await carregarMolduras();
    } catch (error) {
      alert("Erro ao salvar. Verifique o console.");
      throw error;
    }
  };

  // --- LÓGICA DE SELEÇÃO MÚLTIPLA ---
  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const moldurasFiltradas = getFiltered();
    if (selectedIds.length === moldurasFiltradas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(moldurasFiltradas.map((m) => m.id));
    }
  };

  const handleBatchDelete = async () => {
    if (
      !confirm(
        `Tem certeza que deseja deletar ${selectedIds.length} moldura(s)?`
      )
    )
      return;
    try {
      await deleteMoldurasBatch(selectedIds);
      await carregarMolduras();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Erro ao deletar molduras.");
    }
  };

  const handleDelete = async (moldura: Moldura) => {
    if (!confirm(`Deletar a moldura "${moldura.nome}"?`)) return;
    try {
      await deleteMoldura(moldura.id);
      await carregarMolduras();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Erro ao deletar.");
    }
  };

  const getFiltered = () => {
    const t = searchTerm.toLowerCase();
    return molduras.filter(
      (m) =>
        m.nome.toLowerCase().includes(t) || m.codigo.toLowerCase().includes(t)
    );
  };

  if (isLoading)
    return (
      <div className="page-content">
        <div className="container">Carregando...</div>
      </div>
    );
  if (error)
    return (
      <div className="page-content">
        <div className="container text-danger">{error}</div>
      </div>
    );

  const moldurasFiltradas = getFiltered();

  return (
    <div className="page-content">
      <div className="container">
        <div
          className="page-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1>Gerenciamento de Molduras</h1>

          <div style={{ display: "flex", gap: "1rem" }}>
            {selectedIds.length > 0 && (
              <button className="btn btn-danger" onClick={handleBatchDelete}>
                <Trash2 size={20} /> Deletar ({selectedIds.length})
              </button>
            )}
            <button className="btn btn-success" onClick={handleCreateClick}>
              <Plus size={20} /> Nova Moldura
            </button>
          </div>
        </div>

        {/* busca e select all */}
        <div
          className="search-section"
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={20}
              aria-hidden
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-secondary)",
              }}
            />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar molduras por nome ou código..."
              aria-label="Buscar molduras"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleSelectAll}
            title={
              selectedIds.length === moldurasFiltradas.length
                ? "Desmarcar Todos"
                : "Marcar Todos"
            }
          >
            {selectedIds.length > 0 &&
            selectedIds.length === moldurasFiltradas.length ? (
              <CheckSquare size={20} />
            ) : (
              <Square size={20} />
            )}
            <span style={{ marginLeft: 8 }}>Selecionar Todos</span>
          </button>
        </div>

        <div className="molduras-grid">
          {moldurasFiltradas.length === 0 ? (
            <p
              style={{ gridColumn: "1/-1", textAlign: "center", opacity: 0.6 }}
            >
              Nenhuma moldura encontrada.
            </p>
          ) : (
            moldurasFiltradas.map((moldura) => {
              const isSelected = selectedIds.includes(moldura.id);
              return (
                <div
                  key={moldura.id}
                  className={`moldura-card ${
                    isSelected ? "selected-card" : ""
                  }`}
                  style={{
                    border: isSelected
                      ? "2px solid var(--color-primary)"
                      : "1px solid var(--color-border)",
                  }}
                >
                  <div
                    className="moldura-image"
                    style={{ position: "relative" }}
                  >
                    {/* checkbox REAL MEMO*/}
                    <label className={`select-checkbox ${isSelected ? '' : ''}`} aria-hidden>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(moldura.id)}
                        aria-label={`Selecionar moldura ${moldura.nome}`}
                      />
                    </label>

                    {moldura.imagem_url ? (
                      <img
                        src={`${API_URL}${moldura.imagem_url}`}
                        alt={moldura.nome}
                      />
                    ) : (
                      <div className="no-image">
                        <ImageIcon size={40} />
                        <span>Sem imagem</span>
                      </div>
                    )}
                  </div>
                  <div className="moldura-info">
                    <h3 title={moldura.nome}>{moldura.nome}</h3>
                    <p className="moldura-codigo">{moldura.codigo}</p>
                    <p className="moldura-preco">
                      R${" "}
                      {parseFloat(
                        moldura.valor_metro_linear.toString()
                      ).toFixed(2)}
                      /m
                    </p>
                  </div>
                  <div className="moldura-actions">
                    <button
                      className="btn-icon btn-icon-edit"
                      onClick={() => handleEditClick(moldura)}
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="btn-icon btn-icon-delete"
                      onClick={() => handleDelete(moldura)}
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <MolduraFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        moldura={selectedMoldura}
        mode={modalMode}
      />
    </div>
  );
};

export default MoldurasPage;
