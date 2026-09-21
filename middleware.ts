import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'med_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rota de login, API de autenticação, recursos estáticos do Next e imagens públicas
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/logos') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secretKey = process.env.AUTH_SECRET || 'secret-key-fallback-min-32-chars-length!!';
    const key = new TextEncoder().encode(secretKey);
    await jwtVerify(token, key, { algorithms: ['HS256'], clockTolerance: 120 });
    return NextResponse.next();
  } catch (err) {
    console.error('Middleware JWT Verify Error:', err);
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware a todas as rotas exceto arquivos estáticos
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
