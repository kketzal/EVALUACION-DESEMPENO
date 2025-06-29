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
        'SELECT * FROM criteria_checks WHERE evaluation_id = ?',
        [params.id],
        (err: sqlite3.Error | null, rows: any[]) => {
          if (err) {
            console.error('Error al obtener criterios:', err);
            resolve(NextResponse.json({ error: 'Error al obtener criterios' }, { status: 500 }));
          } else {
            resolve(NextResponse.json(rows));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error en GET /api/evaluations/[id]/criteria:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { conductId, tramo, criterionIndex, isChecked } = await request.json();
    
    if (!conductId || !tramo || criterionIndex === undefined || isChecked === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      // Verificar si ya existe un registro
      db.get(
        'SELECT id FROM criteria_checks WHERE evaluation_id = ? AND conduct_id = ? AND tramo = ? AND criterion_index = ?',
        [params.id, conductId, tramo, criterionIndex],
        (err: sqlite3.Error | null, row: any) => {
          if (err) {
            console.error('Error al verificar criterio existente:', err);
            resolve(NextResponse.json({ error: 'Error al verificar criterio' }, { status: 500 }));
          } else if (row) {
            // Actualizar registro existente
            db.run(
              'UPDATE criteria_checks SET is_checked = ? WHERE id = ?',
              [isChecked ? 1 : 0, row.id],
              function(this: sqlite3.RunResult, updateErr: sqlite3.Error | null) {
                if (updateErr) {
                  console.error('Error al actualizar criterio:', updateErr);
                  resolve(NextResponse.json({ error: 'Error al actualizar criterio' }, { status: 500 }));
                } else {
                  resolve(NextResponse.json({ id: row.id, isChecked }));
                }
              }
            );
          } else {
            // Crear nuevo registro
            db.run(
              'INSERT INTO criteria_checks (evaluation_id, conduct_id, tramo, criterion_index, is_checked) VALUES (?, ?, ?, ?, ?)',
              [params.id, conductId, tramo, criterionIndex, isChecked ? 1 : 0],
              function(this: sqlite3.RunResult, insertErr: sqlite3.Error | null) {
                if (insertErr) {
                  console.error('Error al crear criterio:', insertErr);
                  resolve(NextResponse.json({ error: 'Error al crear criterio' }, { status: 500 }));
                } else {
                  resolve(NextResponse.json({ id: this.lastID, isChecked }, { status: 201 }));
                }
              }
            );
          }
        }
      );
    });
  } catch (error) {
    console.error('Error en POST /api/evaluations/[id]/criteria:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 