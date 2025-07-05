const { db } = require('./database');

// Función para corregir nombres de archivos con problemas de codificación
function fixAllFileNames() {
    console.log('Iniciando corrección de todos los nombres de archivos...');
    
    try {
        // Obtener todos los archivos
        const allFiles = db.prepare('SELECT id, original_name FROM evidence_files').all();
        
        console.log(`Encontrados ${allFiles.length} archivos en total`);
        
        let correctedCount = 0;
        
        for (const file of allFiles) {
            const originalName = file.original_name;
            console.log(`\nProcesando archivo ID ${file.id}:`);
            console.log(`  Nombre original: "${originalName}"`);
            console.log(`  Hex: ${Buffer.from(originalName, 'utf8').toString('hex')}`);
            
            // Detectar y corregir problemas comunes de codificación
            let correctedName = originalName;
            
            // Corregir secuencias específicas de caracteres mal codificados
            if (originalName.includes('Ì\x81')) {
                correctedName = originalName.replace(/Ì\x81/g, 'á');
                console.log(`  Corrigiendo Ì\\x81 -> á`);
            }
            if (originalName.includes('Ì\x83')) {
                correctedName = correctedName.replace(/Ì\x83/g, 'ó');
                console.log(`  Corrigiendo Ì\\x83 -> ó`);
            }
            // Corregir el carácter Ì que aparece antes de las tildes
            if (correctedName.includes('Ì')) {
                correctedName = correctedName.replace(/Ì/g, '');
                console.log(`  Eliminando Ì extra`);
            }
            if (originalName.includes('Ì\x89')) {
                correctedName = correctedName.replace(/Ì\x89/g, 'é');
                console.log(`  Corrigiendo Ì\\x89 -> é`);
            }
            if (originalName.includes('Ì\x8D')) {
                correctedName = correctedName.replace(/Ì\x8D/g, 'í');
                console.log(`  Corrigiendo Ì\\x8D -> í`);
            }
            if (originalName.includes('Ì\x9A')) {
                correctedName = correctedName.replace(/Ì\x9A/g, 'ú');
                console.log(`  Corrigiendo Ì\\x9A -> ú`);
            }
            if (originalName.includes('Ì\x91')) {
                correctedName = correctedName.replace(/Ì\x91/g, 'ñ');
                console.log(`  Corrigiendo Ì\\x91 -> ñ`);
            }
            
            // Si se hizo alguna corrección, actualizar la base de datos
            if (correctedName !== originalName) {
                console.log(`  Nombre corregido: "${correctedName}"`);
                
                const updateStmt = db.prepare('UPDATE evidence_files SET original_name = ? WHERE id = ?');
                const result = updateStmt.run(correctedName, file.id);
                
                if (result.changes > 0) {
                    console.log(`  ✅ Archivo ID ${file.id} actualizado correctamente`);
                    correctedCount++;
                } else {
                    console.log(`  ❌ Error al actualizar archivo ID ${file.id}`);
                }
            } else {
                console.log(`  ✅ Nombre ya está correcto`);
            }
        }
        
        console.log(`\n=== RESUMEN ===`);
        console.log(`Total de archivos procesados: ${allFiles.length}`);
        console.log(`Archivos corregidos: ${correctedCount}`);
        console.log(`Archivos sin cambios: ${allFiles.length - correctedCount}`);
        
        if (correctedCount > 0) {
            console.log(`\n✅ Corrección completada exitosamente`);
        } else {
            console.log(`\nℹ️  No se encontraron archivos que necesiten corrección`);
        }
        
    } catch (error) {
        console.error('Error durante la corrección:', error);
    }
}

// Ejecutar la corrección
fixAllFileNames(); 