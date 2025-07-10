const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

// Configuración de la base de datos
const dbPath = path.join(__dirname, 'evaluations.db');
const db = new Database(dbPath);

console.log('🔧 Configurando datos de prueba para E2E...');

try {
  // --- LIMPIEZA DE DATOS DE PRUEBA ANTERIORES ---
  console.log('🧹 Limpiando trabajadores y evaluaciones E2E previos...');
  // Obtener IDs de trabajadores E2E
  const e2eWorkers = db.prepare("SELECT id FROM workers WHERE id LIKE 'e2e-%' OR name LIKE 'Trabajador E2E%'").all();
  if (e2eWorkers.length > 0) {
    for (const w of e2eWorkers) {
      // Eliminar criterios
      db.prepare('DELETE FROM criteria_checks WHERE evaluation_id IN (SELECT id FROM evaluations WHERE worker_id = ?)').run(w.id);
      // Eliminar evaluaciones
      db.prepare('DELETE FROM evaluations WHERE worker_id = ?').run(w.id);
      // Eliminar archivos de evidencia
      db.prepare('DELETE FROM evidence_files WHERE evaluation_id IN (SELECT id FROM evaluations WHERE worker_id = ?)').run(w.id);
      // Eliminar evidencia real
      db.prepare('DELETE FROM real_evidence WHERE evaluation_id IN (SELECT id FROM evaluations WHERE worker_id = ?)').run(w.id);
      // Eliminar puntuaciones
      db.prepare('DELETE FROM scores WHERE evaluation_id IN (SELECT id FROM evaluations WHERE worker_id = ?)').run(w.id);
      // Eliminar trabajador
      db.prepare('DELETE FROM workers WHERE id = ?').run(w.id);
    }
    console.log(`🗑️  Eliminados ${e2eWorkers.length} trabajadores y sus datos asociados.`);
  } else {
    console.log('ℹ️  No había trabajadores E2E previos.');
  }

  // Crear trabajadores de prueba para E2E
  const testWorkers = [
    {
      id: 'e2e-1',
      name: 'Trabajador E2E 1',
      worker_group: 'GRUPO 1-2',
      password: '123'
    },
    {
      id: 'e2e-2',
      name: 'Trabajador E2E 2', 
      worker_group: 'GRUPO 3-4',
      password: '123'
    },
    {
      id: 'e2e-3',
      name: 'Trabajador E2E 3',
      worker_group: 'GRUPO 1-2', 
      password: '123'
    }
  ];

  console.log('📝 Creando trabajadores de prueba...');
  for (const worker of testWorkers) {
    const hashedPassword = bcrypt.hashSync(worker.password, 10);
    const stmt = db.prepare(`
      INSERT INTO workers (id, name, worker_group, password_hash, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(worker.id, worker.name, worker.worker_group, hashedPassword);
    console.log(`✅ Creado trabajador: ${worker.name} (ID: ${worker.id})`);
  }

  // Crear evaluaciones de prueba para el primer trabajador
  const firstWorker = db.prepare('SELECT * FROM workers WHERE id = ?').get('e2e-1');
  if (firstWorker) {
    console.log(`📊 Creando evaluación de prueba para ${firstWorker.name}...`);
    // Verificar si ya existe una evaluación para 2023-2024
    const existingEval = db.prepare(`
      SELECT * FROM evaluations 
      WHERE worker_id = ? AND period = '2023-2024'
    `).get(firstWorker.id);
    if (!existingEval) {
      const stmt = db.prepare(`
        INSERT INTO evaluations (worker_id, period, created_at)
        VALUES (?, '2023-2024', datetime('now'))
      `);
      stmt.run(firstWorker.id);
      console.log(`✅ Creada evaluación para período 2023-2024 para ${firstWorker.name}`);
    } else {
      console.log('ℹ️  La evaluación de prueba ya existe');
    }
  }

  // Crear algunos criterios de ejemplo
  console.log('🎯 Creando criterios de ejemplo...');
  const testCriteria = [
    { conduct_id: 'B1', tramo: 't1', criterion_index: 0, is_checked: true },
    { conduct_id: 'B1', tramo: 't1', criterion_index: 1, is_checked: false },
    { conduct_id: 'B1', tramo: 't2', criterion_index: 0, is_checked: true },
    { conduct_id: 'B2', tramo: 't1', criterion_index: 0, is_checked: false },
    { conduct_id: 'B2', tramo: 't2', criterion_index: 0, is_checked: true }
  ];
  if (firstWorker) {
    const evaluation = db.prepare(`
      SELECT * FROM evaluations 
      WHERE worker_id = ? AND period = '2023-2024'
    `).get(firstWorker.id);
    if (evaluation) {
      for (const criterion of testCriteria) {
        // Verificar si ya existe
        const existing = db.prepare(`
          SELECT * FROM criteria_checks 
          WHERE evaluation_id = ? AND conduct_id = ? AND tramo = ? AND criterion_index = ?
        `).get(evaluation.id, criterion.conduct_id, criterion.tramo, criterion.criterion_index);
        if (!existing) {
          const stmt = db.prepare(`
            INSERT INTO criteria_checks (evaluation_id, conduct_id, tramo, criterion_index, is_checked)
            VALUES (?, ?, ?, ?, ?)
          `);
          stmt.run(
            evaluation.id,
            criterion.conduct_id,
            criterion.tramo,
            criterion.criterion_index,
            criterion.is_checked ? 1 : 0
          );
        }
      }
      console.log('✅ Criterios de ejemplo creados');
    }
  }

  console.log('🎉 Datos de prueba configurados correctamente!');
  console.log('');
  console.log('📋 Resumen de datos creados:');
  console.log(`   - Trabajadores: ${testWorkers.length}`);
  console.log(`   - Evaluaciones: 1 (período 2023-2024)`);
  console.log(`   - Criterios de ejemplo: ${testCriteria.length}`);
  console.log('');
  console.log('🔑 Credenciales de prueba:');
  console.log('   Usuario: Cualquiera de los "Trabajador E2E X"');
  console.log('   Contraseña: 123');
  console.log('');
  console.log('🚀 Las pruebas E2E ahora deberían funcionar correctamente!');

} catch (error) {
  console.error('❌ Error configurando datos de prueba:', error);
  process.exit(1);
} finally {
  db.close();
} 