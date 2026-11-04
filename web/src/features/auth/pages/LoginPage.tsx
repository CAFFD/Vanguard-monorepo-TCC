import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { VanguardLogo } from '../../../components/brand/VanguardLogo';
import { ThemeToggle } from '../../../components/theme/ThemeContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { loginSchema, type LoginFormData } from '../schemas/loginSchema';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    const result = await login(data.email, data.password);
    if (!result.ok) {
      setAuthError(result.error || 'Não foi possível autenticar.');
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--color-background)] text-[var(--color-text-main)] px-4 py-6">
      {/* Barra superior com logo e alternador de tema */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <VanguardLogo size="sm" />
        <ThemeToggle />
      </header>

      {/* Card central de autenticação */}
      <main className="w-full max-w-md mx-auto my-8">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <VanguardLogo size="md" showTagline />
            <h1 className="text-lg font-semibold text-[var(--color-text-main)] tracking-tight mt-5">
              Acesso ao Centro de Operações
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Entre com suas credenciais institucionais para acessar o painel preditivo.
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 p-3.5 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger-bg)] text-[var(--color-danger)] text-xs flex items-start gap-2.5"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
              <div className="leading-relaxed">
                <p className="font-semibold">Falha na autenticação</p>
                <p className="mt-0.5">{authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="E-mail institucional"
              type="email"
              placeholder="nome@prefeitura.gov.br"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[33px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded p-0.5"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <div className="pt-2">
              <Button type="submit" isLoading={isSubmitting} className="w-full">
                <Lock size={15} className="mr-2" aria-hidden="true" />
                Entrar no Vanguard
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
            <ShieldCheck size={15} className="text-emerald-500 shrink-0" aria-hidden="true" />
            <span>Sessão criptografada via JWT assinado em cookie HttpOnly.</span>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-[var(--color-text-secondary)] font-mono">
        Vanguard S.M.A.R.T. · Monitoramento Preditivo de Ativos de TI
      </footer>
    </div>
  );
};

