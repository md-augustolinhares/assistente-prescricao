'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { CreatePrescriptionModal } from '@/components/shift/create-prescription-modal';
import { EditShiftModal } from '@/components/shift/edit-shift-modal';
import {
  getShiftById,
  deletePrescription,
  duplicatePrescription,
  updatePatientName,
  getPrescriptionById,
  ShiftDetail,
  PrescriptionData,
} from '@/lib/firestore-service';
import { exportShiftToExcel } from '@/lib/excel-export';

function ShiftPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const router = useRouter();
  const [shift, setShift] = useState<ShiftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditShiftOpen, setIsEditShiftOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingPatient, setRenamingPatient] = useState<{ id: string; name: string } | null>(null);
  const [newPatientName, setNewPatientName] = useState('');
  const [renamingLoading, setRenamingLoading] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  async function loadShift() {
    if (!id) {
      router.push('/');
      return;
    }
    try {
      setLoading(true);
      const data = await getShiftById(id);
      if (!data) {
        router.push('/');
        return;
      }
      setShift(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShift();
  }, [id]);

  async function handleDeletePrescription(prescriptionId: string, name: string) {
    if (!confirm(`Deseja realmente excluir a prescrição de "${name}"?`)) return;

    try {
      setDeletingId(prescriptionId);
      await deletePrescription(prescriptionId);
      await loadShift();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDuplicatePrescription(prescriptionId: string, name: string) {
    if (!confirm(`Deseja duplicar a prescrição de "${name}"?`)) return;

    try {
      setLoading(true);
      await duplicatePrescription(prescriptionId);
      await loadShift();
    } catch (err) {
      console.error(err);
      alert('Erro ao duplicar prescrição.');
      setLoading(false);
    }
  }

  async function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!renamingPatient || !newPatientName.trim()) return;

    try {
      setRenamingLoading(true);
      await updatePatientName(renamingPatient.id, newPatientName.trim());
      setRenamingPatient(null);
      await loadShift();
    } catch (err) {
      console.error(err);
      alert('Erro ao renomear paciente.');
    } finally {
      setRenamingLoading(false);
    }
  }

  async function handleExportExcel() {
    if (!shift || shift.prescriptions.length === 0) return;
    try {
      setExportingExcel(true);
      const fullPrescriptions: PrescriptionData[] = [];
      for (const p of shift.prescriptions) {
        const full = await getPrescriptionById(p.id);
        if (full) fullPrescriptions.push(full);
      }
      await exportShiftToExcel(shift, fullPrescriptions);
    } catch (err) {
      console.error('Erro ao exportar excel:', err);
      alert('Falha ao exportar excel do plantão.');
    } finally {
      setExportingExcel(false);
    }
  }

  if (loading || !shift) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-5xl mx-auto px-6 py-12 text-center text-slate-500">
          Carregando dados do plantão...
        </div>
      </div>
    );
  }

  const formattedDate = new Date(shift.shiftDate).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition">
            &larr; Voltar para todos os plantões
          </Link>
        </div>

        {/* Shift Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                Plantão Ativo
              </span>
              <button
                type="button"
                onClick={() => setIsEditShiftOpen(true)}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2.5 py-0.5 rounded-md transition flex items-center gap-1"
                title="Alterar data ou observação do plantão"
              >
                <span>✏️</span>
                <span>Alterar Data</span>
              </button>
            </div>
            <h1 className="text-2xl font-black text-slate-800 capitalize mt-2">
              {formattedDate}
            </h1>
            {shift.notes && (
              <p className="text-xs text-slate-500 mt-1">
                📍 {shift.notes}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {shift.prescriptions.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={exportingExcel}
                  className="bg-white border border-green-200 hover:border-green-300 hover:bg-green-50 text-green-700 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                  <span>📥</span>
                  <span>{exportingExcel ? 'Gerando Planilha...' : 'Baixar Excel'}</span>
                </button>
                <Link
                  href={`/plantao/imprimir?id=${shift.id}`}
                  target="_blank"
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <span>🖨️</span>
                  <span>Imprimir Plantão</span>
                </Link>
              </>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2"
            >
              <span>+</span>
              <span>Nova Prescrição</span>
            </button>
          </div>
        </div>

        {/* Patients List Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              Pacientes Prescritos ({shift.prescriptions.length})
            </h2>
          </div>

          {shift.prescriptions.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                📋
              </div>
              <h3 className="font-bold text-slate-700 text-base">
                Nenhum paciente prescrito neste plantão
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
                Clique no botão abaixo para prescrever o primeiro paciente utilizando um modelo clínico base.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                + Prescrever Primeiro Paciente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shift.prescriptions.map((p, index) => (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-300 transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{index + 1}
                      </span>
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                        {p.template.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide group-hover:text-blue-600 transition">
                        {p.patientName}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingPatient({ id: p.id, name: p.patientName });
                          setNewPatientName(p.patientName);
                        }}
                        className="text-xs text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition"
                        title="Renomear paciente"
                      >
                        ✏️
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {p._count.items} itens configurados
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeletePrescription(p.id, p.patientName)}
                        disabled={deletingId === p.id}
                        className="text-xs text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                        title="Excluir prescrição"
                      >
                        🗑️
                      </button>
                      <button
                        onClick={() => {
                          setRenamingPatient({ id: p.id, name: p.patientName });
                          setNewPatientName(p.patientName);
                        }}
                        className="text-xs text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition"
                        title="Editar nome do paciente"
                      >
                        ✏️ Renomear
                      </button>
                      <button
                        onClick={() => handleDuplicatePrescription(p.id, p.patientName)}
                        className="text-xs text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition"
                        title="Duplicar prescrição"
                      >
                        📋 Copiar
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/prescricao/imprimir?id=${p.id}`}
                        target="_blank"
                        className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                      >
                        <span>🖨️</span>
                        <span>Imprimir</span>
                      </Link>
                      <Link
                        href={`/prescricao?id=${p.id}`}
                        className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg shadow-sm shadow-blue-600/20 transition"
                      >
                        Editar &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreatePrescriptionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          loadShift();
        }}
        shiftId={shift.id}
      />

      <EditShiftModal
        isOpen={isEditShiftOpen}
        shiftId={shift.id}
        currentDate={shift.shiftDate}
        currentNotes={shift.notes}
        onClose={() => setIsEditShiftOpen(false)}
        onSuccess={() => loadShift()}
      />

      {renamingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Renomear Paciente
              </h2>
              <button
                onClick={() => setRenamingPatient(null)}
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="renamePatientInput"
                  className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1"
                >
                  Nome do Paciente
                </label>
                <input
                  id="renamePatientInput"
                  type="text"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm font-bold uppercase"
                  placeholder="Digite o nome completo..."
                  autoFocus
                  required
                  minLength={2}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRenamingPatient(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={renamingLoading || newPatientName.trim().length < 2}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 disabled:opacity-50 transition"
                >
                  {renamingLoading ? 'Salvando...' : 'Salvar Nome'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShiftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Carregando...</div>}>
      <ShiftPageContent />
    </Suspense>
  );
}
