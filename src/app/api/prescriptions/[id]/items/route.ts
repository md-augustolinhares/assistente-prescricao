import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const itemSchema = z.object({
  id: z.string().optional(),
  position: z.number(),
  description: z.string(),
  baseText: z.string().optional().default(''),
  route: z.string().nullable().optional().default(''),
  frequency: z.string().nullable().optional().default(''),
  conditionText: z.string().nullable().optional().default(''),
  scheduleType: z.string(),
  isEnabled: z.boolean(),
  isManual: z.boolean().default(false),
  templateItemId: z.string().nullable().optional(),
  catalogItemId: z.string().nullable().optional(),
});

const updateItemsSchema = z.object({
  items: z.array(itemSchema),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prescriptionId } = await params;
    const body = await request.json();
    const { items } = updateItemsSchema.parse(body);

    // Atualização atômica dos itens da prescrição
    await prisma.$transaction([
      prisma.prescriptionItem.deleteMany({
        where: { prescriptionId },
      }),
      prisma.prescriptionItem.createMany({
        data: items.map((item, index) => ({
          prescriptionId,
          position: index + 1,
          description: item.description,
          baseText: item.baseText || item.description,
          route: item.route || '',
          frequency: item.frequency || '',
          conditionText: item.conditionText || '',
          scheduleType: item.scheduleType,
          isEnabled: item.isEnabled,
          isManual: item.isManual ?? false,
          templateItemId: item.templateItemId || null,
          catalogItemId: item.catalogItemId || null,
        })),
      }),
      prisma.prescription.update({
        where: { id: prescriptionId },
        data: { updatedAt: new Date() },
      }),
    ]);

    const updatedItems = await prisma.prescriptionItem.findMany({
      where: { prescriptionId },
      orderBy: { position: 'asc' },
      include: {
        templateItem: true,
        catalogItem: true,
      },
    });

    return NextResponse.json({ success: true, items: updatedItems });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Erro ao atualizar itens da prescrição:', error);
    return NextResponse.json({ error: 'Erro ao salvar itens' }, { status: 500 });
  }
}
