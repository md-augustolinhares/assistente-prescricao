'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DuplicateShiftModalProps {
  isOpen: boolean;
  shiftId: string | null;
  shiftDateStr: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DuplicateShiftModal({ isOpen, shiftId, shiftDateStr, onClose, onSuccess }: DuplicateShiftModalProps) {
  const router = useRouter();
  // Data atual no formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const [newDate, setNewDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !shiftId) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/shifts/${shiftId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: newDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao duplicar plantão');
        setLoading(false);
        return;
      }

      const created = await res.json();
      router.push(`/plantao/${created.id}`);
      router.refresh();
      onSuccess();
      onClose();
    } catch {
      setError('Falha de conexão com o servidor.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-800">
            Duplicar Plantão
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Todas as prescrições e medicações do plantão de <strong>{shiftDateStr}</strong> serão copiadas para a nova data selecionada abaixo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="newDate"
              className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1"
            >
              Nova Data do Plantão
            </label>
            <input
              id="newDate"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm font-medium"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !newDate}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? 'Duplicando...' : 'Confirmar e Abrir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
