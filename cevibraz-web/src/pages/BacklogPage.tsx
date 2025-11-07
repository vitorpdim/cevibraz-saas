import React from 'react';

export const BacklogPage: React.FC = () => {
  return (
    <div className="container-principal" style={{ flexDirection: 'column' }}>
      {/* estilo de card do formulário */}
      <div className="form-orcamento">
        <h2 className="titulo-form">Backlog - Pedidos Salvos</h2>
        <p>
          Carregando tabela de pedidos...
        </p>
        {/* refatoração do backlog/index.html e do backlog.js */}
      </div>
    </div>
  );
};