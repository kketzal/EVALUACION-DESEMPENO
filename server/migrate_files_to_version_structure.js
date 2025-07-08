const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'evaluations.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Iniciando migración de archivos a estructura con versiones...\n');

async function migrateFilesToVersionStructure() {
  try {
    // Obtener todas las evaluaciones con sus archivos
    const evaluations = new Promise((resolve, reject) => {
      db.all(`
        SELECT DISTINCT e.id, e.period, e.version, w.name as worker_name
        FROM evaluations e 
        JOIN workers w ON e.worker_id = w.id
        ORDER BY e.worker_id, e.period, e.version
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    const evaluationsData = await evaluations;

    console.log(`📊 Encontradas ${evaluationsData.length} evaluaciones para procesar`);

    let totalFilesProcessed = 0;
    let totalFilesMigrated = 0;
    let totalErrors = 0;

    for (const evaluation of evaluationsData) {
      console.log(`\n👤 Procesando evaluación ${evaluation.id} (${evaluation.worker_name} - ${evaluation.period} - v${evaluation.version})`);
      
      // Obtener archivos de esta evaluación
      const files = new Promise((resolve, reject) => {
        db.all(`
          SELECT * FROM evidence_files 
          WHERE evaluation_id = ? 
          ORDER BY id
        `, [evaluation.id], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });

      const filesData = await files;

      if (filesData.length === 0) {
        console.log(`  ⚪ No hay archivos para esta evaluación`);
        continue;
      }

      console.log(`  📁 Encontrados ${filesData.length} archivos`);

      for (const file of filesData) {
        totalFilesProcessed++;
        
        try {
          // Verificar si el archivo ya tiene estructura de versión
          const pathParts = file.file_name.split(path.sep);
          const hasVersionDir = pathParts.some(part => part.startsWith('v') && /^v\d+$/.test(part));
          
          if (hasVersionDir) {
            console.log(`  ✅ Archivo ${file.id} ya tiene estructura de versión: ${file.file_name}`);
            continue;
          }

          // Construir la nueva ruta con versión
          const periodDir = evaluation.period;
          const userDir = sanitizeUsername(evaluation.worker_name);
          const versionDir = `v${evaluation.version}`;
          
          // Extraer las partes restantes de la ruta original
          const remainingParts = pathParts.slice(2); // Saltar periodo y usuario
          const newPathParts = [periodDir, userDir, versionDir, ...remainingParts];
          const newFilePath = newPathParts.join(path.sep);

          // Verificar si el archivo físico existe
          const originalPhysicalPath = path.join(__dirname, 'uploads', 'evidence', file.file_name);
          const newPhysicalPath = path.join(__dirname, 'uploads', 'evidence', newFilePath);

          if (!fs.existsSync(originalPhysicalPath)) {
            console.log(`  ⚠️  Archivo físico no encontrado: ${originalPhysicalPath}`);
            totalErrors++;
            continue;
          }

          // Crear directorios si no existen
          const newDir = path.dirname(newPhysicalPath);
          if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir, { recursive: true });
            console.log(`  📂 Creado directorio: ${newDir}`);
          }

          // Mover archivo físico
          fs.renameSync(originalPhysicalPath, newPhysicalPath);
          console.log(`  📄 Archivo movido: ${file.file_name} → ${newFilePath}`);

          // Actualizar registro en BD
          new Promise((resolve, reject) => {
            db.run('UPDATE evidence_files SET file_name = ? WHERE id = ?', [newFilePath, file.id], function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(this);
              }
            });
          });

          totalFilesMigrated++;
          console.log(`  ✅ Archivo ${file.id} migrado exitosamente`);

        } catch (error) {
          console.error(`  ❌ Error migrando archivo ${file.id}:`, error.message);
          totalErrors++;
        }
      }
    }

    console.log(`\n📊 Resumen de migración:`);
    console.log(`  Total archivos procesados: ${totalFilesProcessed}`);
    console.log(`  Total archivos migrados: ${totalFilesMigrated}`);
    console.log(`  Total errores: ${totalErrors}`);
    console.log(`  Archivos ya con estructura correcta: ${totalFilesProcessed - totalFilesMigrated - totalErrors}`);

    if (totalErrors === 0) {
      console.log(`\n✅ Migración completada exitosamente`);
    } else {
      console.log(`\n⚠️  Migración completada con ${totalErrors} errores`);
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    db.close();
  }
}

// Función auxiliar para sanitizar nombres de usuario (copiada del server.js)
function sanitizeUsername(username) {
  return username
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

// Ejecutar migración
migrateFilesToVersionStructure(); 