import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, XCircle, WifiOff, Activity } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../components/feedback/ToastContext';

interface TelemetryStatus {
  normal: number;
  atencao: number;
  critico: number;
  offline: number;
}

interface Equipment {
  id: string;
  patrimony_tag: string;
  hostname: string;
  mac_address: string;
  sector_id: string;
  health_status: string;
}

export const TelemetryDashboard: React.FC = () => {
  const { showToast } = useToast();
  
  const [statusCounts, setStatusCounts] = useState<TelemetryStatus>({
    normal: 0, atencao: 0, critico: 0, offline: 0
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
          
          // Filtragem no frontend (Trade-off aceitável para o TCC)
          const atRisk = equipmentsData.filter(
            (eq) => eq.health_status === 'CRÍTICO' || eq.health_status === 'ATENÇÃO'
          );
          
          setRiskEquipments(atRisk);
          setLastUpdate(new Date());
          setLoading(false);
        }
      } catch (error: any) {
        if (isMounted) {
          showToast('error', error.message || 'Erro ao atualizar o Dashboard NOC.');
          // Não alteramos o loading para false imediatamente na primeira falha 
          // caso já tenha carregado antes, para não piscar a tela. 
          // Mas se for o primeiro carregamento, tiramos o loading.
          if (loading) setLoading(false);
        }
      }
    };

    // Executa imediatamente na montagem
    fetchData();

    // Configura o Polling de 60 segundos
    const intervalId = setInterval(fetchData, 60000);

    // Cleanup para evitar Memory Leaks na desmontagem
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [showToast, loading]);

  const renderSkeletons = () => (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded-xl"></div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
        {renderSkeletons()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[var(--color-text-main)] flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Dashboard NOC
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 font-medium">
            Centro de Operações de Rede - Monitoramento de Saúde de Ativos
          </p>
        </div>
        <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
          Última atualização: <span className="text-gray-900">{lastUpdate.toLocaleTimeString('pt-BR')}</span>
        </div>
      </div>

      {/* Painel de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
          <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
          <h3 className="text-4xl font-black text-emerald-600 mb-1">{statusCounts.normal}</h3>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Normal</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
          <h3 className="text-4xl font-black text-amber-600 mb-1">{statusCounts.atencao}</h3>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Atenção</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
          <XCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="text-4xl font-black text-red-600 mb-1">{statusCounts.critico}</h3>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Crítico</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
          <WifiOff className="w-10 h-10 text-gray-400 mb-3" />
          <h3 className="text-4xl font-black text-gray-600 mb-1">{statusCounts.offline}</h3>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Offline</p>
        </div>
      </div>

      {/* Fila de Triagem */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-xl font-bold text-[var(--color-text-main)]">
            Fila de Triagem (Equipamentos em Risco)
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
          {riskEquipments.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
              <p className="text-lg font-bold text-emerald-700">Parque Tecnológico Estável</p>
              <p className="text-gray-500">Nenhum equipamento apresenta falhas iminentes no momento.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--color-text-secondary)] uppercase bg-gray-50 border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-6 py-4 font-bold">Patrimônio / Hostname</th>
                    <th className="px-6 py-4 font-bold">Endereço MAC</th>
                    <th className="px-6 py-4 font-bold">Status de Risco</th>
                    <th className="px-6 py-4 font-bold text-right">Ação Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {riskEquipments.map((eq) => (
                    <tr key={eq.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[var(--color-text-main)]">{eq.patrimony_tag}</div>
                        <div className="text-[var(--color-text-secondary)]">{eq.hostname}</div>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)] font-mono text-xs">
                        {eq.mac_address}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-max
                          ${eq.health_status === 'CRÍTICO' 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {eq.health_status === 'CRÍTICO' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {eq.health_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/equipamentos/${eq.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                          Analisar e Intervir
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
    </div>
  );
};
