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
          apiFetch('/equipments'),
        ]);

        if (!occurrencesRes.ok) throw new Error('Falha ao carregar chamados.');
        if (!equipmentsRes.ok) throw new Error('Falha ao carregar equipamentos.');

        const occurrencesData: Occurrence[] = await occurrencesRes.json();
        const equipmentsData: Equipment[] = await equipmentsRes.json();

        if (isMounted) {
          const eqMap = equipmentsData.reduce(
            (acc, eq) => {
              acc[eq.id] = eq;
              return acc;
            },
            {} as Record<string, Equipment>
          );

          setEquipments(eqMap);
          const sorted = occurrencesData.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
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
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  return (
    <div className="max-w-[1400px] mx-auto w-full pb-12">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h1 className="text-xl font-medium text-[var(--color-text-main)] tracking-tight">Fila de Chamados</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Gerencie os tickets de suporte e alertas da infraestrutura.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-4">
          <div className="text-xs font-mono text-[var(--color-text-secondary)]">{occurrences.length} tickets</div>
          <Link
            to="/chamados/cadastrar"
            aria-label="Abrir novo chamado"
            className="text-sm font-medium text-[var(--color-primary-foreground)] bg-[var(--color-primary)] px-4 py-2 rounded-md hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors"
          >
            + Abrir Chamado
          </Link>
        </div>
      </div>

      <div className="rounded-md border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
        {loading ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)] font-mono text-sm">
            Carregando chamados...
          </div>
        ) : occurrences.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)] font-mono text-sm bg-[var(--color-surface-elevated)]/30">
            Nenhum chamado registrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Equipamento</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Prioridade</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {occurrences.map((occ) => {
                  const eq = equipments[occ.equipment_id];
                  const priorityUpper = (occ.priority || '').toUpperCase();
                  return (
                    <tr
                      key={occ.id}
                      className="hover:bg-[var(--color-surface-elevated)]/50 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-[var(--color-text-main)] font-medium">
                            {eq ? eq.hostname : 'Desconhecido'}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-secondary)] font-mono">
                            {occ.id.split('-')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] font-mono text-xs">
                        {new Date(occ.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono tracking-widest uppercase ${
                            priorityUpper === 'CRITICA'
                              ? 'border-red-500/35 text-[var(--color-status-critical-text)] bg-red-500/15'
                              : priorityUpper === 'ALTA'
                                ? 'border-amber-500/35 text-[var(--color-status-warning-text)] bg-amber-500/15'
                                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)]'
                          }`}
                        >
                          {occ.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] text-xs">
                        {occ.origin === 'SOLICITACAO_USUARIO'
                          ? 'Usuário'
                          : occ.origin === 'IDENTIFICACAO_TECNICA'
                            ? 'Técnico'
                            : occ.origin === 'TELEMETRIA'
                              ? 'Telemetria'
                              : occ.origin}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              occ.closure_date ? 'bg-zinc-500' : 'bg-amber-500 animate-pulse'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="text-xs font-mono text-[var(--color-text-main)]">
                            {occ.closure_date ? 'FECHADO' : 'ABERTO'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/equipamentos/${occ.equipment_id}`}
                          aria-label={`Ver prontuário do equipamento ${eq ? eq.hostname : occ.equipment_id}`}
                          className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-[var(--color-text-main)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-md hover:border-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors shadow-sm"
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
