import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../components/feedback/ToastContext';

interface Equipment {
  id: string;
  patrimony_tag: string;
  hostname: string;
  mac_address: string;
  sector_id: string;
  health_status: string;
}

interface Sector {
  id: string;
  name: string;
}

export const EquipmentListPage: React.FC = () => {
  const { showToast } = useToast();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [sectors, setSectors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [equipmentsRes, sectorsRes] = await Promise.all([
          apiFetch('/equipments'),
          apiFetch('/sectors')
        ]);

        if (!equipmentsRes.ok) throw new Error('Falha ao carregar equipamentos.');
        if (!sectorsRes.ok) throw new Error('Falha ao carregar setores.');

        const equipmentsData: Equipment[] = await equipmentsRes.json();
        const sectorsData: Sector[] = await sectorsRes.json();

        if (isMounted) {
          const sectorsMap = sectorsData.reduce((acc, sector) => {
            acc[sector.id] = sector.name;
            return acc;
          }, {} as Record<string, string>);
          
          setSectors(sectorsMap);
          setEquipments(equipmentsData);
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
    <div className="w-full pb-12">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-medium text-zinc-100 tracking-tight">Prontuários</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Gestão e histórico de todos os equipamentos do parque.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 text-xs font-mono text-zinc-500">
          {equipments.length} registries
        </div>
      </div>

      <div className="rounded-md border border-white/10 overflow-hidden bg-zinc-950">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-sm">Carregando dados...</div>
        ) : equipments.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-sm border-t border-white/5 bg-zinc-900/20">
            Nenhum equipamento cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 border-b border-white/10 bg-zinc-900/50">
                <tr>
                  <th className="px-4 py-2 font-medium">Patrimônio</th>
                  <th className="px-4 py-2 font-medium">Hostname</th>
                  <th className="px-4 py-2 font-medium">Endereço MAC</th>
                  <th className="px-4 py-2 font-medium">Setor</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {equipments.map((equipment) => (
                  <tr key={equipment.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-2.5 font-mono text-zinc-200">
                      {equipment.patrimony_tag}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400">
                      {equipment.hostname}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 font-mono text-xs">
                      {equipment.mac_address}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400">
                      {sectors[equipment.sector_id] || 'Desconhecido'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          equipment.health_status === 'NORMAL' ? 'bg-emerald-500' : 
                          equipment.health_status === 'ATENÇÃO' ? 'bg-amber-500' :
                          equipment.health_status === 'CRÍTICO' ? 'bg-red-500' : 'bg-zinc-500'
                        }`} />
                        <span className="text-xs font-mono text-zinc-300">
                          {equipment.health_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link 
                        to={`/equipamentos/${equipment.id}`}
                        className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-zinc-100 bg-zinc-800 border border-white/10 rounded-md hover:bg-zinc-700 hover:border-zinc-500 transition-colors shadow-sm"
                      >
                        Abrir
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
