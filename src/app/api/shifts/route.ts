import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createShiftSchema = z.object({
  shiftDate: z.string(), // ISO string ou YYYY-MM-DD
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      orderBy: { shiftDate: 'desc' },
      include: {
        _count: {
          select: { prescriptions: true },
        },
      },
    });
    return NextResponse.json(shifts);
  } catch (error) {
    console.error('Erro ao buscar plantões:', error);
    return NextResponse.json({ error: 'Erro ao buscar plantões' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createShiftSchema.parse(body);

    const shiftDate = new Date(parsed.shiftDate);
    if (isNaN(shiftDate.getTime())) {
      return NextResponse.json({ error: 'Data de plantão inválida' }, { status: 400 });
    }

    const shift = await prisma.shift.create({
      data: {
        shiftDate,
        notes: parsed.notes,
      },
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Erro ao criar plantão:', error);
    return NextResponse.json({ error: 'Erro ao criar plantão' }, { status: 500 });
  }
}
