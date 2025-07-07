const { db } = require('./database');

async function testEvaluationLoading() {
  try {
    console.log('=== Test de carga de evaluaciones ===');
    
    // Obtener todos los trabajadores
    const workers = db.prepare('SELECT * FROM workers ORDER BY name').all();
    console.log(`Encontrados ${workers.length} trabajadores`);
    
    if (workers.length === 0) {
      console.log('No hay trabajadores en la base de datos');
      return;
    }
    
    // Tomar el primer trabajador
    const worker = workers[0];
    console.log(`\nProbando con trabajador: ${worker.name} (ID: ${worker.id})`);
    
    // Obtener evaluaciones del trabajador
    const evaluations = db.prepare(`
      SELECT * FROM evaluations 
      WHERE worker_id = ? 
      ORDER BY period DESC, version DESC, created_at DESC
    `).all(worker.id);
    
    console.log(`\nEvaluaciones encontradas: ${evaluations.length}`);
    
    evaluations.forEach((evaluation, index) => {
      console.log(`  ${index + 1}. ID: ${evaluation.id}, Periodo: ${evaluation.period}, Versión: ${evaluation.version}, Creada: ${evaluation.created_at}`);
    });
    
    if (evaluations.length > 0) {
      console.log('\n✅ Test exitoso: Se encontraron evaluaciones');
    } else {
      console.log('\n⚠️  No se encontraron evaluaciones para este trabajador');
    }
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  } finally {
    process.exit(0);
  }
}

testEvaluationLoading(); 