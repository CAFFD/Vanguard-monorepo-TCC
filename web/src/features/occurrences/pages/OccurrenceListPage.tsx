import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../components/feedback/ToastContext';

interface Occurrence {
  id: string;
  equipment_id: string;
  technician_id: string | null;
  created_at: string;
  origin: string;
  priority: string;
  description: string;
  closure_date: string | null;
}

interface Equipment {
  id: string;
  hostname: string;
  patrimony_tag: string;
}

export const OccurrenceListPage: React.FC = () => {
  const { showToast } = useToast();
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [equipments, setEquipments] = useState<Record<string, Equipment>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [occurrencesRes, equipmentsRes] = await Promise.all([
          apiFetch('/occurrences'),
          apiFetch('/equipments')
        ]);

        if (!occurrencesRes.ok) throw new Error('Falha ao carregar chamados.');
        if (!equipmentsRes.ok) throw new Error('Falha ao carregar equipamentos.');

        const occurrencesData: Occurrence[] = await occurrencesRes.json();
        const equipmentsData: Equipment[] = await equipmentsRes.json();

        if (isMounted) {
          const eqMap = equipmentsData.reduce((acc, eq) => {
            acc[eq.id] = eq;
            return acc;
          }, {} as Record<string, Equipment>);
          
          setEquipments(eqMap);
          // Sort by newest first
          const sorted = occurrencesData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setOccurrences(sorted);
          setLoading(false);
        }
      } catch (error: any) {
        if (isMounted) {
          showToast('error', error.message || 'Erro inesperado.');
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [showToast]);

  return (
    <div className="max-w-[1400px] mx-auto w-full pb-12">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-medium text-zinc-100 tracking-tight">Fila de Chamados</h1>
          <p className="text-sm text-zinc-500 mt-1">Gerencie os tickets de suporte e alertas da infraestrutura.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-4">
          <div className="text-xs font-mono text-zinc-500">
            {occurrences.length} tickets
          </div>
          <Link 
            to="/chamados/cadastrar"
            className="text-sm font-medium text-zinc-950 bg-zinc-100 px-4 py-2 rounded-md hover:bg-white transition-colors"
          >
            + Abrir Chamado
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border border-white/10 overflow-hidden bg-zinc-950">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-sm">Carregando chamados...</div>
        ) : occurrences.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-sm bg-zinc-900/20">
            Nenhum chamado registrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 border-b border-white/10 bg-zinc-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Equipamento</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Prioridade</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {occurrences.map((occ) => {
                  const eq = equipments[occ.equipment_id];
                  return (
                    <tr key={occ.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-zinc-200">{eq ? eq.hostname : 'Desconhecido'}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{occ.id.split('-')[0]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                        {new Date(occ.created_at).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono tracking-widest uppercase
                          ${occ.priority === 'CRITICA' || occ.priority === 'critica' ? 'border-red-500/30 text-red-400 bg-red-500/10' : 
                            occ.priority === 'ALTA' || occ.priority === 'alta' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                            occ.priority === 'MEDIA' || occ.priority === 'media' ? 'border-zinc-500/30 text-zinc-300 bg-zinc-500/10' : 'border-zinc-700 text-zinc-400'}`}>
                          {occ.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {occ.origin === 'SOLICITACAO_USUARIO' ? 'Usuário' :
                         occ.origin === 'IDENTIFICACAO_TECNICA' ? 'Técnico' :
                         occ.origin === 'TELEMETRIA' ? 'Telemetria' : occ.origin}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${occ.closure_date ? 'bg-zinc-500' : 'bg-amber-500 animate-pulse'}`} />
                          <span className="text-xs font-mono text-zinc-300">
                            {occ.closure_date ? 'FECHADO' : 'ABERTO'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link 
                          to={`/equipamentos/${occ.equipment_id}`}
                          className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-zinc-100 bg-zinc-800 border border-white/10 rounded-md hover:bg-zinc-700 hover:border-zinc-500 transition-colors shadow-sm"
                        >
                          Ver Prontuário
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
