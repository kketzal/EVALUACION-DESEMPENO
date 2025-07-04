const sqlite3 = require('sqlite3');
const { db } = require('./database');

/**
 * GET /api/evaluations/:id
 * Devuelve la evaluación y todos sus datos relacionados por id numérico
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getEvaluationById(req, res) {
  try {
    const id = req.params.id;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const evaluation = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(id);
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }
    const evaluationId = evaluation.id;
    const criteriaChecks = db.prepare('SELECT * FROM criteria_checks WHERE evaluation_id = ?').all(evaluationId);
    const realEvidence = db.prepare('SELECT * FROM real_evidence WHERE evaluation_id = ?').all(evaluationId);
    const evidenceFiles = db.prepare('SELECT * FROM evidence_files WHERE evaluation_id = ?').all(evaluationId);
    const scores = db.prepare('SELECT * FROM scores WHERE evaluation_id = ?').all(evaluationId);
    res.json({
      evaluation,
      criteriaChecks,
      realEvidence,
      evidenceFiles,
      scores
    });
  } catch (error) {
    console.error('Error en GET /api/evaluations/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  getEvaluationById
}; 