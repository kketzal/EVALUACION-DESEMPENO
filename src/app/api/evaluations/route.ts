import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import sqlite3 from 'sqlite3';

export async function GET() {
  try {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT e.*, w.name as worker_name, w.position, w.department 
        FROM evaluations e 
        JOIN workers w ON e.worker_id = w.id 
        ORDER BY e.evaluation_date DESC
      `, (err: sqlite3.Error | null, rows: any[]) => {
        if (err) {
          console.error('Error al obtener evaluaciones:', err);
          resolve(NextResponse.json({ error: 'Error al obtener evaluaciones' }, { status: 500 }));
        } else {
          resolve(NextResponse.json(rows));
        }
      });
    });
  } catch (error) {
    console.error('Error en GET /api/evaluations:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workerId } = await request.json();
    
    if (!workerId) {
      return NextResponse.json({ error: 'workerId es requerido' }, { status: 400 });
    }

    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO evaluations (worker_id) VALUES (?)',
        [workerId],
        function(this: sqlite3.RunResult, err: sqlite3.Error | null) {
          if (err) {
            console.error('Error al crear evaluación:', err);
            resolve(NextResponse.json({ error: 'Error al crear evaluación' }, { status: 500 }));
          } else {
            resolve(NextResponse.json({ 
              id: this.lastID, 
              workerId 
            }, { status: 201 }));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error en POST /api/evaluations:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 