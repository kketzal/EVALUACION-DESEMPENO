const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { db, uploadsDir, evidenceDir } = require('./database');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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
            // Crear nueva evaluación si no existe
            stmt = db.prepare('INSERT INTO evaluations (worker_id, period) VALUES (?, ?)');
            const result = stmt.run(workerId, period);
            evaluation = { id: result.lastInsertRowid, worker_id: workerId, period };
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
            evaluation,
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
        
        // Eliminar registro existente si existe
        let stmt = db.prepare('DELETE FROM criteria_checks WHERE evaluation_id = ? AND conduct_id = ? AND tramo = ? AND criterion_index = ?');
        stmt.run(evaluationId, conductId, tramo, criterionIndex);
        
        // Insertar nuevo registro
        stmt = db.prepare('INSERT INTO criteria_checks (evaluation_id, conduct_id, tramo, criterion_index, is_checked) VALUES (?, ?, ?, ?, ?)');
        stmt.run(evaluationId, conductId, tramo, criterionIndex, isChecked);
        
        res.json({ success: true });
    } catch (error) {
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
            
            const stmt = db.prepare(`
                INSERT INTO evidence_files 
                (evaluation_id, competency_id, conduct_id, original_name, file_name, file_type, file_size) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            
            const result = stmt.run(
                evaluationId,
                competencyId,
                conductId,
                file.originalname,
                file.filename,
                file.mimetype,
                file.size
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
                uploaded_at: new Date().toISOString(),
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
        const stmt = db.prepare('UPDATE evaluations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(evaluationId);
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
        const valid = await bcrypt.compare(password, worker.password_hash);
        if (!valid) {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
            return;
        }
        res.json({ success: true, id: worker.id, name: worker.name, worker_group: worker.worker_group });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 