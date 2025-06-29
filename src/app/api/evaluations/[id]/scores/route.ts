import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import sqlite3 from 'sqlite3';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM scores WHERE evaluation_id = ?',
        [params.id],
        (err: sqlite3.Error | null, rows: any[]) => {
          if (err) {
            console.error('Error al obtener puntuaciones:', err);
            resolve(NextResponse.json({ error: 'Error al obtener puntuaciones' }, { status: 500 }));
          } else {
            resolve(NextResponse.json(rows));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error en GET /api/evaluations/[id]/scores:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { conductId, score } = await request.json();
    
    if (!conductId || score === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      // Verificar si ya existe un registro
      db.get(
        'SELECT id FROM scores WHERE evaluation_id = ? AND conduct_id = ?',
        [params.id, conductId],
        (err: sqlite3.Error | null, row: any) => {
          if (err) {
            console.error('Error al verificar puntuación existente:', err);
            resolve(NextResponse.json({ error: 'Error al verificar puntuación' }, { status: 500 }));
          } else if (row) {
            // Actualizar registro existente
            db.run(
              'UPDATE scores SET score = ? WHERE id = ?',
              [score, row.id],
              function(this: sqlite3.RunResult, updateErr: sqlite3.Error | null) {
                if (updateErr) {
                  console.error('Error al actualizar puntuación:', updateErr);
                  resolve(NextResponse.json({ error: 'Error al actualizar puntuación' }, { status: 500 }));
                } else {
                  resolve(NextResponse.json({ id: row.id, score }));
                }
              }
            );
          } else {
            // Crear nuevo registro
            db.run(
              'INSERT INTO scores (evaluation_id, conduct_id, score) VALUES (?, ?, ?)',
              [params.id, conductId, score],
              function(this: sqlite3.RunResult, insertErr: sqlite3.Error | null) {
                if (insertErr) {
                  console.error('Error al crear puntuación:', insertErr);
                  resolve(NextResponse.json({ error: 'Error al crear puntuación' }, { status: 500 }));
                } else {
                  resolve(NextResponse.json({ id: this.lastID, score }, { status: 201 }));
                }
              }
            );
          }
        }
      );
    });
  } catch (error) {
    console.error('Error en POST /api/evaluations/[id]/scores:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 