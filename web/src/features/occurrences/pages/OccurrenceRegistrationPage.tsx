import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Info, AlertCircle } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/feedback/ToastContext';
import { occurrenceSchema } from '../schemas/occurrenceSchema';
import type { OccurrenceFormData } from '../schemas/occurrenceSchema';
import { StorageService } from '../../../services/storage';
import { apiFetch } from '../../../lib/api';
import type { Equipment } from '../../equipments/types';
import type { User } from '../../users/types';

export const OccurrenceRegistrationPage: React.FC = () => {
  const { showToast } = useToast();
  
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [sectorsMap, setSectorsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm<OccurrenceFormData>({
    resolver: zodResolver(occurrenceSchema),
    defaultValues: {
      equipmentId: '',
      technicianId: '',
      origin: 'SOLICITACAO_USUARIO',
      priority: 'MEDIA',
      description: ''
    }
  });

  const selectedOrigin = watch('origin');
  const selectedPriority = watch('priority');
  const descriptionValue = watch('description');

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [eqData, userData, secData] = await Promise.all([
          Promise.resolve(StorageService.getEquipments()),
          Promise.resolve(StorageService.getUsers()),
          StorageService.getSectors()
        ]);
        
        if (isMounted) {
          setEquipments(eqData);
          setTechnicians(userData.filter(u => u.role === 'TECNICO'));
          
          const sMap: Record<string, string> = {};
          secData.forEach(s => { sMap[s.id] = s.name; });
          setSectorsMap(sMap);
          
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          showToast('error', 'Falha ao carregar dados necessários.');
          setLoading(false);
        }
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [showToast]);

  const onSubmit = async (data: OccurrenceFormData) => {
    try {
      const res = await apiFetch('/occurrences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment_id: data.equipmentId,
          technician_id: data.technicianId || null,
          origin: data.origin,
          priority: data.priority,
          description: data.description,
          diagnosis: data.diagnosis || null,
          action_taken: data.actionTaken,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar ocorrência na API.');
      }

      showToast('success', 'Chamado aberto com sucesso');
      reset();
    } catch (error: any) {
      showToast('error', error.message || 'Erro inesperado ao abrir chamado.');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'BAIXA': return 'bg-gray-50 border-gray-200 text-gray-700';
      case 'MEDIA': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'ALTA': return 'bg-[var(--color-warning-bg)] border-[var(--color-warning)] text-[var(--color-warning)]';
      case 'CRITICA': return 'bg-[var(--color-danger-bg)] border-[var(--color-danger)] text-[var(--color-danger)]';
      default: return 'bg-[var(--color-background)] border-[var(--color-border)]';
    }
  };

  const hasEquipments = equipments.length > 0;
  const hasTechnicians = technicians.length > 0;
  const canSubmit = hasEquipments && hasTechnicians && !loading;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-text-main)]">Abrir chamado</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Registre uma ocorrência relacionada a um equipamento e encaminhe-a para atendimento técnico.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-6 md:p-8">
        
        {(!hasEquipments || !hasTechnicians) && !loading && (
          <div className="mb-6 p-4 rounded-md bg-[var(--color-danger-bg)] border border-[var(--color-danger)] text-[var(--color-danger)] text-sm flex gap-3 items-start">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Pré-requisitos ausentes</p>
              <ul className="list-disc ml-5 space-y-1">
                {!hasEquipments && (
                  <li>
                    Não há equipamentos cadastrados. <Link to="/equipamentos/cadastrar" className="underline font-medium hover:text-red-800">Cadastrar equipamento</Link>.
                  </li>
                )}
                {!hasTechnicians && (
                  <li>
                    Não há técnicos cadastrados. <Link to="/usuarios/cadastrar" className="underline font-medium hover:text-red-800">Cadastrar usuário técnico</Link>.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Equipamento"
              {...register('equipmentId')}
              error={errors.equipmentId?.message}
              options={loading ? [] : equipments.map(e => ({
                value: e.id,
                label: `[${e.patrimonyTag}] ${e.hostname} — ${sectorsMap[e.sectorId] || 'Setor Desconhecido'}`
              }))}
              disabled={loading || !hasEquipments}
            />

            <Select
              label="Técnico responsável"
              {...register('technicianId')}
              error={errors.technicianId?.message}
              options={loading ? [] : technicians.map(t => ({
                value: t.id,
                label: `${t.name} — ${t.email}`
              }))}
              disabled={loading || !hasTechnicians}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--color-background)] p-4 rounded-md border border-[var(--color-border)] flex flex-col h-full">
              <Select
                label="Origem"
                {...register('origin')}
                error={errors.origin?.message}
                options={[
                  { value: 'SOLICITACAO_USUARIO', label: 'Solicitação de usuário' },
                  { value: 'IDENTIFICACAO_TECNICA', label: 'Identificação técnica' },
                  { value: 'TELEMETRIA', label: 'Telemetria do equipamento' }
                ]}
                disabled={loading}
              />
              <div className="mt-3 flex gap-2 text-sm text-[var(--color-text-secondary)]">
                <Info size={16} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
                <div>
                  {selectedOrigin === 'SOLICITACAO_USUARIO' && <p>Problema informado por um servidor.</p>}
                  {selectedOrigin === 'IDENTIFICACAO_TECNICA' && <p>Falha encontrada durante inspeção.</p>}
                  {selectedOrigin === 'TELEMETRIA' && <p>Alerta produzido por monitoramento automatizado.</p>}
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-md border transition-colors flex flex-col h-full ${getPriorityColor(selectedPriority)}`}>
              <Select
                label="Prioridade"
                {...register('priority')}
                error={errors.priority?.message}
                options={[
                  { value: 'BAIXA', label: 'Baixa' },
                  { value: 'MEDIA', label: 'Média' },
                  { value: 'ALTA', label: 'Alta' },
                  { value: 'CRITICA', label: 'Crítica' }
                ]}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-[var(--color-text-main)]">
              Descrição do problema
            </label>
            <textarea
              id="description"
              className={`px-3 py-2 border rounded-md text-sm outline-none transition-colors min-h-[120px] resize-y
                ${errors.description 
                  ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-1 focus:ring-[var(--color-danger)]' 
                  : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]'
                }
                disabled:bg-gray-100 disabled:text-gray-500`}
              placeholder="Descreva o problema observado, quando começou e como ele afeta o uso do equipamento."
              {...register('description')}
              disabled={loading}
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${errors.description ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'}`}>
                {errors.description?.message}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {descriptionValue.length}/1000
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" onClick={handleReset} disabled={isSubmitting || loading}>
              Limpar formulário
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={!canSubmit}>
              Abrir chamado
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
