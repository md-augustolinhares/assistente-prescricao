'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { AutoSaveStatus } from '@/components/prescription/auto-save-status';
import { CatalogModal, CatalogItemData } from '@/components/prescription/catalog-modal';
import { renderItemDescription } from '@/lib/prescription-utils';
import { CopyButton } from '@/components/prescription/copy-button';

interface TemplateItemInfo {
  id: string;
  category: string;
  isProtocol: boolean;
  protocolDetail: string | null;
  variants: string; // JSON string
  isEditable: boolean;
}

interface ItemRow {
  id?: string;
  position: number;
  description: string;
  baseText?: string;
  route?: string | null;
  frequency?: string | null;
  conditionText?: string | null;
  scheduleType: string;
  isEnabled: boolean;
  isManual: boolean;
  templateItemId?: string | null;
  catalogItemId?: string | null;
  templateItem?: TemplateItemInfo | null;
}

interface PrescriptionData {
  id: string;
  patientName: string;
  prescriptionDate: string;
  shiftId: string;
  template: {
    name: string;
  };
  items: ItemRow[];
}

const SCHEDULE_OPTIONS = [
  { label: 'Horário Fixo', value: 'HORARIO' },
  { label: 'ACM (A Critério Médico)', value: 'ACM' },
  { label: 'SN (Se Necessário)', value: 'SN' },
  { label: 'Condicional', value: 'CONDICIONAL' },
];

export default function PrescriptionEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [manualText, setManualText] = useState('');
  const [manualSchedule, setManualSchedule] = useState('HORARIO');
  const [isAddingManual, setIsAddingManual] = useState(false);

  // Controle de auto-save inicial
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Carregar dados da prescrição
  useEffect(() => {
    async function loadPrescription() {
      try {
        setLoading(true);
        const res = await fetch(`/api/prescriptions/${id}`);
        if (!res.ok) return;
        const data: PrescriptionData = await res.json();
        setPrescription(data);
        setPatientName(data.patientName);
        setItems(data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadPrescription();
  }, [id]);

  // 2. Hook de Auto-Save com Debounce (800ms)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/prescriptions/${id}/items`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });

        if (res.ok) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      } catch {
        setSaveStatus('error');
      }
    }, 800);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [items, id]);

  // Ações de manipulação de itens
  function handleToggleItem(index: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, isEnabled: !item.isEnabled } : item
      )
    );
  }

  function handleScheduleChange(index: number, scheduleType: string) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const baseText = item.baseText || item.description;
          const route = item.route || '';
          const frequency = item.frequency || '';
          const conditionText = item.conditionText || '';

          const newDesc = renderItemDescription({
            baseText,
            route,
            frequency,
            scheduleType,
            conditionText,
          });

          return { ...item, scheduleType, description: newDesc };
        }
        return item;
      })
    );
  }

  function handleDescriptionChange(index: number, description: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, description } : item
      )
    );
  }

  function handleDeleteItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleMoveItem(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((prev) => {
      const next = [...prev];
      const [movedItem] = next.splice(index, 1);
      next.splice(targetIndex, 0, movedItem);
      return next.map((it, idx) => ({ ...it, position: idx + 1 }));
    });
  }

  function handleSelectCatalogItem(catalogItem: CatalogItemData) {
    const newItem: ItemRow = {
      position: items.length + 1,
      description: catalogItem.fullDescription,
      baseText: catalogItem.fullDescription,
      scheduleType: 'HORARIO',
      isEnabled: true,
      isManual: false,
      catalogItemId: catalogItem.id,
    };
    setItems((prev) => [...prev, newItem]);
  }

  function handleAddManualItem(e: React.FormEvent) {
    e.preventDefault();
    if (!manualText.trim()) return;

    const newItem: ItemRow = {
      position: items.length + 1,
      description: manualText.toUpperCase().trim(),
      baseText: manualText.toUpperCase().trim(),
      scheduleType: manualSchedule,
      isEnabled: true,
      isManual: true,
    };

    setItems((prev) => [...prev, newItem]);
    setManualText('');
    setIsAddingManual(false);
  }

  // Contagem de numeração sequencial ativa para impressão
  let activeCounter = 0;

  if (loading || !prescription) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12 text-center text-slate-500">
          Carregando editor da prescrição...
        </div>
      </div>
    );
  }

  const activeItemsCount = items.filter((i) => i.isEnabled).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
          <Link
            href={`/plantao/${prescription.shiftId}`}
            className="hover:text-blue-600 transition flex items-center gap-1 font-medium"
          >
            &larr; Voltar para a lista do plantão
          </Link>
          <AutoSaveStatus status={saveStatus} />
        </div>

        {/* Patient and Model Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                {prescription.template.name}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(prescription.prescriptionDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">
              {patientName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton items={items.filter(i => i.isEnabled)} />
            <a
              href={`/api/prescriptions/${prescription.id}/export`}
              download
              className="bg-white border border-green-200 hover:border-green-300 hover:bg-green-50 text-green-700 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <span>📥</span>
              <span>Baixar Excel</span>
            </a>
            <Link
              href={`/prescricao/${prescription.id}/imprimir`}
              target="_blank"
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>Imprimir Ficha (A4)</span>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-3 px-1 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span>Itens da Prescrição:</span>
            <span className="font-bold text-blue-600">
              {activeItemsCount} de {items.length} ativos
            </span>
          </div>
          <span className="text-slate-400">
            Apenas itens com check ativo saem na folha impressa
          </span>
        </div>

        {/* Prescription Items List */}
        <div className="space-y-2.5">
          {items.map((item, index) => {
            const isEnabled = item.isEnabled;
            const currentItemNumber = isEnabled ? ++activeCounter : null;

            // Extrair variantes se disponíveis no templateItem
            let parsedVariants: string[] = [];
            if (item.templateItem?.variants) {
              try {
                parsedVariants = JSON.parse(item.templateItem.variants);
              } catch {
                parsedVariants = [];
              }
            }

            return (
              <div
                key={item.id || index}
                className={`rounded-2xl border transition p-4 ${
                  isEnabled
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-slate-100/70 border-dashed border-slate-300 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Toggle Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleItem(index)}
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition border ${
                      isEnabled
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                    title={isEnabled ? 'Desmarcar da prescrição' : 'Incluir na prescrição'}
                  >
                    {isEnabled && '✓'}
                  </button>

                  {/* Item Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isEnabled ? (
                          <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                            {currentItemNumber}.
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 line-through">
                            Inativo
                          </span>
                        )}

                        {/* Tag de categoria */}
                        {item.templateItem?.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {item.templateItem.category}
                          </span>
                        )}

                        {item.isManual && (
                          <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            Item Manual
                          </span>
                        )}

                        {item.catalogItemId && (
                          <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            Especial
                          </span>
                        )}
                      </div>

                      {/* Botões de Reordenação e Ações */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            title="Mover para cima"
                            disabled={index === 0}
                            onClick={() => handleMoveItem(index, 'up')}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-slate-600 hover:text-blue-600 disabled:opacity-25 disabled:hover:bg-transparent text-[11px] font-bold transition"
                          >
                            ⬆️
                          </button>
                          <button
                            type="button"
                            title="Mover para baixo"
                            disabled={index === items.length - 1}
                            onClick={() => handleMoveItem(index, 'down')}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-slate-600 hover:text-blue-600 disabled:opacity-25 disabled:hover:bg-transparent text-[11px] font-bold transition"
                          >
                            ⬇️
                          </button>
                        </div>

                        {(item.isManual || item.catalogItemId) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(index)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition text-xs"
                            title="Remover item da prescrição"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Descrição do Item (com input se for editável ou manual) */}
                    <div className="mt-1">
                      {item.templateItem?.isProtocol ? (
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {item.description}
                          </p>
                          {item.templateItem.protocolDetail && (
                            <p className="text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2 text-slate-700 font-semibold leading-relaxed">
                              {item.templateItem.protocolDetail}
                            </p>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleDescriptionChange(index, e.target.value)
                          }
                          disabled={!isEnabled}
                          className="w-full text-sm font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 outline-none transition"
                        />
                      )}
                    </div>

                    {/* Linha de Opções: Variantes pré-configuradas e Aprazamento */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-2.5 border-t border-slate-100/80 text-xs">
                      {/* Seletor de Aprazamento */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium">Tipo:</span>
                        <select
                          value={item.scheduleType}
                          onChange={(e) =>
                            handleScheduleChange(index, e.target.value)
                          }
                          disabled={!isEnabled}
                          className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          {SCHEDULE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Dropdown de Variantes Rápidas (caso existam) */}
                      {parsedVariants.length > 0 && isEnabled && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">
                            Trocar Apresentação:
                          </span>
                          <select
                            onChange={(e) => {
                              const newBaseText = e.target.value;
                              if (newBaseText) {
                                setItems((prev) =>
                                  prev.map((item, i) => {
                                    if (i === index) {
                                      const route = item.route || '';
                                      const frequency = item.frequency || '';
                                      const conditionText = item.conditionText || '';
                                      const scheduleType = item.scheduleType;

                                      const newDesc = renderItemDescription({
                                        baseText: newBaseText,
                                        route,
                                        frequency,
                                        scheduleType,
                                        conditionText,
                                      });

                                      return { ...item, baseText: newBaseText, description: newDesc };
                                    }
                                    return item;
                                  })
                                );
                              }
                            }}
                            className="bg-blue-50/50 border border-blue-200 text-blue-800 rounded-lg px-2.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                          >
                            <option value="">Alternativas disponíveis...</option>
                            {parsedVariants.map((variantText, vIdx) => (
                              <option key={vIdx} value={variantText}>
                                {variantText}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Seção de Adição de Especiais e Texto Livre */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Adicionar Item Adicional ao Paciente
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <span>📦</span>
              <span>Buscar no Catálogo Geral</span>
            </button>

            {!isAddingManual ? (
              <button
                type="button"
                onClick={() => setIsAddingManual(true)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
              >
                <span>✏️</span>
                <span>Digitar Item Livre</span>
              </button>
            ) : (
              <form onSubmit={handleAddManualItem} className="w-full mt-3 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Digite o medicamento, dose, via e posologia..."
                    autoFocus
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs uppercase font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />

                  <select
                    value={manualSchedule}
                    onChange={(e) => setManualSchedule(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {SCHEDULE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="submit"
                      disabled={!manualText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                    >
                      Inserir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingManual(false);
                        setManualText('');
                      }}
                      className="text-slate-500 hover:bg-slate-100 text-xs font-medium px-3 py-2 rounded-xl transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Barra Inferior Fixa */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AutoSaveStatus status={saveStatus} />
            <span className="hidden sm:inline text-xs text-slate-400">
              {activeItemsCount} itens incluídos
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/plantao/${prescription.shiftId}`}
              className="text-xs font-medium text-slate-600 hover:bg-slate-100 px-3.5 py-2 rounded-xl transition"
            >
              Voltar ao Plantão
            </Link>
            <Link
              href={`/prescricao/${prescription.id}/imprimir`}
              target="_blank"
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>Imprimir Prescrição (A4)</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* Modal de Catálogo */}
      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectItem={handleSelectCatalogItem}
      />
    </div>
  );
}
