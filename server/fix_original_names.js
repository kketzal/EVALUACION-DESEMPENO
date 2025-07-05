const { db } = require('./database');

// Función para corregir nombres originales de archivos
function fixOriginalNames() {
    console.log('Iniciando corrección de nombres originales...');
    
    try {
        // Obtener todos los archivos que tienen nombres de hash como original_name
        const files = db.prepare(`
            SELECT id, original_name, file_name, file_type 
            FROM evidence_files 
            WHERE original_name LIKE '%_%_%' 
            AND (original_name LIKE '1751%' OR original_name LIKE '1752%' OR original_name LIKE '1753%')
        `).all();
        
        console.log(`Encontrados ${files.length} archivos con nombres de hash incorrectos`);
        
        let updatedCount = 0;
        
        for (const file of files) {
            // Extraer información del file_name para generar un nombre legible
            const pathParts = file.file_name.split('/');
            if (pathParts.length >= 5) {
                const [periodDir, userDir, competencyDir, conductDir, filename] = pathParts;
                
                // Obtener la extensión del archivo
                const fileType = filename.substring(filename.lastIndexOf('.'));
                
                // Generar un nombre original legible
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
                const originalName = `Archivo_${fileType.substring(1).toUpperCase()}_${timestamp}${fileType}`;
                
                // Actualizar en la BD
                const stmt = db.prepare('UPDATE evidence_files SET original_name = ? WHERE id = ?');
                const result = stmt.run(originalName, file.id);
                
                if (result.changes > 0) {
                    console.log(`✅ Actualizado ID ${file.id}: "${file.original_name}" -> "${originalName}"`);
                    updatedCount++;
                }
            }
        }
        
        console.log(`\n🎉 Corrección completada:`);
        console.log(`   ✅ Archivos actualizados: ${updatedCount}`);
        
        return {
            updatedCount,
            success: true
        };
        
    } catch (error) {
        console.error('❌ Error al corregir nombres:', error);
        return {
            error: error.message,
            success: false
        };
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    fixOriginalNames();
}

module.exports = { fixOriginalNames }; 