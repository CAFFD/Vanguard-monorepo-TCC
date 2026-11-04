import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../components/feedback/ToastContext';
import { useAuth } from '../../auth/context/AuthContext';
import { HealthBadge } from '../components/HealthBadge';

interface Equipment {
  id: string;
  patrimony_tag: string;
  hostname: string;
  mac_address: string;
  sector_id: string;
  health_status: string;
  health_reasons?: string[];
}

interface Sector {
  id: string;
  name: string;
}

export const EquipmentListPage: React.FC = () => {
  const { showToast } = useToast();
  const { isGestor } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [sectors, setSectors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [equipmentsRes, sectorsRes] = await Promise.all([
          apiFetch('/equipments'),
          apiFetch('/sectors'),
        ]);

        if (!equipmentsRes.ok) throw new Error('Falha ao carregar equipamentos.');
        if (!sectorsRes.ok) throw new Error('Falha ao carregar setores.');

        const equipmentsData: Equipment[] = await equipmentsRes.json();
        const sectorsData: Sector[] = await sectorsRes.json();

        if (isMounted) {
          const sectorsMap = sectorsData.reduce(
            (acc, sector) => {
              acc[sector.id] = sector.name;
              return acc;
            },
            {} as Record<string, string>
          );

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
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  return (
    <div className="w-full pb-12">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--color-border)] pb-4 gap-4">
        <div>
          <h2 className="text-lg font-medium text-[var(--color-text-main)] tracking-tight">Prontuários</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Gestão e histórico de todos os equipamentos do parque.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-[var(--color-text-secondary)]">{equipments.length} registries</div>
          {isGestor && (
            <Link
              to="/equipamentos/cadastrar"
              aria-label="Cadastrar novo equipamento"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] bg-[var(--color-primary)] rounded-md hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors"
            >
              Novo Equipamento
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-md border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
        {loading ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)] font-mono text-sm">
            Carregando dados...
          </div>
        ) : equipments.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)] font-mono text-sm bg-[var(--color-surface-elevated)]/30">
            Nenhum equipamento cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Patrimônio</th>
                  <th className="px-4 py-2.5 font-medium">Hostname</th>
                  <th className="px-4 py-2.5 font-medium">Endereço MAC</th>
                  <th className="px-4 py-2.5 font-medium">Setor</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {equipments.map((equipment) => (
                  <tr
                    key={equipment.id}
                    className="hover:bg-[var(--color-surface-elevated)]/50 transition-colors group"
                  >
                    <td className="px-4 py-2.5 font-mono text-[var(--color-text-main)] font-medium">
                      {equipment.patrimony_tag}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-text-main)]">{equipment.hostname}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-secondary)] font-mono text-xs">
                      {equipment.mac_address}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">
                      {sectors[equipment.sector_id] || 'Desconhecido'}
                    </td>
                    <td className="px-4 py-2.5">
                      <HealthBadge status={equipment.health_status} reasons={equipment.health_reasons} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        to={`/equipamentos/${equipment.id}`}
                        aria-label={`Abrir prontuário do equipamento ${equipment.hostname}`}
                        className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-[var(--color-text-main)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-md hover:border-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors shadow-sm"
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
