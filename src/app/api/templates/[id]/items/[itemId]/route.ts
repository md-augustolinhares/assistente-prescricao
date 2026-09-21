import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { renderItemDescription } from '@/lib/prescription-utils';

const updateTemplateItemSchema = z.object({
  baseText: z.string().min(1, 'Informe o medicamento e dose/diluição'),
  route: z.string().optional().default(''),
  frequency: z.string().optional().default(''),
  conditionText: z.string().optional().default(''),
  defaultScheduleType: z.string().default('HORARIO'),
  category: z.string().default('MEDICAMENTO'),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: templateId, itemId } = await params;
    const body = await request.json();
    const data = updateTemplateItemSchema.parse(body);

    const fullDescription = renderItemDescription({
      baseText: data.baseText,
      route: data.route,
      frequency: data.frequency,
      scheduleType: data.defaultScheduleType,
      conditionText: data.conditionText,
    });

    const updated = await prisma.templateItem.update({
      where: {
        id: itemId,
        templateId,
      },
      data: {
        baseText: data.baseText.trim(),
        route: data.route?.trim() || '',
        frequency: data.frequency?.trim() || '',
        conditionText: data.conditionText?.trim() || '',
        defaultScheduleType: data.defaultScheduleType,
        category: data.category,
        description: fullDescription,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Erro ao atualizar item do modelo:', error);
    return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 });
  }
}
