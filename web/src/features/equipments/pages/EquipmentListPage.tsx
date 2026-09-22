import React, { useEffect, useState } from 'react';
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-text-main)]">Prontuário de Equipamentos</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Visão geral de todos os computadores cadastrados e seus respectivos setores.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)]">Carregando dados...</div>
        ) : equipments.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)]">Nenhum equipamento cadastrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--color-text-secondary)] uppercase bg-[var(--color-background)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-6 py-4 font-medium">Patrimônio</th>
                  <th className="px-6 py-4 font-medium">Hostname</th>
                  <th className="px-6 py-4 font-medium">Endereço MAC</th>
                  <th className="px-6 py-4 font-medium">Setor</th>
                  <th className="px-6 py-4 font-medium">Saúde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {equipments.map((equipment) => (
                  <tr key={equipment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--color-text-main)]">
                      {equipment.patrimony_tag}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                      {equipment.hostname}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] font-mono">
                      {equipment.mac_address}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                      {sectors[equipment.sector_id] || 'Desconhecido'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                        ${equipment.health_status === 'NORMAL' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {equipment.health_status}
                      </span>
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
