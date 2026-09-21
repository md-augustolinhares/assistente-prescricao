'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { renderItemDescription } from '@/lib/prescription-utils';

interface TemplateItemDetail {
  id: string;
  position: number;
  description: string;
  baseText: string;
  route: string | null;
  frequency: string | null;
  conditionText: string | null;
  category: string;
  defaultScheduleType: string;
  isProtocol: boolean;
  protocolDetail: string | null;
  variants: string;
}

interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItemDetail[];
}

const SCHEDULE_OPTIONS = [
  { label: 'Horário Fixo', value: 'HORARIO' },
  { label: 'ACM (A Critério Médico)', value: 'ACM' },
  { label: 'SN (Se Necessário)', value: 'SN' },
  { label: 'Condicional', value: 'CONDICIONAL' },
];

const CATEGORY_OPTIONS = [
  { label: 'Medicamento', value: 'MEDICAMENTO' },
  { label: 'Dieta', value: 'DIETA' },
  { label: 'Hidratação', value: 'HIDRATACAO' },
  { label: 'Cuidado / Enfermagem', value: 'CUIDADO' },
  { label: 'Protocolo Escalonado', value: 'PROTOCOLO' },
  { label: 'Condicional', value: 'CONDICIONAL' },
];

export default function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal de edição de item
  const [editingItem, setEditingItem] = useState<TemplateItemDetail | null>(null);
  const [baseText, setBaseText] = useState('');
  const [route, setRoute] = useState('');
  const [frequency, setFrequency] = useState('');
  const [conditionText, setConditionText] = useState('');
  const [defaultScheduleType, setDefaultScheduleType] = useState('HORARIO');
  const [category, setCategory] = useState('MEDICAMENTO');
  const [variantsList, setVariantsList] = useState<string[]>([]);
  const [newVariant, setNewVariant] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadTemplate() {
    try {
      setLoading(true);
      const res = await fetch(`/api/templates/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setTemplate(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplate();
  }, [id]);

  function openEditModal(item: TemplateItemDetail) {
    setEditingItem(item);
    setBaseText(item.baseText || item.description);
    setRoute(item.route || '');
    setFrequency(item.frequency || '');
    setConditionText(item.conditionText || '');
    setDefaultScheduleType(item.defaultScheduleType || 'HORARIO');
    setCategory(item.category || 'MEDICAMENTO');
    
    let parsedVariants: string[] = [];
    try {
      if (item.variants) {
        parsedVariants = JSON.parse(item.variants);
      }
    } catch (e) {
      console.error(e);
    }
    setVariantsList(parsedVariants);
    setNewVariant('');
    setError('');
  }

  function closeEditModal() {
    setEditingItem(null);
    setError('');
  }

  function handleAddVariant() {
    const trimmed = newVariant.trim();
    if (!trimmed) return;
    if (variantsList.includes(trimmed)) return;
    setVariantsList([...variantsList, trimmed]);
    setNewVariant('');
  }

  function handleRemoveVariant(v: string) {
    setVariantsList(variantsList.filter(item => item !== v));
  }

  // Preview dinâmico do texto gerado
  const previewDescription = renderItemDescription({
    baseText,
    route,
    frequency,
    scheduleType: defaultScheduleType,
    conditionText,
  });

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    if (!baseText.trim()) {
      setError('Informe o medicamento e dose/diluição');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/templates/${id}/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseText: baseText.trim(),
          route: route.trim(),
          frequency: frequency.trim(),
          conditionText: conditionText.trim(),
          defaultScheduleType,
          category,
          variants: variantsList,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao atualizar item');
        setSaving(false);
        return;
      }

      closeEditModal();
      await loadTemplate();
    } catch {
      setError('Falha na comunicação com o servidor');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !template) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-5xl mx-auto px-6 py-12 text-center text-slate-500">
          Carregando itens do modelo...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link href="/modelos" className="hover:text-blue-600 transition font-medium">
            &larr; Voltar para Modelos Base
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
              Configuração do Modelo
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1.5">
              {template.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Altere os medicamentos pré-cadastrados. Novas prescrições criadas com este modelo utilizarão os valores atualizados aqui.
            </p>
          </div>
        </div>

        {/* Lista de Itens do Modelo */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Ordem & Medicamento Padrão</span>
            <span>Ações</span>
          </div>

          <div className="divide-y divide-slate-100">
            {template.items.map((item, index) => (
              <div
                key={item.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="w-6 h-6 bg-slate-100 text-slate-700 font-mono font-bold text-xs rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                        {item.defaultScheduleType}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      {item.description}
                    </p>

                    {item.isProtocol && item.protocolDetail && (
                      <p className="text-xs font-mono text-slate-500 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        {item.protocolDetail}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="self-start sm:self-center text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition flex items-center gap-1"
                >
                  <span>✏️</span>
                  <span>Editar Item</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal de Edição Modular */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Item #{editingItem.position} do Modelo
                </span>
                <h2 className="text-lg font-bold text-slate-800 mt-1">
                  Editar Medicamento ou Cuidado
                </h2>
              </div>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Bloco 1: Medicamento + Dose / Diluição */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Medicamento + Dose / Diluição
                </label>
                <input
                  type="text"
                  value={baseText}
                  onChange={(e) => setBaseText(e.target.value)}
                  placeholder="Ex: Paracetamol 500mg 1CP ou Dipirona 1AMP+AD 10ML"
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {/* Bloco 2: Via e Frequência */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Via de Administração
                  </label>
                  <input
                    type="text"
                    value={route}
                    onChange={(e) => setRoute(e.target.value.toUpperCase())}
                    placeholder="Ex: EV, VO, SC, IM"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Frequência / Intervalo
                  </label>
                  <input
                    type="text"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value.toUpperCase())}
                    placeholder="Ex: 6/6H, 8/8H, 12/12H, AGORA"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Bloco 3: Condição Específica */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Condição Específica (caso seja condicional)
                </label>
                <input
                  type="text"
                  value={conditionText}
                  onChange={(e) => setConditionText(e.target.value.toUpperCase())}
                  placeholder="Ex: SE DOR OU FEBRE, SE DOR FORTE, SE NAUSEAS OU VOMITOS"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Bloco 4: Tipo de Aprazamento e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Aprazamento Padrão
                  </label>
                  <select
                    value={defaultScheduleType}
                    onChange={(e) => setDefaultScheduleType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {SCHEDULE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Categoria Clínica
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bloco 5: Variações (Apresentações alternativas) */}
              <div className="border-t border-slate-100 pt-3 mt-3">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Apresentações Alternativas (Variações)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newVariant}
                    onChange={(e) => setNewVariant(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddVariant();
                      }
                    }}
                    placeholder="Ex: SF 0,9% 100ML"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Adicionar
                  </button>
                </div>
                
                {variantsList.length > 0 ? (
                  <ul className="space-y-1">
                    {variantsList.map((v, i) => (
                      <li key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
                        <span>{v}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v)}
                          className="text-red-500 hover:text-red-700 font-bold px-1"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Nenhuma variação cadastrada.</p>
                )}
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Texto que sairá impresso:
                </span>
                <p className="text-xs font-black text-slate-900 uppercase font-mono">
                  {previewDescription || '(Preencha os campos para ver o preview)'}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">
                  {error}
                </div>
              )}

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !baseText.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 disabled:opacity-50 transition"
                >
                  {saving ? 'Salvando...' : 'Salvar no Modelo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
