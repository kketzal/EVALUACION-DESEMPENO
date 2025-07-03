const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Crear directorio de evidencia si no existe
const evidenceDir = path.join(uploadsDir, 'evidence');
if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
}

const db = new Database(path.join(__dirname, 'evaluations.db'));

// Crear tablas si no existen
const createTables = () => {
    // Tabla de trabajadores
    db.exec(`
        CREATE TABLE IF NOT EXISTS workers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            worker_group TEXT CHECK(worker_group IN ('GRUPO 1-2', 'GRUPO 3-4')),
            password_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Migración: agregar worker_group si no existe
    try {
        db.exec(`ALTER TABLE workers ADD COLUMN worker_group TEXT CHECK(worker_group IN ('GRUPO 1-2', 'GRUPO 3-4'))`);
        console.log('Campo worker_group agregado a la tabla workers');
    } catch (error) {
        // El campo ya existe, no hacer nada
        console.log('Campo worker_group ya existe en la tabla workers');
    }

    // Migración: agregar password_hash si no existe
    try {
        db.exec(`ALTER TABLE workers ADD COLUMN password_hash TEXT`);
        console.log('Campo password_hash agregado a la tabla workers');
    } catch (error) {
        // El campo ya existe, no hacer nada
        console.log('Campo password_hash ya existe en la tabla workers');
    }

    // Tabla de evaluaciones
    db.exec(`
        CREATE TABLE IF NOT EXISTS evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            worker_id TEXT NOT NULL,
            period TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            useT1SevenPoints BOOLEAN DEFAULT 1,
            FOREIGN KEY (worker_id) REFERENCES workers (id)
        )
    `);

    // Migración: agregar useT1SevenPoints si no existe
    try {
        db.exec(`ALTER TABLE evaluations ADD COLUMN useT1SevenPoints BOOLEAN DEFAULT 1`);
        console.log('Campo useT1SevenPoints agregado a la tabla evaluations');
    } catch (error) {
        // El campo ya existe, no hacer nada
        console.log('Campo useT1SevenPoints ya existe en la tabla evaluations');
    }

    // Tabla de criterios evaluados
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

    // Tabla de evidencia real
    db.exec(`
        CREATE TABLE IF NOT EXISTS real_evidence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            evaluation_id INTEGER NOT NULL,
            conduct_id TEXT NOT NULL,
            evidence_text TEXT,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations (id)
        )
    `);

    // Tabla de archivos de evidencia
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

    // Tabla de puntuaciones
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

    // Tabla de configuración global
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `);

    // Tabla de sesiones persistentes
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            worker_id TEXT NOT NULL,
            last_activity INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        )
    `);
};

// Migrar usuarios antiguos: asignar password_hash por defecto si no tienen
async function migrateUsersDefaultPassword() {
    const users = db.prepare('SELECT id FROM workers WHERE password_hash IS NULL OR password_hash = ""').all();
    if (users.length === 0) return;
    const hash = await bcrypt.hash('1234', 10);
    const stmt = db.prepare('UPDATE workers SET password_hash = ? WHERE id = ?');
    for (const user of users) {
        stmt.run(hash, user.id);
    }
    console.log(`Migrados ${users.length} usuarios con contraseña por defecto '1234'.`);
}

async function createSuperAdmin() {
    const exists = db.prepare('SELECT id FROM workers WHERE id = ?').get('superadmin');
    if (!exists) {
        const hash = await bcrypt.hash('password123', 10);
        db.prepare('INSERT INTO workers (id, name, worker_group, password_hash) VALUES (?, ?, ?, ?)')
          .run('superadmin', 'Super Admin', 'GRUPO 1-2', hash);
        console.log('Usuario Super Admin creado con clave password123');
    }
}

// Inicializar base de datos
createTables();
// migrateUsersDefaultPassword();
createSuperAdmin();

module.exports = { db, uploadsDir, evidenceDir }; 