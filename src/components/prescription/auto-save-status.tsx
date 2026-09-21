'use client';

interface AutoSaveStatusProps {
  status: 'saved' | 'saving' | 'error';
}

export function AutoSaveStatus({ status }: AutoSaveStatusProps) {
  if (status === 'saving') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="font-medium">Salvando alterações...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
        <span>⚠️</span>
        <span className="font-medium">Falha ao salvar. Tentando novamente...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      <span className="font-medium">Salvo automaticamente</span>
    </div>
  );
}
