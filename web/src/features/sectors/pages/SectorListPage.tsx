import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../components/feedback/ToastContext';
import { useAuth } from '../../auth/context/AuthContext';

interface Sector {
  id: string;
  name: string;
  description: string;
}

export const SectorListPage: React.FC = () => {
  const { showToast } = useToast();
  const { isGestor } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSectors = async () => {
      try {
        const res = await apiFetch('/sectors');
        if (!res.ok) throw new Error('Falha ao carregar setores.');

        const data = await res.json();
        if (isMounted) {
          setSectors(Array.isArray(data) ? data : []);
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
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handleDelete = async (sector: Sector) => {
    if (!window.confirm(`Deseja realmente remover o setor "${sector.name}"?`)) return;
    try {
      setDeletingId(sector.id);
      const res = await apiFetch(`/sectors/${sector.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || 'Não foi possível excluir o setor.');
      }
      setSectors((prev) => prev.filter((s) => s.id !== sector.id));
      showToast('success', 'Setor removido com sucesso.');
    } catch (error: any) {
      showToast('error', error.message || 'Erro ao excluir setor.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-6 border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-lg font-medium text-[var(--color-text-main)] tracking-tight">Departamentos</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Gestão das áreas e setores onde as máquinas estão alocadas.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-[var(--color-text-secondary)]">{sectors.length} registros</div>
          {isGestor && (
            <Link
              to="/setores/cadastrar"
              aria-label="Cadastrar novo setor"
              className="text-sm font-medium text-[var(--color-primary-foreground)] bg-[var(--color-primary)] px-4 py-2 rounded-md hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors"
            >
              + Adicionar
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-md border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
        {loading ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)] font-mono text-sm">
            Carregando setores...
          </div>
        ) : sectors.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)] font-mono text-sm bg-[var(--color-surface-elevated)]/30">
            Nenhum setor cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60">
                <tr>
                  <th className="px-4 py-3 font-medium w-64">ID (UUID)</th>
                  <th className="px-4 py-3 font-medium">Nome do Setor</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  {isGestor && <th className="px-4 py-3 font-medium text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {sectors.map((sector) => (
                  <tr
                    key={sector.id}
                    className="hover:bg-[var(--color-surface-elevated)]/50 transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono text-[10px] text-[var(--color-text-secondary)]">
                      {sector.id}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-main)] font-medium">{sector.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{sector.description}</td>
                    {isGestor && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(sector)}
                          disabled={deletingId === sector.id}
                          aria-label={`Remover setor ${sector.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={13} aria-hidden="true" />
                          <span>Remover</span>
                        </button>
                      </td>
                    )}
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
