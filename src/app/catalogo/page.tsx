'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';

interface CatalogItem {
  id: string;
  name: string;
  fullDescription: string;
  category: string;
  variants?: string;
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

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Form state para novo/editar item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [variantsText, setVariantsText] = useState('');
  const [category, setCategory] = useState('MEDICAMENTO');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadItems() {
    try {
      setLoading(true);
      const res = await fetch('/api/catalog');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function openNewModal() {
    setEditingId(null);
    setName('');
    setFullDescription('');
    setVariantsText('');
    setCategory('MEDICAMENTO');
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(item: CatalogItem) {
    setEditingId(item.id);
    setName(item.name);
    setFullDescription(item.fullDescription);
    setCategory(item.category);
    
    // Parse variants for text area
    const parsedVariants = item.variants ? JSON.parse(item.variants) : [];
    // Remove the primary description from the variants text box to avoid confusion, 
    // or just show all of them. The easiest is to show all of them, so the user can edit any.
    setVariantsText(parsedVariants.join('\n'));
    
    setError('');
    setIsModalOpen(true);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !fullDescription.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const url = editingId ? `/api/catalog/${editingId}` : '/api/catalog';
      const method = editingId ? 'PUT' : 'POST';

      // Build variants JSON
      const variantsArray = variantsText
        .split('\n')
        .map(v => v.trim())
        .filter(Boolean);
        
      // Ensure the fullDescription is inside the variants if we are using them
      if (variantsArray.length > 0 && !variantsArray.includes(fullDescription.trim())) {
        variantsArray.unshift(fullDescription.trim());
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          fullDescription: fullDescription.trim(), // removed force toUpperCase to let user decide
          category,
          variants: JSON.stringify(variantsArray),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar item');
        setSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      await loadItems();
    } catch {
      setError('Falha de conexão com o servidor');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, itemName: string) {
    if (!confirm(`Deseja remover "${itemName}" do catálogo?`)) return;

    try {
      await fetch(`/api/catalog/${id}`, { method: 'DELETE' });
      await loadItems();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = items.filter((item) => {
    const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.fullDescription.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Catálogo Geral de Medicações e Cuidados
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie os itens do catálogo, incluindo dietas, hidratação, medicamentos e cuidados.
            </p>
          </div>

          <button
            onClick={openNewModal}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2 self-start sm:self-auto"
          >
            <span>+</span>
            <span>Novo Item</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Filtrar medicamentos por nome ou posologia..."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Carregando catálogo...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <h3 className="font-semibold text-slate-700">Nenhum item encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre novos itens para acelerar a prescrição durante o plantão.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const parsedVariants = item.variants ? JSON.parse(item.variants) : [];
              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-bold text-slate-900">
                        {item.name}
                      </h3>
                      <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                    </div>
                    {parsedVariants.length > 1 ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                          {parsedVariants.length} Variações de Apresentação:
                        </p>
                        {parsedVariants.map((v: string) => (
                          <p key={v} className="text-xs text-slate-600 font-mono leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 truncate">
                            • {v}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 font-mono leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                        {item.fullDescription}
                      </p>
                    )}
                  </div>

                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-xs text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition"
                    title="Editar item"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="text-xs text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                    title="Excluir item"
                  >
                    🗑️ Remover
                  </button>
                </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'Editar Medicamento Especial' : 'Novo Medicamento Especial'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Nome Curto de Identificação
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ceftriaxona 1g EV"
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Posologia Principal para Impressão
                </label>
                <textarea
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Ex: DIETA GERAL"
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs uppercase font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Variações de Apresentação</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Opcional</span>
                </label>
                <p className="text-[10px] text-slate-500 mb-1.5">Insira uma variação por linha. Elas aparecerão como opções na prescrição.</p>
                <textarea
                  value={variantsText}
                  onChange={(e) => setVariantsText(e.target.value)}
                  placeholder={`Ex:\nDIETA BRANDA\nDIETA PASTOSA\nDIETA ZERO`}
                  rows={4}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs uppercase font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Categoria Clínica
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-800"
                >
                  <option value="MEDICAMENTO">Medicamento Geral</option>
                  <option value="HIDRATACAO">Hidratação / Soroterapia</option>
                  <option value="CUIDADO">Cuidados / Dieta</option>
                  <option value="CONDICIONAL">Condicionais (PRN)</option>
                  <option value="ANTIBIOTICO">Antibiótico</option>
                  <option value="ANTICOAGULANTE">Anticoagulante</option>
                  <option value="ELETROLITO">Eletrólito (Correção Na/K)</option>
                  <option value="SONDA">Sondas</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim() || !fullDescription.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 disabled:opacity-50 transition"
                >
                  {submitting ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar no Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
