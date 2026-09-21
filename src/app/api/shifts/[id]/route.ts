import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        prescriptions: {
          orderBy: { position: 'asc' },
          include: {
            template: true,
            _count: {
              select: { items: true },
            },
          },
        },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Plantão não encontrado' }, { status: 404 });
    }

    return NextResponse.json(shift);
  } catch (error) {
    console.error('Erro ao buscar detalhes do plantão:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar plantão' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.shift.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir plantão:', error);
    return NextResponse.json({ error: 'Erro ao excluir plantão' }, { status: 500 });
  }
}
