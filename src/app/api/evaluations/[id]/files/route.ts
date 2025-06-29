import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import sqlite3 from 'sqlite3';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const competencyId = searchParams.get('competencyId');
    const conductId = searchParams.get('conductId');

    const db = getDatabase();
    
    let query = 'SELECT * FROM evidence_files WHERE evaluation_id = ?';
    const queryParams = [params.id];

    if (competencyId) {
      query += ' AND competency_id = ?';
      queryParams.push(competencyId);
    }

    if (conductId) {
      query += ' AND conduct_id = ?';
      queryParams.push(conductId);
    }

    query += ' ORDER BY uploaded_at DESC';
    
    return new Promise((resolve, reject) => {
      db.all(query, queryParams, (err: sqlite3.Error | null, rows: any[]) => {
        if (err) {
          console.error('Error al obtener archivos:', err);
          resolve(NextResponse.json({ error: 'Error al obtener archivos' }, { status: 500 }));
        } else {
          // Transformar los datos para que coincidan con el formato esperado
          const transformedFiles = rows.map(row => ({
            id: row.id.toString(),
            name: row.original_name,
            type: row.file_type,
            size: row.file_size,
            url: `/api/files/${row.file_name}`
          }));
          resolve(NextResponse.json(transformedFiles));
        }
      });
    });
  } catch (error) {
    console.error('Error en GET /api/evaluations/[id]/files:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 