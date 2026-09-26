'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { CreateShiftModal } from '@/components/shift/create-shift-modal';
import { DuplicateShiftModal } from '@/components/shift/duplicate-shift-modal';

interface TemplateItem {
  id: string;
  position: number;
  description: string;
}

interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItem[];
}

interface ShiftData {
  id: string;
  shiftDate: string;
  notes: string | null;
  _count: {
    prescriptions: number;
  };
}

export default function HomePage() {
  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [duplicateShiftInfo, setDuplicateShiftInfo] = useState<{ id: string; dateStr: string } | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [shiftsRes, templatesRes] = await Promise.all([
        fetch('/api/shifts'),
        fetch('/api/templates'),
      ]);

      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json();
        setShifts(shiftsData);
      }
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDeleteShift(id: string, dateStr: string) {
    if (!confirm(`Deseja excluir o plantão de ${dateStr} e todas as suas prescrições?`)) return;

    try {
      const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Plantões Recentes */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Meus Plantões Clínicos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecione a data de um plantão para acessar ou prescrever seus pacientes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2 self-start sm:self-auto"
            >
              <span>+</span>
              <span>Abrir Novo Plantão</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Carregando plantões...
            </div>
          ) : shifts.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                📅
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Nenhum plantão registrado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Abra um novo plantão selecionando a data de hoje para começar a prescrever.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                + Criar Primeiro Plantão
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {shifts.map((shift) => {
                const dateStr = new Date(shift.shiftDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <div
                    key={shift.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                          {dateStr}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDuplicateShiftInfo({ id: shift.id, dateStr })}
                            className="text-slate-300 hover:text-blue-500 p-1 rounded-md transition text-xs"
                            title="Duplicar plantão"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => handleDeleteShift(shift.id, dateStr)}
                            className="text-slate-300 hover:text-red-500 p-1 rounded-md transition text-xs"
                            title="Excluir plantão"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-slate-800 text-base group-hover:text-blue-600 transition capitalize">
                        {new Date(shift.shiftDate).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                        })}
                      </h3>

                      {shift.notes ? (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          📍 {shift.notes}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">
                          Sem observações
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">
                        {shift._count.prescriptions} paciente(s)
                      </span>
                      <Link
                        href={`/plantao/${shift.id}`}
                        className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <span>Entrar</span>
                        <span>&rarr;</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Modelos Clínicos Disponíveis */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-900">
              Modelos de Prescrição Disponíveis
            </h2>
            <p className="text-xs text-slate-500">
              Modelos base carregados do banco com itens e variantes configuradas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">
                      {tpl.name}
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                      {tpl.items.length} itens
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                    {tpl.description || 'Sem descrição cadastrada.'}
                  </p>

                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    {tpl.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="text-[11px] text-slate-600 flex items-center gap-1.5 truncate"
                      >
                        <span className="text-slate-400 font-mono text-[10px]">
                          {item.position}.
                        </span>
                        <span className="truncate">{item.description}</span>
                      </div>
                    ))}
                    {tpl.items.length > 3 && (
                      <div className="text-[10px] text-slate-400 italic">
                        + {tpl.items.length - 3} outros itens
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    ● Disponível
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <CreateShiftModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          loadData();
        }}
      />

      <DuplicateShiftModal
        isOpen={!!duplicateShiftInfo}
        shiftId={duplicateShiftInfo?.id || null}
        shiftDateStr={duplicateShiftInfo?.dateStr || null}
        onClose={() => setDuplicateShiftInfo(null)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
