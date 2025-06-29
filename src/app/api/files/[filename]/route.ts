import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import sqlite3 from 'sqlite3';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json({ error: 'ID de archivo requerido' }, { status: 400 });
    }

    console.log('Eliminando archivo con ID:', fileId);

    const db = getDatabase();

    // Obtener información del archivo
    const fileInfo = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM evidence_files WHERE id = ?',
        [fileId],
        (err: sqlite3.Error | null, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    if (!fileInfo) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    console.log('Archivo encontrado en BD:', fileInfo);

    // Eliminar archivo físico
    const filePath = path.join(process.cwd(), 'uploads', 'evidence', fileInfo.file_name);
    try {
      await unlink(filePath);
      console.log('Archivo físico eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar archivo físico:', error);
      // Continuar aunque falle la eliminación física
    }

    // Eliminar registro de la base de datos
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM evidence_files WHERE id = ?',
        [fileId],
        function(this: sqlite3.RunResult, err: sqlite3.Error | null) {
          if (err) {
            console.error('Error al eliminar registro de BD:', err);
            reject(err);
          } else {
            console.log('Registro eliminado de BD, filas afectadas:', this.changes);
            resolve(this.changes);
          }
        }
      );
    });

    return NextResponse.json({ message: 'Archivo eliminado correctamente' });

  } catch (error) {
    console.error('Error en DELETE /api/files:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 