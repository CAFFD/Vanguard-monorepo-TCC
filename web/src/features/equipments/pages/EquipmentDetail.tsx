import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../components/feedback/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { occurrenceSchema } from '../../occurrences/schemas/occurrenceSchema';
import type { OccurrenceFormData } from '../../occurrences/schemas/occurrenceSchema';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

interface Equipment {
  id: string;
  patrimony_tag: string;
  hostname: string;
  mac_address: string;
  sector_id: string;
  health_status: string;
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
  
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<OccurrenceFormData>({
    resolver: zodResolver(occurrenceSchema),
    defaultValues: {
      equipmentId: id || '',
      technicianId: 'b75f8221-50be-4a57-8be7-3bf76b4a8e80', // Mocked technician until Auth
      origin: 'IDENTIFICACAO_TECNICA',
      priority: 'MEDIA',
      description: '',
      diagnosis: '',
      actionTaken: '',
    }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eqRes, occRes] = await Promise.all([
        apiFetch(`/equipments/${id}`),
        apiFetch(`/occurrences/equipment/${id}`)
      ]);

      if (!eqRes.ok) throw new Error('Falha ao carregar equipamento.');
      if (!occRes.ok) throw new Error('Falha ao carregar histórico de ocorrências.');

      const eqData = await eqRes.json();
      const occData = await occRes.json();

      setEquipment(eqData);
      setOccurrences(occData);
    } catch (error: any) {
      showToast('error', error.message || 'Erro ao carregar prontuário.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, showToast]);

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
        throw new Error('Falha ao registrar ocorrência.');
      }

      showToast('success', 'Manutenção registrada com sucesso!');
      reset();
      setShowForm(false);
      fetchData(); // Recarrega histórico
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando prontuário...</div>;
  }

  if (!equipment) {
    return <div className="p-8 text-center text-red-600">Equipamento não encontrado.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-main)]">Prontuário do Equipamento</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Histórico médico e manutenções do ativo.</p>
        </div>
        <Link to="/equipamentos" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          &larr; Voltar para lista
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium uppercase">Hostname</p>
            <p className="font-semibold">{equipment.hostname}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium uppercase">Patrimônio</p>
            <p className="font-semibold">{equipment.patrimony_tag}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium uppercase">MAC Address</p>
            <p className="font-mono text-sm">{equipment.mac_address}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium uppercase">Saúde Atual</p>
            <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-bold border
              ${equipment.health_status === 'NORMAL' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : equipment.health_status === 'OFFLINE'
                ? 'bg-gray-100 text-gray-700 border-gray-300'
                : equipment.health_status === 'ATENÇÃO'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200'}`}>
              {equipment.health_status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-[var(--color-text-main)]">Histórico de Ocorrências</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar Registro' : 'Registrar Manutenção'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg border border-[var(--color-border)] p-6 mb-8">
          <h4 className="font-bold mb-4">Nova Manutenção / Intervenção</h4>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Origem da Falha"
                {...register('origin')}
                error={errors.origin?.message}
                options={[
                  { value: 'IDENTIFICACAO_TECNICA', label: 'Identificação técnica' },
                  { value: 'TELEMETRIA', label: 'Alerta da Telemetria' },
                  { value: 'SOLICITACAO_USUARIO', label: 'Chamado de Usuário' }
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
                  { value: 'BAIXA', label: 'Baixa' }
                ]}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição do Problema Observado</label>
              <textarea
                className="w-full mt-1 p-2 border rounded-md min-h-[80px]"
                {...register('description')}
              />
              {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium">Diagnóstico Técnico (Opcional)</label>
              <textarea
                className="w-full mt-1 p-2 border rounded-md min-h-[60px]"
                {...register('diagnosis')}
              />
              {errors.diagnosis && <span className="text-xs text-red-500">{errors.diagnosis.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium">Ação Tomada / Solução Aplicada</label>
              <textarea
                className="w-full mt-1 p-2 border rounded-md min-h-[80px]"
                {...register('actionTaken')}
              />
              {errors.actionTaken && <span className="text-xs text-red-500">{errors.actionTaken.message}</span>}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isSubmitting}>Salvar Registro</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {occurrences.length === 0 ? (
          <p className="text-center text-[var(--color-text-secondary)] py-8 border rounded-lg bg-white">
            Nenhuma ocorrência registrada para este equipamento.
          </p>
        ) : (
          occurrences.map((occ) => (
            <div key={occ.id} className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-2
                    ${occ.priority === 'CRITICA' ? 'bg-red-100 text-red-800' : 
                      occ.priority === 'ALTA' ? 'bg-orange-100 text-orange-800' :
                      occ.priority === 'MEDIA' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {occ.priority}
                  </span>
                  <span className="text-xs text-gray-500">Origem: {occ.origin}</span>
                </div>
                <span className="text-xs font-mono text-gray-500">
                  {new Date(occ.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              
              <div className="mb-3">
                <h5 className="text-xs font-bold uppercase text-gray-500 mb-1">Problema:</h5>
                <p className="text-sm text-gray-800">{occ.description}</p>
              </div>

              {occ.diagnosis && (
                <div className="mb-3">
                  <h5 className="text-xs font-bold uppercase text-gray-500 mb-1">Diagnóstico:</h5>
                  <p className="text-sm text-gray-800">{occ.diagnosis}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded p-3 border border-gray-100">
                <h5 className="text-xs font-bold uppercase text-emerald-700 mb-1">Ação Tomada:</h5>
                <p className="text-sm text-gray-800 font-medium">{occ.action_taken || 'Nenhuma ação documentada.'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
