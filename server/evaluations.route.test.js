const request = require('supertest');
const express = require('express');
const { makeEvaluationsRoutes } = require('./evaluations.route');

// Mock de la base de datos
const mockDb = {
  prepare: jest.fn(() => ({
    all: jest.fn(),
    get: jest.fn(),
    run: jest.fn(() => ({ lastInsertRowid: 1 }))
  }))
};

describe('Evaluations API', () => {
  let app;
  let handlers;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    handlers = makeEvaluationsRoutes(mockDb);
    app.get('/api/evaluations', handlers.getEvaluations);
    app.post('/api/evaluations', handlers.postEvaluation);
    mockDb.prepare.mockClear();
  });

  it('GET /api/evaluations - éxito', async () => {
    mockDb.prepare.mockReturnValueOnce({ all: () => [{ id: 1, worker_id: 'w1', period: '2023', version: 1 }] });
    const res = await request(app).get('/api/evaluations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/evaluations - éxito', async () => {
    mockDb.prepare
      .mockReturnValueOnce({ get: () => ({ maxVersion: 1 }) }) // para version
      .mockReturnValueOnce({ run: () => ({ lastInsertRowid: 1 }) }) // para insert
      .mockReturnValueOnce({ get: () => ({ id: 1, worker_id: 'w1', period: '2023', version: 2 }) }); // para select final
    const res = await request(app)
      .post('/api/evaluations')
      .send({ workerId: 'w1', period: '2023' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
  });

  it('POST /api/evaluations - error de validación', async () => {
    const res = await request(app)
      .post('/api/evaluations')
      .send({ workerId: 'w1' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/evaluations - error interno', async () => {
    mockDb.prepare.mockImplementationOnce(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/evaluations');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
}); 