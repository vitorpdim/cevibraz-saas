import React from "react";
import {
  Calculator,
  ClipboardList,
  Frame,
  Package,
  BarChart3,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { path: "/", icon: Calculator, label: "Orçamento" },
  { path: "/backlog", icon: ClipboardList, label: "Backlog" },
  { path: "/molduras", icon: Frame, label: "Cadastro de Molduras" },
  { path: "/estoque", icon: Package, label: "Estoque" },
  { path: "/dashboard", icon: BarChart3, label: "Dashboard" },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">Cevibraz</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? "active" : ""}`}
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
