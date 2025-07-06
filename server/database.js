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
db.exec('PRAGMA foreign_keys = ON;'); // Activar claves foráneas
db.exec('PRAGMA encoding = "UTF-8";'); // Forzar codificación UTF-8

// Función para obtener la hora actual en zona horaria española
function getSpanishTimestamp() {
    const now = new Date();
    // Convertir a hora española (UTC+1 en invierno, UTC+2 en verano)
    const spanishTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Madrid"}));
    return spanishTime.toISOString().replace('T', ' ').substring(0, 19);
}

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
            updated_at DATETIME,
            useT1SevenPoints BOOLEAN DEFAULT 1,
            autoSave BOOLEAN DEFAULT 1,
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

    // Migración: agregar autoSave si no existe
    try {
        db.exec(`ALTER TABLE evaluations ADD COLUMN autoSave BOOLEAN DEFAULT 1`);
        console.log('Campo autoSave agregado a la tabla evaluations');
    } catch (error) {
        // El campo ya existe, no hacer nada
        console.log('Campo autoSave ya existe en la tabla evaluations');
    }

    // Forzar recreación de la tabla criteria_checks con clave foránea correcta
    try {
        db.exec('DROP TABLE IF EXISTS criteria_checks;');
        console.log('Tabla criteria_checks eliminada para recreación con clave foránea.');
    } catch (error) {
        console.log('No se pudo eliminar criteria_checks:', error);
    }

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

// Migrar evaluaciones: limpiar updated_at de evaluaciones sin datos guardados
function migrateEvaluationsUpdatedAt() {
    try {
        // Buscar evaluaciones que tienen updated_at pero no tienen criterios, evidencia o archivos
        const evaluations = db.prepare(`
            SELECT e.id, e.updated_at 
            FROM evaluations e 
            LEFT JOIN criteria_checks cc ON e.id = cc.evaluation_id 
            LEFT JOIN real_evidence re ON e.id = re.evaluation_id 
            LEFT JOIN evidence_files ef ON e.id = ef.evaluation_id 
            WHERE e.updated_at IS NOT NULL 
            AND cc.id IS NULL 
            AND re.id IS NULL 
            AND ef.id IS NULL
        `).all();
        
        if (evaluations.length > 0) {
            const stmt = db.prepare('UPDATE evaluations SET updated_at = NULL WHERE id = ?');
            for (const evaluation of evaluations) {
                stmt.run(evaluation.id);
            }
            console.log(`Migradas ${evaluations.length} evaluaciones: updated_at establecido a NULL para evaluaciones sin datos`);
        } else {
            console.log('No hay evaluaciones que necesiten migración de updated_at');
        }
    } catch (error) {
        console.log('Error en migración de updated_at:', error);
    }
}

// Verificar el estado de las evaluaciones en la base de datos
function checkEvaluationsStatus() {
    try {
        console.log('=== VERIFICACIÓN DE ESTADO DE EVALUACIONES ===');
        
        const evaluations = db.prepare(`
            SELECT e.id, e.worker_id, e.period, e.version, e.created_at, e.updated_at,
                   COUNT(cc.id) as criteria_count,
                   COUNT(re.id) as evidence_count,
                   COUNT(ef.id) as files_count
            FROM evaluations e 
            LEFT JOIN criteria_checks cc ON e.id = cc.evaluation_id 
            LEFT JOIN real_evidence re ON e.id = re.evaluation_id 
            LEFT JOIN evidence_files ef ON e.id = ef.evaluation_id 
            GROUP BY e.id
            ORDER BY e.id DESC
            LIMIT 10
        `).all();
        
        console.log('Últimas 10 evaluaciones:');
        evaluations.forEach(evaluation => {
            console.log(`  ID: ${evaluation.id}, Worker: ${evaluation.worker_id}, Period: ${evaluation.period}, Version: ${evaluation.version}`);
            console.log(`    Created: ${evaluation.created_at}, Updated: ${evaluation.updated_at}`);
            console.log(`    Data: Criteria=${evaluation.criteria_count}, Evidence=${evaluation.evidence_count}, Files=${evaluation.files_count}`);
            console.log(`    Has data: ${evaluation.criteria_count > 0 || evaluation.evidence_count > 0 || evaluation.files_count > 0}`);
            console.log(`    Should have updated_at: ${evaluation.criteria_count > 0 || evaluation.evidence_count > 0 || evaluation.files_count > 0}`);
            console.log('');
        });
        
        console.log('=== FIN VERIFICACIÓN ===');
    } catch (error) {
        console.log('Error en verificación de evaluaciones:', error);
    }
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
// migrateEvaluationsUpdatedAt();
checkEvaluationsStatus();
createSuperAdmin();

module.exports = { db, uploadsDir, evidenceDir }; 