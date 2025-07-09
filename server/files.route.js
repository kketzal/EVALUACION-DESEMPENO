const sqlite3 = require('sqlite3');
// const { db } = require('./database');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function makeFilesRoutes(db) {
  async function getFiles(req, res) {
    try {
      const evaluationId = req.params.id;
      const competencyId = req.query.competencyId;
      const conductId = req.query.conductId;
      let query = 'SELECT * FROM evidence_files WHERE evaluation_id = ?';
      const queryParams = [evaluationId];
      if (competencyId) {
        query += ' AND competency_id = ?';
        queryParams.push(competencyId);
      }
      if (conductId) {
        query += ' AND conduct_id = ?';
        queryParams.push(conductId);
      }
      query += ' ORDER BY uploaded_at DESC';
      const rows = db.prepare(query).all(...queryParams);
      const transformedFiles = rows.map(row => ({
        id: row.id.toString(),
        name: row.original_name,
        type: row.file_type,
        size: row.file_size,
        url: `/api/files/${row.file_name}`
      }));
      res.json(transformedFiles);
    } catch (error) {
      console.error('Error en GET /api/evaluations/:id/files:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  return { getFiles };
}

module.exports = { makeFilesRoutes }; 