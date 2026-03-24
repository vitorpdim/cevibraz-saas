// =======================================
// Imports externos
// =======================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calculator,
  ClipboardList,
  Frame,
  Layers,
  Package,
  BarChart3,
} from 'lucide-react';

// =======================================
// Constantes
// =======================================

const MENU_ITEMS = [
  { path: '/',          icon: Calculator,   label: 'Orçamento' },
  { path: '/backlog',   icon: ClipboardList, label: 'Backlog' },
  { path: '/molduras',  icon: Frame,         label: 'Cadastro de Molduras' },
  { path: '/materiais', icon: Layers,        label: 'Materiais' },
  { path: '/estoque',   icon: Package,       label: 'Estoque' },
  { path: '/dashboard', icon: BarChart3,     label: 'Dashboard' },
] as const;

// =======================================
// Componente
// =======================================

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">Cevibraz</h2>
      </div>
      <nav className="sidebar-nav">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
