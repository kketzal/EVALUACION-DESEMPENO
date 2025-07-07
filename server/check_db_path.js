const { db } = require('./database');
const path = require('path');

console.log('🔍 Verificando configuración de base de datos...');

// Verificar la ruta de la base de datos
console.log('📁 Ruta de la base de datos:', db.name);

// Verificar que podemos escribir en la base de datos
console.log('✍️  Probando escritura en la base de datos...');

try {
  // Crear una tabla de prueba temporal
  db.exec('CREATE TABLE IF NOT EXISTS test_write (id INTEGER PRIMARY KEY, test_value TEXT)');
  
  // Insertar un valor de prueba
  const insertResult = db.prepare('INSERT INTO test_write (test_value) VALUES (?)').run('test_' + Date.now());
  console.log('✅ Escritura exitosa, ID:', insertResult.lastInsertRowid);
  
  // Leer el valor insertado
  const readResult = db.prepare('SELECT * FROM test_write WHERE id = ?').get(insertResult.lastInsertRowid);
  console.log('📖 Lectura exitosa:', readResult);
  
  // Limpiar la tabla de prueba
  db.exec('DROP TABLE test_write');
  console.log('🧹 Tabla de prueba eliminada');
  
} catch (error) {
  console.error('❌ Error en prueba de escritura:', error);
}

// Verificar el estado actual de criteria_checks
console.log('\n📊 Estado actual de criteria_checks:');
const criteriaCount = db.prepare('SELECT COUNT(*) as count FROM criteria_checks').get();
console.log('Total de criterios en la base de datos:', criteriaCount.count);

// Verificar evaluaciones
console.log('\n📊 Estado actual de evaluations:');
const evalCount = db.prepare('SELECT COUNT(*) as count FROM evaluations').get();
console.log('Total de evaluaciones en la base de datos:', evalCount.count);

const recentEvals = db.prepare('SELECT id, worker_id, period, created_at FROM evaluations ORDER BY created_at DESC LIMIT 3').all();
console.log('Últimas 3 evaluaciones:');
recentEvals.forEach(evaluation => {
  console.log(`  ID: ${evaluation.id}, Worker: ${evaluation.worker_id}, Period: ${evaluation.period}, Created: ${evaluation.created_at}`);
});

console.log('\n✅ Verificación completada'); 