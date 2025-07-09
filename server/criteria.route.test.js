const request = require('supertest');
const express = require('express');
const getEvaluationById = jest.fn((req, res) => res.status(200).json({ mocked: true }));

jest.mock('./evalById.route', () => ({
  makeGetEvaluationById: () => getEvaluationById
}));

const { makeCriteriaRoutes } = require('./criteria.route');

// Mock de la base de datos
const mockDb = {
  prepare: jest.fn(() => ({
    all: jest.fn(),
    get: jest.fn(),
    run: jest.fn()
  }))
};

describe('Criteria API', () => {
  let app;
  let handlers;
  let mockDb;

  beforeEach(() => {
    jest.resetModules();
    mockDb = {
      prepare: jest.fn(() => ({
        all: jest.fn(),
        get: jest.fn(),
        run: jest.fn()
      }))
    };
    app = express();
    app.use(express.json());
    handlers = makeCriteriaRoutes(mockDb);
    app.get('/api/evaluations/:id/criteria', handlers.getCriteria);
    app.post('/api/evaluations/:id/criteria', handlers.postCriteria);
    mockDb.prepare.mockClear();
  });

  it('GET /api/evaluations/:id/criteria - éxito', async () => {
    mockDb.prepare.mockReturnValueOnce({ all: () => [{ id: 1, evaluation_id: 1, conduct_id: 'A1', tramo: 't1', criterion_index: 0, is_checked: 1 }] });
    const res = await request(app).get('/api/evaluations/1/criteria');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/evaluations/:id/criteria - éxito', async () => {
    mockDb.prepare
      .mockReturnValueOnce({ run: jest.fn() }) // update evaluations
      .mockReturnValueOnce({ get: () => undefined }) // no existe
      .mockReturnValueOnce({ run: jest.fn() }); // insert
    const res = await request(app)
      .post('/api/evaluations/1/criteria')
      .send({ conductId: 'A1', tramo: 't1', criterionIndex: 0, isChecked: true });
    expect(res.status).toBe(200);
  });

  it('POST /api/evaluations/:id/criteria - error de validación', async () => {
    const res = await request(app)
      .post('/api/evaluations/1/criteria')
      .send({ tramo: 't1', criterionIndex: 0, isChecked: true });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/evaluations/:id/criteria - error interno', async () => {
    mockDb.prepare.mockImplementationOnce(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/evaluations/1/criteria');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
}); 