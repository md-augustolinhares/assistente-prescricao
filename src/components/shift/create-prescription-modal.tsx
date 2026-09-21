'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TemplateOption {
  id: string;
  name: string;
  description: string | null;
  items: Array<{ id: string }>;
}

interface CreatePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId: string;
}

export function CreatePrescriptionModal({
  isOpen,
  onClose,
  shiftId,
}: CreatePrescriptionModalProps) {
  const router = useRouter();
  const [patientName, setPatientName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTemplates, setFetchingTemplates] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    async function loadTemplates() {
      try {
        setFetchingTemplates(true);
        const res = await fetch('/api/templates');
        const data = await res.json();
        setTemplates(data);
        if (data.length > 0 && !selectedTemplateId) {
          // Seleciona o Geral por padrão
          const geral = data.find((t: TemplateOption) => t.name.toLowerCase().includes('geral')) || data[0];
          setSelectedTemplateId(geral.id);
        }
      } catch (err) {
        console.error('Erro ao carregar templates:', err);
      } finally {
        setFetchingTemplates(false);
      }
    }

    loadTemplates();
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim() || !selectedTemplateId) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId,
          templateId: selectedTemplateId,
          patientName: patientName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao criar prescrição');
        setLoading(false);
        return;
      }

      const prescription = await res.json();
      router.push(`/prescricao/${prescription.id}`);
      onClose();
    } catch {
      setError('Falha de conexão com o servidor.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Nova Prescrição Médica
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="patientName"
              className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1"
            >
              Nome e Idade do Paciente
            </label>
            <input
              id="patientName"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Ex: JOAO PAULO 76A"
              autoFocus
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm uppercase font-semibold tracking-wide"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Formato direto para impressão: NOME COMPLETO IDADE
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Escolha o Modelo Base Inicial
            </label>

            {fetchingTemplates ? (
              <div className="text-center py-4 text-xs text-slate-400">
                Carregando modelos clínicos...
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <label
                      key={tpl.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={tpl.id}
                        checked={isSelected}
                        onChange={() => setSelectedTemplateId(tpl.id)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-800">
                            {tpl.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {tpl.items.length} itens
                          </span>
                        </div>
                        {tpl.description && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {tpl.description}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !patientName.trim() || !selectedTemplateId}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? 'Abrindo Editor...' : 'Montar Prescrição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
