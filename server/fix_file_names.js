const { db } = require('./database');

// Función para decodificar nombres de archivos con problemas de codificación
function decodeFileName(fileName) {
    if (!fileName) return fileName;
    
    try {
        // Intentar decodificar caracteres mal codificados
        let decoded = fileName;
        
        // Corregir secuencias específicas de caracteres mal codificados
        decoded = decoded.replace(/Ì\x81/g, 'á');
        decoded = decoded.replace(/Ì\x83/g, 'ó');
        decoded = decoded.replace(/Ì\x89/g, 'é');
        decoded = decoded.replace(/Ì\x8D/g, 'í');
        decoded = decoded.replace(/Ì\x9A/g, 'ú');
        decoded = decoded.replace(/Ì\x91/g, 'ñ');
        decoded = decoded.replace(/Ì\x80/g, 'à');
        decoded = decoded.replace(/Ì\x82/g, 'ò');
        decoded = decoded.replace(/Ì\x88/g, 'è');
        decoded = decoded.replace(/Ì\x8C/g, 'ì');
        decoded = decoded.replace(/Ì\x99/g, 'ù');
        
        // Corregir nombres específicos que sabemos que están mal
        decoded = decoded.replace(/EvaluacioÌn DesempenÌo por Competencias/g, 'Evaluación Desempeño por Competencias');
        
        // Eliminar caracteres Ì extra que aparecen antes de las tildes (solo si no se corrigieron arriba)
        if (!decoded.includes('á') && !decoded.includes('ó') && !decoded.includes('é') && !decoded.includes('í') && !decoded.includes('ú') && !decoded.includes('ñ')) {
            decoded = decoded.replace(/Ì/g, '');
        }
        
        return decoded;
    } catch (error) {
        console.error('Error decodificando nombre de archivo:', error);
        return fileName;
    }
}

// Función para corregir todos los nombres de archivos en la base de datos
function fixAllFileNames() {
    console.log('Iniciando corrección de nombres de archivos...');
    
    try {
        // Obtener todos los archivos
        const allFiles = db.prepare('SELECT id, original_name FROM evidence_files').all();
        
        console.log(`Encontrados ${allFiles.length} archivos en total`);
        
        let correctedCount = 0;
        
        for (const file of allFiles) {
            const originalName = file.original_name;
            const correctedName = decodeFileName(originalName);
            
            if (correctedName !== originalName) {
                console.log(`Corrigiendo archivo ID ${file.id}:`);
                console.log(`  Antes: "${originalName}"`);
                console.log(`  Después: "${correctedName}"`);
                
                const updateStmt = db.prepare('UPDATE evidence_files SET original_name = ? WHERE id = ?');
                const result = updateStmt.run(correctedName, file.id);
                
                if (result.changes > 0) {
                    console.log(`  ✅ Archivo ID ${file.id} actualizado correctamente`);
                    correctedCount++;
                } else {
                    console.log(`  ❌ Error al actualizar archivo ID ${file.id}`);
                }
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