const { db } = require('./database');

console.log('🧹 Limpiando criteria_checks huérfanos...');

// Buscar todos los evaluation_id válidos
const validEvaluations = db.prepare('SELECT id FROM evaluations').all().map(e => e.id);
console.log('Evaluaciones válidas:', validEvaluations.length);

// Eliminar criteria_checks cuyo evaluation_id no esté en la lista de evaluaciones
const result = db.prepare(`DELETE FROM criteria_checks WHERE evaluation_id NOT IN (${validEvaluations.length > 0 ? validEvaluations.join(',') : 'NULL'})`).run();
console.log('Registros eliminados:', result.changes);

// Mostrar el estado final
db.prepare('VACUUM').run();
const remaining = db.prepare('SELECT COUNT(*) as count FROM criteria_checks').get();
console.log('Registros restantes en criteria_checks:', remaining.count);

console.log('✅ Limpieza completada'); 