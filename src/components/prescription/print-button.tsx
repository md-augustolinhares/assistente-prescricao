'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2"
    >
      <span>🖨️</span>
      <span>Imprimir Agora (Ctrl + P)</span>
    </button>
  );
}
