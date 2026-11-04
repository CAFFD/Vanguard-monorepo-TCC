import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Info, AlertCircle } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/feedback/ToastContext';
import { useAuth } from '../../auth/context/AuthContext';
import { occurrenceSchema } from '../schemas/occurrenceSchema';
import type { OccurrenceFormData } from '../schemas/occurrenceSchema';
import { apiFetch } from '../../../lib/api';
import type { User } from '../../users/types';

interface ApiEquipment {
  id: string;
  hostname: string;
  patrimony_tag: string;
  sector_id: string;
}

export const OccurrenceRegistrationPage: React.FC = () => {
  const { showToast } = useToast();
  const { isGestor, user } = useAuth();

  const [equipments, setEquipments] = useState<ApiEquipment[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [sectorsMap, setSectorsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OccurrenceFormData>({
    resolver: zodResolver(occurrenceSchema),
    defaultValues: {
      equipmentId: '',
      technicianId: user?.role === 'TECNICO' ? user.id : '',
      origin: 'SOLICITACAO_USUARIO',
      priority: 'MEDIA',
      description: '',
    },
  });

  const selectedOrigin = useWatch({ control, name: 'origin' });
  const descriptionValue = useWatch({ control, name: 'description' }) || '';

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [eqRes, userRes, secRes] = await Promise.all([
          apiFetch('/equipments'),
          apiFetch('/users'),
          apiFetch('/sectors'),
        ]);

        const eqData = eqRes.ok ? await eqRes.json() : [];
        const userData = userRes.ok ? await userRes.json() : [];
        const secData = secRes.ok ? await secRes.json() : [];

        if (isMounted) {
          setEquipments(Array.isArray(eqData) ? eqData : []);
          const allUsers: User[] = Array.isArray(userData) ? userData : [];
          const techList = allUsers.filter((u) => u.role === 'TECNICO');
          setTechnicians(techList.length > 0 ? techList : allUsers);

          const sMap: Record<string, string> = {};
          if (Array.isArray(secData)) {
            secData.forEach((s: any) => {
              sMap[s.id] = s.name;
            });
          }
          setSectorsMap(sMap);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          showToast('error', 'Falha ao carregar dados necessários da API.');
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const onSubmit = async (data: OccurrenceFormData) => {
    try {
      const res = await apiFetch('/occurrences', {
        method: 'POST',
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
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || 'Falha ao registrar ocorrência na API.');
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

  const hasEquipments = equipments.length > 0;
  const hasTechnicians = technicians.length > 0;
  const canSubmit = hasEquipments && hasTechnicians && !loading;

  return (
    <div className="max-w-3xl mx-auto w-full pb-12">
      <div className="mb-6 border-b border-[var(--color-border)] pb-4">
        <h2 className="text-lg font-medium text-[var(--color-text-main)] tracking-tight">Abrir chamado</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Registre uma ocorrência relacionada a um equipamento e encaminhe-a para atendimento técnico.
        </p>
      </div>

      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
        {(!hasEquipments || !hasTechnicians) && !loading && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-md bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/35 text-[var(--color-danger)] text-sm flex gap-3 items-start"
          >
            <AlertCircle size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold mb-1">Pré-requisitos ausentes</p>
              <ul className="list-disc ml-5 space-y-1">
                {!hasEquipments && (
                  <li>
                    Não há equipamentos cadastrados.{' '}
                    {isGestor ? (
                      <Link to="/equipamentos/cadastrar" className="underline font-medium">
                        Cadastrar equipamento
                      </Link>
                    ) : (
                      <span>Solicite o cadastro a um Gestor.</span>
                    )}
                  </li>
                )}
                {!hasTechnicians && (
                  <li>
                    Não há técnicos cadastrados.{' '}
                    {isGestor ? (
                      <Link to="/usuarios/cadastrar" className="underline font-medium">
                        Cadastrar usuário técnico
                      </Link>
                    ) : (
                      <span>Solicite o cadastro a um Gestor.</span>
                    )}
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
              options={
                loading
                  ? []
                  : equipments.map((e) => ({
                      value: e.id,
                      label: `[${e.patrimony_tag}] ${e.hostname} — ${sectorsMap[e.sector_id] || 'Setor Desconhecido'}`,
                    }))
              }
              disabled={loading || !hasEquipments}
            />

            <Select
              label="Técnico responsável"
              {...register('technicianId')}
              error={errors.technicianId?.message}
              options={
                loading
                  ? []
                  : technicians.map((t) => ({
                      value: t.id,
                      label: `${t.name} — ${t.email}`,
                    }))
              }
              disabled={loading || !hasTechnicians}
            />

            <div className="flex flex-col">
              <Select
                label="Origem"
                {...register('origin')}
                error={errors.origin?.message}
                options={[
                  { value: 'SOLICITACAO_USUARIO', label: 'Solicitação de usuário' },
                  { value: 'IDENTIFICACAO_TECNICA', label: 'Identificação técnica' },
                  { value: 'TELEMETRIA', label: 'Telemetria do equipamento' },
                ]}
                disabled={loading}
              />
              <div className="mt-2 text-xs text-[var(--color-text-secondary)] flex gap-1.5 items-start">
                <Info size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {selectedOrigin === 'SOLICITACAO_USUARIO' && 'Problema informado por um servidor.'}
                  {selectedOrigin === 'IDENTIFICACAO_TECNICA' && 'Falha encontrada durante inspeção.'}
                  {selectedOrigin === 'TELEMETRIA' && 'Alerta produzido por monitoramento automatizado.'}
                </span>
              </div>
            </div>

            <Select
              label="Prioridade"
              {...register('priority')}
              error={errors.priority?.message}
              options={[
                { value: 'BAIXA', label: 'Baixa' },
                { value: 'MEDIA', label: 'Média' },
                { value: 'ALTA', label: 'Alta' },
                { value: 'CRITICA', label: 'Crítica' },
              ]}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-[var(--color-text-main)]">
              Descrição do problema
            </label>
            <textarea
              id="description"
              className={`px-3 py-2 border rounded-md text-sm outline-none transition-colors min-h-[120px] resize-y bg-[var(--color-surface)] text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)]
                ${
                  errors.description
                    ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-1 focus:ring-[var(--color-danger)]'
                    : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]'
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="Descreva o problema observado, quando começou e como ele afeta o uso do equipamento."
              {...register('description')}
              disabled={loading}
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${errors.description ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'}`}>
                {errors.description?.message}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)] font-mono">
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
