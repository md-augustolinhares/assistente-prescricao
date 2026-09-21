import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCatalogItemSchema = z.object({
  name: z.string().min(2).optional(),
  fullDescription: z.string().min(3).optional(),
  category: z.enum(['ANTIBIOTICO', 'ANTICOAGULANTE', 'ELETROLITO', 'SONDA', 'OUTRO']).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateCatalogItemSchema.parse(body);

    const updated = await prisma.catalogItem.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar item do catálogo:', error);
    return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.catalogItem.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir item do catálogo:', error);
    return NextResponse.json({ error: 'Erro ao excluir item' }, { status: 500 });
  }
}
