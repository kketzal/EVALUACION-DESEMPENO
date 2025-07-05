const { db } = require('./database');
const bcrypt = require('bcryptjs');

async function resetAllPasswords() {
  const users = db.prepare('SELECT id FROM workers WHERE id != ?').all('superadmin');
  const hash = await bcrypt.hash('1234', 10);
  for (const user of users) {
    db.prepare('UPDATE workers SET password_hash = ? WHERE id = ?').run(hash, user.id);
    console.log(`Contraseña reseteada para usuario: ${user.id}`);
  }
  console.log('¡Todas las contraseñas (excepto superadmin) han sido cambiadas a 1234!');
}

resetAllPasswords(); 