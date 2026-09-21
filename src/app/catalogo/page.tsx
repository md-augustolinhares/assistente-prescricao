'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';

interface CatalogItem {
  id: string;
  name: string;
  fullDescription: string;
  category: string;
}

const CATEGORIES = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Antibióticos', value: 'ANTIBIOTICO' },
  { label: 'Anticoagulantes', value: 'ANTICOAGULANTE' },
  { label: 'Eletrólitos', value: 'ELETROLITO' },
  { label: 'Sondas', value: 'SONDA' },
  { label: 'Outros', value: 'OUTRO' },
];

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Form state para novo item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [category, setCategory] = useState('ANTIBIOTICO');
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

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !fullDescription.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          fullDescription: fullDescription.toUpperCase().trim(),
          category,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao cadastrar item');
        setSubmitting(false);
        return;
      }

      setName('');
      setFullDescription('');
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
              Catálogo de Medicamentos Especiais
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Cadastre e mantenha antibióticos, correções e posologias para uso rápido nos plantões
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2 self-start sm:self-auto"
          >
            <span>+</span>
            <span>Novo Medicamento</span>
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
            {filtered.map((item) => (
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
                  <p className="text-xs text-slate-600 font-mono leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {item.fullDescription}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="text-xs text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition"
                    title="Excluir item"
                  >
                    🗑️ Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Novo Medicamento Especial
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
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
                  Posologia Completa para Impressão
                </label>
                <textarea
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Ex: CEFTRIAXONA 1G + 100ML SF 0,9% EV 12/12H"
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs uppercase font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  required
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
                  <option value="ANTIBIOTICO">Antibiótico</option>
                  <option value="ANTICOAGULANTE">Anticoagulante</option>
                  <option value="ELETROLITO">Eletrólito (Correção Na/K)</option>
                  <option value="SONDA">Sonda / Cuidados Especiais</option>
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
                  {submitting ? 'Salvando...' : 'Cadastrar no Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
