const { db } = require('./database');
const fs = require('fs');
const path = require('path');

// Función para sanitizar nombres de usuario
function sanitizeUsername(username) {
    return username.toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

// Función para registrar archivos huérfanos
function registerOrphanFiles() {
    console.log('Iniciando registro de archivos huérfanos...');
    
    const evidenceDir = path.join(__dirname, 'uploads', 'evidence');
    let registeredCount = 0;
    let errors = [];
    
    // Función recursiva para escanear directorios
    function scanDirectory(dirPath, relativePath = '') {
        if (!fs.existsSync(dirPath)) return;
        
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const relativeItemPath = path.join(relativePath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Es un directorio, escanear recursivamente
                scanDirectory(fullPath, relativeItemPath);
            } else {
                // Es un archivo
                try {
                    // Verificar si ya está en la BD
                    const existingFile = db.prepare('SELECT id FROM evidence_files WHERE file_name = ?').get(relativeItemPath);
                    
                    if (!existingFile) {
                        // Extraer información de la ruta
                        const pathParts = relativeItemPath.split(path.sep);
                        
                        if (pathParts.length >= 5) {
                            const [periodDir, userDir, competencyDir, conductDir, filename] = pathParts;
                            
                            // Buscar evaluación correspondiente
                            const sanitizedUserDir = sanitizeUsername(userDir);
                            const evaluation = db.prepare(`
                                SELECT e.id, e.worker_id, w.name as worker_name 
                                FROM evaluations e 
                                JOIN workers w ON e.worker_id = w.id 
                                WHERE e.period = ? AND w.name LIKE ?
                            `).get(periodDir, `%${userDir.replace(/_/g, '%')}%`);
                            
                            if (evaluation) {
                                // Obtener información del archivo
                                const fileStats = fs.statSync(fullPath);
                                const fileType = path.extname(filename).toLowerCase();
                                
                                // Determinar MIME type básico
                                let mimeType = 'application/octet-stream';
                                if (fileType === '.pdf') mimeType = 'application/pdf';
                                else if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileType)) mimeType = `image/${fileType.substring(1)}`;
                                else if (fileType === '.txt') mimeType = 'text/plain';
                                else if (fileType === '.doc') mimeType = 'application/msword';
                                else if (fileType === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                                
                                // Generar un nombre original legible basado en el tipo de archivo y la fecha
                                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
                                const originalName = `Archivo_${fileType.substring(1).toUpperCase()}_${timestamp}${fileType}`;
                                
                                // Insertar en la BD
                                const stmt = db.prepare(`
                                    INSERT INTO evidence_files 
                                    (evaluation_id, competency_id, conduct_id, original_name, file_name, file_type, file_size, uploaded_at) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                `);
                                
                                const result = stmt.run(
                                    evaluation.id,
                                    competencyDir,
                                    conductDir,
                                    originalName,
                                    relativeItemPath,
                                    mimeType,
                                    fileStats.size,
                                    new Date().toISOString().replace('T', ' ').substring(0, 19)
                                );
                                
                                console.log(`✅ Registrado: ${relativeItemPath} (ID: ${result.lastInsertRowid})`);
                                registeredCount++;
                            } else {
                                console.log(`❌ No se encontró evaluación para: ${relativeItemPath}`);
                                errors.push({
                                    file: relativeItemPath,
                                    error: 'No se encontró evaluación correspondiente'
                                });
                            }
                        } else {
                            console.log(`❌ Ruta inválida: ${relativeItemPath}`);
                            errors.push({
                                file: relativeItemPath,
                                error: 'Estructura de ruta inválida'
                            });
                        }
                    } else {
                        console.log(`⏭️  Ya registrado: ${relativeItemPath}`);
                    }
                } catch (error) {
                    console.error(`❌ Error procesando ${relativeItemPath}:`, error.message);
                    errors.push({
                        file: relativeItemPath,
                        error: error.message
                    });
                }
            }
        }
    }
    
    // Escanear desde la raíz de evidence
    scanDirectory(evidenceDir);
    
    console.log(`\n🎉 Registro completado:`);
    console.log(`   ✅ Archivos registrados: ${registeredCount}`);
    console.log(`   ❌ Errores: ${errors.length}`);
    
    if (errors.length > 0) {
        console.log('\nErrores detallados:');
        errors.forEach(error => {
            console.log(`   - ${error.file}: ${error.error}`);
        });
    }
    
    return {
        registeredCount,
        errors,
        success: errors.length === 0
    };
}

// Ejecutar si se llama directamente
if (require.main === module) {
    registerOrphanFiles();
}

module.exports = { registerOrphanFiles }; 