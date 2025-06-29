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
        'SELECT * FROM real_evidences WHERE evaluation_id = ?',
        [params.id],
        (err: sqlite3.Error | null, rows: any[]) => {
          if (err) {
            console.error('Error al obtener evidencias:', err);
            resolve(NextResponse.json({ error: 'Error al obtener evidencias' }, { status: 500 }));
          } else {
            resolve(NextResponse.json(rows));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error en GET /api/evaluations/[id]/evidence:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { conductId, evidenceText } = await request.json();
    
    if (!conductId) {
      return NextResponse.json({ error: 'conductId es requerido' }, { status: 400 });
    }

    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      // Verificar si ya existe un registro
      db.get(
        'SELECT id FROM real_evidences WHERE evaluation_id = ? AND conduct_id = ?',
        [params.id, conductId],
        (err: sqlite3.Error | null, row: any) => {
          if (err) {
            console.error('Error al verificar evidencia existente:', err);
            resolve(NextResponse.json({ error: 'Error al verificar evidencia' }, { status: 500 }));
          } else if (row) {
            // Actualizar registro existente
            db.run(
              'UPDATE real_evidences SET evidence_text = ? WHERE id = ?',
              [evidenceText || '', row.id],
              function(this: sqlite3.RunResult, updateErr: sqlite3.Error | null) {
                if (updateErr) {
                  console.error('Error al actualizar evidencia:', updateErr);
                  resolve(NextResponse.json({ error: 'Error al actualizar evidencia' }, { status: 500 }));
                } else {
                  resolve(NextResponse.json({ id: row.id, evidenceText }));
                }
              }
            );
          } else {
            // Crear nuevo registro
            db.run(
              'INSERT INTO real_evidences (evaluation_id, conduct_id, evidence_text) VALUES (?, ?, ?)',
              [params.id, conductId, evidenceText || ''],
              function(this: sqlite3.RunResult, insertErr: sqlite3.Error | null) {
                if (insertErr) {
                  console.error('Error al crear evidencia:', insertErr);
                  resolve(NextResponse.json({ error: 'Error al crear evidencia' }, { status: 500 }));
                } else {
                  resolve(NextResponse.json({ id: this.lastID, evidenceText }, { status: 201 }));
                }
              }
            );
          }
        }
      );
    });
  } catch (error) {
    console.error('Error en POST /api/evaluations/[id]/evidence:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 