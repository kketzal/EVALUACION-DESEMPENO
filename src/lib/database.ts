import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'evaluations.db');

export function getDatabase() {
  return new sqlite3.Database(dbPath);
}

export function initDatabase() {
  const db = getDatabase();
  
  // Crear tabla de trabajadores
  db.run(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      department TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear tabla de evaluaciones
  db.run(`
    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      evaluation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_score REAL DEFAULT 0,
      status TEXT DEFAULT 'in_progress',
      FOREIGN KEY (worker_id) REFERENCES workers (id)
    )
  `);

  // Crear tabla de criterios verificados
  db.run(`
    CREATE TABLE IF NOT EXISTS criteria_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluation_id INTEGER NOT NULL,
      conduct_id TEXT NOT NULL,
      tramo TEXT NOT NULL,
      criterion_index INTEGER NOT NULL,
      is_checked BOOLEAN DEFAULT 0,
      FOREIGN KEY (evaluation_id) REFERENCES evaluations (id)
    )
  `);

  // Crear tabla de archivos de evidencia
  db.run(`
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

  // Crear tabla de puntuaciones
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluation_id INTEGER NOT NULL,
      conduct_id TEXT NOT NULL,
      score REAL DEFAULT 0,
      FOREIGN KEY (evaluation_id) REFERENCES evaluations (id)
    )
  `);

  // Crear tabla de evidencias reales
  db.run(`
    CREATE TABLE IF NOT EXISTS real_evidences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluation_id INTEGER NOT NULL,
      conduct_id TEXT NOT NULL,
      evidence_text TEXT,
      FOREIGN KEY (evaluation_id) REFERENCES evaluations (id)
    )
  `);

  console.log('Base de datos inicializada correctamente');
  return db;
} 