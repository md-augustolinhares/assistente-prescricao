'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/20 group-hover:scale-105 transition">
            AP
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">
              Assistente de Prescrição
            </h1>
            <p className="text-[11px] text-slate-500">
              Enfermaria Clínica & Plantão Ágil
            </p>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg transition ${
              pathname === '/' || pathname.startsWith('/plantao')
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Plantões
          </Link>
          <Link
            href="/catalogo"
            className={`px-3 py-1.5 rounded-lg transition ${
              pathname.startsWith('/catalogo')
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Catálogo de Especiais
          </Link>
          <Link
            href="/modelos"
            className={`px-3 py-1.5 rounded-lg transition ${
              pathname.startsWith('/modelos')
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Modelos de Prescrição
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleLogout}
          type="button"
          className="text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 transition"
        >
          Encerrar Sessão
        </button>
      </div>
    </header>
  );
}
