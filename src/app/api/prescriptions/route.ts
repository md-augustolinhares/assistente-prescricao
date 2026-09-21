import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPrescriptionSchema = z.object({
  shiftId: z.string(),
  templateId: z.string(),
  patientName: z.string().min(2, 'Informe o nome e idade do paciente'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shiftId, templateId, patientName } = createPrescriptionSchema.parse(body);

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Modelo de prescrição não encontrado' }, { status: 404 });
    }

    // Calcular próxima posição no plantão
    const lastPrescription = await prisma.prescription.findFirst({
      where: { shiftId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const position = (lastPrescription?.position ?? 0) + 1;

    // Criar prescrição com os itens copiados do modelo
    const prescription = await prisma.prescription.create({
      data: {
        shiftId,
        templateId,
        patientName: patientName.toUpperCase().trim(),
        position,
        items: {
          create: template.items.map((item) => ({
            templateItemId: item.id,
            position: item.position,
            description: item.description,
            scheduleType: item.defaultScheduleType,
            isEnabled: item.enabledByDefault,
            isManual: false,
          })),
        },
      },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Erro ao criar prescrição:', error);
    return NextResponse.json({ error: 'Erro ao criar prescrição' }, { status: 500 });
  }
}
