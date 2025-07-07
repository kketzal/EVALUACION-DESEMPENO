const fetch = require('node-fetch');

async function testCriteriaSave() {
  try {
    console.log('🧪 Probando guardado de criterios...');
    
    // Usar la evaluación actual (ID 83)
    const evaluationId = 83;
    
    // Datos de prueba
    const testData = {
      conductId: 'B1',
      tramo: 't1',
      criterionIndex: 0,
      isChecked: true
    };
    
    console.log(`📤 Enviando datos a evaluación ${evaluationId}:`, testData);
    
    // Hacer la petición POST
    const response = await fetch(`http://localhost:3001/api/evaluations/${evaluationId}/criteria`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Respuesta del servidor:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseData = await response.text();
    console.log('Response Body:', responseData);
    
    if (response.ok) {
      console.log('✅ Guardado exitoso!');
      
      // Verificar que se guardó en la base de datos
      const { db } = require('./database');
      const criteria = db.prepare('SELECT * FROM criteria_checks WHERE evaluation_id = ?').all(evaluationId);
      console.log(`📊 Criterios en BD para evaluación ${evaluationId}:`, criteria.length);
      if (criteria.length > 0) {
        console.log('📋 Último criterio guardado:', criteria[criteria.length - 1]);
      }
    } else {
      console.log('❌ Error en el guardado');
    }
    
  } catch (error) {
    console.error('💥 Error en la prueba:', error.message);
  }
}

testCriteriaSave(); 