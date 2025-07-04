const sqlite3 = require('sqlite3');
const { db } = require('./database');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getScores(req, res) {
  try {
    const evaluationId = req.params.id;
    const rows = db.prepare('SELECT * FROM scores WHERE evaluation_id = ?').all(evaluationId);
    res.json(rows);
  } catch (error) {
    console.error('Error en GET /api/evaluations/:id/scores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function postScore(req, res) {
  try {
    const evaluationId = req.params.id;
    const { conductId, score } = req.body;
    if (!conductId || score === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const row = db.prepare('SELECT id FROM scores WHERE evaluation_id = ? AND conduct_id = ?').get(evaluationId, conductId);
    if (row) {
      db.prepare('UPDATE scores SET score = ? WHERE id = ?').run(score, row.id);
      res.json({ id: row.id, score });
    } else {
      const result = db.prepare('INSERT INTO scores (evaluation_id, conduct_id, score) VALUES (?, ?, ?)').run(evaluationId, conductId, score);
      res.status(201).json({ id: result.lastInsertRowid, score });
    }
  } catch (error) {
    console.error('Error en POST /api/evaluations/:id/scores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  getScores,
  postScore
}; 