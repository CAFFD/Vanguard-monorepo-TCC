import React from 'react';
import { Link } from 'react-router-dom';

export const OccurrenceListPage: React.FC = () => {
  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-medium text-zinc-100 tracking-tight">Fila de Chamados</h1>
          <p className="text-sm text-zinc-500 mt-1">Gerencie os tickets de suporte e alertas da infraestrutura.</p>
        </div>
        <Link 
          to="/chamados/cadastrar"
          className="text-sm font-medium text-zinc-950 bg-zinc-100 px-4 py-2 rounded-md hover:bg-white transition-colors"
        >
          + Abrir Chamado
        </Link>
      </div>
      
      <div className="rounded-md border border-white/10 bg-zinc-950 p-8 text-center">
        <p className="text-sm font-mono text-zinc-500">
          [Esqueleto: Data Grid de Chamados será implementado aqui]
        </p>
      </div>
    </div>
  );
};
