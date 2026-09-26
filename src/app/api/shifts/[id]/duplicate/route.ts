import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newDate } = body;

    if (!newDate) {
      return NextResponse.json(
        { error: 'Nova data é obrigatória' },
        { status: 400 }
      );
    }

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        prescriptions: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!shift) {
      return NextResponse.json(
        { error: 'Plantão original não encontrado' },
        { status: 404 }
      );
    }

    // Usar transaction para duplicar atômicamente
    const newShift = await prisma.$transaction(async (tx) => {
      return await tx.shift.create({
        data: {
          shiftDate: new Date(`${newDate}T12:00:00Z`),
          notes: shift.notes,
          prescriptions: {
            create: shift.prescriptions.map((p) => ({
              patientName: p.patientName,
              prescriptionDate: new Date(`${newDate}T12:00:00Z`),
              templateId: p.templateId,
              position: p.position,
              items: {
                create: p.items.map((i) => ({
                  templateItemId: i.templateItemId,
                  catalogItemId: i.catalogItemId,
                  position: i.position,
                  description: i.description,
                  baseText: i.baseText,
                  route: i.route,
                  frequency: i.frequency,
                  conditionText: i.conditionText,
                  scheduleType: i.scheduleType,
                  isEnabled: i.isEnabled,
                  isManual: i.isManual,
                })),
              },
            })),
          },
        },
      });
    });

    return NextResponse.json({ id: newShift.id });
  } catch (error) {
    console.error('Erro ao duplicar plantão:', error);
    return NextResponse.json(
      { error: 'Erro ao duplicar plantão' },
      { status: 500 }
    );
  }
}
