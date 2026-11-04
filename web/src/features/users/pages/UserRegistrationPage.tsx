import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Info } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/feedback/ToastContext';
import { userSchema } from '../schemas/userSchema';
import type { UserFormData } from '../schemas/userSchema';
import { apiFetch } from '../../../lib/api';

export const UserRegistrationPage: React.FC = () => {
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: undefined,
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      // A senha é enviada via HTTPS e derivada com scrypt + sal aleatório no servidor.
      const payload = {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password,
      };

      const response = await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const msg = responseData?.message || 'Erro ao cadastrar usuário.';
        showToast('error', msg);
        return;
      }

      showToast('success', 'Usuário cadastrado com sucesso!');
      reset();
    } catch (error: any) {
      showToast('error', error.message || 'Erro inesperado ao cadastrar usuário.');
    }
  };

  const handleReset = () => {
    if (isDirty) {
      if (window.confirm('Tem certeza que deseja limpar o formulário? Todos os dados preenchidos serão perdidos.')) {
        reset();
      }
    } else {
      reset();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full pb-12">
      <div className="mb-6 border-b border-[var(--color-border)] pb-4">
        <h2 className="text-lg font-medium text-[var(--color-text-main)] tracking-tight">Cadastrar usuário</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Registre um novo profissional com acesso ao sistema de gestão de ativos.
        </p>
      </div>

      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome completo"
              placeholder="Ex: João da Silva"
              {...register('name')}
              error={errors.name?.message}
              autoComplete="name"
            />

            <Input
              label="E-mail institucional"
              type="email"
              placeholder="joao.silva@prefeitura.gov.br"
              {...register('email')}
              error={errors.email?.message}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col">
            <Select
              label="Perfil de acesso"
              {...register('role')}
              error={errors.role?.message}
              options={[
                { value: 'GESTOR', label: 'Gestor' },
                { value: 'TECNICO', label: 'Técnico' },
              ]}
            />
            <div className="mt-2 text-xs text-[var(--color-text-secondary)] flex gap-1.5 items-start">
              <Info size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p>
                  <strong className="font-medium text-[var(--color-text-main)]">Gestor:</strong> acompanha a saúde do
                  parque, alertas, usuários, setores e informações gerenciais.
                </p>
                <p>
                  <strong className="font-medium text-[var(--color-text-main)]">Técnico:</strong> analisa alertas,
                  realiza manutenções e registra intervenções nos prontuários.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                helperText="Mínimo de 8 caracteres com letras e números."
                {...register('password')}
                error={errors.password?.message}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[33px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded p-0.5"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Input
              label="Confirmar senha"
              type={showPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" onClick={handleReset} disabled={isSubmitting}>
              Limpar formulário
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Cadastrar usuário
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
