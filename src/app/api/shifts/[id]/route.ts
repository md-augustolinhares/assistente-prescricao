import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateShiftSchema = z.object({
  shiftDate: z.string().optional(),
  notes: z.string().nullable().optional(),
});

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateShiftSchema.parse(body);

    let parsedDate: Date | undefined;
    if (parsed.shiftDate) {
      parsedDate =
        parsed.shiftDate.length === 10
          ? new Date(`${parsed.shiftDate}T12:00:00Z`)
          : new Date(parsed.shiftDate);

      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Data de plantão inválida' }, { status: 400 });
      }
    }

    const updatedShift = await prisma.$transaction(async (tx) => {
      const updated = await tx.shift.update({
        where: { id },
        data: {
          ...(parsedDate && { shiftDate: parsedDate }),
          ...(parsed.notes !== undefined && { notes: parsed.notes }),
        },
      });

      if (parsedDate) {
        await tx.prescription.updateMany({
          where: { shiftId: id },
          data: { prescriptionDate: parsedDate },
        });
      }

      return updated;
    });

    return NextResponse.json(updatedShift);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Erro ao atualizar plantão:', error);
    return NextResponse.json({ error: 'Erro ao atualizar plantão' }, { status: 500 });
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
