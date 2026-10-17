'use client';

import { useState, useEffect } from 'react';

interface EditShiftModalProps {
  isOpen: boolean;
  shiftId: string | null;
  currentDate: string | null;
  currentNotes: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditShiftModal({
  isOpen,
  shiftId,
  currentDate,
  currentNotes,
  onClose,
  onSuccess,
}: EditShiftModalProps) {
  const [shiftDate, setShiftDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && currentDate) {
      try {
        const formatted = new Date(currentDate).toISOString().split('T')[0];
        setShiftDate(formatted);
      } catch {
        setShiftDate(new Date().toISOString().split('T')[0]);
      }
      setNotes(currentNotes || '');
      setError('');
    }
  }, [isOpen, currentDate, currentNotes]);

  if (!isOpen || !shiftId) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shiftDate) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/shifts/${shiftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftDate,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao atualizar plantão');
        setLoading(false);
        return;
      }

      setLoading(false);
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Editar Plantão
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="editShiftDate"
              className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1"
            >
              Data do Plantão
            </label>
            <input
              id="editShiftDate"
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm font-medium"
              required
            />
          </div>

          <div>
            <label
              htmlFor="editShiftNotes"
              className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1"
            >
              Observações (Opcional)
            </label>
            <input
              id="editShiftNotes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Ala Verde, Enfermaria 2, Noturno..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm"
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
              disabled={loading || !shiftDate}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
