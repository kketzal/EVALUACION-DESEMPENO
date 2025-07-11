const sqlite3 = require('sqlite3');
const { db } = require('./database');
const { getEvaluationById } = require('./evalById.route.js');

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
    
    // Actualizar updated_at de la evaluación
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
    
    db.prepare('UPDATE evaluations SET updated_at = ? WHERE id = ?').run(spanishTimeFormatted, evaluationId);
    
    const row = db.prepare('SELECT id FROM scores WHERE evaluation_id = ? AND conduct_id = ?').get(evaluationId, conductId);
    if (row) {
      db.prepare('UPDATE scores SET score = ? WHERE id = ?').run(score, row.id);
    } else {
      db.prepare('INSERT INTO scores (evaluation_id, conduct_id, score) VALUES (?, ?, ?)').run(evaluationId, conductId, score);
    }
    // Devolver evaluación completa
    await getEvaluationById(req, res);
  } catch (error) {
    console.error('Error en POST /api/evaluations/:id/scores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

function makeScoresRoutes(db) {
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
  async function postScore(req, res) {
    try {
      const evaluationId = req.params.id;
      const { conductId, score } = req.body;
      if (!conductId || score === undefined) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }
      // Actualizar updated_at de la evaluación
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
      db.prepare('UPDATE evaluations SET updated_at = ? WHERE id = ?').run(spanishTimeFormatted, evaluationId);
      const row = db.prepare('SELECT id FROM scores WHERE evaluation_id = ? AND conduct_id = ?').get(evaluationId, conductId);
      if (row) {
        db.prepare('UPDATE scores SET score = ? WHERE id = ?').run(score, row.id);
      } else {
        db.prepare('INSERT INTO scores (evaluation_id, conduct_id, score) VALUES (?, ?, ?)').run(evaluationId, conductId, score);
      }
      // Devolver evaluación completa
      const { makeGetEvaluationById } = require('./evalById.route.js');
      await makeGetEvaluationById(db)(req, res);
    } catch (error) {
      console.error('Error en POST /api/evaluations/:id/scores:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  return { getScores, postScore };
}

module.exports = { makeScoresRoutes }; 