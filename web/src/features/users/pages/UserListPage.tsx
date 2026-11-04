import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../components/feedback/ToastContext';
import { useAuth } from '../../auth/context/AuthContext';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export const UserListPage: React.FC = () => {
  const { showToast } = useToast();
  const { user: currentUser, isGestor } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const res = await apiFetch('/users');
        if (!res.ok) throw new Error('Falha ao carregar usuários.');

        const data = await res.json();
        if (isMounted) {
          setUsers(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (error: any) {
        if (isMounted) {
          showToast('error', error.message || 'Erro inesperado.');
          setLoading(false);
        }
      }
    };

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handleDelete = async (target: UserItem) => {
    if (!window.confirm(`Deseja realmente remover o usuário "${target.name}" (${target.email})?`)) return;
    try {
      setDeletingId(target.id);
      const res = await apiFetch(`/users/${target.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || 'Não foi possível excluir o usuário.');
      }
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      showToast('success', 'Usuário removido com sucesso.');
    } catch (error: any) {
      showToast('error', error.message || 'Erro ao excluir usuário.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-6 border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-lg font-medium text-[var(--color-text-main)] tracking-tight">Equipe</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Lista de técnicos e gestores com acesso ao Vanguard.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-[var(--color-text-secondary)]">{users.length} membros</div>
          {isGestor && (
            <Link
              to="/usuarios/cadastrar"
              aria-label="Cadastrar novo usuário"
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
            Carregando equipe...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)] font-mono text-sm bg-[var(--color-surface-elevated)]/30">
            Nenhum usuário cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60">
                <tr>
                  <th className="px-4 py-3 font-medium">ID (UUID)</th>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Nível de Acesso</th>
                  {isGestor && <th className="px-4 py-3 font-medium text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {users.map((user) => {
                  const isSelf = currentUser?.id === user.id;
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[var(--color-surface-elevated)]/50 transition-colors group"
                    >
                      <td className="px-4 py-3 font-mono text-[10px] text-[var(--color-text-secondary)]">
                        {user.id}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-main)] font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] font-mono text-xs">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono tracking-widest uppercase ${
                            user.role === 'GESTOR'
                              ? 'border-amber-500/35 text-[var(--color-status-warning-text)] bg-amber-500/15'
                              : 'border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)]'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      {isGestor && (
                        <td className="px-4 py-3 text-right">
                          {isSelf ? (
                            <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">
                              Sessão atual
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              disabled={deletingId === user.id}
                              aria-label={`Remover usuário ${user.name}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={13} aria-hidden="true" />
                              <span>Remover</span>
                            </button>
                          )}
                        </td>
                      )}
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
