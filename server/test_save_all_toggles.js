const fetch = require('node-fetch');

async function testSaveAllToggles() {
  try {
    console.log('🧪 Probando guardado automático de todos los toggles activados del TRAMO 1...');
    
    // Simular los criterios activados del TRAMO 1 (con useT1SevenPoints = false, todos activados)
    const t1Criteria = [
      'Realiza la conducta de manera habitual',
      'Realiza la conducta adecuadamente sin alcanzar siempre los estándares esperados',
      'Comete errores de forma poco frecuente',
      'Manifiesta suficiente autonomía en la realización de la conducta'
    ];
    
    const conductId = 'B1';
    const evaluationId = 77;
    
    console.log(`📤 Guardando ${t1Criteria.length} toggles activados del TRAMO 1 para conducta ${conductId}...`);
    
    // Guardar todos los toggles activados del TRAMO 1
    for (let i = 0; i < t1Criteria.length; i++) {
      const testData = {
        conductId: conductId,
        tramo: 't1',
        criterionIndex: i,
        isChecked: true
      };
      
      console.log(`Guardando criterio ${i}: ${t1Criteria[i]}`);
      
      const response = await fetch(`http://localhost:3001/api/evaluations/${evaluationId}/criteria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      if (response.ok) {
        console.log(`✅ Criterio ${i} guardado exitosamente`);
      } else {
        console.log(`❌ Error al guardar criterio ${i}: ${response.status}`);
      }
    }
    
    console.log('🎉 Prueba completada!');
    
  } catch (error) {
    console.error('💥 Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testSaveAllToggles(); 