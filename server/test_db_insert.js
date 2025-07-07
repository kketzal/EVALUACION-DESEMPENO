const { db } = require('./database');

async function testDbInsert() {
  try {
    console.log('🧪 Probando inserción directa en la base de datos...');
    
    // Verificar que la evaluación existe
    const evaluation = db.prepare('SELECT * FROM evaluations WHERE id = 83').get();
    console.log('Evaluación encontrada:', evaluation ? 'Sí' : 'No');
    
    if (!evaluation) {
      console.log('❌ La evaluación 83 no existe');
      return;
    }
    
    // Verificar el estado actual de criteria_checks
    const currentCriteria = db.prepare('SELECT COUNT(*) as count FROM criteria_checks WHERE evaluation_id = 83').get();
    console.log('Criterios actuales:', currentCriteria.count);
    
    // Intentar insertar un criterio
    console.log('📝 Insertando criterio...');
    const stmt = db.prepare('INSERT INTO criteria_checks (evaluation_id, conduct_id, tramo, criterion_index, is_checked) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(83, 'B1', 't1', 0, 1);
    
    console.log('Resultado de inserción:', result);
    console.log('ID del nuevo registro:', result.lastInsertRowid);
    
    // Verificar que se insertó
    const newCriteria = db.prepare('SELECT COUNT(*) as count FROM criteria_checks WHERE evaluation_id = 83').get();
    console.log('Criterios después de inserción:', newCriteria.count);
    
    // Mostrar el registro insertado
    const inserted = db.prepare('SELECT * FROM criteria_checks WHERE evaluation_id = 83 ORDER BY id DESC LIMIT 1').get();
    console.log('Registro insertado:', inserted);
    
    console.log('✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testDbInsert(); 