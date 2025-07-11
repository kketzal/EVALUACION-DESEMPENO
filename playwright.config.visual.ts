import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración para ejecutar pruebas en modo visual (con navegadores abiertos)
 * Útil para debugging y desarrollo
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Ejecutar secuencialmente para mejor visibilidad
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Un solo worker para mejor control
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* Configuraciones para hacer las pruebas más lentas y visibles */
    actionTimeout: 60000, // 60 segundos para cada acción
    navigationTimeout: 120000, // 120 segundos para navegación
  },

  projects: [
    {
      name: 'chromium-visual',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: 2000, // Pausa de 2 segundos entre acciones
          headless: false, // Mostrar el navegador
        },
      },
    },
  ],

  webServer: {
    command: 'npm run dev:full',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
}); 