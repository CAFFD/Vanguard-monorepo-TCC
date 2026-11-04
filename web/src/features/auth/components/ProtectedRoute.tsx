import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../../users/types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Verificando sessão segura...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-lg mx-auto my-16 p-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-center">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={20} />
        </div>
        <h2 className="text-base font-semibold text-[var(--color-text-main)] mb-1">
          Acesso restrito a Gestores
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-5">
          Seu perfil atual (<span className="font-mono font-medium">{user.role}</span>) possui permissão para operação de chamados, prontuários e monitoramento NOC, mas não para administração de cadastros estruturais.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Voltar ao Centro de Operações
        </Link>
      </div>
    );
  }

  return <Outlet />;
};

