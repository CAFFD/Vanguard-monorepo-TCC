import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../components/feedback/ToastContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export const UserListPage: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const res = await apiFetch('/users');
        if (!res.ok) throw new Error('Falha ao carregar usuários.');
        
        const data = await res.json();
        if (isMounted) {
          setUsers(data);
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
    return () => { isMounted = false; };
  }, [showToast]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-medium text-zinc-100 tracking-tight">Equipe</h2>
          <p className="text-sm text-zinc-500 mt-1">Lista de técnicos e gestores com acesso ao Vanguard.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-zinc-500">
            {users.length} membros
          </div>
          <Link 
            to="/usuarios/cadastrar"
            className="text-sm font-medium text-zinc-950 bg-zinc-100 px-4 py-2 rounded-md hover:bg-white transition-colors"
          >
            + Adicionar
          </Link>
        </div>
      </div>
      
      <div className="rounded-md border border-white/10 overflow-hidden bg-zinc-950">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-sm">Carregando equipe...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-sm bg-zinc-900/20">
            Nenhum usuário cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 border-b border-white/10 bg-zinc-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium">ID (UUID)</th>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Nível de Acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-3 font-mono text-[10px] text-zinc-500">
                      {user.id}
                    </td>
                    <td className="px-4 py-3 text-zinc-200 font-medium">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono tracking-widest uppercase
                        ${user.role === 'GESTOR' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 
                          'border-zinc-500/30 text-zinc-300 bg-zinc-500/10'}`}>
                        {user.role}
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
