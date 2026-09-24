import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCatalogItemSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  fullDescription: z.string().min(3, 'Descrição necessária'),
  category: z.enum(['MEDICAMENTO', 'HIDRATACAO', 'CUIDADO', 'DIETA', 'ANTIBIOTICO', 'ANTICOAGULANTE', 'ELETROLITO', 'SONDA', 'OUTRO']),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('q');

    const items = await prisma.catalogItem.findMany({
      where: {
        ...(category && { category }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { fullDescription: { contains: search } },
          ],
        }),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Erro ao buscar catálogo:', error);
    return NextResponse.json({ error: 'Erro ao buscar catálogo' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createCatalogItemSchema.parse(body);

    const item = await prisma.catalogItem.create({
      data,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Erro ao criar item no catálogo:', error);
    return NextResponse.json({ error: 'Erro ao criar item' }, { status: 500 });
  }
}
