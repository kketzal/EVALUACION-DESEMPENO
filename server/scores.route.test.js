const request = require('supertest');
const express = require('express');
const getEvaluationById = jest.fn((req, res) => res.status(200).json({ mocked: true }));

jest.mock('./evalById.route', () => ({
  makeGetEvaluationById: () => getEvaluationById
}));

// Mock de la base de datos
const mockDb = {
  prepare: jest.fn(() => ({
    all: jest.fn(),
    get: jest.fn(),
    run: jest.fn()
  }))
};

const { makeScoresRoutes } = require('./scores.route');

describe('Scores API', () => {
  let app;
  let handlers;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    handlers = makeScoresRoutes(mockDb);
    app.get('/api/evaluations/:id/scores', handlers.getScores);
    app.post('/api/evaluations/:id/scores', handlers.postScore);
    mockDb.prepare.mockClear();
  });

  it('GET /api/evaluations/:id/scores - éxito', async () => {
    mockDb.prepare.mockReturnValueOnce({ all: () => [{ id: 1, evaluation_id: 1, conduct_id: 'A1', score: 5 }] });
    const res = await request(app).get('/api/evaluations/1/scores');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/evaluations/:id/scores - éxito', async () => {
    mockDb.prepare
      .mockReturnValueOnce({ run: jest.fn() }) // update evaluations
      .mockReturnValueOnce({ get: () => undefined }) // no existe
      .mockReturnValueOnce({ run: jest.fn() }); // insert
    const res = await request(app)
      .post('/api/evaluations/1/scores')
      .send({ conductId: 'A1', score: 5 });
    expect(res.status).toBe(200);
  });

  it('POST /api/evaluations/:id/scores - error de validación', async () => {
    const res = await request(app)
      .post('/api/evaluations/1/scores')
      .send({ score: 5 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/evaluations/:id/scores - error interno', async () => {
    mockDb.prepare.mockImplementationOnce(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/evaluations/1/scores');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
}); 