import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import sqlite3 from 'sqlite3';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const evaluationId = formData.get('evaluationId') as string;
    const competencyId = formData.get('competencyId') as string;
    const conductId = formData.get('conductId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron archivos' }, { status: 400 });
    }

    if (!evaluationId || !competencyId || !conductId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    console.log('Subiendo archivos:', { evaluationId, competencyId, conductId, fileCount: files.length });

    const db = getDatabase();
    const uploadDir = path.join(process.cwd(), 'uploads', 'evidence');
    
    // Crear directorio si no existe
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles = [];

    for (const file of files) {
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 1000000000);
      const fileName = `${timestamp}-${randomId}-${file.name}`;
      const filePath = path.join(uploadDir, fileName);

      // Guardar archivo en disco
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Guardar información en base de datos
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO evidence_files (evaluation_id, competency_id, conduct_id, original_name, file_name, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [evaluationId, competencyId, conductId, file.name, fileName, file.type, file.size],
          function(this: sqlite3.RunResult, err: sqlite3.Error | null) {
            if (err) {
              console.error('Error al guardar archivo en BD:', err);
              reject(err);
            } else {
              console.log('Archivo guardado en BD con ID:', this.lastID);
              uploadedFiles.push({
                id: this.lastID,
                originalName: file.name,
                fileName: fileName,
                fileType: file.type,
                fileSize: file.size,
                url: `/api/files/${fileName}`
              });
              resolve(this.lastID);
            }
          }
        );
      });
    }

    console.log('Archivos subidos exitosamente:', uploadedFiles.length);
    return NextResponse.json({ files: uploadedFiles });

  } catch (error) {
    console.error('Error en POST /api/upload:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 