const sqlite3 = require('sqlite3');
const { db } = require('./database');
const fs = require('fs');
const path = require('path');

// Función para sanitizar nombres de usuario
const sanitizeUsername = (username) => {
    return username
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
};

// Función para eliminar directorios vacíos recursivamente
const removeEmptyDirectories = (dirPath, stopAtPath = null) => {
    if (!fs.existsSync(dirPath) || dirPath === stopAtPath) {
        return;
    }
    
    const files = fs.readdirSync(dirPath);
    if (files.length === 0) {
        fs.rmdirSync(dirPath);
        console.log('Directorio vacío eliminado:', dirPath);
        removeEmptyDirectories(path.dirname(dirPath), stopAtPath);
    }
};

async function testFileDeletion() {
    try {
        console.log('=== PRUEBA DE ELIMINACIÓN DE ARCHIVOS ===');
        
        // 1. Obtener un archivo de ejemplo de la base de datos
        const stmt = db.prepare(`
            SELECT ef.*, e.period, w.name as worker_name
            FROM evidence_files ef 
            JOIN evaluations e ON ef.evaluation_id = e.id 
            JOIN workers w ON e.worker_id = w.id
            LIMIT 1
        `);
        const file = stmt.get();
        
        if (!file) {
            console.log('No hay archivos en la base de datos para probar');
            return;
        }
        
        console.log('Archivo encontrado:', {
            id: file.id,
            name: file.file_name,
            worker_name: file.worker_name,
            period: file.period,
            competency_id: file.competency_id,
            conduct_id: file.conduct_id
        });
        
        // 2. Construir la ruta del archivo
        const periodDir = file.period || 'unknown';
        const userDir = sanitizeUsername(file.worker_name || 'unknown');
        const competencyDir = file.competency_id || 'unknown';
        const conductDir = file.conduct_id || 'unknown';
        const filePath = path.join(__dirname, 'uploads', 'evidence', periodDir, userDir, competencyDir, conductDir, file.file_name);
        
        console.log('Ruta del archivo:', filePath);
        console.log('¿Existe el archivo?', fs.existsSync(filePath));
        
        // 3. Verificar si el archivo existe físicamente
        if (fs.existsSync(filePath)) {
            console.log('✅ Archivo encontrado físicamente');
            
            // 4. Simular la eliminación
            console.log('Eliminando archivo físico...');
            fs.unlinkSync(filePath);
            console.log('✅ Archivo físico eliminado');
            
            // 5. Eliminar directorios vacíos
            const dirPath = path.dirname(filePath);
            const evidenceBasePath = path.join(__dirname, 'uploads', 'evidence');
            console.log('Eliminando directorios vacíos desde:', dirPath, 'hasta:', evidenceBasePath);
            removeEmptyDirectories(dirPath, evidenceBasePath);
            
            // 6. Eliminar de la base de datos
            const deleteStmt = db.prepare('DELETE FROM evidence_files WHERE id = ?');
            const result = deleteStmt.run(file.id);
            console.log('✅ Registro eliminado de BD, filas afectadas:', result.changes);
            
            console.log('🎉 PRUEBA EXITOSA: Archivo eliminado completamente');
        } else {
            console.log('❌ Archivo no encontrado físicamente');
            console.log('Verificando estructura de directorios...');
            
            const dirPath = path.dirname(filePath);
            console.log('Directorio padre:', dirPath);
            console.log('¿Existe el directorio?', fs.existsSync(dirPath));
            
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                console.log('Archivos en el directorio:', files);
            }
        }
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error);
    }
}

// Ejecutar la prueba
testFileDeletion(); 