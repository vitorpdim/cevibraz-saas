import React, { useState, useEffect, useMemo } from "react";
import { X, Search, Image as ImageIcon } from "lucide-react";
import type { Moldura } from "../types";
import { fetchMolduras } from "../services/api";

const API_URL = import.meta.env.VITE_API_URL || "https://cevibraz-api.onrender.com";

interface MolduraSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (moldura: Moldura) => void;
  // add p saber quais já foram selecionadas (opcional, pra UI)
  moldurasJaSelecionadas?: string[]; 
}

export const MolduraSelectorModal: React.FC<MolduraSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [molduras, setMolduras] = useState<Moldura[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPreview, setSelectedPreview] = useState<Moldura | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchMolduras()
        .then((data) => {
          setMolduras(data);
          if (data.length > 0) setSelectedPreview(data[0]);
        })
        .catch((err) => console.error("Erro ao carregar molduras", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // filtro de busca
  const filteredMolduras = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return molduras.filter(
      (m) =>
        m.nome.toLowerCase().includes(lowerTerm) ||
        m.codigo.toLowerCase().includes(lowerTerm)
    );
  }, [molduras, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* --- HEADER --- */}
        <div className="modal-header">
          <h2>Selecionar Moldura</h2>
          <button 
            className="modal-close-btn"
            onClick={onClose} 
          >
            <X size={24} />
          </button>
        </div>

        <div className="moldura-selector-layout">
          {/* --- LADO ESQUERDO --- */}
          <div className="moldura-preview-section">
            <div className="moldura-preview-card">
              <div className="moldura-preview-image">
                {selectedPreview?.imagem_url ? (
                  <img
                    src={`${API_URL}${selectedPreview.imagem_url}`}
                    alt={selectedPreview.nome}
                  />
                ) : (
                  <div className="moldura-preview-placeholder">
                    <ImageIcon size={48} />
                    <span>Visualização</span>
                  </div>
                )}
              </div>
            </div>
            
            {selectedPreview ? (
              <div className="moldura-preview-info" style={{ width: '100%', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>{selectedPreview.nome}</h3>
                <div style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>{selectedPreview.codigo}</div>
                <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                  R$ {parseFloat(selectedPreview.valor_metro_linear.toString()).toFixed(2)}/m
                </div>
                <button 
                  className="btn btn-success" 
                  style={{ width: '100%', padding: '12px' }}
                  onClick={() => { onSelect(selectedPreview); onClose(); }}
                >
                  Confirmar Seleção
                </button>
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)' }}>Selecione uma moldura na lista ao lado</p>
            )}
          </div>

          {/* --- LADO DIREITO --- */}
          <div className="moldura-list-section">
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} 
              />
              <input
                type="text"
                className="moldura-search-input"
                style={{ paddingLeft: '2.5rem', margin: 0 }}
                placeholder="Filtrar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className="moldura-list">
              {loading ? (
                <p style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</p>
              ) : filteredMolduras.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>Nenhuma moldura encontrada.</p>
              ) : (
                filteredMolduras.map((moldura) => (
                  <div
                    key={moldura.id}
                    className={`moldura-list-item ${selectedPreview?.id === moldura.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPreview(moldura)}
                    onDoubleClick={() => { onSelect(moldura); onClose(); }}
                  >
                    <div className="moldura-list-item-info">
                      <div className="moldura-list-item-name">{moldura.nome}</div>
                      <div className="moldura-list-item-code">{moldura.codigo}</div>
                    </div>
                    <div className="moldura-list-item-price">
                      R$ {parseFloat(moldura.valor_metro_linear.toString()).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};