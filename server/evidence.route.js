const { makeGetEvaluationById } = require('./evalById.route.js');

function makeEvidenceRoutes(db) {
  const getEvaluationById = makeGetEvaluationById(db);

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
      
      const row = db.prepare('SELECT id FROM real_evidence WHERE evaluation_id = ? AND conduct_id = ?').get(evaluationId, conductId);
      if (row) {
        db.prepare('UPDATE real_evidence SET evidence_text = ? WHERE id = ?').run(evidenceText || '', row.id);
      } else {
        db.prepare('INSERT INTO real_evidence (evaluation_id, conduct_id, evidence_text) VALUES (?, ?, ?)').run(evaluationId, conductId, evidenceText || '');
      }
      // Devolver evaluación completa
      await getEvaluationById(req, res);
    } catch (error) {
      console.error('Error en POST /api/evaluations/:id/evidence:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  return {
    getEvidence,
    postEvidence
  };
}

module.exports = { makeEvidenceRoutes }; 