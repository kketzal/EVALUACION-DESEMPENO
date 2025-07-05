const sqlite3 = require('sqlite3');
const { db } = require('./database');
const fs = require('fs');
const path = require('path');

async function registerExistingFile() {
    try {
        console.log('=== REGISTRANDO ARCHIVO EXISTENTE ===');
        
        // Verificar que el archivo existe
        const filePath = 'uploads/evidence/2023-2024/manuel_martinez_peinado/B/B1/evaluacioi_n_desempeni_o_por_competencias_1751712969535.pdf';
        
        if (!fs.existsSync(filePath)) {
            console.log('❌ Archivo no encontrado:', filePath);
            return;
        }
        
        console.log('✅ Archivo encontrado:', filePath);
        
        // Obtener información del archivo
        const stats = fs.statSync(filePath);
        const fileName = path.basename(filePath);
        
        console.log('Información del archivo:', {
            name: fileName,
            size: stats.size,
            created: stats.birthtime
        });
        
        // Crear un trabajador si no existe
        const workerId = '1751315490898';
        const workerName = 'MANUEL MARTINEZ PEINADO';
        
        const existingWorker = db.prepare('SELECT id FROM workers WHERE id = ?').get(workerId);
        if (!existingWorker) {
            console.log('Creando trabajador:', workerName);
            db.prepare('INSERT INTO workers (id, name, worker_group) VALUES (?, ?, ?)')
              .run(workerId, workerName, 'GRUPO 1-2');
        }
        
        // Crear una evaluación si no existe
        const period = '2023-2024';
        const existingEvaluation = db.prepare('SELECT id FROM evaluations WHERE worker_id = ? AND period = ?').get(workerId, period);
        let evaluationId;
        
        if (!existingEvaluation) {
            console.log('Creando evaluación para periodo:', period);
            const result = db.prepare('INSERT INTO evaluations (worker_id, period) VALUES (?, ?)').run(workerId, period);
            evaluationId = result.lastInsertRowid;
        } else {
            evaluationId = existingEvaluation.id;
        }
        
        console.log('ID de evaluación:', evaluationId);
        
        // Registrar el archivo en la base de datos
        const competencyId = 'B';
        const conductId = 'B1';
        const originalName = 'evaluación_desempeño_por_competencias.pdf';
        const fileType = 'application/pdf';
        
        console.log('Registrando archivo en la base de datos...');
        const result = db.prepare(`
            INSERT INTO evidence_files 
            (evaluation_id, competency_id, conduct_id, original_name, file_name, file_type, file_size) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(evaluationId, competencyId, conductId, originalName, fileName, fileType, stats.size);
        
        const fileId = result.lastInsertRowid;
        console.log('✅ Archivo registrado con ID:', fileId);
        
        // Verificar que se registró correctamente
        const registeredFile = db.prepare('SELECT * FROM evidence_files WHERE id = ?').get(fileId);
        console.log('Archivo registrado:', registeredFile);
        
        console.log('🎉 ARCHIVO REGISTRADO EXITOSAMENTE');
        
    } catch (error) {
        console.error('❌ Error registrando archivo:', error);
    }
}

// Ejecutar el script
registerExistingFile(); 