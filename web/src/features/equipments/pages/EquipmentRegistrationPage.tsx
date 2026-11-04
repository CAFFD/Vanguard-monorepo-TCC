import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/feedback/ToastContext';
import { equipmentSchema } from '../schemas/equipmentSchema';
import type { EquipmentFormData } from '../schemas/equipmentSchema';
import { apiFetch } from '../../../lib/api';

interface Sector {
  id: string;
  name: string;
}

export const EquipmentRegistrationPage: React.FC = () => {
  const { showToast } = useToast();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      patrimonyTag: '',
      hostname: '',
      macAddress: '',
      sectorId: '',
    },
  });

  useEffect(() => {
    let isMounted = true;
    apiFetch('/sectors')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setSectors(Array.isArray(data) ? data : []);
          setLoadingSectors(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          showToast('error', 'Falha ao carregar setores.');
          setLoadingSectors(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handleMacChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-fA-F0-9]/g, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 2 === 0 && i < 12) {
        formatted += ':';
      }
      formatted += value[i];
    }
    setValue('macAddress', formatted.toUpperCase(), { shouldValidate: isDirty });
  };

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      const payload = {
        id: crypto.randomUUID(),
        sector_id: data.sectorId,
        mac_address: data.macAddress,
        patrimony_tag: data.patrimonyTag,
        hostname: data.hostname,
        health_status: 'SEM_LEITURA',
      };

      const response = await apiFetch('/equipments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Erro ao cadastrar equipamento.');
      }

      showToast('success', 'Equipamento cadastrado com sucesso');
      reset();
    } catch (error: any) {
      showToast('error', error.message || 'Erro inesperado ao cadastrar equipamento.');
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
        <h2 className="text-lg font-medium text-[var(--color-text-main)] tracking-tight">Cadastrar Equipamento</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Registre um novo ativo tecnológico e vincule-o ao setor responsável.
        </p>
      </div>

      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Número de patrimônio"
              placeholder="Ex: 123456"
              {...register('patrimonyTag')}
              error={errors.patrimonyTag?.message}
            />

            <Input
              label="Hostname"
              placeholder="Ex: pc-admin-01"
              helperText="Permitido letras, números e hífen."
              {...register('hostname')}
              error={errors.hostname?.message}
            />

            <Input
              label="Endereço MAC"
              placeholder="AA:BB:CC:DD:EE:FF"
              {...register('macAddress')}
              onChange={(e) => {
                register('macAddress').onChange(e);
                handleMacChange(e);
              }}
              error={errors.macAddress?.message}
              maxLength={17}
            />

            <Select
              label="Setor responsável"
              {...register('sectorId')}
              error={errors.sectorId?.message}
              options={loadingSectors ? [] : sectors.map((s) => ({ value: s.id, label: s.name }))}
              disabled={loadingSectors}
            />
          </div>

          <div className="bg-[var(--color-surface-elevated)] p-4 rounded-md border border-[var(--color-border)]">
            <h3 className="text-xs font-mono font-medium text-[var(--color-text-main)] uppercase tracking-widest mb-1.5">
              Telemetria Automática
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              O estado de saúde será definido automaticamente após o primeiro sinal do Agente Go instalado na máquina.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" onClick={handleReset} disabled={isSubmitting}>
              Limpar formulário
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Cadastrar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
