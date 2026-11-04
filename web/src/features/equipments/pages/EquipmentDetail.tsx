import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../components/feedback/ToastContext';
import { useAuth } from '../../auth/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { occurrenceSchema } from '../../occurrences/schemas/occurrenceSchema';
import type { OccurrenceFormData } from '../../occurrences/schemas/occurrenceSchema';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { HealthBadge } from '../components/HealthBadge';
import { HealthReasons } from '../components/HealthReasons';

interface Equipment {
  id: string;
  patrimony_tag: string;
  hostname: string;
  mac_address: string;
  sector_id: string;
  health_status: string;
  health_reasons?: string[];
}

interface Occurrence {
  id: string;
  equipment_id: string;
  technician_id: string | null;
  created_at: string;
  origin: string;
  priority: string;
  description: string;
  diagnosis: string | null;
  action_taken: string | null;
  closure_date: string | null;
}

export const EquipmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OccurrenceFormData>({
    resolver: zodResolver(occurrenceSchema),
    defaultValues: {
      equipmentId: id || '',
      technicianId: user?.id || '',
      origin: 'IDENTIFICACAO_TECNICA',
      priority: 'MEDIA',
      description: '',
      diagnosis: '',
      actionTaken: '',
    },
  });

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const loadProntuario = async () => {
      try {
        const [eqRes, occRes] = await Promise.all([
          apiFetch(`/equipments/${id}`),
          apiFetch(`/occurrences/equipment/${id}`),
        ]);

        if (!eqRes.ok) throw new Error('Falha ao carregar equipamento.');
        if (!occRes.ok) throw new Error('Falha ao carregar histórico de ocorrências.');

        const eqData = await eqRes.json();
        const occData = await occRes.json();

        if (isMounted) {
          setEquipment(eqData);
          setOccurrences(occData);
        }
      } catch (error: any) {
        if (isMounted) {
          showToast('error', error.message || 'Erro ao carregar prontuário.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProntuario();
    return () => {
      isMounted = false;
    };
  }, [id, reloadKey, showToast]);

  const onSubmit = async (data: OccurrenceFormData) => {
    try {
      const res = await apiFetch('/occurrences', {
        method: 'POST',
        body: JSON.stringify({
          equipment_id: data.equipmentId,
          technician_id: user?.id || data.technicianId || null,
          origin: data.origin,
          priority: data.priority,
          description: data.description,
          diagnosis: data.diagnosis || null,
          action_taken: data.actionTaken,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || 'Falha ao registrar ocorrência.');
      }

      showToast('success', 'Manutenção registrada com sucesso!');
      reset({
        equipmentId: id || '',
        technicianId: user?.id || '',
        origin: 'IDENTIFICACAO_TECNICA',
        priority: 'MEDIA',
        description: '',
        diagnosis: '',
        actionTaken: '',
      });
      setShowForm(false);
      setReloadKey((prev) => prev + 1);
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--color-text-secondary)] font-mono text-sm">
        Carregando prontuário...
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="p-8 text-center text-[var(--color-danger)] font-mono text-sm">
        Equipamento não encontrado.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-xl font-medium text-[var(--color-text-main)]">{equipment.hostname}</h2>
            <HealthBadge status={equipment.health_status} variant="pill" />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] font-mono">ID: {equipment.id}</p>
        </div>
        <Link
          to="/equipamentos"
          className="mt-4 sm:mt-0 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)] transition-colors"
        >
          &larr; Voltar
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-[10px] text-[var(--color-text-secondary)] font-medium uppercase tracking-widest mb-1">
            Hostname
          </p>
          <p className="font-mono text-sm text-[var(--color-text-main)]">{equipment.hostname}</p>
        </div>
        <div className="p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-[10px] text-[var(--color-text-secondary)] font-medium uppercase tracking-widest mb-1">
            Patrimônio
          </p>
          <p className="font-mono text-sm text-[var(--color-text-main)]">{equipment.patrimony_tag}</p>
        </div>
        <div className="p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-[10px] text-[var(--color-text-secondary)] font-medium uppercase tracking-widest mb-1">
            MAC Address
          </p>
          <p className="font-mono text-sm text-[var(--color-text-main)]">{equipment.mac_address}</p>
        </div>
        <div className="p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-[10px] text-[var(--color-text-secondary)] font-medium uppercase tracking-widest mb-1">
            Sector ID
          </p>
          <p className="font-mono text-sm text-[var(--color-text-main)]">{equipment.sector_id.slice(0, 8)}...</p>
        </div>
      </div>

      <HealthReasons status={equipment.health_status} reasons={equipment.health_reasons} />

      <div className="flex justify-between items-center mb-4 border-b border-[var(--color-border)] pb-2">
        <h3 className="text-sm font-medium text-[var(--color-text-main)]">Log de Ocorrências</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          aria-expanded={showForm}
          aria-label={showForm ? 'Cancelar registro de manutenção' : 'Registrar nova manutenção'}
          className="text-xs font-medium text-[var(--color-text-main)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-3 py-1.5 rounded-md hover:border-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Registrar Manutenção'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6 mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Origem da Falha"
                {...register('origin')}
                error={errors.origin?.message}
                options={[
                  { value: 'IDENTIFICACAO_TECNICA', label: 'Identificação técnica' },
                  { value: 'TELEMETRIA', label: 'Alerta da Telemetria' },
                  { value: 'SOLICITACAO_USUARIO', label: 'Chamado de Usuário' },
                ]}
              />
              <Select
                label="Prioridade"
                {...register('priority')}
                error={errors.priority?.message}
                options={[
                  { value: 'MEDIA', label: 'Média' },
                  { value: 'ALTA', label: 'Alta' },
                  { value: 'CRITICA', label: 'Crítica' },
                  { value: 'BAIXA', label: 'Baixa' },
                ]}
              />
            </div>

            <div>
              <label htmlFor="occ-description" className="text-xs font-medium text-[var(--color-text-main)]">
                Descrição do Problema
              </label>
              <textarea
                id="occ-description"
                className="w-full mt-1.5 p-3 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] min-h-[80px] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                {...register('description')}
              />
              {errors.description && (
                <span className="text-xs text-[var(--color-danger)] mt-1 block">{errors.description.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="occ-diagnosis" className="text-xs font-medium text-[var(--color-text-main)]">
                Diagnóstico Técnico (Opcional)
              </label>
              <textarea
                id="occ-diagnosis"
                className="w-full mt-1.5 p-3 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] min-h-[60px] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                {...register('diagnosis')}
              />
              {errors.diagnosis && (
                <span className="text-xs text-[var(--color-danger)] mt-1 block">{errors.diagnosis.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="occ-action" className="text-xs font-medium text-[var(--color-text-main)]">
                Ação Tomada
              </label>
              <textarea
                id="occ-action"
                className="w-full mt-1.5 p-3 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] min-h-[80px] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                {...register('actionTaken')}
              />
              {errors.actionTaken && (
                <span className="text-xs text-[var(--color-danger)] mt-1 block">{errors.actionTaken.message}</span>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isSubmitting}>
                Salvar Registro
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {occurrences.length === 0 ? (
          <div className="p-8 text-center border border-[var(--color-border)] rounded-md bg-[var(--color-surface)]">
            <p className="text-sm font-mono text-[var(--color-text-secondary)]">Nenhum evento registrado.</p>
          </div>
        ) : (
          occurrences.map((occ) => (
            <div key={occ.id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono tracking-widest uppercase ${
                      occ.priority === 'CRITICA'
                        ? 'border-red-500/35 text-[var(--color-status-critical-text)] bg-red-500/15'
                        : occ.priority === 'ALTA'
                          ? 'border-amber-500/35 text-[var(--color-status-warning-text)] bg-amber-500/15'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)]'
                    }`}
                  >
                    {occ.priority}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)] font-mono">Origin: {occ.origin}</span>
                </div>
                <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                  {new Date(occ.created_at).toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-[10px] font-medium uppercase text-[var(--color-text-secondary)] tracking-widest mb-1">
                    Issue
                  </h5>
                  <p className="text-sm text-[var(--color-text-main)]">{occ.description}</p>
                </div>

                {occ.diagnosis && (
                  <div>
                    <h5 className="text-[10px] font-medium uppercase text-[var(--color-text-secondary)] tracking-widest mb-1">
                      Diagnosis
                    </h5>
                    <p className="text-sm text-[var(--color-text-main)]">{occ.diagnosis}</p>
                  </div>
                )}

                <div>
                  <h5 className="text-[10px] font-medium uppercase text-[var(--color-text-secondary)] tracking-widest mb-1">
                    Resolution
                  </h5>
                  <p className="text-sm text-[var(--color-text-main)]">{occ.action_taken || '-'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
