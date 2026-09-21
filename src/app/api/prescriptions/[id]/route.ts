import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        template: true,
        shift: true,
        items: {
          orderBy: { position: 'asc' },
          include: {
            templateItem: true,
            catalogItem: true,
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescrição não encontrada' }, { status: 404 });
    }

    return NextResponse.json(prescription);
  } catch (error) {
    console.error('Erro ao buscar prescrição:', error);
    return NextResponse.json({ error: 'Erro ao buscar prescrição' }, { status: 500 });
  }
}

const updatePrescriptionSchema = z.object({
  patientName: z.string().min(2).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { patientName } = updatePrescriptionSchema.parse(body);

    const updated = await prisma.prescription.update({
      where: { id },
      data: {
        ...(patientName && { patientName: patientName.toUpperCase().trim() }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar prescrição:', error);
    return NextResponse.json({ error: 'Erro ao atualizar prescrição' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.prescription.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir prescrição:', error);
    return NextResponse.json({ error: 'Erro ao excluir prescrição' }, { status: 500 });
  }
}
