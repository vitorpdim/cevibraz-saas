import React from 'react';
import { Wrench } from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  return (
    <div className="page-content">
      <div className="maintenance-container">
        <Wrench size={64} className="maintenance-icon" />
        <h1>Página em Manutenção</h1>
        <p>Esta funcionalidade estará disponível em breve.</p>
      </div>
    </div>
  );
};
