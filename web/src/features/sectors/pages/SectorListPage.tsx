import React from 'react';
import { Link } from 'react-router-dom';

export const SectorListPage: React.FC = () => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-medium text-zinc-100">Lista de Setores</h2>
        <Link 
          to="/setores/cadastrar"
          className="text-xs font-medium text-zinc-950 bg-zinc-100 px-3 py-1.5 rounded-md hover:bg-white transition-colors"
        >
          + Novo Setor
        </Link>
      </div>
      
      <div className="rounded-md border border-white/10 bg-zinc-950 p-8 text-center">
        <p className="text-sm font-mono text-zinc-500">
          [Esqueleto: Tabela de Setores será implementada aqui]
        </p>
      </div>
    </div>
  );
};
