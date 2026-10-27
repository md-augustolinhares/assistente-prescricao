'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getInstitutions,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  setActiveInstitution,
  Institution,
} from '@/lib/firestore-service';

interface InstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstitutionChange?: () => void;
}

export function InstitutionModal({
  isOpen,
  onClose,
  onInstitutionChange,
}: InstitutionModalProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    try {
      setLoading(true);
      const list = await getInstitutions();
      setInstitutions(list);
    } catch (err) {
      console.error('Erro ao carregar instituições:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData();
      setIsEditing(false);
      setEditingId(null);
    }
  }, [isOpen]);

  function handleStartNew() {
    setName('');
    setSubtitle('');
    setLogoPreview(null);
    setEditingId(null);
    setError('');
    setIsEditing(true);
  }

  function handleStartEdit(inst: Institution) {
    setName(inst.name);
    setSubtitle(inst.subtitle || '');
    setLogoPreview(inst.logoDataUrl || null);
    setEditingId(inst.id);
    setError('');
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditingId(null);
    setError('');
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem (PNG ou JPG).');
      return;
    }

    // Limitar tamanho para ~1MB para garantir bom armazenamento no Firestore
    if (file.size > 1.5 * 1024 * 1024) {
      setError('A imagem é muito pesada (máx: 1.5MB). Escolha uma versão menor.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da instituição é obrigatório.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (editingId) {
        await updateInstitution(editingId, {
          name: name.trim(),
          subtitle: subtitle.trim() || null,
          logoDataUrl: logoPreview,
        });
      } else {
        await createInstitution({
          name: name.trim(),
          subtitle: subtitle.trim() || null,
          logoDataUrl: logoPreview,
        });
      }

      await loadData();
      setIsEditing(false);
      setEditingId(null);
      if (onInstitutionChange) onInstitutionChange();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar instituição.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetActive(id: string) {
    try {
      await setActiveInstitution(id);
      await loadData();
      if (onInstitutionChange) onInstitutionChange();
    } catch (err) {
      console.error(err);
      alert('Erro ao definir instituição ativa.');
    }
  }

  async function handleDelete(id: string, instName: string) {
    if (!confirm(`Deseja realmente excluir a instituição "${instName}"?`)) return;

    try {
      await deleteInstitution(id);
      await loadData();
      if (onInstitutionChange) onInstitutionChange();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir instituição.');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Configurações
            </span>
            <h2 className="text-lg font-bold text-slate-800 mt-1">
              Instituições e Cabeçalhos
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie os locais onde você atende. Fica salvo apenas no seu banco de dados.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {isEditing ? (
            /* Formulário de Criação/Edição */
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Nome da Instituição (obrigatório)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="Ex: PREFEITURA MUNICIPAL DE EXEMPLO"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Subtítulo / Setor (opcional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value.toUpperCase())}
                  placeholder="Ex: PRONTO SOCORRO MUNICIPAL"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Upload de Logo */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Brasão / Logotipo (PNG ou JPG)
                </label>
                
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-2xl text-slate-300">🏛️</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition self-start"
                    >
                      {logoPreview ? 'Trocar Imagem...' : 'Selecionar Arquivo...'}
                    </button>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => setLogoPreview(null)}
                        className="text-xs text-red-500 hover:text-red-700 transition self-start"
                      >
                        Remover Logotipo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 disabled:opacity-50 transition"
                >
                  {saving ? 'Salvando...' : editingId ? 'Atualizar Instituição' : 'Cadastrar Instituição'}
                </button>
              </div>
            </form>
          ) : (
            /* Lista de Instituições */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-semibold text-slate-500">
                  {institutions.length} instituição(ões) cadastrada(s)
                </span>
                <button
                  type="button"
                  onClick={handleStartNew}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Nova Instituição</span>
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Carregando instituições...
                </div>
              ) : institutions.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl p-6">
                  <span className="text-3xl mb-2 block">🏥</span>
                  <p className="text-sm font-bold text-slate-700">Nenhuma instituição cadastrada</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto mb-4">
                    Cadastre a instituição onde você está atendendo para que o cabeçalho impresso e as planilhas saiam com o nome oficial e o brasão.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartNew}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                  >
                    + Cadastrar Primeira Instituição
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {institutions.map((inst) => (
                    <div
                      key={inst.id}
                      className={`p-3.5 flex items-center justify-between gap-3 transition ${
                        inst.isDefault ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                          {inst.logoDataUrl ? (
                            <img
                              src={inst.logoDataUrl}
                              alt={inst.name}
                              className="w-full h-full object-contain p-0.5"
                            />
                          ) : (
                            <span className="text-lg">🏛️</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 uppercase truncate">
                              {inst.name}
                            </h4>
                            {inst.isDefault && (
                              <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex-shrink-0">
                                Ativa
                              </span>
                            )}
                          </div>
                          {inst.subtitle && (
                            <p className="text-[11px] text-slate-500 uppercase truncate">
                              {inst.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!inst.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetActive(inst.id)}
                            className="text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition"
                            title="Tornar esta a instituição ativa padrão"
                          >
                            Tornar Ativa
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(inst)}
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition"
                          title="Editar instituição"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(inst.id, inst.name)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                          title="Excluir instituição"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
