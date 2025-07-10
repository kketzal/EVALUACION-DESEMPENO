const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

describe('Database Module', () => {
  let db;
  let testDbPath;

  beforeAll(() => {
    // Crear una base de datos temporal en memoria para las pruebas
    testDbPath = ':memory:';
    db = new Database(testDbPath);
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
  });

  beforeEach(() => {
    // Limpiar la base de datos antes de cada prueba
    // Usar DROP TABLE IF EXISTS para evitar errores si las tablas no existen
    try {
      db.exec('DELETE FROM evidence_files');
      db.exec('DELETE FROM real_evidence');
      db.exec('DELETE FROM criteria_checks');
      db.exec('DELETE FROM scores');
      db.exec('DELETE FROM evaluations');
      db.exec('DELETE FROM workers');
      db.exec('DELETE FROM sessions');
      db.exec('DELETE FROM settings');
    } catch (error) {
      // Las tablas no existen aún, no es un problema
    }
  });

  describe('Estructura de la base de datos', () => {
    it('crea las tablas correctamente', () => {
      // Crear las tablas
      db.exec(`
        CREATE TABLE IF NOT EXISTS workers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          worker_group TEXT NOT NULL,
          password_hash TEXT
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS evaluations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          worker_id TEXT NOT NULL,
          period TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          useT1SevenPoints BOOLEAN DEFAULT 1,
          autoSave BOOLEAN DEFAULT 1,
          FOREIGN KEY (worker_id) REFERENCES workers (id)
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS criteria_checks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          evaluation_id INTEGER NOT NULL,
          conduct_id TEXT NOT NULL,
          tramo TEXT NOT NULL,
          criterion_index INTEGER NOT NULL,
          is_checked BOOLEAN NOT NULL,
          FOREIGN KEY (evaluation_id) REFERENCES evaluations (id)
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS real_evidence (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          evaluation_id INTEGER NOT NULL,
          conduct_id TEXT NOT NULL,
          evidence_text TEXT,
          FOREIGN KEY (evaluation_id) REFERENCES evaluations (id)
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS evidence_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          evaluation_id INTEGER NOT NULL,
          competency_id TEXT NOT NULL,
          conduct_id TEXT NOT NULL,
          original_name TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (evaluation_id) REFERENCES evaluations (id)
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          evaluation_id INTEGER NOT NULL,
          conduct_id TEXT NOT NULL,
          t1_score REAL,
          t2_score REAL,
          final_score REAL NOT NULL,
          FOREIGN KEY (evaluation_id) REFERENCES evaluations (id)
        )
      `);

      // Verificar que las tablas existen
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const tableNames = tables.map(t => t.name);
      
      expect(tableNames).toContain('workers');
      expect(tableNames).toContain('evaluations');
      expect(tableNames).toContain('criteria_checks');
      expect(tableNames).toContain('real_evidence');
      expect(tableNames).toContain('evidence_files');
      expect(tableNames).toContain('scores');
    });
  });

  describe('Operaciones de trabajadores', () => {
    beforeEach(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS workers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          worker_group TEXT NOT NULL,
          password_hash TEXT
        )
      `);
    });

    it('inserta y obtiene trabajadores correctamente', () => {
      // Insertar trabajador
      const stmt = db.prepare('INSERT INTO workers (id, name, worker_group) VALUES (?, ?, ?)');
      const result = stmt.run('worker1', 'Juan Pérez', 'GRUPO 1-2');
      
      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBeDefined();

      // Obtener trabajador
      const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get('worker1');
      
      expect(worker).toBeDefined();
      expect(worker.name).toBe('Juan Pérez');
      expect(worker.worker_group).toBe('GRUPO 1-2');
    });

    it('obtiene todos los trabajadores', () => {
      // Insertar múltiples trabajadores
      const stmt = db.prepare('INSERT INTO workers (id, name, worker_group) VALUES (?, ?, ?)');
      stmt.run('worker1', 'Juan Pérez', 'GRUPO 1-2');
      stmt.run('worker2', 'María García', 'GRUPO 3-4');

      // Obtener todos
      const workers = db.prepare('SELECT * FROM workers ORDER BY name').all();
      
      expect(workers).toHaveLength(2);
      expect(workers[0].name).toBe('Juan Pérez');
      expect(workers[1].name).toBe('María García');
    });
  });

  describe('Operaciones de evaluaciones', () => {
    beforeEach(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS workers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          worker_group TEXT NOT NULL,
          password_hash TEXT
        )
      `);
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS evaluations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          worker_id TEXT NOT NULL,
          period TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          useT1SevenPoints BOOLEAN DEFAULT 1,
          autoSave BOOLEAN DEFAULT 1,
          FOREIGN KEY (worker_id) REFERENCES workers (id)
        )
      `);

      // Insertar trabajador de prueba
      db.prepare('INSERT INTO workers (id, name, worker_group) VALUES (?, ?, ?)')
        .run('worker1', 'Juan Pérez', 'GRUPO 1-2');
    });

    it('inserta y obtiene evaluaciones correctamente', () => {
      // Insertar evaluación
      const stmt = db.prepare('INSERT INTO evaluations (worker_id, period, version, useT1SevenPoints, autoSave) VALUES (?, ?, ?, ?, ?)');
      const result = stmt.run('worker1', '2024', 1, 1, 1);
      
      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBeDefined();

      // Obtener evaluación
      const evaluation = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(result.lastInsertRowid);
      
      expect(evaluation).toBeDefined();
      expect(evaluation.worker_id).toBe('worker1');
      expect(evaluation.period).toBe('2024');
      expect(evaluation.version).toBe(1);
    });

    it('obtiene evaluaciones por trabajador y período', () => {
      // Insertar múltiples evaluaciones
      const stmt = db.prepare('INSERT INTO evaluations (worker_id, period, version) VALUES (?, ?, ?)');
      stmt.run('worker1', '2024', 1);
      stmt.run('worker1', '2024', 2);
      stmt.run('worker1', '2023', 1);

      // Obtener evaluaciones específicas
      const evaluations = db.prepare('SELECT * FROM evaluations WHERE worker_id = ? AND period = ? ORDER BY version')
        .all('worker1', '2024');
      
      expect(evaluations).toHaveLength(2);
      expect(evaluations[0].version).toBe(1);
      expect(evaluations[1].version).toBe(2);
    });
  });

  describe('Operaciones de criterios', () => {
    beforeEach(() => {
      // Crear tablas necesarias
      db.exec(`
        CREATE TABLE IF NOT EXISTS workers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          worker_group TEXT NOT NULL,
          password_hash TEXT
        )
      `);
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS evaluations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          worker_id TEXT NOT NULL,
          period TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          useT1SevenPoints BOOLEAN DEFAULT 1,
          autoSave BOOLEAN DEFAULT 1,
          FOREIGN KEY (worker_id) REFERENCES workers (id)
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS criteria_checks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          evaluation_id INTEGER NOT NULL,
          conduct_id TEXT NOT NULL,
          tramo TEXT NOT NULL,
          criterion_index INTEGER NOT NULL,
          is_checked BOOLEAN NOT NULL,
          FOREIGN KEY (evaluation_id) REFERENCES evaluations (id)
        )
      `);

      // Insertar datos de prueba
      db.prepare('INSERT INTO workers (id, name, worker_group) VALUES (?, ?, ?)')
        .run('worker1', 'Juan Pérez', 'GRUPO 1-2');
      
      const evalResult = db.prepare('INSERT INTO evaluations (worker_id, period) VALUES (?, ?)')
        .run('worker1', '2024');
      
      // Obtener el ID de la evaluación insertada
      const evaluation = db.prepare('SELECT id FROM evaluations WHERE worker_id = ? AND period = ?').get('worker1', '2024');
      return evaluation.id;
    });

    it('inserta y obtiene criterios correctamente', () => {
      const evaluationId = db.prepare('SELECT id FROM evaluations WHERE worker_id = ? AND period = ?').get('worker1', '2024').id;
      
      // Insertar criterios
      const stmt = db.prepare('INSERT INTO criteria_checks (evaluation_id, conduct_id, tramo, criterion_index, is_checked) VALUES (?, ?, ?, ?, ?)');
      stmt.run(evaluationId, 'A1', 't1', 0, 1);
      stmt.run(evaluationId, 'A1', 't1', 1, 0);

      // Obtener criterios
      const criteria = db.prepare('SELECT * FROM criteria_checks WHERE evaluation_id = ? ORDER BY criterion_index')
        .all(evaluationId);
      
      expect(criteria).toHaveLength(2);
      expect(criteria[0].conduct_id).toBe('A1');
      expect(criteria[0].tramo).toBe('t1');
      expect(criteria[0].criterion_index).toBe(0);
      expect(criteria[0].is_checked).toBe(1);
      expect(criteria[1].is_checked).toBe(0);
    });
  });

  describe('Operaciones de evidencia', () => {
    beforeEach(() => {
      // Crear tablas necesarias
      db.exec(`
        CREATE TABLE IF NOT EXISTS workers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          worker_group TEXT NOT NULL,
          password_hash TEXT
        )
      `);
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS evaluations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          worker_id TEXT NOT NULL,
          period TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          useT1SevenPoints BOOLEAN DEFAULT 1,
          autoSave BOOLEAN DEFAULT 1,
          FOREIGN KEY (worker_id) REFERENCES evaluations (id)
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS real_evidence (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          evaluation_id INTEGER NOT NULL,
          conduct_id TEXT NOT NULL,
          evidence_text TEXT,
          FOREIGN KEY (evaluation_id) REFERENCES evaluations (id)
        )
      `);

      // Insertar datos de prueba
      db.prepare('INSERT INTO workers (id, name, worker_group) VALUES (?, ?, ?)')
        .run('worker1', 'Juan Pérez', 'GRUPO 1-2');
      
      db.prepare('INSERT INTO evaluations (worker_id, period) VALUES (?, ?)')
        .run('worker1', '2024');
    });

    it('inserta y obtiene evidencia correctamente', () => {
      const evaluationId = db.prepare('SELECT id FROM evaluations WHERE worker_id = ? AND period = ?').get('worker1', '2024').id;
      
      // Insertar evidencia
      const stmt = db.prepare('INSERT INTO real_evidence (evaluation_id, conduct_id, evidence_text) VALUES (?, ?, ?)');
      stmt.run(evaluationId, 'A1', 'Evidencia de prueba 1');
      stmt.run(evaluationId, 'A2', 'Evidencia de prueba 2');

      // Obtener evidencia
      const evidence = db.prepare('SELECT * FROM real_evidence WHERE evaluation_id = ? ORDER BY conduct_id')
        .all(evaluationId);
      
      expect(evidence).toHaveLength(2);
      expect(evidence[0].conduct_id).toBe('A1');
      expect(evidence[0].evidence_text).toBe('Evidencia de prueba 1');
      expect(evidence[1].conduct_id).toBe('A2');
      expect(evidence[1].evidence_text).toBe('Evidencia de prueba 2');
    });
  });

  describe('Operaciones de archivos', () => {
    beforeEach(() => {
      // Crear tablas necesarias
      db.exec(`
        CREATE TABLE IF NOT EXISTS workers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          worker_group TEXT NOT NULL,
          password_hash TEXT
        )
      `);
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS evaluations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          worker_id TEXT NOT NULL,
          period TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          useT1SevenPoints BOOLEAN DEFAULT 1,
          autoSave BOOLEAN DEFAULT 1,
          FOREIGN KEY (worker_id) REFERENCES evaluations (id)
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS evidence_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          evaluation_id INTEGER NOT NULL,
          competency_id TEXT NOT NULL,
          conduct_id TEXT NOT NULL,
          original_name TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (evaluation_id) REFERENCES evaluations (id)
        )
      `);

      // Insertar datos de prueba
      db.prepare('INSERT INTO workers (id, name, worker_group) VALUES (?, ?, ?)')
        .run('worker1', 'Juan Pérez', 'GRUPO 1-2');
      
      db.prepare('INSERT INTO evaluations (worker_id, period) VALUES (?, ?)')
        .run('worker1', '2024');
    });

    it('inserta y obtiene archivos correctamente', () => {
      const evaluationId = db.prepare('SELECT id FROM evaluations WHERE worker_id = ? AND period = ?').get('worker1', '2024').id;
      
      // Insertar archivos
      const stmt = db.prepare('INSERT INTO evidence_files (evaluation_id, competency_id, conduct_id, original_name, file_name, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?, ?)');
      stmt.run(evaluationId, 'COMP1', 'A1', 'documento.pdf', 'doc1.pdf', 'application/pdf', 1024);
      stmt.run(evaluationId, 'COMP1', 'A2', 'imagen.jpg', 'img1.jpg', 'image/jpeg', 2048);

      // Obtener archivos
      const files = db.prepare('SELECT * FROM evidence_files WHERE evaluation_id = ? ORDER BY original_name')
        .all(evaluationId);
      
      expect(files).toHaveLength(2);
      expect(files[0].original_name).toBe('documento.pdf');
      expect(files[0].file_name).toBe('doc1.pdf');
      expect(files[0].file_type).toBe('application/pdf');
      expect(files[0].file_size).toBe(1024);
      expect(files[1].original_name).toBe('imagen.jpg');
      expect(files[1].file_name).toBe('img1.jpg');
      expect(files[1].file_type).toBe('image/jpeg');
      expect(files[1].file_size).toBe(2048);
    });
  });

  describe('Transacciones', () => {
    beforeEach(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS workers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          worker_group TEXT NOT NULL,
          password_hash TEXT
        )
      `);
    });

    it('ejecuta transacciones correctamente', () => {
      const transaction = db.transaction(() => {
        db.prepare('INSERT INTO workers (id, name, worker_group) VALUES (?, ?, ?)').run('worker1', 'Juan', 'GRUPO 1-2');
        db.prepare('INSERT INTO workers (id, name, worker_group) VALUES (?, ?, ?)').run('worker2', 'María', 'GRUPO 3-4');
      });

      transaction();

      const workers = db.prepare('SELECT * FROM workers ORDER BY id').all();
      expect(workers).toHaveLength(2);
      expect(workers[0].id).toBe('worker1');
      expect(workers[1].id).toBe('worker2');
    });

    it('revierte transacciones en caso de error', () => {
      const transaction = db.transaction(() => {
        db.prepare('INSERT INTO workers (id, name, worker_group) VALUES (?, ?, ?)').run('worker1', 'Juan', 'GRUPO 1-2');
        // Esto causará un error de clave duplicada
        db.prepare('INSERT INTO workers (id, name, worker_group) VALUES (?, ?, ?)').run('worker1', 'María', 'GRUPO 3-4');
      });

      expect(() => transaction()).toThrow();

      const workers = db.prepare('SELECT * FROM workers').all();
      expect(workers).toHaveLength(0);
    });
  });
}); 