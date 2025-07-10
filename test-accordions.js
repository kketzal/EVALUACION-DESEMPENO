import { execSync } from 'child_process';

console.log('🧪 Ejecutando tests de accordions...');

try {
  execSync('npx playwright test --grep "Despliegue de accordions" --project=chromium --timeout=30000', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Tests de accordions completados exitosamente');
} catch (error) {
  console.error('❌ Error en tests de accordions:', error.message);
  process.exit(1);
} 