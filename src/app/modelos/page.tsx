'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';

interface TemplateSummary {
  id: string;
  name: string;
  description: string | null;
  items: Array<{ id: string }>;
}

export default function TemplatesListPage() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTemplates() {
    try {
      setLoading(true);
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Modelos Base de Prescrição
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Customize os medicamentos pré-definidos de cada modelo (ex: trocar Dipirona por Paracetamol, ajustar horários padrão)
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Carregando modelos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-base mb-3 shadow-inner">
                    📋
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {tpl.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {tpl.description || 'Modelo padrão de enfermaria'}
                  </p>
                  <span className="inline-block mt-3 text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                    {tpl.items.length} itens configurados
                  </span>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100">
                  <Link
                    href={`/modelos/${tpl.id}`}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition flex items-center justify-center gap-1.5"
                  >
                    <span>✏️</span>
                    <span>Editar Medicamentos</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
