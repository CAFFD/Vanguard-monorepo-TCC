import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../components/feedback/ToastContext';

interface Sector {
  id: string;
  name: string;
  description: string;
}

export const SectorListPage: React.FC = () => {
  const { showToast } = useToast();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchSectors = async () => {
      try {
        const res = await apiFetch('/sectors');
        if (!res.ok) throw new Error('Falha ao carregar setores.');
        
        const data = await res.json();
        if (isMounted) {
          setSectors(data);
          setLoading(false);
        }
      } catch (error: any) {
        if (isMounted) {
          showToast('error', error.message || 'Erro inesperado.');
          setLoading(false);
        }
      }
    };

    fetchSectors();
    return () => { isMounted = false; };
  }, [showToast]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-medium text-zinc-100 tracking-tight">Departamentos</h2>
          <p className="text-sm text-zinc-500 mt-1">Gestão das áreas e setores onde as máquinas estão alocadas.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-zinc-500">
            {sectors.length} registros
          </div>
          <Link 
            to="/setores/cadastrar"
            className="text-sm font-medium text-zinc-950 bg-zinc-100 px-4 py-2 rounded-md hover:bg-white transition-colors"
          >
            + Adicionar
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border border-white/10 overflow-hidden bg-zinc-950">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-sm">Carregando setores...</div>
        ) : sectors.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-sm bg-zinc-900/20">
            Nenhum setor cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 border-b border-white/10 bg-zinc-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium w-64">ID (UUID)</th>
                  <th className="px-4 py-3 font-medium">Nome do Setor</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sectors.map((sector) => (
                  <tr key={sector.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-3 font-mono text-[10px] text-zinc-500">
                      {sector.id}
                    </td>
                    <td className="px-4 py-3 text-zinc-200 font-medium">
                      {sector.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {sector.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
