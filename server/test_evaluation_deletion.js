async function testEvaluationLifecycle() {
  try {
    console.log('🧪 Probando ciclo completo de evaluación...');
    
    // 1. Crear una evaluación
    console.log('\n1️⃣ Creando evaluación...');
    const createResponse = await fetch('http://localhost:3001/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: 'TEST_WORKER',
        period: '2025-TEST'
      })
    });
    
    if (!createResponse.ok) {
      throw new Error(`Error al crear evaluación: ${createResponse.status}`);
    }
    
    const createdEval = await createResponse.json();
    const evaluationId = createdEval.id;
    console.log(`✅ Evaluación creada con ID: ${evaluationId}`);
    
    // 2. Guardar algunos criterios
    console.log('\n2️⃣ Guardando criterios...');
    const criteriaToSave = [
      { conductId: 'B1', tramo: 't1', criterionIndex: 0, isChecked: true },
      { conductId: 'B1', tramo: 't1', criterionIndex: 1, isChecked: false },
      { conductId: 'B2', tramo: 't2', criterionIndex: 0, isChecked: true }
    ];
    
    for (const criteria of criteriaToSave) {
      const criteriaResponse = await fetch(`http://localhost:3001/api/evaluations/${evaluationId}/criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteria)
      });
      
      if (criteriaResponse.ok) {
        console.log(`✅ Criterio guardado: ${criteria.conductId} ${criteria.tramo} ${criteria.criterionIndex}`);
      } else {
        console.log(`❌ Error al guardar criterio: ${criteriaResponse.status}`);
      }
    }
    
    // 3. Guardar evidencia
    console.log('\n3️⃣ Guardando evidencia...');
    const evidenceResponse = await fetch(`http://localhost:3001/api/evaluations/${evaluationId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conductId: 'B1',
        evidenceText: 'Evidencia de prueba para B1'
      })
    });
    
    if (evidenceResponse.ok) {
      console.log('✅ Evidencia guardada');
    } else {
      console.log(`❌ Error al guardar evidencia: ${evidenceResponse.status}`);
    }
    
    // 4. Guardar puntuación
    console.log('\n4️⃣ Guardando puntuación...');
    const scoreResponse = await fetch(`http://localhost:3001/api/evaluations/${evaluationId}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conductId: 'B1',
        t1Score: 5.0,
        t2Score: 3.0,
        finalScore: 4.0
      })
    });
    
    if (scoreResponse.ok) {
      console.log('✅ Puntuación guardada');
    } else {
      console.log(`❌ Error al guardar puntuación: ${scoreResponse.status}`);
    }
    
    // 5. Verificar que los datos se guardaron
    console.log('\n5️⃣ Verificando datos guardados...');
    const getResponse = await fetch(`http://localhost:3001/api/evaluations/${evaluationId}`);
    
    if (getResponse.ok) {
      const evaluationData = await getResponse.json();
      console.log('📊 Datos de la evaluación:');
      console.log(`  - Criterios: ${evaluationData.criteriaChecks.length}`);
      console.log(`  - Evidencias: ${evaluationData.realEvidence.length}`);
      console.log(`  - Puntuaciones: ${evaluationData.scores.length}`);
      console.log(`  - Archivos: ${evaluationData.evidenceFiles.length}`);
    } else {
      console.log(`❌ Error al obtener evaluación: ${getResponse.status}`);
    }
    
    // 6. Eliminar la evaluación
    console.log('\n6️⃣ Eliminando evaluación...');
    const deleteResponse = await fetch(`http://localhost:3001/api/evaluations/${evaluationId}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      const deleteResult = await deleteResponse.json();
      console.log('✅ Evaluación eliminada:', deleteResult.message);
    } else {
      console.log(`❌ Error al eliminar evaluación: ${deleteResponse.status}`);
    }
    
    // 7. Verificar que la evaluación ya no existe
    console.log('\n7️⃣ Verificando que la evaluación fue eliminada...');
    const checkResponse = await fetch(`http://localhost:3001/api/evaluations/${evaluationId}`);
    
    if (checkResponse.status === 404) {
      console.log('✅ Evaluación eliminada correctamente (404)');
    } else {
      console.log(`❌ Evaluación aún existe: ${checkResponse.status}`);
    }
    
    console.log('\n🎉 Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('💥 Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testEvaluationLifecycle(); 