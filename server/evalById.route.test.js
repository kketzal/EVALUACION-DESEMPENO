const request = require('supertest');
const express = require('express');
const { makeGetEvaluationById, makeTestDatabaseState } = require('./evalById.route');

// Mock de la base de datos y dependencias
jest.mock('./database', () => {
  const mockDb = {
    prepare: jest.fn(() => ({
      get: jest.fn(),
      all: jest.fn()
    }))
  };
  return { db: mockDb };
});

const { db } = require('./database');

describe('GET /api/evaluations/:id', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    const getEvaluationById = makeGetEvaluationById(db);
    app.get('/api/evaluations/:id', getEvaluationById);
    db.prepare.mockClear();
  });

  it('devuelve 400 si el id no es numérico', async () => {
    const res = await request(app).get('/api/evaluations/abc');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'ID inválido');
  });

  it('devuelve 404 si la evaluación no existe', async () => {
    db.prepare.mockReturnValueOnce({ get: () => undefined });
    const res = await request(app).get('/api/evaluations/123');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Evaluación no encontrada');
  });

  it('devuelve la evaluación y sus datos relacionados', async () => {
    db.prepare
      .mockReturnValueOnce({ get: () => ({ id: 1, worker_id: 'w1', period: '2023', version: 1, created_at: '2023-01-01', updated_at: '2023-01-02' }) })
      .mockReturnValueOnce({ all: () => [{ id: 1, conduct_id: 'A1', tramo: 't1', criterion_index: 0, is_checked: true }] })
      .mockReturnValueOnce({ all: () => [{ id: 1, conduct_id: 'A1', evidence_text: 'Evidencia' }] })
      .mockReturnValueOnce({ all: () => [{ id: 1, conduct_id: 'A1', file_name: 'file.pdf' }] })
      .mockReturnValueOnce({ all: () => [{ id: 1, conduct_id: 'A1', t1_score: 5, t2_score: 7, final_score: 8 }] });
    const res = await request(app).get('/api/evaluations/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('evaluation');
    expect(res.body).toHaveProperty('criteriaChecks');
    expect(res.body).toHaveProperty('realEvidence');
    expect(res.body).toHaveProperty('evidenceFiles');
    expect(res.body).toHaveProperty('scores');
    expect(res.body.evaluation).toHaveProperty('id', 1);
    expect(Array.isArray(res.body.criteriaChecks)).toBe(true);
    expect(Array.isArray(res.body.realEvidence)).toBe(true);
    expect(Array.isArray(res.body.evidenceFiles)).toBe(true);
    expect(Array.isArray(res.body.scores)).toBe(true);
  });
});

describe('GET /api/test-db-state', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    const testDatabaseState = makeTestDatabaseState(db);
    app.get('/api/test-db-state', testDatabaseState);
    db.prepare.mockClear();
  });

  it('devuelve el estado de la base de datos', async () => {
    db.prepare.mockReturnValueOnce({ all: () => [
      { id: 42, worker_id: 'w1', period: '2023', version: 1, created_at: '2023-01-01', updated_at: '2023-01-02', criteria_count: 2, evidence_count: 1, files_count: 1 }
    ] });
    const res = await request(app).get('/api/test-db-state');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('evaluations');
    expect(Array.isArray(res.body.evaluations)).toBe(true);
    expect(res.body.evaluations[0]).toHaveProperty('id', 42);
  });
}); 