const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

import React, { useState, useEffect } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import type { Moldura } from "../types";

interface MolduraFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  moldura: Moldura | null;
  mode: "create" | "edit";
}

export const MolduraFormModal: React.FC<MolduraFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  moldura,
  mode,
}) => {
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [valorMetroLinear, setValorMetroLinear] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (moldura && mode === "edit") {
      setCodigo(moldura.codigo);
      setNome(moldura.nome);
      setValorMetroLinear(moldura.valor_metro_linear.toString());
      if (moldura.imagem_url) {
        setImagePreview(`${API_URL}${moldura.imagem_url}`);
      }
    } else {
      setCodigo("");
      setNome("");
      setValorMetroLinear("");
      setImageFile(null);
      setImagePreview(null);
    }
  }, [moldura, mode, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!codigo || !nome || !valorMetroLinear) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const formData = new FormData();
    formData.append("codigo", codigo);
    formData.append("nome", nome);
    formData.append("valor_metro_linear", valorMetroLinear);

    if (imageFile) {
      formData.append("imagem", imageFile);
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar moldura:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === "create" ? "Nova Moldura" : "Editar Moldura"}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="moldura-form">
          <div className="moldura-form-layout">
            <div className="moldura-image-section">
              <label className="image-upload-label">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="image-preview"
                  />
                ) : (
                  <div className="image-placeholder">
                    <ImageIcon size={48} />
                    <span>Clique para adicionar imagem</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </label>
              <div className="image-upload-hint">
                <Upload size={16} />
                <span>Formatos: JPG, PNG, WebP (max 5MB)</span>
              </div>
            </div>

            <div className="moldura-fields-section">
              <div className="form-group">
                <label htmlFor="codigo">Código *</label>
                <input
                  type="text"
                  id="codigo"
                  className="form-control"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ex: AL-Preto-001"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="nome">Nome *</label>
                <input
                  type="text"
                  id="nome"
                  className="form-control"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Alumínio Preto Fosco"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="valor">Valor por Metro Linear (R$) *</label>
                <input
                  type="number"
                  id="valor"
                  className="form-control"
                  value={valorMetroLinear}
                  onChange={(e) => setValorMetroLinear(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              {imagePreview && moldura && (
                <div className="moldura-info-display">
                  <div className="info-item">
                    <span className="info-label">Código:</span>
                    <span className="info-value">{codigo}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Preço:</span>
                    <span className="info-value">R$ {valorMetroLinear}/m</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={isSaving}
            >
              {isSaving
                ? "Salvando..."
                : mode === "create"
                ? "Criar Moldura"
                : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
