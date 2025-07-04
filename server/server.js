const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { db, uploadsDir, evidenceDir } = require('./database');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const SESSION_MAX_AGE_DAYS = 7;

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, 'uploads/evidence');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

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
        
        // Agregar URL a los archivos
        const evidenceFilesWithUrl = evidenceFiles.map(file => ({
            ...file,
            url: `http://localhost:3001/uploads/evidence/${file.file_name}`
        }));
        
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

// Guardar criterios
app.post('/api/evaluations/:evaluationId/criteria', (req, res) => {
    try {
        const { evaluationId } = req.params;
        const { conductId, tramo, criterionIndex, isChecked } = req.body;

        console.log('[CRITERIA SAVE]', { evaluationId, conductId, tramo, criterionIndex, isChecked });

        // Eliminar registro existente si existe
        try {
            let stmt = db.prepare('DELETE FROM criteria_checks WHERE evaluation_id = ? AND conduct_id = ? AND tramo = ? AND criterion_index = ?');
            const delResult = stmt.run(evaluationId, conductId, tramo, criterionIndex);
            console.log('[CRITERIA DELETE]', delResult);
        } catch (err) {
            console.error('[CRITERIA DELETE ERROR]', err);
        }

        // Insertar nuevo registro
        try {
            let stmt = db.prepare('INSERT INTO criteria_checks (evaluation_id, conduct_id, tramo, criterion_index, is_checked) VALUES (?, ?, ?, ?, ?)');
            const insResult = stmt.run(
                evaluationId,
                conductId,
                tramo,
                criterionIndex,
                isChecked ? 1 : 0
            );
            console.log('[CRITERIA INSERT]', insResult);
        } catch (err) {
            console.error('[CRITERIA INSERT ERROR]', err);
        }

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
app.post('/api/evaluations/:evaluationId/files', upload.array('files', 10), (req, res) => {
    try {
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
        
        const uploadedFiles = [];
        
        for (const file of files) {
            console.log('Procesando archivo:', {
                originalname: file.originalname,
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size
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
            const stmt = db.prepare(`
                INSERT INTO evidence_files 
                (evaluation_id, competency_id, conduct_id, original_name, file_name, file_type, file_size, uploaded_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            const result = stmt.run(
                evaluationId,
                competencyId,
                conductId,
                file.originalname,
                file.filename,
                file.mimetype,
                file.size,
                spanishTimeFormatted
            );
            
            console.log('Archivo guardado en BD con ID:', result.lastInsertRowid);
            
            uploadedFiles.push({
                id: result.lastInsertRowid,
                evaluation_id: evaluationId,
                competency_id: competencyId,
                conduct_id: conductId,
                original_name: file.originalname,
                file_name: file.filename,
                file_type: file.mimetype,
                file_size: file.size,
                uploaded_at: spanishTimeFormatted,
                url: `http://localhost:3001/uploads/evidence/${file.filename}`
            });
        }
        
        console.log('Archivos subidos exitosamente:', uploadedFiles.length);
        res.json(uploadedFiles);
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar archivo de evidencia
app.delete('/api/files/:fileId', (req, res) => {
    try {
        const { fileId } = req.params;
        console.log('Eliminando archivo con ID:', fileId);
        
        // Obtener información del archivo
        let stmt = db.prepare('SELECT * FROM evidence_files WHERE id = ?');
        const file = stmt.get(fileId);
        
        console.log('Archivo encontrado en BD:', file);
        
        if (!file) {
            console.log('Archivo no encontrado en la base de datos');
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        
        // Eliminar archivo físico
        const filePath = path.join(evidenceDir, file.file_name);
        console.log('Intentando eliminar archivo físico:', filePath);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Archivo físico eliminado exitosamente');
        } else {
            console.log('Archivo físico no encontrado en:', filePath);
        }
        
        // Eliminar registro de la base de datos
        stmt = db.prepare('DELETE FROM evidence_files WHERE id = ?');
        const result = stmt.run(fileId);
        console.log('Registro eliminado de BD, filas afectadas:', result.changes);
        
        res.json({ success: true, message: 'Archivo eliminado exitosamente' });
    } catch (error) {
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
app.patch('/api/evaluations/:evaluationId/settings', (req, res) => {
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
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para listar archivos realmente presentes en disco
app.get('/api/evidence-files-on-disk', (req, res) => {
  const evidencePath = path.join(__dirname, 'uploads/evidence');
  fs.readdir(evidencePath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo leer la carpeta de evidencia.' });
    }
    res.json({ files });
  });
});

// Endpoint para eliminar un archivo físico huérfano
app.delete('/api/evidence-files-on-disk', (req, res) => {
  const fileName = req.query.file;
  if (!fileName) return res.status(400).json({ error: 'Falta el parámetro file' });
  const filePath = path.join(__dirname, 'uploads/evidence', fileName);
  fs.unlink(filePath, err => {
    if (err) {
      return res.status(404).json({ error: 'No se pudo eliminar el archivo (¿ya no existe?)' });
    }
    res.json({ success: true });
  });
});

// Eliminar evaluación y todos sus datos asociados
app.delete('/api/evaluations/:evaluationId', (req, res) => {
  try {
    const { evaluationId } = req.params;
    // Eliminar criterios, evidencias, archivos y puntuaciones asociadas
    db.prepare('DELETE FROM criteria_checks WHERE evaluation_id = ?').run(evaluationId);
    db.prepare('DELETE FROM real_evidence WHERE evaluation_id = ?').run(evaluationId);
    db.prepare('DELETE FROM evidence_files WHERE evaluation_id = ?').run(evaluationId);
    db.prepare('DELETE FROM scores WHERE evaluation_id = ?').run(evaluationId);
    // Eliminar la evaluación
    db.prepare('DELETE FROM evaluations WHERE id = ?').run(evaluationId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const evaluationsHandlers = require('./evaluations.route.js');

// Evaluaciones (listado y creación)
app.get('/api/evaluations', evaluationsHandlers.getEvaluations);
app.post('/api/evaluations', evaluationsHandlers.postEvaluation);

// --- ENDPOINTS MIGRADOS DESDE src/app/api/evaluations/[id] ---
const criteriaHandlers = require('./criteria.route.js');
const evidenceHandlers = require('./evidence.route.js');
const filesHandlers = require('./files.route.js');
const scoresHandlers = require('./scores.route.js');
const evalByIdHandler = require('./evalById.route.js');

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

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 