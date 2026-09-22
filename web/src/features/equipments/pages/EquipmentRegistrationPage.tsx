import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
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

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      patrimonyTag: '',
      hostname: '',
      macAddress: '',
      sectorId: ''
    }
  });

  useEffect(() => {
    let isMounted = true;
    apiFetch('/sectors')
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setSectors(data);
          setLoadingSectors(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          showToast('error', 'Falha ao carregar setores.');
          setLoadingSectors(false);
        }
      });
    return () => { isMounted = false; };
  }, [showToast]);

  const handleMacChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^a-fA-F0-9]/g, '');
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
        health_status: 'NORMAL'
      };

      const response = await apiFetch('/equipments', {
        method: 'POST',
        body: JSON.stringify(payload)
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-text-main)]">Cadastrar equipamento</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Registre um novo ativo tecnológico e vincule-o ao setor responsável.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-6 md:p-8">
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
                register('macAddress').onChange(e); // allow react-hook-form to track
                handleMacChange(e);
              }}
              error={errors.macAddress?.message}
              maxLength={17}
            />

            <Select
              label="Setor responsável"
              {...register('sectorId')}
              error={errors.sectorId?.message}
              options={loadingSectors ? [] : sectors.map(s => ({ value: s.id, label: s.name }))}
              disabled={loadingSectors}
            />
          </div>

          <div className="bg-[var(--color-background)] p-4 rounded-md border border-[var(--color-border)]">
            <h3 className="text-sm font-medium text-[var(--color-text-main)] mb-2">Estado de saúde</h3>
            <div className="flex gap-2 text-sm text-[var(--color-text-secondary)]">
              <Info size={18} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
              <p>O estado de saúde será definido automaticamente após o recebimento da telemetria do equipamento.</p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" onClick={handleReset} disabled={isSubmitting}>
              Limpar formulário
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Cadastrar equipamento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
