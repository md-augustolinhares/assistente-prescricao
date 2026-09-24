import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    const getPriority = (name: string): number => {
      const lower = name.toLowerCase();
      if (lower.includes('geral')) return 1;
      if (lower.includes('psiquiat')) return 2;
      return 10;
    };

    const sortedTemplates = templates.sort((a, b) => {
      const pA = getPriority(a.name);
      const pB = getPriority(b.name);
      if (pA !== pB) return pA - pB;
      return a.name.localeCompare(b.name, 'pt-BR');
    });

    return NextResponse.json(sortedTemplates);
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 });
  }
}
