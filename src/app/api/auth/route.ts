import { NextResponse } from 'next/server';
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Senha não informada' }, { status: 400 });
    }

    const isValid = await verifyPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    const token = await createSessionToken({ authenticated: true });

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return response;
}
