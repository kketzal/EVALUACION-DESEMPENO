const request = require('supertest');
const express = require('express');
const getEvaluationById = jest.fn((req, res) => res.status(200).json({ mocked: true }));

jest.mock('./evalById.route', () => ({
  makeGetEvaluationById: () => getEvaluationById
}));

const { makeEvidenceRoutes } = require('./evidence.route');

describe('Evidence API', () => {
  let app;
  let handlers;
  let mockDb;

  beforeEach(() => {
    jest.resetModules(); // Limpia el cache de módulos
    mockDb = {
      prepare: jest.fn(() => ({
        all: jest.fn(),
        get: jest.fn(),
        run: jest.fn()
      }))
    };
    app = express();
    app.use(express.json());
    handlers = makeEvidenceRoutes(mockDb);
    app.get('/api/evaluations/:id/evidence', handlers.getEvidence);
    app.post('/api/evaluations/:id/evidence', handlers.postEvidence);
    mockDb.prepare.mockClear();
  });

  it('GET /api/evaluations/:id/evidence - éxito', async () => {
    mockDb.prepare.mockReturnValueOnce({ all: () => [{ id: 1, conduct_id: 'A1', evidence_text: 'Texto' }] });
    const res = await request(app).get('/api/evaluations/1/evidence');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, conduct_id: 'A1', evidence_text: 'Texto' }]);
  });

  it('POST /api/evaluations/:id/evidence - éxito', async () => {
    // El handler espera:
    // 1. update evaluations (run)
    // 2. buscar si existe la evidencia (get)
    // 3. si no existe, insert (run)
    // 4. si existe, update (run)
    const runMock = jest.fn();
    const getMock = jest.fn().mockReturnValue(undefined); // Simula que no existe
    // El orden de prepare debe coincidir con el handler
    mockDb.prepare
      .mockReturnValueOnce({ run: runMock }) // update evaluations
      .mockReturnValueOnce({ get: getMock }) // buscar evidencia
      .mockReturnValueOnce({ run: runMock }); // insert evidencia
    const res = await request(app)
      .post('/api/evaluations/1/evidence')
      .send({ conductId: 'A1', evidenceText: 'Texto' });
    expect(res.status).toBe(200);
    expect(runMock).toHaveBeenCalled();
  });

  it('POST /api/evaluations/:id/evidence - error de validación', async () => {
    const res = await request(app)
      .post('/api/evaluations/1/evidence')
      .send({ evidenceText: 'Texto' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/evaluations/:id/evidence - error interno', async () => {
    mockDb.prepare.mockImplementationOnce(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/evaluations/1/evidence');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
}); 