import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../components/feedback/ToastContext';
import { HealthBadge } from '../../equipments/components/HealthBadge';
import { isAtRisk } from '../../equipments/lib/health';

interface TelemetryStatus {
  normal: number;
  atencao: number;
  critico: number;
  offline: number;
  sem_leitura: number;
}

interface Equipment {
  id: string;
  patrimony_tag: string;
  hostname: string;
  mac_address: string;
  sector_id: string;
  health_status: string;
  health_reasons?: string[];
}

export const TelemetryDashboard: React.FC = () => {
  const { showToast } = useToast();
  
  const [statusCounts, setStatusCounts] = useState<TelemetryStatus>({
    normal: 0, atencao: 0, critico: 0, offline: 0, sem_leitura: 0
  });
  const [riskEquipments, setRiskEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [statusRes, equipmentsRes] = await Promise.all([
          apiFetch('/telemetry/status'),
          apiFetch('/equipments')
        ]);

        if (!statusRes.ok) throw new Error('Falha ao obter status da telemetria.');
        if (!equipmentsRes.ok) throw new Error('Falha ao obter lista de equipamentos.');

        const statusData: TelemetryStatus = await statusRes.json();
        const equipmentsData: Equipment[] = await equipmentsRes.json();

        if (isMounted) {
          setStatusCounts(statusData);
          
          const atRisk = equipmentsData.filter((eq) => isAtRisk(eq.health_status));
          
          setRiskEquipments(atRisk);
          setLastUpdate(new Date());
          setLoading(false);
        }
      } catch (error: any) {
        if (isMounted) {
          showToast('error', error.message || 'Erro ao atualizar dados NOC.');
          if (loading) setLoading(false);
        }
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [showToast, loading]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="h-6 w-48 bg-zinc-800 rounded-md mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-zinc-900 border border-white/5 rounded-md"></div>
          ))}
        </div>
        <div className="h-64 bg-zinc-900 border border-white/5 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="w-full pb-12">
      {/* Header minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-lg font-medium text-zinc-100 tracking-tight">Centro de Operações (NOC)</h2>
          <p className="text-sm text-zinc-500 mt-1">Visão técnica do parque e telemetria em tempo real.</p>
        </div>
        <div className="text-xs font-mono text-zinc-500 flex items-center gap-2 mt-4 sm:mt-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse"></span>
          Live · {lastUpdate.toLocaleTimeString('pt-BR')}
        </div>
      </div>

      {/* Métricas Técnicas (Grid Vercel-style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        
        <div className="p-4 rounded-md border border-white/10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Normal</span>
          </div>
          <div className="text-3xl font-mono text-zinc-100 tracking-tighter">{statusCounts.normal}</div>
        </div>

        <div className="p-4 rounded-md border border-white/10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Atenção</span>
          </div>
          <div className="text-3xl font-mono text-zinc-100 tracking-tighter">{statusCounts.atencao}</div>
        </div>

        <div className="p-4 rounded-md border border-white/10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Crítico</span>
          </div>
          <div className="text-3xl font-mono text-zinc-100 tracking-tighter">{statusCounts.critico}</div>
        </div>

        <div className="p-4 rounded-md border border-white/10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-zinc-500"></div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Offline</span>
          </div>
          <div className="text-3xl font-mono text-zinc-100 tracking-tighter">{statusCounts.offline}</div>
        </div>

        <div className="p-4 rounded-md border border-dashed border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-violet-400"></div>
            <span className="text-xs font-medium text-violet-300/80 uppercase tracking-widest">Sem Leitura</span>
          </div>
          <div className="text-3xl font-mono text-zinc-100 tracking-tighter">{statusCounts.sem_leitura ?? 0}</div>
        </div>

      </div>

      {/* Fila de Triagem Densa */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-100">Equipamentos em Risco</h3>
        <span className="text-xs font-mono text-zinc-500">{riskEquipments.length} found</span>
      </div>

      <div className="rounded-md border border-white/10 overflow-hidden bg-zinc-950">
        {riskEquipments.length === 0 ? (
          <div className="p-8 text-center border-t border-white/5 bg-zinc-900/20">
            <p className="text-sm font-mono text-zinc-400">0 equipamentos apresentando anomalias.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 border-b border-white/10 bg-zinc-900/50">
                <tr>
                  <th className="px-4 py-2 font-medium">Equipamento</th>
                  <th className="px-4 py-2 font-medium">MAC Address</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Motivo</th>
                  <th className="px-4 py-2 text-right font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {riskEquipments.map((eq) => (
                  <tr key={eq.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-2.5">
                      <div className="font-mono text-zinc-200">{eq.patrimony_tag}</div>
                      <div className="text-xs text-zinc-500">{eq.hostname}</div>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400 font-mono text-xs">
                      {eq.mac_address}
                    </td>
                    <td className="px-4 py-2.5">
                      <HealthBadge status={eq.health_status} reasons={eq.health_reasons} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500 max-w-xs">
                      <span className="block truncate" title={eq.health_reasons?.[0]}>
                        {eq.health_reasons?.[0] ?? '—'}
                      </span>
                      {eq.health_reasons && eq.health_reasons.length > 1 && (
                        <span className="text-[10px] font-mono text-zinc-600">+{eq.health_reasons.length - 1} motivo(s)</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link 
                        to={`/equipamentos/${eq.id}`}
                        className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-zinc-100 bg-zinc-800 border border-white/10 rounded-md hover:bg-zinc-700 hover:border-zinc-500 transition-colors shadow-sm"
                      >
                        Investigar
                      </Link>
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
