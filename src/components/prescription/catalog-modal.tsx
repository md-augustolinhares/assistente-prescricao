'use client';

import { useState, useEffect } from 'react';

export interface CatalogItemData {
  id: string;
  name: string;
  fullDescription: string;
  category: string;
  variants?: string;
}

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: CatalogItemData, insertAt: 'top' | 'bottom') => void;
}

const CATEGORIES = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Medicamentos', value: 'MEDICAMENTO' },
  { label: 'Hidratação', value: 'HIDRATACAO' },
  { label: 'Cuidados / Dieta', value: 'CUIDADO' },
  { label: 'Condicionais (PRN)', value: 'CONDICIONAL' },
  { label: 'Antibióticos', value: 'ANTIBIOTICO' },
  { label: 'Anticoagulantes', value: 'ANTICOAGULANTE' },
  { label: 'Eletrólitos / Sondas', value: 'ELETROLITO' },
  { label: 'Outros', value: 'OUTRO' },
];

export function CatalogModal({ isOpen, onClose, onSelectItem }: CatalogModalProps) {
  const [items, setItems] = useState<CatalogItemData[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [insertAt, setInsertAt] = useState<'top' | 'bottom'>('bottom');

  useEffect(() => {
    if (!isOpen) return;

    async function loadCatalog() {
      try {
        setLoading(true);
        const res = await fetch('/api/catalog');
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error('Erro ao carregar catálogo:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    const matchesCat = category === 'ALL' || item.category === category;
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.fullDescription.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Catálogo Geral de Medicações e Cuidados
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                Posição de Inserção:
              </span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setInsertAt('top')}
                  className={`text-[11px] font-bold px-3 py-1 rounded-md transition ${insertAt === 'top' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  ⬆️ Topo
                </button>
                <button
                  type="button"
                  onClick={() => setInsertAt('bottom')}
                  className={`text-[11px] font-bold px-3 py-1 rounded-md transition ${insertAt === 'bottom' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  ⬇️ Final
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition self-start"
          >
            ✕
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar por nome ou posologia (ex: ceftriaxona, potássio, enoxaparina...)"
            autoFocus
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                  category === cat.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Item List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Carregando itens...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Nenhum item encontrado no catálogo.
            </div>
          ) : (
            filteredItems.map((item) => {
              const variants: string[] = item.variants ? JSON.parse(item.variants) : [];
              const hasVariants = variants.length > 1;
              const currentDesc = selectedVariants[item.id] || item.fullDescription;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 transition flex flex-col gap-2 group bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-bold text-slate-800">
                          {item.name}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </div>
                      
                      {hasVariants ? (
                        <select
                          value={currentDesc}
                          onChange={(e) => setSelectedVariants({...selectedVariants, [item.id]: e.target.value})}
                          className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                        >
                          {variants.map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-slate-600 font-mono bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                          {item.fullDescription}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectItem({ ...item, fullDescription: currentDesc }, insertAt);
                        onClose();
                      }}
                      className="mt-1 flex-shrink-0 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition shadow-sm"
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 bg-slate-50">
          <span>{filteredItems.length} opções disponíveis</span>
          <button
            onClick={onClose}
            type="button"
            className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
