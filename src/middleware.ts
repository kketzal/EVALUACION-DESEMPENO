import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Inicializar la base de datos en el primer request
  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      require('../lib/init-db');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}; 