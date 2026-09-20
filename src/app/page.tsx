import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const templates = await prisma.template.findMany({
    include: {
      items: {
        orderBy: { position: 'asc' },
      },
    },
  });

  const shifts = await prisma.shift.findMany({
    orderBy: { shiftDate: 'desc' },
    include: {
      _count: {
        select: { prescriptions: true },
      },
    },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
            AP
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">
              Assistente de Prescrição
            </h1>
            <p className="text-xs text-slate-500">
              Enfermaria Clínica & Plantão Ágil
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <form action="/api/auth" method="DELETE">
            <button
              type="submit"
              className="text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 transition"
            >
              Encerrar Sessão
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Plantões Recentes */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Plantões
              </h2>
              <p className="text-sm text-slate-500">
                Selecione um plantão existente ou inicie um novo
              </p>
            </div>
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2"
            >
              <span>+</span>
              <span>Novo Plantão</span>
            </button>
          </div>

          {shifts.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                📅
              </div>
              <h3 className="font-semibold text-slate-700">Nenhum plantão ativo</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
                Comece um novo plantão para registrar prescrições e imprimir fichas para os pacientes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition"
                >
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                    {new Date(shift.shiftDate).toLocaleDateString('pt-BR')}
                  </span>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>{shift._count.prescriptions} paciente(s)</span>
                    <Link
                      href={`/plantao/${shift.id}`}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Acessar &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Templates Clínicos Ativos */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-800">
              Modelos de Prescrição Carregados
            </h2>
            <p className="text-sm text-slate-500">
              Templates disponíveis pré-configurados no banco de dados (Turso)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-800 text-base">
                      {template.name}
                    </h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      {template.items.length} itens
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                    {template.description || 'Sem descrição cadastrada.'}
                  </p>

                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    {template.items.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="text-xs text-slate-600 flex items-center gap-2 truncate"
                      >
                        <span className="text-slate-400 font-mono text-[10px]">
                          {item.position}.
                        </span>
                        <span className="truncate">{item.description}</span>
                      </div>
                    ))}
                    {template.items.length > 4 && (
                      <div className="text-[11px] text-slate-400 italic">
                        + {template.items.length - 4} outros itens
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 text-right">
                  <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md">
                    ● Ativo para uso
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
