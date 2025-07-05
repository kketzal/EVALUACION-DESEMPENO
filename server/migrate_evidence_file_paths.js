const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'evaluations.db'));

function sanitizeUsername(username) {
  return (username || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

const files = db.prepare('SELECT * FROM evidence_files').all();
console.log(`Total archivos a migrar: ${files.length}`);

let updated = 0;
for (const file of files) {
  // Obtener info de evaluación y usuario
  const evalRow = db.prepare('SELECT e.*, w.name as worker_name FROM evaluations e JOIN workers w ON e.worker_id = w.id WHERE e.id = ?').get(file.evaluation_id);
  if (!evalRow) {
    console.warn(`No se encontró evaluación para archivo id=${file.id}`);
    continue;
  }
  const periodDir = evalRow.period || 'unknown';
  const userDir = sanitizeUsername(evalRow.worker_name || 'unknown');
  const competencyDir = file.competency_id || 'unknown';
  const conductDir = file.conduct_id || 'unknown';
  // Si ya tiene subcarpetas, saltar
  if (file.file_name.includes('/') && file.file_name.startsWith(periodDir)) {
    continue;
  }
  const newRelativePath = path.join(periodDir, userDir, competencyDir, conductDir, file.file_name);
  db.prepare('UPDATE evidence_files SET file_name = ? WHERE id = ?').run(newRelativePath, file.id);
  updated++;
  console.log(`Actualizado archivo id=${file.id}: ${file.file_name} -> ${newRelativePath}`);
}
console.log(`Total actualizados: ${updated}`); 