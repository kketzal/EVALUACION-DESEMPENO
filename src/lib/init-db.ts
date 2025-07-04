import { getDatabase } from './database';

export function initializeDatabase() {
  const db = getDatabase();

  // Crear tablas si no existen
  db.exec(`
    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      worker_group TEXT CHECK(worker_group IN ('GRUPO 1-2', 'GRUPO 3-4')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id TEXT NOT NULL,
      period TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      useT1SevenPoints BOOLEAN DEFAULT 1,
      autoSave BOOLEAN DEFAULT 1,
      version INTEGER,
      FOREIGN KEY (worker_id) REFERENCES workers(id)
    );

    CREATE TABLE IF NOT EXISTS criteria_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluation_id INTEGER NOT NULL,
      conduct_id TEXT NOT NULL,
      tramo TEXT NOT NULL,
      criterion_index INTEGER NOT NULL,
      is_checked BOOLEAN NOT NULL,
      FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
    );

    CREATE TABLE IF NOT EXISTS real_evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluation_id INTEGER NOT NULL,
      conduct_id TEXT NOT NULL,
      evidence_text TEXT NOT NULL,
      FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluation_id INTEGER NOT NULL,
      conduct_id TEXT NOT NULL,
      t1_score REAL,
      t2_score REAL,
      final_score REAL NOT NULL,
      FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
    );

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
      FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
    );
  `);
} 