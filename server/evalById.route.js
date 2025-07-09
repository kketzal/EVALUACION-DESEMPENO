const sqlite3 = require('sqlite3');
// const { db } = require('./database');

/**
 * GET /api/evaluations/:id
 * Devuelve la evaluación y todos sus datos relacionados por id numérico
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function makeGetEvaluationById(db) {
  return async function getEvaluationById(req, res) {
    try {
      const id = req.params.id;
      if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      const evaluation = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(id);
      if (!evaluation) {
        return res.status(404).json({ error: 'Evaluación no encontrada' });
      }
      
      console.log('getEvaluationById - Datos de la evaluación desde BD:', {
        id: evaluation.id,
        worker_id: evaluation.worker_id,
        period: evaluation.period,
        version: evaluation.version,
        created_at: evaluation.created_at,
        updated_at: evaluation.updated_at,
        updated_at_type: typeof evaluation.updated_at,
        updated_at_null: evaluation.updated_at === null,
        updated_at_undefined: evaluation.updated_at === undefined
      });
      
      const evaluationId = evaluation.id;
      const criteriaChecks = db.prepare('SELECT * FROM criteria_checks WHERE evaluation_id = ?').all(evaluationId);
      const realEvidence = db.prepare('SELECT * FROM real_evidence WHERE evaluation_id = ?').all(evaluationId);
      const evidenceFiles = db.prepare('SELECT * FROM evidence_files WHERE evaluation_id = ?').all(evaluationId);
      const scores = db.prepare('SELECT * FROM scores WHERE evaluation_id = ?').all(evaluationId);
      
      console.log('getEvaluationById - Datos relacionados:', {
        evaluationId: evaluation.id,
        criteriaChecksCount: criteriaChecks.length,
        realEvidenceCount: realEvidence.length,
        evidenceFilesCount: evidenceFiles.length,
        scoresCount: scores.length,
        hasData: criteriaChecks.length > 0 || realEvidence.length > 0 || evidenceFiles.length > 0
      });
      
      // Mostrar algunos datos de ejemplo para verificar que se están cargando
      if (criteriaChecks.length > 0) {
        console.log('getEvaluationById - Ejemplo de criterios:', criteriaChecks.slice(0, 2));
      }
      if (realEvidence.length > 0) {
        console.log('getEvaluationById - Ejemplo de evidencia:', realEvidence.slice(0, 2));
      }
      if (evidenceFiles.length > 0) {
        console.log('getEvaluationById - Ejemplo de archivos:', evidenceFiles.slice(0, 2));
      }
      
      // Determinar si la evaluación es nueva
      // Una evaluación es nueva si no tiene datos guardados
      // Si tiene datos pero updated_at es NULL, no es nueva (puede ser un problema de migración)
      const hasData = criteriaChecks.length > 0 || realEvidence.length > 0 || evidenceFiles.length > 0;
      const isNew = !hasData && !evaluation.updated_at;
      
      console.log('getEvaluationById - Detección de evaluación nueva:', {
        evaluationId: evaluation.id,
        isNew,
        hasData,
        criteriaChecksCount: criteriaChecks.length,
        realEvidenceCount: realEvidence.length,
        evidenceFilesCount: evidenceFiles.length,
        updatedAt: evaluation.updated_at,
        hasUpdatedAt: !!evaluation.updated_at,
        condition1: criteriaChecks.length === 0,
        condition2: realEvidence.length === 0,
        condition3: evidenceFiles.length === 0,
        condition4: !evaluation.updated_at
      });
      
      console.log('getEvaluationById - Respuesta final:', {
        evaluationId: evaluation.id,
        is_new: isNew,
        updated_at: evaluation.updated_at,
        version: evaluation.version
      });
      
      res.json({
        evaluation: {
          ...evaluation,
          is_new: isNew
        },
        criteriaChecks,
        realEvidence,
        evidenceFiles,
        scores
      });
    } catch (error) {
      console.error('Error en GET /api/evaluations/:id:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}

// Endpoint de prueba para verificar el estado de la base de datos
function makeTestDatabaseState(db) {
  return function testDatabaseState(req, res) {
    try {
      console.log('=== PRUEBA DE ESTADO DE BASE DE DATOS ===');
      
      // Obtener todas las evaluaciones con sus datos relacionados
      const evaluations = db.prepare(`
        SELECT e.id, e.worker_id, e.period, e.version, e.created_at, e.updated_at,
               COUNT(cc.id) as criteria_count,
               COUNT(re.id) as evidence_count,
               COUNT(ef.id) as files_count
        FROM evaluations e 
        LEFT JOIN criteria_checks cc ON e.id = cc.evaluation_id 
        LEFT JOIN real_evidence re ON e.id = re.evaluation_id 
        LEFT JOIN evidence_files ef ON e.id = ef.evaluation_id 
        GROUP BY e.id
        ORDER BY e.id DESC
        LIMIT 5
      `).all();
      
      console.log('Estado de las últimas 5 evaluaciones:');
      evaluations.forEach(evaluation => {
        console.log(`  ID: ${evaluation.id}, Worker: ${evaluation.worker_id}, Period: ${evaluation.period}`);
        console.log(`    Created: ${evaluation.created_at}, Updated: ${evaluation.updated_at}`);
        console.log(`    Data: Criteria=${evaluation.criteria_count}, Evidence=${evaluation.evidence_count}, Files=${evaluation.files_count}`);
        console.log(`    Has data: ${evaluation.criteria_count > 0 || evaluation.evidence_count > 0 || evaluation.files_count > 0}`);
        console.log('');
      });
      
      res.json({
        message: 'Estado de base de datos verificado',
        evaluations: evaluations
      });
    } catch (error) {
      console.error('Error en prueba de base de datos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}

module.exports = {
  makeGetEvaluationById,
  makeTestDatabaseState
}; 