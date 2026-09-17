import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/feedback/ToastContext';
import { sectorSchema } from '../schemas/sectorSchema';
import type { SectorFormData } from '../schemas/sectorSchema';
import { StorageService } from '../../../services/storage';

export const SectorRegistrationPage: React.FC = () => {
  const { showToast } = useToast();
  
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm<SectorFormData>({
    resolver: zodResolver(sectorSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const descriptionValue = watch('description');

  const onSubmit = async (data: SectorFormData) => {
    try {
      const newSector = {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description,
      };
      await StorageService.saveSector(newSector);
      showToast('success', 'Setor cadastrado com sucesso');
      reset();
    } catch (error: any) {
      showToast('error', error.message || 'Erro inesperado ao cadastrar setor.');
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
        <h2 className="text-2xl font-bold text-[var(--color-text-main)]">Cadastrar setor</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Registre um setor da prefeitura para organizar a localização e a responsabilidade pelos equipamentos.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <Input
            label="Nome do setor"
            placeholder="Ex: Secretaria de Educação"
            {...register('name')}
            error={errors.name?.message}
          />
          
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-[var(--color-text-main)]">
              Descrição
            </label>
            <textarea
              id="description"
              className={`px-3 py-2 border rounded-md text-sm outline-none transition-colors min-h-[100px] resize-y
                ${errors.description 
                  ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-1 focus:ring-[var(--color-danger)]' 
                  : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]'
                }
                disabled:bg-gray-100 disabled:text-gray-500`}
              placeholder="Ex: Responsável pelos equipamentos das unidades administrativas da Secretaria de Educação."
              {...register('description')}
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${errors.description ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'}`}>
                {errors.description?.message}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {descriptionValue.length}/300
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" onClick={handleReset} disabled={isSubmitting}>
              Limpar formulário
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Cadastrar setor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
