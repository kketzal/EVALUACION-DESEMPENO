const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'evaluations.db');
const db = new sqlite3.Database(dbPath);

const hash = bcrypt.hashSync('123', 10);

db.run('UPDATE workers SET password_hash = ? WHERE id = ?', [hash, 'e2e-1'], (err) => {
  if (err) {
    console.error('Error actualizando contraseña:', err);
  } else {
    console.log('Contraseña actualizada para Trabajador E2E 1');
  }
  db.close();
}); 