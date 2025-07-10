import { test, expect } from '@playwright/test';

test.describe('Gestión de Archivos de Evidencia', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Iniciando prueba de gestión de archivos...');
    
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
      }
      
      // Esperar a que cargue la evaluación con timeout más largo
      console.log('Esperando a que carguen los bloques de competencias...');
      try {
        await page.waitForSelector('[data-testid="competency-block"]', { timeout: 30000 });
        console.log('Bloques de competencias cargados exitosamente');
      } catch (e) {
        console.log('Error esperando bloques de competencias, tomando captura...');
        await page.screenshot({ path: 'e2e-fail-no-competency-block.png', fullPage: true });
        
        // Intentar obtener más información sobre el estado de la página
        const pageContent = await page.content();
        console.log('Contenido de la página:', pageContent.substring(0, 1000));
        
        throw new Error('No se encontró el bloque de competencias tras login. Captura guardada.');
      }
    } else {
      console.log('Trabajador E2E 1 no encontrado, tomando captura...');
      await page.screenshot({ path: 'e2e-fail-no-worker.png', fullPage: true });
      throw new Error('No se encontró el botón de Trabajador E2E 1. Captura guardada.');
    }
  });

  test('debería mostrar bloques de competencias', async ({ page }) => {
    console.log('Iniciando prueba de verificación de bloques de competencias...');
    
    // Verificar que hay bloques de competencias
    const competencyBlocks = page.locator('[data-testid="competency-block"]');
    const blockCount = await competencyBlocks.count();
    expect(blockCount).toBeGreaterThan(0);
    console.log(`Encontrados ${blockCount} bloques de competencias`);
    
    // Verificar que los bloques son visibles
    const firstBlock = competencyBlocks.first();
    await expect(firstBlock).toBeVisible();
    console.log('Primer bloque de competencias es visible');
    
    // Verificar que hay contenido en el bloque (títulos, descripciones, etc.)
    const blockTitle = firstBlock.locator('h2');
    await expect(blockTitle).toBeVisible();
    console.log('Título del bloque de competencias es visible');
    
    console.log('Prueba de verificación completada exitosamente');
  });

  test('debería poder navegar a la página de resumen', async ({ page }) => {
    console.log('Iniciando prueba de navegación a resumen...');
    
    // Navegar a la pestaña de resumen
    await page.click('[data-testid="summary-tab"]');
    console.log('Clic en pestaña de resumen realizado');
    
    // Verificar que la página de resumen se carga
    await expect(page.locator('[data-testid="summary-files"]')).toBeVisible({ timeout: 10000 });
    console.log('Página de resumen cargada correctamente');
    
    // Verificar que hay elementos de resumen
    const summaryItems = page.locator('[data-testid="summary-file-item"]');
    const itemCount = await summaryItems.count();
    console.log(`Encontrados ${itemCount} elementos en el resumen`);
    
    console.log('Prueba de navegación a resumen completada exitosamente');
  });

  test('debería poder navegar a la gestión de usuarios', async ({ page }) => {
    console.log('Iniciando prueba de navegación a gestión de usuarios...');
    
    // Navegar a la pestaña de gestión de usuarios
    await page.click('[data-testid="manage-users-tab"]');
    console.log('Clic en pestaña de gestión de usuarios realizado');
    
    // Verificar que la página de gestión de usuarios se carga
    await expect(page.locator('h2:has-text("Gestionar Usuarios")')).toBeVisible({ timeout: 10000 });
    console.log('Página de gestión de usuarios cargada correctamente');
    
    // Verificar que hay elementos de gestión de usuarios
    const userButtons = page.locator('button:has-text("GRUPO")');
    const buttonCount = await userButtons.count();
    console.log(`Encontrados ${buttonCount} botones de grupo de usuarios`);
    
    console.log('Prueba de navegación a gestión de usuarios completada exitosamente');
  });
}); 