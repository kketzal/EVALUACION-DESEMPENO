const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { db, uploadsDir, evidenceDir } = require('./database');

// Log de la base de datos que está usando el servidor
if (db && db.name) {
    console.log('[SERVER] Base de datos del servidor:', db.name);
}
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const SESSION_MAX_AGE_DAYS = 7;
const { decodeFileName } = require('./fix_file_names');
const { makeGetEvaluationById, makeTestDatabaseState } = require('./evalById.route.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = {
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
// Servir archivos estáticos con headers de descarga
app.use('/uploads', (req, res, next) => {
    // Si es un archivo de evidencia, configurar headers para descarga
    if (req.path.includes('/evidence/')) {
        res.setHeader('Content-Disposition', 'attachment');
        res.setHeader('Cache-Control', 'no-cache');
    }
    next();
}, express.static(path.join(__dirname, 'uploads')));

const sanitizeUsername = (username) => {
    return (username || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quitar tildes
        .replace(/[^a-zA-Z0-9_\-]/g, '_') // solo letras, números, guion y guion bajo
        .replace(/_+/g, '_') // un solo guion bajo seguido
        .replace(/^_+|_+$/g, '') // sin guion bajo al principio o final
        .toLowerCase();
};

// Configuración de multer para subida de archivos con estructura organizada
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const { evaluationId } = req.params;
        const { competencyId, conductId } = req.body;
        
        // Obtener información de la evaluación para crear la estructura de carpetas
        let evaluation;
        try {
            evaluation = db.prepare('SELECT e.*, w.name as worker_name, e.version FROM evaluations e JOIN workers w ON e.worker_id = w.id WHERE e.id = ?').get(evaluationId);
        } catch (err) {
            console.error('Error obteniendo información de evaluación:', err);
            evaluation = { period: 'unknown', worker_name: 'unknown', version: 1 };
        }
        
        // Crear estructura de carpetas: uploads/evidence/PERIODO/USUARIO/VERSION/COMPETENCIA/CONDUCTA/
        const periodDir = evaluation.period || 'unknown';
        const userDir = sanitizeUsername(evaluation.worker_name || 'unknown');
        const versionDir = `v${evaluation.version || 1}`;
        const competencyDir = competencyId || 'unknown';
        const conductDir = conductId || 'unknown';
        
        const dir = path.join(__dirname, 'uploads', 'evidence', periodDir, userDir, versionDir, competencyDir, conductDir);
        
        // LOG DETALLADO
        console.log('[MULTER DESTINATION]', {
          evaluationId,
          periodDir,
          userDir,
          versionDir,
          competencyDir,
          conductDir,
          finalDir: dir
        });
        
        // Crear directorios si no existen
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log('Directorio creado:', dir);
        }
        
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Limpiar el nombre original para evitar problemas de seguridad
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, safeName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB por archivo
        files: 10 // Máximo 10 archivos por subida
    },
    fileFilter: function (req, file, cb) {
        // Validar tipos de archivo permitidos
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'text/plain' // Temporal para debugging
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
        }
    }
});

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                error: 'Archivo demasiado grande. Máximo 10MB por archivo.' 
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                error: 'Demasiados archivos. Máximo 10 archivos por subida.' 
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                error: 'Campo de archivo inesperado.' 
            });
        }
        return res.status(400).json({ 
            error: `Error de subida: ${error.message}` 
        });
    }
    
    if (error.message && error.message.includes('Tipo de archivo no permitido')) {
        return res.status(400).json({ 
            error: error.message 
        });
    }
    
    next(error);
};

// Función elegante para corregir nombres corruptos de archivos
function fixCorruptedFileName(name) {
  if (!name) return name;
  return decodeFileName(name);
}

function cleanFileName(name) {
  if (!name) return name;
  // Elimina caracteres no válidos para nombres de archivo en la mayoría de sistemas
  return name.replace(/[\\/:*?"<>|]/g, '');
}

// Exportar funciones para pruebas
module.exports = { fixCorruptedFileName, cleanFileName };

// Aplicar middleware de manejo de errores de multer
app.use(handleMulterError);

// Rutas para trabajadores
app.get('/api/workers', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM workers ORDER BY name').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/workers', async (req, res) => {
    try {
        const { id, name, worker_group, password } = req.body;
        if (!worker_group || !['GRUPO 1-2', 'GRUPO 3-4'].includes(worker_group)) {
            res.status(400).json({ error: 'Grupo de trabajador inválido' });
            return;
        }
        let password_hash = null;
        if (password) {
            password_hash = await bcrypt.hash(password, 10);
        }
        const stmt = db.prepare('INSERT INTO workers (id, name, worker_group, password_hash) VALUES (?, ?, ?, ?)');
        stmt.run(id, name, worker_group, password_hash);
        res.json({ id, name, worker_group });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/workers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, worker_group, password } = req.body;
        if (!name && !worker_group && !password) {
            res.status(400).json({ error: 'Faltan campos para actualizar' });
            return;
        }
        let setClauses = [];
        let values = [];
        if (name) {
            setClauses.push('name = ?');
            values.push(name);
        }
        if (worker_group) {
            if (!['GRUPO 1-2', 'GRUPO 3-4'].includes(worker_group)) {
                res.status(400).json({ error: 'Grupo de trabajador inválido' });
                return;
            }
            setClauses.push('worker_group = ?');
            values.push(worker_group);
        }
        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            setClauses.push('password_hash = ?');
            values.push(password_hash);
        }
        values.push(id);
        const stmt = db.prepare(`UPDATE workers SET ${setClauses.join(', ')} WHERE id = ?`);
        const result = stmt.run(...values);
        if (result.changes === 0) {
            res.status(404).json({ error: 'Trabajador no encontrado' });
            return;
        }
        const row = db.prepare('SELECT * FROM workers WHERE id = ?').get(id);
        res.json(row);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar trabajador y todos sus datos asociados
app.delete('/api/workers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Eliminando trabajador:', id);
        
        // Verificar que el trabajador existe
        const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(id);
        if (!worker) {
            return res.status(404).json({ error: 'Trabajador no encontrado' });
        }
        
        // Obtener todas las evaluaciones del trabajador
        const evaluations = db.prepare('SELECT id FROM evaluations WHERE worker_id = ?').all(id);
        console.log(`Encontradas ${evaluations.length} evaluaciones para eliminar`);
        
        // Para cada evaluación, eliminar todos sus datos asociados (criterios, evidencias, archivos, puntuaciones)
        let totalFilesDeleted = 0;
        for (const evaluation of evaluations) {
            // Obtener archivos de la evaluación
            const files = db.prepare('SELECT * FROM evidence_files WHERE evaluation_id = ?').all(evaluation.id);
            
            // Eliminar archivos físicos
            for (const file of files) {
                try {
                    const filePath = path.join(__dirname, 'uploads', 'evidence', file.file_name);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log('Archivo físico eliminado:', filePath);
                        totalFilesDeleted++;
                    }
                } catch (error) {
                    console.error(`Error eliminando archivo físico ${file.id}:`, error);
                }
            }
            
            // Eliminar datos de la evaluación
            db.prepare('DELETE FROM criteria_checks WHERE evaluation_id = ?').run(evaluation.id);
            db.prepare('DELETE FROM real_evidence WHERE evaluation_id = ?').run(evaluation.id);
            db.prepare('DELETE FROM evidence_files WHERE evaluation_id = ?').run(evaluation.id);
            db.prepare('DELETE FROM scores WHERE evaluation_id = ?').run(evaluation.id);
        }
        
        // Eliminar evaluaciones del trabajador
        const evaluationsResult = db.prepare('DELETE FROM evaluations WHERE worker_id = ?').run(id);
        
        // Eliminar sesiones del trabajador
        const sessionsResult = db.prepare('DELETE FROM sessions WHERE worker_id = ?').run(id);
        
        // Eliminar el trabajador
        const workerResult = db.prepare('DELETE FROM workers WHERE id = ?').run(id);
        
        console.log('Eliminación completada:', {
            evaluationsDeleted: evaluationsResult.changes,
            sessionsDeleted: sessionsResult.changes,
            workerDeleted: workerResult.changes,
            physicalFilesDeleted: totalFilesDeleted
        });
        
        res.json({ 
            success: true, 
            message: `Trabajador eliminado exitosamente. ${evaluationsResult.changes} evaluaciones eliminadas, ${totalFilesDeleted} archivos físicos eliminados.`
        });
    } catch (error) {
        console.error('Error eliminando trabajador:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rutas para evaluaciones
app.get('/api/evaluations/:workerId/:period', (req, res) => {
    try {
        const { workerId, period } = req.params;
        
        // Obtener evaluación
        let stmt = db.prepare('SELECT * FROM evaluations WHERE worker_id = ? AND period = ?');
        let evaluation = stmt.get(workerId, period);
        
        if (!evaluation) {
            // NO crear automáticamente - devolver error 404
            return res.status(404).json({ 
                error: 'No existe evaluación para este trabajador y periodo',
                workerId,
                period
            });
        }
        
        // Obtener criterios
        stmt = db.prepare('SELECT * FROM criteria_checks WHERE evaluation_id = ?');
        const criteriaChecks = stmt.all(evaluation.id);
        
        // Obtener evidencia real
        stmt = db.prepare('SELECT * FROM real_evidence WHERE evaluation_id = ?');
        const realEvidence = stmt.all(evaluation.id);
        
        // Obtener archivos
        stmt = db.prepare('SELECT * FROM evidence_files WHERE evaluation_id = ?');
        const evidenceFiles = stmt.all(evaluation.id);
        console.log('Archivos encontrados en BD para evaluación', evaluation.id, ':', evidenceFiles);
        
        // Agregar URL a los archivos con la nueva estructura de carpetas
        const evidenceFilesWithUrl = evidenceFiles.map(file => {
            return {
                ...file,
                original_name: cleanFileName(file.original_name), // Limpiar nombre original si está corrupto
                name: cleanFileName(file.original_name), // Agregar campo name para compatibilidad con el frontend
                url: `/api/files/${file.file_name}`
            };
        });
        
        // Obtener puntuaciones
        stmt = db.prepare('SELECT * FROM scores WHERE evaluation_id = ?');
        const scores = stmt.all(evaluation.id);
        
        res.json({
            evaluation: {
                ...evaluation,
                useT1SevenPoints: evaluation.useT1SevenPoints === undefined ? 1 : evaluation.useT1SevenPoints,
                autoSave: evaluation.autoSave === undefined ? 1 : evaluation.autoSave
            },
            criteriaChecks,
            realEvidence,
            evidenceFiles: evidenceFilesWithUrl,
            scores
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint de prueba
app.get('/api/test', (req, res) => {
    console.log('[TEST] Endpoint de prueba llamado');
    res.json({ message: 'Servidor funcionando correctamente', timestamp: new Date().toISOString() });
});

// Endpoint de prueba para criterios
app.post('/api/test-criteria', (req, res) => {
    try {
        console.log('[TEST CRITERIA] Iniciando prueba de guardado...');
        
        // Insertar un criterio de prueba directamente
        const stmt = db.prepare('INSERT INTO criteria_checks (evaluation_id, conduct_id, tramo, criterion_index, is_checked) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(83, 'TEST', 't1', 999, 1);
        
        console.log('[TEST CRITERIA] Resultado de inserción:', result);
        
        // Verificar que se insertó
        const verify = db.prepare('SELECT * FROM criteria_checks WHERE evaluation_id = 83 AND conduct_id = ?').get('TEST');
        console.log('[TEST CRITERIA] Verificación:', verify ? 'Exitoso' : 'Fallido');
        
        res.json({ success: true, insertedId: result.lastInsertRowid, verified: !!verify });
    } catch (error) {
        console.error('[TEST CRITERIA ERROR]', error);
        res.status(500).json({ error: error.message });
    }
});

// Guardar criterios
app.post('/api/evaluations/:evaluationId/criteria', (req, res) => {
    try {
        const { evaluationId } = req.params;
        const { conductId, tramo, criterionIndex, isChecked } = req.body;

        console.log('[CRITERIA SAVE] Iniciando guardado...', { evaluationId, conductId, tramo, criterionIndex, isChecked });

        // Verificar que la evaluación existe
        const evaluation = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(evaluationId);
        console.log('[CRITERIA SAVE] Evaluación encontrada:', evaluation ? 'Sí' : 'No');

        // Eliminar registro existente si existe
        try {
            console.log('[CRITERIA DELETE] Intentando eliminar registro existente...');
            let stmt = db.prepare('DELETE FROM criteria_checks WHERE evaluation_id = ? AND conduct_id = ? AND tramo = ? AND criterion_index = ?');
            const delResult = stmt.run(evaluationId, conductId, tramo, criterionIndex);
            console.log('[CRITERIA DELETE] Resultado:', delResult);
        } catch (err) {
            console.error('[CRITERIA DELETE ERROR]', err);
        }

        // Insertar nuevo registro
        try {
            console.log('[CRITERIA INSERT] Intentando insertar nuevo registro...');
            let stmt = db.prepare('INSERT INTO criteria_checks (evaluation_id, conduct_id, tramo, criterion_index, is_checked) VALUES (?, ?, ?, ?, ?)');
            const insResult = stmt.run(
                evaluationId,
                conductId,
                tramo,
                criterionIndex,
                isChecked ? 1 : 0
            );
            console.log('[CRITERIA INSERT] Resultado:', insResult);
            
            // Verificar que realmente se insertó
            const verifyStmt = db.prepare('SELECT * FROM criteria_checks WHERE evaluation_id = ? AND conduct_id = ? AND tramo = ? AND criterion_index = ?');
            const inserted = verifyStmt.get(evaluationId, conductId, tramo, criterionIndex);
            console.log('[CRITERIA INSERT] Verificación de inserción:', inserted ? 'Exitoso' : 'Fallido');
            
        } catch (err) {
            console.error('[CRITERIA INSERT ERROR]', err);
        }

        console.log('[CRITERIA SAVE] Enviando respuesta de éxito');
        res.json({ success: true });
    } catch (error) {
        console.error('[CRITERIA ERROR]', error);
        res.status(500).json({ error: error.message });
    }
});

// Guardar evidencia real
app.post('/api/evaluations/:evaluationId/evidence', (req, res) => {
    try {
        const { evaluationId } = req.params;
        const { conductId, evidenceText } = req.body;
        
        // Eliminar registro existente si existe
        let stmt = db.prepare('DELETE FROM real_evidence WHERE evaluation_id = ? AND conduct_id = ?');
        stmt.run(evaluationId, conductId);
        
        // Insertar nuevo registro
        stmt = db.prepare('INSERT INTO real_evidence (evaluation_id, conduct_id, evidence_text) VALUES (?, ?, ?)');
        stmt.run(evaluationId, conductId, evidenceText);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Subir archivos de evidencia
app.post('/api/evaluations/:evaluationId/files', upload.array('files', 10), async (req, res) => {
    const { evaluationId } = req.params;
    const { competencyId, conductId } = req.body;
    const files = req.files;
    
    console.log('Subiendo archivos:', {
        evaluationId,
        competencyId,
        conductId,
        fileCount: files ? files.length : 0
    });
    
    if (!files || files.length === 0) {
        console.log('No se recibieron archivos');
        return res.status(400).json({ error: 'No se recibieron archivos' });
    }
    
    // Obtener información de la evaluación para construir las URLs
    let evaluation;
    try {
        evaluation = db.prepare('SELECT e.*, w.name as worker_name FROM evaluations e JOIN workers w ON e.worker_id = w.id WHERE e.id = ?').get(evaluationId);
    } catch (err) {
        console.error('Error obteniendo información de evaluación:', err);
        evaluation = { period: 'unknown', worker_name: 'unknown' };
    }
    
    const uploadedFiles = [];
    const filesToRollback = []; // Archivos que se subieron físicamente pero pueden necesitar rollback
    
    try {
        for (const file of files) {
            // Corregir nombre si está corrupto
            const fixedOriginalName = fixCorruptedFileName(file.originalname);
            const normalizedOriginalName = fixedOriginalName.normalize('NFC');
            
            console.log('Procesando archivo:', {
                originalname: file.originalname,
                normalizedOriginalName,
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path
            });
            
            const now = new Date();
            const spanishTimeFormatted = now.toLocaleString("en-US", {
                timeZone: "Europe/Madrid",
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(',', '').replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
            
            // Obtener la versión de la evaluación
            const versionStmt = db.prepare('SELECT version FROM evaluations WHERE id = ?');
            const versionResult = versionStmt.get(evaluationId);
            const version = versionResult ? versionResult.version : 1;
            
            // Construir la ruta relativa completa para guardar en la BD
            const periodDir = evaluation.period || 'unknown';
            const userDir = sanitizeUsername(evaluation.worker_name || 'unknown');
            const versionDir = `v${version}`; // Agregar directorio de versión
            const competencyDir = competencyId || 'unknown';
            const conductDir = conductId || 'unknown';
            const relativeFilePath = path.join(periodDir, userDir, versionDir, competencyDir, conductDir, file.filename);
            
            // Construir la URL con la nueva estructura de carpetas
            const fileUrl = `/api/files/${relativeFilePath}`;

            // Intentar insertar en la base de datos
            console.log('Intentando insertar en BD con datos:', {
                evaluationId,
                competencyId,
                conductId,
                originalName: file.originalname,
                fileName: relativeFilePath,
                fileType: file.mimetype,
                fileSize: file.size,
                uploadedAt: spanishTimeFormatted
            });

            const stmt = db.prepare(`
                INSERT INTO evidence_files 
                (evaluation_id, competency_id, conduct_id, original_name, file_name, file_type, file_size, uploaded_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                evaluationId,
                competencyId,
                conductId,
                normalizedOriginalName,
                relativeFilePath,
                file.mimetype,
                file.size,
                spanishTimeFormatted
            );

            console.log('Archivo guardado en BD con ID:', result.lastInsertRowid);

            // Verificar que realmente se insertó
            const verifyStmt = db.prepare('SELECT * FROM evidence_files WHERE id = ?');
            const insertedFile = verifyStmt.get(result.lastInsertRowid);
            console.log('Verificación de inserción:', insertedFile);

            // Agregar a la lista de archivos procesados exitosamente
            uploadedFiles.push({
                id: result.lastInsertRowid,
                evaluation_id: evaluationId,
                competency_id: competencyId,
                conduct_id: conductId,
                original_name: normalizedOriginalName,
                name: normalizedOriginalName, // Para frontend
                file_name: relativeFilePath,
                file_type: file.mimetype,
                file_size: file.size,
                uploaded_at: spanishTimeFormatted,
                url: fileUrl
            });
            
            // Agregar a la lista de archivos que podrían necesitar rollback
            filesToRollback.push({
                file: file,
                periodDir: periodDir,
                userDir: userDir,
                versionDir: versionDir,
                competencyDir: competencyDir,
                conductDir: conductDir
            });
        }
        
        console.log('Archivos subidos exitosamente:', uploadedFiles.length);
        // Devolver evaluación completa
        req.params.id = evaluationId; // Para compatibilidad con getEvaluationById
        const getEvaluationById = makeGetEvaluationById(db);
        await getEvaluationById(req, res);
        return;
        
    } catch (error) {
        console.error('Error uploading files:', error);
        
        // ROLLBACK: Eliminar archivos físicos que se subieron pero falló la inserción en BD
        console.log('Iniciando rollback de archivos físicos...');
        let rollbackErrors = [];
        
        for (const fileInfo of filesToRollback) {
            try {
                const filePath = path.join(__dirname, 'uploads', 'evidence', 
                    fileInfo.periodDir, fileInfo.userDir, fileInfo.versionDir, fileInfo.competencyDir, fileInfo.conductDir, 
                    fileInfo.file.filename);
                
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Archivo eliminado en rollback:', filePath);
                    
                    // Verificar si el directorio está vacío y eliminarlo
                    const dirPath = path.dirname(filePath);
                    try {
                        const filesInDir = fs.readdirSync(dirPath);
                        if (filesInDir.length === 0) {
                            fs.rmdirSync(dirPath);
                            console.log('Directorio vacío eliminado en rollback:', dirPath);
                        }
                    } catch (err) {
                        console.log('No se pudo verificar/eliminar directorio en rollback:', err.message);
                    }
                } else {
                    console.log('Archivo no encontrado para rollback:', filePath);
                }
            } catch (rollbackError) {
                console.error('Error durante rollback de archivo:', rollbackError);
                rollbackErrors.push({
                    file: fileInfo.file.filename,
                    error: rollbackError.message
                });
            }
        }
        
        if (rollbackErrors.length > 0) {
            console.error('Errores durante rollback:', rollbackErrors);
        }
        
        res.status(500).json({ 
            error: 'Error interno del servidor al subir archivos',
            rollbackErrors: rollbackErrors.length > 0 ? rollbackErrors : undefined
        });
    }
});

// Servir archivo de evidencia
app.get('/api/files/:filePath(*)', (req, res) => {
    try {
        const { filePath } = req.params;
        console.log('Solicitando archivo:', filePath);
        
        // Buscar el archivo en la base de datos para obtener la información completa
        const stmt = db.prepare(`
            SELECT ef.*, e.period, w.name as worker_name
            FROM evidence_files ef 
            JOIN evaluations e ON ef.evaluation_id = e.id 
            JOIN workers w ON e.worker_id = w.id
            WHERE ef.file_name = ?
        `);
        const file = stmt.get(filePath);
        
        if (!file) {
            console.log('Archivo no encontrado en la base de datos:', filePath);
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        
        // Construir la ruta completa del archivo
        // El file_name ya contiene la ruta completa desde la raíz de evidence
        const fullFilePath = path.join(__dirname, 'uploads', 'evidence', file.file_name);
        
        console.log('Ruta completa del archivo:', fullFilePath);
        
        if (!fs.existsSync(fullFilePath)) {
            console.log('Archivo físico no encontrado:', fullFilePath);
            return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
        }
        
        // Determinar si el archivo se puede visualizar en el navegador
        const canViewInBrowser = file.file_type && (
            file.file_type.startsWith('image/') || 
            file.file_type === 'application/pdf' ||
            file.file_type === 'text/plain' ||
            file.file_type === 'text/html'
        );

        // Limpiar el nombre original para los headers (solo si está corrupto)
        const cleanOriginalName = cleanFileName(file.original_name);
        
        // Configurar headers según el tipo de archivo
        if (canViewInBrowser) {
            // Para archivos visualizables, permitir que se abran en el navegador
            res.setHeader('Content-Type', file.file_type);
            res.setHeader('Content-Disposition', `inline; filename="${cleanOriginalName}"`);
        } else {
            // Para archivos no visualizables, forzar descarga
            res.setHeader('Content-Disposition', `attachment; filename="${cleanOriginalName}"`);
            res.setHeader('Content-Type', file.file_type || 'application/octet-stream');
        }
        res.setHeader('Cache-Control', 'no-cache');
        
        // Enviar el archivo
        res.sendFile(fullFilePath);
        
    } catch (error) {
        console.error('Error al servir archivo:', error);
        res.status(500).json({ error: error.message });
    }
});

// Función utilitaria para eliminar carpetas vacías recursivamente hasta un directorio raíz
function removeEmptyDirsRecursively(dirPath, stopAt) {
    if (!fs.existsSync(dirPath)) return;
    if (dirPath === stopAt) return;
    try {
        const files = fs.readdirSync(dirPath);
        if (files.length === 0) {
            fs.rmdirSync(dirPath);
            console.log('Directorio vacío eliminado:', dirPath);
            // Subir un nivel y repetir
            removeEmptyDirsRecursively(path.dirname(dirPath), stopAt);
        } else {
            console.log(`Directorio no vacío (${files.length} elementos):`, dirPath);
        }
    } catch (err) {
        console.log('No se pudo eliminar directorio:', dirPath, err.message);
    }
}

// Eliminar archivo de evidencia
app.delete('/api/files/:fileId', (req, res) => {
    try {
        const { fileId } = req.params;
        console.log('=== ELIMINACIÓN DE ARCHIVO INICIADA ===');
        console.log('Eliminando archivo con ID:', fileId);
        console.log('Headers de la petición:', req.headers);
        
        // Obtener información del archivo
        let stmt = db.prepare(`
            SELECT ef.*, e.period, w.name as worker_name
            FROM evidence_files ef 
            JOIN evaluations e ON ef.evaluation_id = e.id 
            JOIN workers w ON e.worker_id = w.id
            WHERE ef.id = ?
        `);
        const file = stmt.get(fileId);
        
        console.log('Archivo encontrado en BD:', file);
        
        if (!file) {
            console.log('Archivo no encontrado en la base de datos');
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        
        // Construir la ruta del archivo físico
        // El file_name ya contiene la ruta completa desde la raíz de evidence
        const filePath = path.join(__dirname, 'uploads', 'evidence', file.file_name);
        
        console.log('Intentando eliminar archivo físico:', filePath);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Archivo físico eliminado exitosamente');
            // Eliminar directorios vacíos recursivamente hasta /uploads/evidence
            const conductDirPath = path.dirname(filePath);
            const evidenceRoot = path.join(__dirname, 'uploads', 'evidence');
            removeEmptyDirsRecursively(conductDirPath, evidenceRoot);
        } else {
            console.log('Archivo físico no encontrado en:', filePath);
        }
        
        // Eliminar registro de la base de datos
        stmt = db.prepare('DELETE FROM evidence_files WHERE id = ?');
        const result = stmt.run(fileId);
        console.log('Registro eliminado de BD, filas afectadas:', result.changes);
        
        console.log('=== ELIMINACIÓN DE ARCHIVO COMPLETADA ===');
        res.json({ success: true, message: 'Archivo eliminado exitosamente' });
    } catch (error) {
        console.error('=== ERROR EN ELIMINACIÓN DE ARCHIVO ===');
        console.error('Error al eliminar archivo:', error);
        res.status(500).json({ error: error.message });
    }
});

// Guardar puntuaciones
app.post('/api/evaluations/:evaluationId/scores', (req, res) => {
    try {
        const { evaluationId } = req.params;
        const { conductId, t1Score, t2Score, finalScore } = req.body;
        
        // Eliminar registro existente si existe
        let stmt = db.prepare('DELETE FROM scores WHERE evaluation_id = ? AND conduct_id = ?');
        stmt.run(evaluationId, conductId);
        
        // Insertar nuevo registro
        stmt = db.prepare('INSERT INTO scores (evaluation_id, conduct_id, t1_score, t2_score, final_score) VALUES (?, ?, ?, ?, ?)');
        stmt.run(evaluationId, conductId, t1Score, t2Score, finalScore);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar timestamp de evaluación
app.put('/api/evaluations/:evaluationId', (req, res) => {
    try {
        const { evaluationId } = req.params;
        const now = new Date();
        const spanishTimeFormatted = now.toLocaleString("en-US", {
            timeZone: "Europe/Madrid",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '').replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
        const stmt = db.prepare('UPDATE evaluations SET updated_at = ? WHERE id = ?');
        stmt.run(spanishTimeFormatted, evaluationId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Autenticación de usuario
app.post('/api/workers/authenticate', async (req, res) => {
    try {
        const { id, password } = req.body;
        if (!id || !password) {
            res.status(400).json({ error: 'Faltan credenciales' });
            return;
        }
        const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(id);
        if (!worker || !worker.password_hash) {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
            return;
        }
        // Obtener timeout global
        let timeout = 60;
        try {
            const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('session_timeout_minutes');
            timeout = row ? parseInt(row.value, 10) : 60;
        } catch {}
        // Generar token de sesión
        const token = uuidv4();
        const now = Date.now();
        db.prepare('INSERT INTO sessions (token, worker_id, last_activity, created_at) VALUES (?, ?, ?, ?)')
          .run(token, worker.id, now, now);
        res.json({ success: true, id: worker.id, name: worker.name, worker_group: worker.worker_group, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Validar sesión por token
app.get('/api/session/validate', (req, res) => {
    try {
        console.log('Authorization header:', req.headers['authorization']);
        let token = req.headers['authorization'] || req.query.token;
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7);
        }
        if (!token) {
            return res.status(401).json({ error: 'Sesión inválida' });
        }
        const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
        if (!session) {
            return res.status(401).json({ error: 'Sesión inválida' });
        }
        // Obtener timeout global
        let timeout = 60;
        try {
            const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('session_timeout_minutes');
            timeout = row ? parseInt(row.value, 10) : 60;
        } catch {}
        const now = Date.now();
        // Expiración por inactividad
        if (now - session.last_activity > timeout * 60 * 1000) {
            db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
            return res.status(401).json({ error: 'Sesión expirada por inactividad' });
        }
        // Expiración máxima absoluta (7 días)
        if (now - session.created_at > SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
            db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
            return res.status(401).json({ error: 'Sesión expirada (máx. 7 días)' });
        }
        // Actualizar última actividad
        db.prepare('UPDATE sessions SET last_activity = ? WHERE token = ?').run(now, token);
        // Obtener datos del usuario
        const worker = db.prepare('SELECT id, name, worker_group FROM workers WHERE id = ?').get(session.worker_id);
        if (!worker) {
            db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        res.json({ success: true, ...worker });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para obtener el timeout global de sesión
app.get('/api/settings/session-timeout', (req, res) => {
    try {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('session_timeout_minutes');
        const value = row ? parseInt(row.value, 10) : 60;
        res.json({ timeout: value });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para actualizar el timeout global de sesión
app.post('/api/settings/session-timeout', (req, res) => {
    try {
        const { timeout } = req.body;
        if (!timeout || isNaN(timeout) || timeout < 1 || timeout > 1440) {
            return res.status(400).json({ error: 'Valor de timeout inválido' });
        }
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
          .run('session_timeout_minutes', String(timeout));
        res.json({ success: true, timeout });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Logout de sesión
app.post('/api/session/logout', (req, res) => {
    let token = req.headers['authorization'] || req.body?.token;
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
    }
    if (!token) {
        return res.status(400).json({ error: 'Token requerido' });
    }
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    res.json({ success: true });
});

// Exportar la base de datos
app.get('/api/export-db', (req, res) => {
  res.download(path.join(__dirname, 'uploads', 'database.sqlite'), 'evaluacion.sqlite');
});

// Exportar ZIP completo con BD y archivos de evidencia
app.get('/api/export-zip', (req, res) => {
  const archiver = require('archiver');
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  res.attachment(`evaluacion-completa-${new Date().toISOString().slice(0, 10)}.zip`);
  archive.pipe(res);

  // Agregar la base de datos
  archive.file(path.join(__dirname, 'uploads', 'database.sqlite'), { name: 'database.sqlite' });

  // Agregar todos los archivos de evidencia
  const evidenceDir = path.join(__dirname, 'uploads', 'evidence');
  if (fs.existsSync(evidenceDir)) {
    archive.directory(evidenceDir, 'evidence');
  }

  archive.finalize();
});

// Importar la base de datos
app.post('/api/import-db', upload.single('file'), (req, res) => {
  fs.copyFileSync(req.file.path, path.join(__dirname, 'uploads', 'database.sqlite'));
  res.sendStatus(200);
});

// Importar ZIP completo
app.post('/api/import-zip', upload.single('file'), (req, res) => {
  const archiver = require('archiver');
  const extract = require('extract-zip');
  const zipPath = req.file.path;
  const extractPath = path.join(__dirname, 'uploads');
  
  extract(zipPath, { dir: extractPath })
    .then(() => {
      // Verificar que se extrajo la base de datos
      const dbPath = path.join(extractPath, 'database.sqlite');
      if (!fs.existsSync(dbPath)) {
        return res.status(400).json({ error: 'El ZIP no contiene una base de datos válida' });
      }
      
      // Mover la base de datos a la ubicación correcta si es necesario
      const targetDbPath = path.join(__dirname, 'uploads', 'database.sqlite');
      if (dbPath !== targetDbPath) {
        fs.copyFileSync(dbPath, targetDbPath);
        fs.unlinkSync(dbPath);
      }
      
      // Verificar que se extrajo la carpeta de evidencia
      const evidencePath = path.join(extractPath, 'evidence');
      if (fs.existsSync(evidencePath)) {
        // Mover archivos de evidencia a la ubicación correcta
        const targetEvidencePath = path.join(__dirname, 'uploads', 'evidence');
        if (fs.existsSync(targetEvidencePath)) {
          fs.rmSync(targetEvidencePath, { recursive: true, force: true });
        }
        fs.renameSync(evidencePath, targetEvidencePath);
      }
      
      res.sendStatus(200);
    })
    .catch((err) => {
      console.error('Error al extraer ZIP:', err);
      res.status(500).json({ error: 'Error al procesar el archivo ZIP' });
    });
});

// Guardar configuración de evaluación (useT1SevenPoints y autoSave)
app.patch('/api/evaluations/:evaluationId/settings', async (req, res) => {
    try {
        const { evaluationId } = req.params;
        const { useT1SevenPoints, autoSave } = req.body;
        
        let setClauses = [];
        let values = [];
        
        if (typeof useT1SevenPoints !== 'undefined') {
            setClauses.push('useT1SevenPoints = ?');
            values.push(useT1SevenPoints ? 1 : 0);
        }
        
        if (typeof autoSave !== 'undefined') {
            setClauses.push('autoSave = ?');
            values.push(autoSave ? 1 : 0);
        }
        
        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }
        
        values.push(evaluationId);
        const stmt = db.prepare(`UPDATE evaluations SET ${setClauses.join(', ')} WHERE id = ?`);
        stmt.run(...values);
        // Devolver evaluación completa
        req.params.id = evaluationId;
        const getEvaluationById = makeGetEvaluationById(db);
        await getEvaluationById(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener archivos en disco para verificar estructura
app.get('/api/evidence-files-on-disk', (req, res) => {
    try {
        const evidencePath = path.join(__dirname, 'uploads', 'evidence');
        const files = [];
        
        if (fs.existsSync(evidencePath)) {
            const scanDirectory = (dirPath, relativePath = '') => {
                const items = fs.readdirSync(dirPath);
                
                for (const item of items) {
                    const fullPath = path.join(dirPath, item);
                    const relativeItemPath = path.join(relativePath, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        scanDirectory(fullPath, relativeItemPath);
                    } else {
                        files.push({
                            name: item,
                            path: relativeItemPath,
                            fullPath: fullPath,
                            size: stat.size,
                            modified: stat.mtime
                        });
                    }
                }
            };
            
            scanDirectory(evidencePath);
        }
        
        res.json({ files: files.map(f => f.path) });
    } catch (error) {
        console.error('Error scanning evidence files:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar archivo específico del disco
app.delete('/api/evidence-files-on-disk', (req, res) => {
    try {
        const { file } = req.query;
        if (!file) {
            return res.status(400).json({ error: 'Nombre de archivo requerido' });
        }
        
        const filePath = path.join(__dirname, 'uploads', 'evidence', file);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Archivo eliminado del disco:', filePath);
            res.json({ success: true, message: 'Archivo eliminado del disco' });
        } else {
            res.status(404).json({ error: 'Archivo no encontrado en disco' });
        }
    } catch (error) {
        console.error('Error eliminando archivo del disco:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar evaluación y todos sus datos asociados
app.delete('/api/evaluations/:evaluationId', (req, res) => {
  try {
    const { evaluationId } = req.params;
    console.log('Eliminando evaluación:', evaluationId);
    
    // Obtener todos los archivos de la evaluación antes de eliminarlos
    const files = db.prepare('SELECT * FROM evidence_files WHERE evaluation_id = ?').all(evaluationId);
    console.log(`Encontrados ${files.length} archivos para eliminar`);
    
    // Eliminar archivos físicos
    let deletedFilesCount = 0;
    let deletedDirPaths = new Set(); // Usar Set para evitar duplicados
    
    for (const file of files) {
      try {
        // Construir la ruta del archivo físico
        const filePath = path.join(__dirname, 'uploads', 'evidence', file.file_name);
        const conductDirPath = path.dirname(filePath);
        
        // Eliminar archivo físico si existe
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Archivo físico eliminado:', filePath);
          deletedFilesCount++;
          deletedDirPaths.add(conductDirPath);
        } else {
          console.log('Archivo físico no encontrado:', filePath);
        }
      } catch (error) {
        console.error(`Error eliminando archivo físico ${file.id}:`, error);
      }
    }
    
    // Limpiar directorios vacíos recursivamente desde todos los directorios de archivos eliminados
    const evidenceRoot = path.join(__dirname, 'uploads', 'evidence');
    for (const dirPath of deletedDirPaths) {
      console.log('Limpiando directorio vacío:', dirPath);
      removeEmptyDirsRecursively(dirPath, evidenceRoot);
    }
    
    // Eliminar criterios, evidencias, archivos y puntuaciones asociadas
    const criteriaResult = db.prepare('DELETE FROM criteria_checks WHERE evaluation_id = ?').run(evaluationId);
    const evidenceResult = db.prepare('DELETE FROM real_evidence WHERE evaluation_id = ?').run(evaluationId);
    const filesResult = db.prepare('DELETE FROM evidence_files WHERE evaluation_id = ?').run(evaluationId);
    const scoresResult = db.prepare('DELETE FROM scores WHERE evaluation_id = ?').run(evaluationId);
    
    // Eliminar la evaluación
    const evaluationResult = db.prepare('DELETE FROM evaluations WHERE id = ?').run(evaluationId);
    
    console.log('Eliminación completada:', {
      criteriaDeleted: criteriaResult.changes,
      evidenceDeleted: evidenceResult.changes,
      filesDeleted: filesResult.changes,
      scoresDeleted: scoresResult.changes,
      evaluationDeleted: evaluationResult.changes,
      physicalFilesDeleted: deletedFilesCount
    });
    
    res.json({ 
      success: true, 
      message: `Evaluación eliminada exitosamente. ${deletedFilesCount} archivos físicos eliminados.`
    });
  } catch (error) {
    console.error('Error eliminando evaluación:', error);
    res.status(500).json({ error: error.message });
  }
});

const { makeEvaluationsRoutes } = require('./evaluations.route.js');
const { makeCriteriaRoutes } = require('./criteria.route.js');
const { makeEvidenceRoutes } = require('./evidence.route.js');
const { makeFilesRoutes } = require('./files.route.js');
const { makeScoresRoutes } = require('./scores.route.js');

// Evaluaciones (listado y creación)
app.get('/api/evaluations', makeEvaluationsRoutes(db).getEvaluations);
app.post('/api/evaluations', makeEvaluationsRoutes(db).postEvaluation);

// --- ENDPOINTS MIGRADOS DESDE src/app/api/evaluations/[id] ---

const criteriaHandlers = makeCriteriaRoutes(db);
const evidenceHandlers = makeEvidenceRoutes(db);
const filesHandlers = makeFilesRoutes(db);
const evalByIdHandler = {
  getEvaluationById: makeGetEvaluationById(db),
  testDatabaseState: makeTestDatabaseState(db)
};
const scoresHandlers = makeScoresRoutes(db);

// Criterios
app.get('/api/evaluations/:id/criteria', criteriaHandlers.getCriteria);
app.post('/api/evaluations/:id/criteria', criteriaHandlers.postCriteria);

// Evidencias
app.get('/api/evaluations/:id/evidence', evidenceHandlers.getEvidence);
app.post('/api/evaluations/:id/evidence', evidenceHandlers.postEvidence);

// Archivos (solo GET, POST/DELETE se gestionan en otro lado)
app.get('/api/evaluations/:id/files', filesHandlers.getFiles);

// Puntuaciones
app.get('/api/evaluations/:id/scores', scoresHandlers.getScores);
app.post('/api/evaluations/:id/scores', scoresHandlers.postScore);

// Evaluación por id (histórico exacto)
app.get('/api/evaluations/:id', evalByIdHandler.getEvaluationById);

// Endpoint de prueba para verificar el estado de la base de datos
app.get('/api/test/database-state', evalByIdHandler.testDatabaseState);

// Endpoint de debugging para verificar la tabla evidence_files
app.get('/api/debug/evidence-files', (req, res) => {
    try {
        const allFiles = db.prepare('SELECT * FROM evidence_files ORDER BY id DESC LIMIT 20').all();
        console.log('Todos los archivos en evidence_files:', allFiles);
        res.json({
            totalFiles: allFiles.length,
            files: allFiles
        });
    } catch (error) {
        console.error('Error en debug evidence-files:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar todos los archivos de una conducta específica
app.delete('/api/evaluations/:evaluationId/conducts/:conductId/files', (req, res) => {
    try {
        const { evaluationId, conductId } = req.params;
        console.log('Eliminando todos los archivos de conducta:', { evaluationId, conductId });
        
        // Obtener todos los archivos de la conducta
        let stmt = db.prepare(`
            SELECT ef.*, e.period, e.version, w.name as worker_name
            FROM evidence_files ef 
            JOIN evaluations e ON ef.evaluation_id = e.id 
            JOIN workers w ON e.worker_id = w.id
            WHERE ef.evaluation_id = ? AND ef.conduct_id = ?
        `);
        const files = stmt.all(evaluationId, conductId);
        
        console.log(`Encontrados ${files.length} archivos para eliminar`);
        
        if (files.length === 0) {
            return res.json({ success: true, message: 'No hay archivos para eliminar', deletedCount: 0 });
        }
        
        let deletedCount = 0;
        let errors = [];
        let deletedDirPaths = new Set(); // Usar Set para evitar duplicados
        
        for (const file of files) {
            try {
                // Construir la ruta del archivo físico
                // El file_name ya contiene la ruta completa desde la raíz de evidence
                const filePath = path.join(__dirname, 'uploads', 'evidence', file.file_name);
                const conductDirPath = path.dirname(filePath);
                
                // Eliminar archivo físico si existe
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Archivo físico eliminado:', filePath);
                    deletedDirPaths.add(conductDirPath);
                }
                
                // Eliminar registro de la base de datos
                const deleteStmt = db.prepare('DELETE FROM evidence_files WHERE id = ?');
                const result = deleteStmt.run(file.id);
                if (result.changes > 0) {
                    deletedCount++;
                    console.log(`Archivo ${file.id} eliminado de BD`);
                }
            } catch (error) {
                console.error(`Error eliminando archivo ${file.id}:`, error);
                errors.push({ fileId: file.id, error: error.message });
            }
        }
        
        // Limpiar directorios vacíos recursivamente desde todos los directorios de archivos eliminados
        const evidenceRoot = path.join(__dirname, 'uploads', 'evidence');
        for (const dirPath of deletedDirPaths) {
            console.log('Limpiando directorio vacío:', dirPath);
            removeEmptyDirsRecursively(dirPath, evidenceRoot);
        }
        console.log(`Eliminación completada: ${deletedCount} archivos eliminados, ${errors.length} errores`);
        res.json({ 
            success: true, 
            message: `${deletedCount} archivo${deletedCount !== 1 ? 's' : ''} eliminado${deletedCount !== 1 ? 's' : ''} exitosamente`,
            deletedCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error al eliminar archivos de conducta:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener archivos huérfanos en el sistema de archivos
app.get('/api/orphan-files', (req, res) => {
    try {
        const evidenceDir = path.join(__dirname, 'uploads', 'evidence');
        const orphanFiles = [];
        const orphanDirs = [];
        
        if (!fs.existsSync(evidenceDir)) {
            return res.json({ orphanFiles: [], orphanDirs: [] });
        }
        
        // Obtener todos los archivos registrados en la BD
        const stmt = db.prepare('SELECT file_name FROM evidence_files');
        const dbFiles = stmt.all().map(row => row.file_name);
        
        // Función recursiva para escanear directorios
        function scanDirectory(dirPath, relativePath = '') {
            if (!fs.existsSync(dirPath)) return;
            
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const relativeItemPath = path.join(relativePath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Es un directorio
                    const subItems = fs.readdirSync(fullPath);
                    if (subItems.length === 0) {
                        // Directorio vacío
                        orphanDirs.push({
                            path: relativeItemPath,
                            fullPath: fullPath,
                            type: 'empty'
                        });
                    } else {
                        // Directorio con contenido, escanear recursivamente
                        scanDirectory(fullPath, relativeItemPath);
                    }
                } else {
                    // Es un archivo
                    // Construir la ruta completa que debería estar en la BD
                    const expectedDbPath = relativeItemPath;
                    
                    if (!dbFiles.includes(expectedDbPath)) {
                        // Archivo no está en la BD
                        orphanFiles.push({
                            name: item,
                            path: relativeItemPath,
                            fullPath: fullPath,
                            size: stat.size,
                            modified: stat.mtime
                        });
                    }
                }
            }
        }
        
        // Escanear desde la raíz de evidence
        scanDirectory(evidenceDir);
        
        console.log(`Encontrados ${orphanFiles.length} archivos huérfanos y ${orphanDirs.length} carpetas vacías`);
        
        res.json({
            orphanFiles,
            orphanDirs
        });
        
    } catch (error) {
        console.error('Error al escanear archivos huérfanos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar archivo huérfano
app.delete('/api/orphan-files/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const { path: filePath } = req.query;
        
        if (!filePath) {
            return res.status(400).json({ error: 'Se requiere la ruta del archivo' });
        }
        
        const fullPath = path.join(__dirname, 'uploads', 'evidence', filePath);
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        
        // Verificar que el archivo no esté en la BD
        const stmt = db.prepare('SELECT COUNT(*) as count FROM evidence_files WHERE file_name = ?');
        const result = stmt.get(filename);
        
        if (result.count > 0) {
            return res.status(400).json({ error: 'El archivo está registrado en la base de datos' });
        }
        
        // Eliminar archivo
        fs.unlinkSync(fullPath);
        
        // Limpiar directorios vacíos recursivamente
        const evidenceRoot = path.join(__dirname, 'uploads', 'evidence');
        removeEmptyDirsRecursively(path.dirname(fullPath), evidenceRoot);
        
        res.json({ success: true, message: 'Archivo huérfano eliminado correctamente' });
        
    } catch (error) {
        console.error('Error al eliminar archivo huérfano:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar carpeta huérfana
app.delete('/api/orphan-dirs/:dirPath', (req, res) => {
    try {
        const { dirPath } = req.params;
        const fullPath = path.join(__dirname, 'uploads', 'evidence', dirPath);
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'Carpeta no encontrada' });
        }
        
        const stat = fs.statSync(fullPath);
        if (!stat.isDirectory()) {
            return res.status(400).json({ error: 'No es un directorio' });
        }
        
        const items = fs.readdirSync(fullPath);
        if (items.length > 0) {
            return res.status(400).json({ error: 'La carpeta no está vacía' });
        }
        
        // Eliminar carpeta vacía
        fs.rmdirSync(fullPath);
        
        // Limpiar directorios vacíos recursivamente hacia arriba
        const evidenceRoot = path.join(__dirname, 'uploads', 'evidence');
        removeEmptyDirsRecursively(path.dirname(fullPath), evidenceRoot);
        
        res.json({ success: true, message: 'Carpeta huérfana eliminada correctamente' });
        
    } catch (error) {
        console.error('Error al eliminar carpeta huérfana:', error);
        res.status(500).json({ error: error.message });
    }
});

// Registrar archivos huérfanos en la base de datos
app.post('/api/register-orphan-files', (req, res) => {
    try {
        const { registerOrphanFiles } = require('./register_orphan_files');
        
        // Ejecutar el registro
        const result = registerOrphanFiles();
        
        res.json({ 
            success: true, 
            message: 'Archivos huérfanos registrados correctamente',
            result
        });
        
    } catch (error) {
        console.error('Error al registrar archivos huérfanos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Corregir nombres originales de archivos
app.post('/api/fix-original-names', (req, res) => {
    try {
        const { fixOriginalNames } = require('./fix_original_names');
        
        // Ejecutar la corrección
        const result = fixOriginalNames();
        
        res.json({ 
            success: true, 
            message: 'Nombres originales corregidos correctamente',
            result
        });
        
    } catch (error) {
        console.error('Error al corregir nombres originales:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener configuración global de evaluación
app.get('/api/settings/evaluation', (req, res) => {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('useT1SevenPoints');
    const useT1SevenPoints = row ? row.value === 'true' || row.value === '1' : true;
    res.json({ useT1SevenPoints });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar configuración global de evaluación
app.post('/api/settings/evaluation', (req, res) => {
  try {
    const { useT1SevenPoints } = req.body;
    if (typeof useT1SevenPoints === 'undefined') {
      return res.status(400).json({ error: 'Falta el campo useT1SevenPoints' });
    }
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run('useT1SevenPoints', useT1SevenPoints ? '1' : '0');
    res.json({ success: true, useT1SevenPoints });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nueva versión de evaluación existente
app.post('/api/evaluations/:evaluationId/version', (req, res) => {
    try {
        const { evaluationId } = req.params;
        
        // Obtener la evaluación original
        const originalEvaluation = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(evaluationId);
        if (!originalEvaluation) {
            return res.status(404).json({ error: 'Evaluación no encontrada' });
        }
        
        // Obtener la versión máxima para este trabajador y periodo
        const row = db.prepare('SELECT MAX(version) as maxVersion FROM evaluations WHERE worker_id = ? AND period = ?').get(originalEvaluation.worker_id, originalEvaluation.period);
        const maxVersion = row && row.maxVersion ? row.maxVersion : 0;
        const newVersion = maxVersion + 1;
        
        const now = new Date();
        const spanishTimeFormatted = now.toLocaleString("en-US", {
            timeZone: "Europe/Madrid",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '').replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
        
        // Crear nueva evaluación con versión incrementada
        const result = db.prepare('INSERT INTO evaluations (worker_id, period, version, created_at, updated_at, useT1SevenPoints, autoSave) VALUES (?, ?, ?, ?, NULL, ?, ?)').run(
            originalEvaluation.worker_id,
            originalEvaluation.period,
            newVersion,
            spanishTimeFormatted,
            originalEvaluation.useT1SevenPoints,
            originalEvaluation.autoSave
        );
        
        const newEvaluationId = result.lastInsertRowid;
        
        // Copiar criterios de la evaluación original
        const criteriaChecks = db.prepare('SELECT * FROM criteria_checks WHERE evaluation_id = ?').all(evaluationId);
        for (const check of criteriaChecks) {
            db.prepare('INSERT INTO criteria_checks (evaluation_id, conduct_id, tramo, criterion_index, is_checked) VALUES (?, ?, ?, ?, ?)').run(
                newEvaluationId,
                check.conduct_id,
                check.tramo,
                check.criterion_index,
                check.is_checked
            );
        }
        
        // Copiar evidencia real
        const realEvidence = db.prepare('SELECT * FROM real_evidence WHERE evaluation_id = ?').all(evaluationId);
        for (const evidence of realEvidence) {
            db.prepare('INSERT INTO real_evidence (evaluation_id, conduct_id, evidence_text) VALUES (?, ?, ?)').run(
                newEvaluationId,
                evidence.conduct_id,
                evidence.evidence_text
            );
        }
        
        // Copiar puntuaciones
        const scores = db.prepare('SELECT * FROM scores WHERE evaluation_id = ?').all(evaluationId);
        for (const score of scores) {
            db.prepare('INSERT INTO scores (evaluation_id, conduct_id, t1_score, t2_score, final_score) VALUES (?, ?, ?, ?, ?)').run(
                newEvaluationId,
                score.conduct_id,
                score.t1_score,
                score.t2_score,
                score.final_score
            );
        }
        
        // Copiar archivos de evidencia
        const evidenceFiles = db.prepare('SELECT * FROM evidence_files WHERE evaluation_id = ?').all(evaluationId);
        for (const file of evidenceFiles) {
            // Obtener información de la evaluación original para construir la nueva ruta
            const originalEval = db.prepare('SELECT period, worker_id FROM evaluations WHERE id = ?').get(evaluationId);
            const worker = db.prepare('SELECT name FROM workers WHERE id = ?').get(originalEval.worker_id);
            
            // Construir la nueva ruta con la versión actualizada
            const pathParts = file.file_name.split(path.sep);
            const newPathParts = [...pathParts];
            
            // Buscar y reemplazar el directorio de versión
            for (let i = 0; i < newPathParts.length; i++) {
                if (newPathParts[i].startsWith('v') && /^v\d+$/.test(newPathParts[i])) {
                    newPathParts[i] = `v${newVersion}`;
                    break;
                }
            }
            
            const newFilePath = newPathParts.join(path.sep);
            
            // Copiar archivo físico si existe
            const originalFilePath = path.join(__dirname, 'uploads', 'evidence', file.file_name);
            const newPhysicalPath = path.join(__dirname, 'uploads', 'evidence', newFilePath);
            
            if (fs.existsSync(originalFilePath)) {
                // Crear directorios si no existen
                const newDir = path.dirname(newPhysicalPath);
                if (!fs.existsSync(newDir)) {
                    fs.mkdirSync(newDir, { recursive: true });
                }
                
                // Copiar archivo
                fs.copyFileSync(originalFilePath, newPhysicalPath);
                console.log(`Archivo copiado: ${originalFilePath} → ${newPhysicalPath}`);
            }
            
            // Insertar en BD con la nueva ruta
            db.prepare('INSERT INTO evidence_files (evaluation_id, conduct_id, file_name, original_name, file_type, file_size, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
                newEvaluationId,
                file.conduct_id,
                newFilePath,
                file.original_name,
                file.file_type,
                file.file_size,
                file.uploaded_at
            );
        }
        
        console.log('Nueva versión creada:', {
            originalId: evaluationId,
            newId: newEvaluationId,
            version: newVersion,
            worker_id: originalEvaluation.worker_id,
            period: originalEvaluation.period
        });
        
        res.status(201).json({
            id: newEvaluationId,
            worker_id: originalEvaluation.worker_id,
            period: originalEvaluation.period,
            version: newVersion,
            created_at: spanishTimeFormatted,
            updated_at: null,
            is_new_version: true
        });
    } catch (error) {
        console.error('Error al crear nueva versión:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Solo iniciar el servidor si este archivo se ejecuta directamente
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
} 