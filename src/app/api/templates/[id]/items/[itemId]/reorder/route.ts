import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reorderSchema = z.object({
  direction: z.enum(['up', 'down']),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: templateId, itemId } = await params;
    const body = await request.json();
    const { direction } = reorderSchema.parse(body);

    const items = await prisma.templateItem.findMany({
      where: { templateId },
      orderBy: { position: 'asc' },
    });

    const currentIndex = items.findIndex((it) => it.id === itemId);
    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Item não encontrado no modelo' }, { status: 404 });
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) {
      return NextResponse.json({ message: 'Item já está no limite' }, { status: 200 });
    }

    // Troca os dois itens na lista ordenada
    const reordered = [...items];
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    // Normaliza as posições de 1 a N
    await prisma.$transaction(
      reordered.map((item, idx) =>
        prisma.templateItem.update({
          where: { id: item.id },
          data: { position: idx + 1 },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'JSON malformado ou inválido' }, { status: 400 });
    }
    console.error('Erro ao reordenar item:', error);
    return NextResponse.json({ error: 'Erro ao reordenar item' }, { status: 500 });
  }
}
