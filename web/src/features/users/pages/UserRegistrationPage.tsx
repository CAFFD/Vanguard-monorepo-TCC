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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: undefined,
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      // Hash da senha via Web Crypto API (SHA-256) antes de enviar ao backend
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data.password));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const password_hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const payload = {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        role: data.role,
        password_hash,
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
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-text-main)]">Cadastrar usuário</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Registre um novo profissional com acesso ao sistema de gestão de ativos.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-6 md:p-8">
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

          <div className="bg-[var(--color-background)] p-4 rounded-md border border-[var(--color-border)]">
            <Select
              label="Perfil de acesso"
              {...register('role')}
              error={errors.role?.message}
              options={[
                { value: 'GESTOR', label: 'Gestor' },
                { value: 'TECNICO', label: 'Técnico' }
              ]}
            />
            <div className="mt-3 flex gap-2 text-sm text-[var(--color-text-secondary)]">
              <Info size={16} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
              <div>
                <p><strong>Gestor:</strong> acompanha a saúde do parque, alertas e informações gerenciais dos ativos.</p>
                <p><strong>Técnico:</strong> analisa alertas, realiza manutenções e registra intervenções nos equipamentos.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? "text" : "password"}
                {...register('password')}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Input
              label="Confirmar senha"
              type={showPassword ? "text" : "password"}
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
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
