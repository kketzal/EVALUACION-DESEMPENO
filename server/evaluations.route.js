const sqlite3 = require('sqlite3');
const { db } = require('./database');
const { getEvaluationById } = require('./evalById.route.js');

function makeEvaluationsRoutes(db) {
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
      // Verificar que se guardó correctamente
      const savedEvaluation = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(result.lastInsertRowid);
      res.json(savedEvaluation);
    } catch (error) {
      console.error('Error en POST /api/evaluations:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  return { getEvaluations, postEvaluation };
}

module.exports = { makeEvaluationsRoutes }; 