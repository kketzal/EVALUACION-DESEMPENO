import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import sqlite3 from 'sqlite3';

export async function GET() {
  try {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM workers ORDER BY name', (err: sqlite3.Error | null, rows: any[]) => {
        if (err) {
          console.error('Error al obtener trabajadores:', err);
          resolve(NextResponse.json({ error: 'Error al obtener trabajadores' }, { status: 500 }));
        } else {
          resolve(NextResponse.json(rows));
        }
      });
    });
  } catch (error) {
    console.error('Error en GET /api/workers:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, name, worker_group } = await request.json();
    if (!id || !name || !worker_group || !['GRUPO 1-2', 'GRUPO 3-4'].includes(worker_group)) {
      return NextResponse.json({ error: 'Faltan campos requeridos o grupo inválido' }, { status: 400 });
    }
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO workers (id, name, worker_group) VALUES (?, ?, ?)',
        [id, name, worker_group],
        function(this: sqlite3.RunResult, err: sqlite3.Error | null) {
          if (err) {
            console.error('Error al crear trabajador:', err);
            resolve(NextResponse.json({ error: 'Error al crear trabajador' }, { status: 500 }));
          } else {
            resolve(NextResponse.json({ 
              id, 
              name, 
              worker_group
            }, { status: 201 }));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error en POST /api/workers:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 