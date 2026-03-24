// =======================================
// Imports externos
// =======================================

import React, { useState, useEffect } from 'react';
import { Save, Package } from 'lucide-react';

// =======================================
// Imports internos
// =======================================

import type { Material } from '../types';
import { fetchMateriais, updateMaterial } from '../services/api';

// =======================================
// Componente
// =======================================

export const MateriaisPage: React.FC = () => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedPrices, setEditedPrices] = useState<Record<number, number>>({});
  const [savingIds, setSavingIds] = useState<number[]>([]);

  const carregarMateriais = async () => {
    try {
      setIsLoading(true);
      const data = await fetchMateriais();
      setMateriais(data);
    } catch {
      alert('Falha ao carregar materiais. Verifique a conexão com a API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarMateriais();
  }, []);

  const handlePriceChange = (id: number, newValue: string) => {
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      setEditedPrices((prev) => ({ ...prev, [id]: numValue }));
    } else {
      setEditedPrices((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const handleSave = async (id: number) => {
    const novoValor = editedPrices[id];
    if (novoValor === undefined) return;

    setSavingIds((prev) => [...prev, id]);
    try {
      await updateMaterial(id, novoValor);
      setMateriais((prev) =>
        prev.map((m) => (m.id === id ? { ...m, valor_base: novoValor } : m)),
      );
      setEditedPrices((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch {
      alert('Falha ao salvar o preço. Tente novamente.');
    } finally {
      setSavingIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const materiaisFiltrados = materiais.filter((m) =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="container">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div className="page-header">
          <h1>Gerenciamento de Materiais</h1>
        </div>

        <div className="search-section" style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                  Material
                </th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                  Tipo de Cálculo
                </th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                  Valor Base (R$)
                </th>
                <th style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>

              {materiaisFiltrados.map((material) => {
                const isEdited = editedPrices[material.id] !== undefined;
                const currentValue = isEdited ? editedPrices[material.id] : material.valor_base;
                const isSaving = savingIds.includes(material.id);

                return (
                  <tr key={material.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={18} color="var(--color-primary)" />
                        <span style={{ fontWeight: 600 }}>{material.nome}</span>
                      </div>
                    </td>

                    <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>
                      {material.tipo_calculo === 'metro_quadrado' ? 'Metro Quadrado (m²)' : 'Metro Linear (m)'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: '120px' }}
                        value={currentValue}
                        onChange={(e) => handlePriceChange(material.id, e.target.value)}
                        step="0.01"
                        min="0"/>

                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {isEdited && (
                        
                        <button
                          className="btn btn-success"
                          onClick={() => handleSave(material.id)}
                          disabled={isSaving}
                          style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                        >
                          <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>

                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MateriaisPage;
