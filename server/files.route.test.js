const request = require('supertest');
const express = require('express');
const { makeFilesRoutes } = require('./files.route');

// Mock de la base de datos
const mockDb = {
  prepare: jest.fn(() => ({
    all: jest.fn()
  }))
};

describe('Files API', () => {
  let app;
  let handlers;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    handlers = makeFilesRoutes(mockDb);
    app.get('/api/evaluations/:id/files', handlers.getFiles);
    mockDb.prepare.mockClear();
  });

  it('GET /api/evaluations/:id/files - éxito', async () => {
    mockDb.prepare.mockReturnValueOnce({ all: () => [{ id: 1, original_name: 'file.pdf', file_type: 'application/pdf', file_size: 123, file_name: 'file.pdf' }] });
    const res = await request(app).get('/api/evaluations/1/files');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/evaluations/:id/files - error interno', async () => {
    mockDb.prepare.mockImplementationOnce(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/evaluations/1/files');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
}); 