import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { VanguardLogo } from '../brand/VanguardLogo';
import { ThemeToggle } from '../theme/ThemeContext';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useToast } from '../feedback/ToastContext';

export const Layout: React.FC = () => {
  const { user, isGestor, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: 'Overview', show: true },
    { to: '/chamados', label: 'Chamados', show: true },
    { to: '/equipamentos', label: 'Equipamentos', show: true },
    { to: '/configuracoes', label: 'Configurações', show: isGestor },
  ].filter((link) => link.show);

  const handleLogout = async () => {
    await logout();
    showToast('success', 'Sessão encerrada com segurança.');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-main)] font-sans">
      {/* Top-Nav estilo Vercel adaptável aos temas Escuro e Claro */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 max-w-[1400px] mx-auto gap-4">
          <div className="flex items-center min-w-0">
            {/* Brand */}
            <Link
              to="/"
              aria-label="Ir para o painel inicial do Vanguard"
              className="flex items-center pr-4 sm:pr-6 border-r border-[var(--color-border)] mr-4 sm:mr-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
            >
              <VanguardLogo size="sm" />
            </Link>

            {/* Navigation Tabs */}
            <nav aria-label="Navegação principal" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                      isActive
                        ? 'text-[var(--color-text-main)] bg-[var(--color-surface-elevated)] font-medium border border-[var(--color-border)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-elevated)]/60'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Controles de sessão e acessibilidade (Tema + Perfil + Logout) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />

            {user && (
              <div className="flex items-center gap-2.5 pl-2.5 border-l border-[var(--color-border)]">
                <div className="hidden md:flex flex-col items-end leading-tight">
                  <span className="text-xs font-medium text-[var(--color-text-main)] truncate max-w-[160px]">
                    {user.name}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--color-text-secondary)] truncate max-w-[180px]">
                    {user.email}
                  </span>
                </div>

                <span
                  aria-label={`Perfil de acesso: ${user.role}`}
                  className={`px-2 py-0.5 rounded border text-[10px] font-mono tracking-widest uppercase ${
                    user.role === 'GESTOR'
                      ? 'border-amber-500/40 bg-amber-500/10 text-[var(--color-status-warning-text)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {user.role}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Encerrar sessão e sair"
                  title="Sair"
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] transition-colors"
                >
                  <LogOut size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-[1400px] mx-auto w-full p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
};
