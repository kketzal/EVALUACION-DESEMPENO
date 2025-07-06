const sqlite3 = require('sqlite3');
const { db } = require('./database');

// GET /api/evaluations
async function getEvaluations(req, res) {
  try {
    const rows = db.prepare(`
      SELECT e.*, w.name as worker_name
      FROM evaluations e 
      JOIN workers w ON e.worker_id = w.id 
      ORDER BY e.worker_id, e.period, e.version DESC, e.created_at DESC
    `).all();
    res.json(rows);
  } catch (error) {
    console.error('Error en GET /api/evaluations:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /api/evaluations
async function postEvaluation(req, res) {
  try {
    const { workerId, period } = req.body;
    if (!workerId || !period) {
      return res.status(400).json({ error: 'workerId y period son requeridos' });
    }
    const row = db.prepare('SELECT MAX(version) as maxVersion FROM evaluations WHERE worker_id = ? AND period = ?').get(workerId, period);
    const maxVersion = row && row.maxVersion ? row.maxVersion : 0;
    const newVersion = (maxVersion || 0) + 1;
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
    
    // Para evaluaciones nuevas, updated_at debe ser null inicialmente
    const result = db.prepare('INSERT INTO evaluations (worker_id, period, version, created_at, updated_at) VALUES (?, ?, ?, ?, NULL)').run(workerId, period, newVersion, spanishTimeFormatted);
    
    console.log('postEvaluation - Evaluación creada:', {
      id: result.lastInsertRowid,
      worker_id: workerId,
      period,
      version: newVersion,
      created_at: spanishTimeFormatted,
      updated_at: null
    });
    
    // Verificar que se guardó correctamente
    const savedEvaluation = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(result.lastInsertRowid);
    console.log('postEvaluation - Verificación de guardado:', {
      id: savedEvaluation.id,
      updated_at: savedEvaluation.updated_at,
      updated_at_type: typeof savedEvaluation.updated_at,
      updated_at_null: savedEvaluation.updated_at === null
    });
    
    res.status(201).json({
      id: result.lastInsertRowid,
      worker_id: workerId,
      period,
      version: newVersion,
      created_at: spanishTimeFormatted,
      updated_at: null,
      is_new: true
    });
  } catch (error) {
    console.error('Error en POST /api/evaluations:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  getEvaluations,
  postEvaluation
}; 