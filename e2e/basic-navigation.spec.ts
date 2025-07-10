import { test, expect } from '@playwright/test';

test.describe('Navegación Básica', () => {
  test('debería cargar la aplicación y mostrar la pantalla de login', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('/');
    
    // Verificar que aparece la pantalla de login
    await expect(page.locator('text=Bienvenido/a al Sistema de Evaluación del Desempeño')).toBeVisible();
    await expect(page.locator('text=Seleccionar Trabajador')).toBeVisible();
    await expect(page.locator('text=Añadir Nuevo Trabajador')).toBeVisible();
  });

  test('debería poder seleccionar un trabajador y navegar a las competencias', async ({ page }) => {
    console.log('Iniciando prueba de selección de trabajador...');
    
    // Navegar a la aplicación
    await page.goto('/');
    console.log('Navegación completada');
    
    // Esperar a que la aplicación cargue
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 20000 });
    console.log('Selector de trabajador encontrado');
    
    // Hacer clic en seleccionar trabajador
    await page.click('[data-testid="worker-select"]');
    console.log('Clic en seleccionar trabajador realizado');
    
    // Esperar a que aparezca el modal de selección
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 15000 });
    console.log('Modal de selección de trabajador visible');
    
    // Verificar que el modal está visible
    await expect(page.locator('text=Seleccionar Trabajador/a')).toBeVisible();
    
    // Buscar específicamente el trabajador de prueba E2E
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    console.log('Buscando botón de Trabajador E2E 1...');
    
    if (await workerButton.count() > 0) {
      console.log('Trabajador E2E 1 encontrado, haciendo clic...');
      await workerButton.first().click();
      
      // Esperar a que aparezca el campo de contraseña
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      console.log('Campo de contraseña visible');
      
      // Introducir contraseña
      await page.fill('input[type="password"]', '123');
      await page.press('input[type="password"]', 'Enter');
      console.log('Contraseña introducida y Enter presionado');
      
      // Esperar un momento para que procese el login
      await page.waitForTimeout(2000);
      
      // Si aparece modal de selección de evaluación, continuar
      const continueButton = page.locator('button:has-text("Continuar")');
      if (await continueButton.isVisible({ timeout: 5000 })) {
        console.log('Modal de continuar evaluación encontrado, haciendo clic...');
        await continueButton.click();
        // Esperar a que desaparezca el modal
        await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 10000 });
        console.log('Modal de continuar evaluación cerrado');
      }
      
      // Esperar a que cargue la evaluación y los bloques de competencias
      await page.waitForSelector('[data-testid="competency-block"]', { timeout: 30000 });
      console.log('Bloques de competencias cargados inicialmente');
      
      // Verificar que aparece al menos un bloque de competencias
      await expect(page.locator('[data-testid="competency-block"]')).toBeVisible();
      console.log('Prueba completada exitosamente');
    } else {
      console.log('Trabajador E2E 1 no encontrado, tomando captura...');
      await page.screenshot({ path: 'e2e-fail-no-worker.png', fullPage: true });
      throw new Error('No se encontró el botón de Trabajador E2E 1. Captura guardada.');
    }
  });

  test('debería poder navegar entre las diferentes pestañas', async ({ page }) => {
    console.log('Iniciando prueba de navegación entre pestañas...');
    
    // Navegar a la aplicación
    await page.goto('/');
    
    // Esperar a que la aplicación cargue
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 20000 });
    
    // Hacer clic en seleccionar trabajador
    await page.click('[data-testid="worker-select"]');
    
    // Esperar a que aparezca el modal de selección
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 15000 });
    
    // Buscar específicamente el trabajador de prueba E2E
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    if (await workerButton.count() > 0) {
      await workerButton.first().click();
      
      // Esperar a que aparezca el campo de contraseña
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      
      // Introducir contraseña
      await page.fill('input[type="password"]', '123');
      await page.press('input[type="password"]', 'Enter');
      
      // Esperar un momento para que procese el login
      await page.waitForTimeout(2000);
      
      // Si aparece modal de selección de evaluación, continuar
      const continueButton = page.locator('button:has-text("Continuar")');
      if (await continueButton.isVisible({ timeout: 5000 })) {
        await continueButton.click();
      }
      
      // Esperar a que cargue la evaluación
      await page.waitForSelector('[data-testid="competency-block"]', { timeout: 30000 });
      console.log('Bloques de competencias cargados inicialmente');
      
      // Navegar a la pestaña de resumen
      await page.waitForSelector('div.fixed.inset-0', { state: 'detached', timeout: 15000 });
      await page.click('[data-testid="summary-tab"]');
      await expect(page.locator('[data-testid="summary-files"]')).toBeVisible({ timeout: 10000 });
      console.log('Navegación a resumen completada');
      
      // Navegar a la pestaña de gestión de usuarios
      await page.click('[data-testid="manage-users-tab"]');
      await expect(page.locator('h2:has-text("Gestionar Usuarios")')).toBeVisible({ timeout: 10000 });
      console.log('Navegación a gestión de usuarios completada');
      
      // Verificar que la navegación básica funciona correctamente
      console.log('Prueba de navegación básica completada exitosamente');
    } else {
      await page.screenshot({ path: 'e2e-fail-no-worker-nav.png', fullPage: true });
      throw new Error('No se encontró el botón de Trabajador E2E 1 en navegación. Captura guardada.');
    }
  });

  test('debería mantener los bloques de competencias visibles al navegar de vuelta', async ({ page }) => {
    console.log('Iniciando prueba de navegación completa entre pestañas...');
    
    // Navegar a la aplicación
    await page.goto('/');
    
    // Esperar a que la aplicación cargue
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 20000 });
    
    // Hacer clic en seleccionar trabajador
    await page.click('[data-testid="worker-select"]');
    
    // Esperar a que aparezca el modal de selección
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 15000 });
    
    // Buscar específicamente el trabajador de prueba E2E
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    if (await workerButton.count() > 0) {
      await workerButton.first().click();
      
      // Esperar a que aparezca el campo de contraseña
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      
      // Introducir contraseña
      await page.fill('input[type="password"]', '123');
      await page.press('input[type="password"]', 'Enter');
      
      // Esperar un momento para que procese el login
      await page.waitForTimeout(2000);
      
      // Si aparece modal de selección de evaluación, continuar
      const continueButton = page.locator('button:has-text("Continuar")');
      if (await continueButton.isVisible({ timeout: 5000 })) {
        await continueButton.click();
      }
      
      // Esperar a que cargue la evaluación
      await page.waitForSelector('[data-testid="competency-block"]', { timeout: 30000 });
      console.log('Bloques de competencias cargados inicialmente');
      
      // Tras login, seleccionar explícitamente la competencia 'B' para asegurar que la vista de competencias está activa
      await page.waitForSelector('div.fixed.inset-0', { state: 'detached', timeout: 15000 });
      const competencyButtonB = page.locator('button:has-text("B")').first();
      if (await competencyButtonB.count() > 0) {
        await competencyButtonB.click();
        console.log('Competencia B seleccionada tras login');
        await page.waitForTimeout(1000); // Dar tiempo a renderizar
      } else {
        console.log('No se encontró el botón de competencia B tras login, tomando captura...');
        await page.screenshot({ path: 'e2e-fail-no-competency-button-after-login.png', fullPage: true });
        throw new Error('No se encontró el botón de competencia B tras login. Captura guardada.');
      }
      
      // Navegar a la pestaña de resumen
      await page.waitForSelector('div.fixed.inset-0', { state: 'detached', timeout: 15000 });
      await page.click('[data-testid="summary-tab"]');
      await expect(page.locator('[data-testid="summary-files"]')).toBeVisible({ timeout: 10000 });
      console.log('Navegación a resumen completada');
      
      // Navegar de vuelta a las competencias usando el sidebar
      const competencyButton = page.locator('button:has-text("B")').first();
      if (await competencyButton.count() > 0) {
        await competencyButton.click();
        console.log('Navegación de vuelta a competencias realizada');
        
        // Esperar a que se carguen los bloques de competencias
        await page.waitForTimeout(2000);
        try {
          await expect(page.locator('[data-testid="competency-block"]')).toBeVisible({ timeout: 15000 });
          console.log('Bloques de competencias visibles después de navegación de vuelta');
        } catch (e) {
          console.log('No se encontraron los bloques de competencias tras volver. Guardando screenshot y HTML...');
          await page.screenshot({ path: 'e2e-fail-no-competency-block-after-back.png', fullPage: true });
          const pageContent = await page.content();
          const fs = require('fs');
          fs.writeFileSync('e2e-fail-no-competency-block-after-back.html', pageContent);
          throw e;
        }
      } else {
        console.log('No se encontró el botón de competencia B, tomando captura...');
        await page.screenshot({ path: 'e2e-fail-no-competency-button.png', fullPage: true });
        throw new Error('No se encontró el botón de competencia B. Captura guardada.');
      }
      
      console.log('Prueba de navegación completa completada exitosamente');
    } else {
      await page.screenshot({ path: 'e2e-fail-no-worker-nav.png', fullPage: true });
      throw new Error('No se encontró el botón de Trabajador E2E 1 en navegación. Captura guardada.');
    }
  });
}); 