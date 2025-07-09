const { db } = require('./database');

// Función para decodificar nombres de archivos con problemas de codificación
function decodeFileName(fileName) {
    if (!fileName) return fileName;
    try {
        let decoded = fileName;
        // Corregir secuencias específicas de caracteres mal codificados
        // Incluye variantes con y sin byte extra
        decoded = decoded.replace(/aÌ[\x81]?/g, 'á');
        decoded = decoded.replace(/eÌ[\x81]?/g, 'é');
        decoded = decoded.replace(/iÌ[\x81]?/g, 'í');
        decoded = decoded.replace(/oÌ[\x81]?/g, 'ó');
        decoded = decoded.replace(/uÌ[\x81]?/g, 'ú');
        decoded = decoded.replace(/nÌ[\x83]?/g, 'ñ');
        decoded = decoded.replace(/AÌ[\x81]?/g, 'Á');
        decoded = decoded.replace(/EÌ[\x81]?/g, 'É');
        decoded = decoded.replace(/IÌ[\x81]?/g, 'Í');
        decoded = decoded.replace(/OÌ[\x81]?/g, 'Ó');
        decoded = decoded.replace(/UÌ[\x81]?/g, 'Ú');
        decoded = decoded.replace(/NÌ[\x83]?/g, 'Ñ');
        // Otros patrones
        decoded = decoded.replace(/nÌ~/g, 'ñ');
        decoded = decoded.replace(/NÌ~/g, 'Ñ');
        decoded = decoded.replace(/ñ~/g, 'ñ');
        decoded = decoded.replace(/Ñ~/g, 'Ñ');
        decoded = decoded.replace(/Ì/g, ''); // Elimina secuencias residuales
        decoded = decoded.replace(/EvaluacioÌn DesempenÌo por Competencias/g, 'Evaluación Desempeño por Competencias');
        // Reemplazo robusto para ñ corrupta: n seguido de uno o más caracteres no alfanuméricos y luego 'or'
        decoded = decoded.replace(/n[^a-zA-Z0-9]+or/g, 'ñor');
        decoded = decoded.replace(/N[^a-zA-Z0-9]+or/g, 'Ñor');
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

module.exports = { decodeFileName }; 