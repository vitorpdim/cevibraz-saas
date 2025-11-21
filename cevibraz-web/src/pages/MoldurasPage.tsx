import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import type { Moldura } from "../types";
import {
  fetchMolduras,
  createMoldura,
  updateMoldura,
  deleteMoldura,
} from "../services/api";
import { MolduraFormModal } from "../components/MolduraFormModal";

export const MoldurasPage: React.FC = () => {
  const [molduras, setMolduras] = useState<Moldura[]>([]);
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
    } catch (err) {
      console.error("Erro ao carregar molduras:", err);
      setError("Falha ao carregar molduras. Verifique a API.");
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
        alert("Moldura criada com sucesso!");
      } else if (selectedMoldura) {
        await updateMoldura(selectedMoldura.id, formData);
        alert("Moldura atualizada com sucesso!");
      }
      await carregarMolduras();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar moldura. Verifique o console.");
      throw error;
    }
  };

  const handleDelete = async (moldura: Moldura) => {
    if (
      !confirm(`Tem certeza que deseja deletar a moldura "${moldura.nome}"?`)
    ) {
      return;
    }

    try {
      await deleteMoldura(moldura.id);
      alert("Moldura deletada com sucesso!");
      await carregarMolduras();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro ao deletar moldura. Verifique o console.");
    }
  };

  const moldurasFiltradas = molduras.filter((moldura) => {
    const termo = searchTerm.toLowerCase();
    return (
      moldura.nome.toLowerCase().includes(termo) ||
      moldura.codigo.toLowerCase().includes(termo)
    );
  });

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="container">
          <h1>Carregando molduras...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="container">
          <h1 className="text-danger">Erro ao carregar molduras</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div className="page-header">
          <h1>Gerenciamento de Molduras</h1>
          <button className="btn btn-success" onClick={handleCreateClick}>
            <Plus size={20} />
            Nova Moldura
          </button>
        </div>

        <div className="search-section">
          <input
            type="text"
            className="form-control search-input"
            placeholder="Buscar por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="molduras-grid">
          {moldurasFiltradas.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma moldura encontrada.</p>
            </div>
          ) : (
            moldurasFiltradas.map((moldura) => (
              <div key={moldura.id} className="moldura-card">
                <div className="moldura-image">
                  {moldura.imagem_url ? (
                    <img
                      src={`https://cevibraz-api.onrender.com${moldura.imagem_url}`}
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
                  <h3>{moldura.nome}</h3>
                  <p className="moldura-codigo">Código: {moldura.codigo}</p>
                  <p className="moldura-preco">
                    R${" "}
                    {parseFloat(moldura.valor_metro_linear.toString()).toFixed(
                      2
                    )}
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
            ))
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
