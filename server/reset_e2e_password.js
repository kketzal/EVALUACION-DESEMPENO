const bcrypt = require('bcryptjs');
const { db } = require('./database');

async function resetE2EPassword() {
  const userId = 'e2e-1';
  const newPassword = '123';
  const hash = await bcrypt.hash(newPassword, 10);

  const result = db.prepare('UPDATE workers SET password_hash = ? WHERE id = ?').run(hash, userId);
  if (result.changes > 0) {
    console.log(`Contraseña de '${userId}' actualizada correctamente a '123'.`);
  } else {
    console.log(`No se encontró el usuario con id '${userId}'.`);
  }
}

resetE2EPassword().then(() => process.exit()); 