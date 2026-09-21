import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar a prescrição original com todos os seus itens
    const original = await prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!original) {
      return NextResponse.json({ error: 'Prescrição original não encontrada' }, { status: 404 });
    }

    // Criar a nova prescrição (duplicada)
    const duplicated = await prisma.prescription.create({
      data: {
        patientName: `${original.patientName} (Cópia)`,
        prescriptionDate: new Date(),
        shiftId: original.shiftId,
        templateId: original.templateId,
        items: {
          create: original.items.map((item) => ({
            position: item.position,
            description: item.description,
            scheduleType: item.scheduleType,
            isEnabled: item.isEnabled,
            isManual: item.isManual,
            templateItemId: item.templateItemId,
            catalogItemId: item.catalogItemId,
          })),
        },
      },
    });

    return NextResponse.json(duplicated);
  } catch (error) {
    console.error('Erro ao duplicar prescrição:', error);
    return NextResponse.json({ error: 'Erro interno ao duplicar prescrição' }, { status: 500 });
  }
}
