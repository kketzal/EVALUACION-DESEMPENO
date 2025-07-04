const sqlite3 = require('sqlite3');
const { db } = require('./database');

// GET /api/evaluations/:id/criteria
async function getCriteria(req, res) {
  try {
    const evaluationId = req.params.id;
    const rows = db.prepare('SELECT * FROM criteria_checks WHERE evaluation_id = ?').all(evaluationId);
    res.json(rows);
  } catch (error) {
    console.error('Error en GET /api/evaluations/:id/criteria:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /api/evaluations/:id/criteria
async function postCriteria(req, res) {
  try {
    const evaluationId = req.params.id;
    const { conductId, tramo, criterionIndex, isChecked } = req.body;
    if (!conductId || !tramo || criterionIndex === undefined || isChecked === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    // Verificar si ya existe un registro
    const row = db.prepare('SELECT id FROM criteria_checks WHERE evaluation_id = ? AND conduct_id = ? AND tramo = ? AND criterion_index = ?').get(evaluationId, conductId, tramo, criterionIndex);
    if (row) {
      // Actualizar registro existente
      db.prepare('UPDATE criteria_checks SET is_checked = ? WHERE id = ?').run(isChecked ? 1 : 0, row.id);
      res.json({ id: row.id, isChecked });
    } else {
      // Crear nuevo registro
      const result = db.prepare('INSERT INTO criteria_checks (evaluation_id, conduct_id, tramo, criterion_index, is_checked) VALUES (?, ?, ?, ?, ?)').run(evaluationId, conductId, tramo, criterionIndex, isChecked ? 1 : 0);
      res.status(201).json({ id: result.lastInsertRowid, isChecked });
    }
  } catch (error) {
    console.error('Error en POST /api/evaluations/:id/criteria:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  getCriteria,
  postCriteria
}; 