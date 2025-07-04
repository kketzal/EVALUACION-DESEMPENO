const sqlite3 = require('sqlite3');
const { db } = require('./database');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getEvidence(req, res) {
  try {
    const evaluationId = req.params.id;
    const rows = db.prepare('SELECT * FROM real_evidence WHERE evaluation_id = ?').all(evaluationId);
    res.json(rows);
  } catch (error) {
    console.error('Error en GET /api/evaluations/:id/evidence:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function postEvidence(req, res) {
  try {
    const evaluationId = req.params.id;
    const { conductId, evidenceText } = req.body;
    if (!conductId) {
      return res.status(400).json({ error: 'conductId es requerido' });
    }
    const row = db.prepare('SELECT id FROM real_evidence WHERE evaluation_id = ? AND conduct_id = ?').get(evaluationId, conductId);
    if (row) {
      db.prepare('UPDATE real_evidence SET evidence_text = ? WHERE id = ?').run(evidenceText || '', row.id);
      res.json({ id: row.id, evidenceText });
    } else {
      const result = db.prepare('INSERT INTO real_evidence (evaluation_id, conduct_id, evidence_text) VALUES (?, ?, ?)').run(evaluationId, conductId, evidenceText || '');
      res.status(201).json({ id: result.lastInsertRowid, evidenceText });
    }
  } catch (error) {
    console.error('Error en POST /api/evaluations/:id/evidence:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  getEvidence,
  postEvidence
}; 