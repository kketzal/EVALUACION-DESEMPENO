const { db } = require('./database');

// Función para corregir nombres corruptos
function fixCorruptedName(fileName) {
    if (!fileName) return fileName;
    
    // Mapeo de patrones corruptos a caracteres correctos
    const corrections = {
        'Ì\x81': 'á',  // a con acento agudo
        'Ì\x83': 'ó',  // o con acento agudo
        'Ì\x89': 'é',  // e con acento agudo
        'Ì\x8D': 'í',  // i con acento agudo
        'Ì\x9A': 'ú',  // u con acento agudo
        'Ì\x91': 'ñ',  // ñ
        'Ì\x9C': 'ü',  // u con diéresis
        'Ì\x87': 'ç'   // c con cedilla
    };
    
    let corrected = fileName;
    
    // Aplicar correcciones
    for (const [corrupted, correct] of Object.entries(corrections)) {
        corrected = corrected.replace(new RegExp(corrupted, 'g'), correct);
    }
    
    // Eliminar cualquier carácter Ì que pueda haber quedado
    corrected = corrected.replace(/Ì/g, '');
    
    return corrected;
}

console.log('=== CORRIGIENDO NOMBRES CORRUPTOS EN LA BASE DE DATOS ===\n');

// Obtener todos los archivos con nombres corruptos
const corruptedFiles = db.prepare('SELECT id, original_name FROM evidence_files WHERE original_name LIKE ?').all('%Ì%');

console.log(`Encontrados ${corruptedFiles.length} archivos con nombres corruptos:\n`);

corruptedFiles.forEach((file, index) => {
    const correctedName = fixCorruptedName(file.original_name);
    console.log(`${index + 1}. ID: ${file.id}`);
    console.log(`   Corrupto: "${file.original_name}"`);
    console.log(`   Corregido: "${correctedName}"`);
    console.log('');
    
    // Actualizar en la base de datos
    const stmt = db.prepare('UPDATE evidence_files SET original_name = ? WHERE id = ?');
    stmt.run(correctedName, file.id);
});

console.log('=== VERIFICACIÓN POST-CORRECCIÓN ===\n');

// Verificar que se corrigieron
const remainingCorrupted = db.prepare('SELECT COUNT(*) as count FROM evidence_files WHERE original_name LIKE ?').get('%Ì%');
console.log(`Archivos aún corruptos: ${remainingCorrupted.count}`);

if (remainingCorrupted.count === 0) {
    console.log('✅ ¡Todos los nombres han sido corregidos exitosamente!');
} else {
    console.log('❌ Aún quedan nombres corruptos');
}

console.log('\n=== MUESTRA DE ARCHIVOS CORREGIDOS ===\n');
const sampleFiles = db.prepare('SELECT id, original_name FROM evidence_files WHERE original_name LIKE ? OR original_name LIKE ? OR original_name LIKE ? LIMIT 5').all('%á%', '%ó%', '%ñ%');

sampleFiles.forEach((file, index) => {
    console.log(`${index + 1}. ID: ${file.id} - "${file.original_name}"`);
});

console.log('\n¡Proceso completado!'); 