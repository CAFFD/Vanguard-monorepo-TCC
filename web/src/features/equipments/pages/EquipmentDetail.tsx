import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../components/feedback/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { occurrenceSchema } from '../../occurrences/schemas/occurrenceSchema';
import type { OccurrenceFormData } from '../../occurrences/schemas/occurrenceSchema';
import { Select } from '../../../components/ui/Select';
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
      fetchData();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 font-mono text-sm">Carregando prontuário...</div>;
  }

  if (!equipment) {
    return <div className="p-8 text-center text-red-500 font-mono text-sm">Equipamento não encontrado.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-medium text-zinc-100">{equipment.hostname}</h2>
            <HealthBadge status={equipment.health_status} variant="pill" />
          </div>
          <p className="text-sm text-zinc-500 font-mono">ID: {equipment.id}</p>
        </div>
        <Link to="/equipamentos" className="mt-4 sm:mt-0 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
          &larr; Voltar
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-md border border-white/10 bg-zinc-900/40">
          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mb-1">Hostname</p>
          <p className="font-mono text-sm text-zinc-200">{equipment.hostname}</p>
        </div>
        <div className="p-4 rounded-md border border-white/10 bg-zinc-900/40">
          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mb-1">Patrimônio</p>
          <p className="font-mono text-sm text-zinc-200">{equipment.patrimony_tag}</p>
        </div>
        <div className="p-4 rounded-md border border-white/10 bg-zinc-900/40">
          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mb-1">MAC Address</p>
          <p className="font-mono text-sm text-zinc-200">{equipment.mac_address}</p>
        </div>
        <div className="p-4 rounded-md border border-white/10 bg-zinc-900/40">
          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mb-1">Sector ID</p>
          <p className="font-mono text-sm text-zinc-200">{equipment.sector_id.slice(0,8)}...</p>
        </div>
      </div>

      <HealthReasons status={equipment.health_status} reasons={equipment.health_reasons} />

      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h3 className="text-sm font-medium text-zinc-100">Log de Ocorrências</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-medium text-zinc-100 bg-zinc-800 border border-white/10 px-3 py-1.5 rounded-md hover:bg-zinc-700 transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Registrar Manutenção'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-md border border-white/10 bg-zinc-900/50 p-6 mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-xs font-medium text-zinc-400">Descrição do Problema</label>
              <textarea
                className="w-full mt-1.5 p-3 text-sm bg-zinc-950 border border-white/10 rounded-md text-zinc-200 placeholder-zinc-700 min-h-[80px] focus:outline-none focus:border-zinc-500"
                {...register('description')}
              />
              {errors.description && <span className="text-xs text-red-500 mt-1 block">{errors.description.message}</span>}
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400">Diagnóstico Técnico (Opcional)</label>
              <textarea
                className="w-full mt-1.5 p-3 text-sm bg-zinc-950 border border-white/10 rounded-md text-zinc-200 placeholder-zinc-700 min-h-[60px] focus:outline-none focus:border-zinc-500"
                {...register('diagnosis')}
              />
              {errors.diagnosis && <span className="text-xs text-red-500 mt-1 block">{errors.diagnosis.message}</span>}
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400">Ação Tomada</label>
              <textarea
                className="w-full mt-1.5 p-3 text-sm bg-zinc-950 border border-white/10 rounded-md text-zinc-200 placeholder-zinc-700 min-h-[80px] focus:outline-none focus:border-zinc-500"
                {...register('actionTaken')}
              />
              {errors.actionTaken && <span className="text-xs text-red-500 mt-1 block">{errors.actionTaken.message}</span>}
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="text-xs font-medium text-zinc-950 bg-zinc-100 px-4 py-2 rounded-md hover:bg-white transition-colors disabled:opacity-50"
              >
                Salvar Registro
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {occurrences.length === 0 ? (
          <div className="p-8 text-center border border-white/5 rounded-md bg-zinc-900/20">
            <p className="text-sm font-mono text-zinc-500">Nenhum evento registrado.</p>
          </div>
        ) : (
          occurrences.map((occ) => (
            <div key={occ.id} className="rounded-md border border-white/10 bg-zinc-950 p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono tracking-widest uppercase
                    ${occ.priority === 'CRITICA' ? 'border-red-500/30 text-red-400 bg-red-500/10' : 
                      occ.priority === 'ALTA' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                      occ.priority === 'MEDIA' ? 'border-zinc-500/30 text-zinc-300 bg-zinc-500/10' : 'border-zinc-700 text-zinc-400'}`}>
                    {occ.priority}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">Origin: {occ.origin}</span>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  {new Date(occ.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-[10px] font-medium uppercase text-zinc-500 tracking-widest mb-1">Issue</h5>
                  <p className="text-sm text-zinc-300">{occ.description}</p>
                </div>

                {occ.diagnosis && (
                  <div>
                    <h5 className="text-[10px] font-medium uppercase text-zinc-500 tracking-widest mb-1">Diagnosis</h5>
                    <p className="text-sm text-zinc-300">{occ.diagnosis}</p>
                  </div>
                )}

                <div>
                  <h5 className="text-[10px] font-medium uppercase text-zinc-500 tracking-widest mb-1">Resolution</h5>
                  <p className="text-sm text-zinc-300">{occ.action_taken || '-'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
