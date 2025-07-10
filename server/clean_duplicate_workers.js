const { db } = require('./database');

function cleanDuplicateWorkers() {
  console.log('Limpiando trabajadores duplicados con id null...');
  
  // Primero, mostrar cuántos trabajadores con id null hay
  const nullWorkers = db.prepare('SELECT * FROM workers WHERE id IS NULL').all();
  console.log(`Encontrados ${nullWorkers.length} trabajadores con id null:`);
  
  nullWorkers.forEach(worker => {
    console.log(`- ${worker.name} (${worker.worker_group}) - Creado: ${worker.created_at}`);
  });
  
  // Eliminar todos los trabajadores con id null
  const result = db.prepare('DELETE FROM workers WHERE id IS NULL').run();
  
  console.log(`Eliminados ${result.changes} trabajadores con id null.`);
  
  // Mostrar los trabajadores restantes
  const remainingWorkers = db.prepare('SELECT * FROM workers ORDER BY name').all();
  console.log('\nTrabajadores restantes:');
  remainingWorkers.forEach(worker => {
    console.log(`- ${worker.name} (ID: ${worker.id}) - ${worker.worker_group}`);
  });
}

cleanDuplicateWorkers();
process.exit(0); 