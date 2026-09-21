'use client';

import { useState } from 'react';

interface CopyButtonProps {
  items: { description: string; position: number }[];
}

export function CopyButton({ items }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // Generate tab-separated or newline-separated text
    const text = items
      .sort((a, b) => a.position - b.position)
      .map((item, index) => `${index + 1}- ${item.description}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      alert('Erro ao copiar para a área de transferência.');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 transition"
      title="Copia os itens para colar no Excel"
    >
      <span>{copied ? '✅' : '📋'}</span>
      <span>{copied ? 'Copiado!' : 'Copiar p/ Excel'}</span>
    </button>
  );
}
