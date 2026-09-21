'use client';

import { useState, useEffect } from 'react';

export interface CatalogItemData {
  id: string;
  name: string;
  fullDescription: string;
  category: string;
}

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: CatalogItemData) => void;
}

const CATEGORIES = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Antibióticos', value: 'ANTIBIOTICO' },
  { label: 'Anticoagulantes', value: 'ANTICOAGULANTE' },
  { label: 'Eletrólitos', value: 'ELETROLITO' },
  { label: 'Sondas', value: 'SONDA' },
  { label: 'Outros', value: 'OUTRO' },
];

export function CatalogModal({ isOpen, onClose, onSelectItem }: CatalogModalProps) {
  const [items, setItems] = useState<CatalogItemData[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);

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
              Catálogo de Medicamentos Especiais
            </h2>
            <p className="text-xs text-slate-500">
              Clique em qualquer item para adicionar imediatamente à prescrição
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
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
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectItem(item);
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                      {item.name}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono">
                    {item.fullDescription}
                  </p>
                </div>

                <button
                  type="button"
                  className="text-xs font-semibold text-blue-600 bg-white group-hover:bg-blue-600 group-hover:text-white px-3 py-1.5 rounded-lg border border-blue-200 group-hover:border-blue-600 transition shadow-sm"
                >
                  + Adicionar
                </button>
              </div>
            ))
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
