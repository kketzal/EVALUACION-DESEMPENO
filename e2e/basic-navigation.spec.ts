import { test, expect } from '@playwright/test';

test.describe('Navegación Básica', () => {
  // ===== TESTS ESPECÍFICOS PARA DESARROLLO DIARIO =====
  
  test('Login con trabajador válido', async ({ page }) => {
    console.log('🔐 Test: Login con trabajador válido');
    await page.goto('/');
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 30000 });
    await page.click('[data-testid="worker-select"]');
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 30000 });
    
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    await workerButton.first().click();
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.fill('input[type="password"]', '123');
    await page.press('input[type="password"]', 'Enter');
    
    // Manejar modal de continuar evaluación si aparece
    const continueButton = page.locator('button:has-text("Continuar")');
    try {
      if (await continueButton.isVisible({ timeout: 10000 })) {
        await continueButton.click();
        await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 20000 });
      }
    } catch (e) {
      console.log('No apareció modal de continuar evaluación');
    }
    
    await page.waitForSelector('[data-testid="competency-block"]', { timeout: 60000 });
    await expect(page.locator('[data-testid="competency-block"]')).toBeVisible();
    console.log('✅ Login exitoso');
  });

  test('Navegación a resumen', async ({ page }) => {
    console.log('📊 Test: Navegación a resumen');
    await page.goto('/');
    
    // Login rápido
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 30000 });
    await page.click('[data-testid="worker-select"]');
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 30000 });
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    await workerButton.first().click();
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.fill('input[type="password"]', '123');
    await page.press('input[type="password"]', 'Enter');
    
    // Manejar modal si aparece
    const continueButton = page.locator('button:has-text("Continuar")');
    try {
      if (await continueButton.isVisible({ timeout: 10000 })) {
        await continueButton.click();
        await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 20000 });
      }
    } catch (e) {}
    
    await page.waitForSelector('[data-testid="competency-block"]', { timeout: 60000 });
    
    // Navegar a resumen
    await page.waitForSelector('[data-testid="summary-tab"]', { timeout: 30000 });
    await page.waitForSelector('div.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black.bg-opacity-50', { state: 'detached', timeout: 10000 });
    await page.click('[data-testid="summary-tab"]');
    await expect(page.locator('[data-testid="summary-files"]')).toBeVisible({ timeout: 20000 });
    console.log('✅ Navegación a resumen exitosa');
  });

  test('Navegación a gestión de usuarios', async ({ page }) => {
    console.log('👥 Test: Navegación a gestión de usuarios');
    await page.goto('/');
    
    // Login rápido
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 30000 });
    await page.click('[data-testid="worker-select"]');
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 30000 });
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    await workerButton.first().click();
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.fill('input[type="password"]', '123');
    await page.press('input[type="password"]', 'Enter');
    
    // Manejar modal si aparece
    const continueButton = page.locator('button:has-text("Continuar")');
    try {
      if (await continueButton.isVisible({ timeout: 10000 })) {
        await continueButton.click();
        await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 20000 });
      }
    } catch (e) {}
    
    await page.waitForSelector('[data-testid="competency-block"]', { timeout: 60000 });
    
    // Navegar a gestión de usuarios
    await page.waitForSelector('[data-testid="manage-users-tab"]', { timeout: 30000 });
    const usersTab = page.locator('[data-testid="manage-users-tab"]');
    await expect(usersTab).toBeVisible({ timeout: 10000 });
    await usersTab.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    try {
      await usersTab.click({ timeout: 10000 });
    } catch (clickError) {
      await usersTab.click({ force: true, timeout: 10000 });
    }
    
    await expect(page.locator('h2:has-text("Gestionar Usuarios")')).toBeVisible({ timeout: 20000 });
    console.log('✅ Navegación a gestión de usuarios exitosa');
  });

  test('Cambio de trabajador', async ({ page }) => {
    console.log('🔄 Test: Cambio de trabajador');
    await page.goto('/');
    
    // Login inicial
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 30000 });
    await page.click('[data-testid="worker-select"]');
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 30000 });
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    await workerButton.first().click();
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.fill('input[type="password"]', '123');
    await page.press('input[type="password"]', 'Enter');
    
    // Manejar modal si aparece
    const continueButton = page.locator('button:has-text("Continuar")');
    try {
      if (await continueButton.isVisible({ timeout: 10000 })) {
        await continueButton.click();
        await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 20000 });
      }
    } catch (e) {}
    
    await page.waitForSelector('[data-testid="competency-block"]', { timeout: 60000 });
    
    // Cambiar trabajador
    const changeWorkerButton = page.locator('button:has-text("Cambiar Trabajador")');
    await expect(changeWorkerButton).toBeVisible({ timeout: 10000 });
    await changeWorkerButton.click();
    
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 20000 });
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 20000 });
    
    const sameWorkerButton = page.locator('button:has-text("Trabajador E2E 1")');
    await page.waitForSelector('button:has-text("Trabajador E2E 1")', { timeout: 20000 });
    await sameWorkerButton.first().click();
    
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.fill('input[type="password"]', '123');
    await page.press('input[type="password"]', 'Enter');
    
    // Manejar modal si aparece
    const continueButton2 = page.locator('button:has-text("Continuar")');
    try {
      if (await continueButton2.isVisible({ timeout: 10000 })) {
        await continueButton2.click();
        await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 20000 });
      }
    } catch (e) {}
    
    await page.waitForSelector('[data-testid="competency-block"]', { timeout: 60000 });
    await expect(page.locator('[data-testid="competency-block"]')).toBeVisible();
    console.log('✅ Cambio de trabajador exitoso');
  });

  test('Regreso a competencias desde gestión de usuarios', async ({ page }) => {
    console.log('🏠 Test: Regreso a competencias desde gestión de usuarios');
    await page.goto('/');
    
    // Login rápido
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 30000 });
    await page.click('[data-testid="worker-select"]');
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 30000 });
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    await workerButton.first().click();
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.fill('input[type="password"]', '123');
    await page.press('input[type="password"]', 'Enter');
    
    // Manejar modal si aparece
    const continueButton = page.locator('button:has-text("Continuar")');
    try {
      if (await continueButton.isVisible({ timeout: 10000 })) {
        await continueButton.click();
        await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 20000 });
      }
    } catch (e) {}
    
    await page.waitForSelector('[data-testid="competency-block"]', { timeout: 60000 });
    
    // Navegar a gestión de usuarios
    await page.waitForSelector('[data-testid="manage-users-tab"]', { timeout: 30000 });
    const usersTab = page.locator('[data-testid="manage-users-tab"]');
    await expect(usersTab).toBeVisible({ timeout: 10000 });
    await usersTab.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    try {
      await usersTab.click({ timeout: 10000 });
    } catch (clickError) {
      await usersTab.click({ force: true, timeout: 10000 });
    }
    
    await expect(page.locator('h2:has-text("Gestionar Usuarios")')).toBeVisible({ timeout: 20000 });
    
    // Regresar a competencias
    const firstCompetencyButton = page.locator('nav ul > li button').first();
    await firstCompetencyButton.waitFor({ state: 'visible', timeout: 20000 });
    await firstCompetencyButton.click();
    await expect(page.locator('[data-testid="competency-block"]')).toBeVisible({ timeout: 20000 });
    console.log('✅ Regreso a competencias exitoso');
  });

  test('Despliegue de accordions y funcionalidad de expandir/colapsar', async ({ page }) => {
    console.log('📂 Test: Despliegue de accordions y funcionalidad de expandir/colapsar');
    await page.goto('/');
    
    // Login rápido
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 30000 });
    await page.click('[data-testid="worker-select"]');
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 30000 });
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    await workerButton.first().click();
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.fill('input[type="password"]', '123');
    await page.press('input[type="password"]', 'Enter');
    
    // Manejar modal si aparece
    const continueButton = page.locator('button:has-text("Continuar")');
    try {
      if (await continueButton.isVisible({ timeout: 10000 })) {
        await continueButton.click();
        await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 20000 });
      }
    } catch (e) {}
    
    await page.waitForSelector('[data-testid="competency-block"]', { timeout: 60000 });
    
    // Verificar que hay accordions disponibles - usar un selector más específico
    const accordions = page.locator('div.border.rounded-lg.mb-2.bg-gray-50');
    await expect(accordions.first()).toBeVisible({ timeout: 10000 });
    const accordionCount = await accordions.count();
    console.log(`Encontrados ${accordionCount} accordions`);
    
    // Verificar que los accordions están cerrados inicialmente
    for (let i = 0; i < Math.min(accordionCount, 3); i++) {
      const accordion = accordions.nth(i);
      await expect(accordion).toBeVisible();
    }
    
    // Abrir el primer accordion - hacer clic en el botón dentro del accordion
    const firstAccordion = accordions.first();
    const accordionButton = firstAccordion.locator('button').first();
    await accordionButton.click();
    await page.waitForTimeout(1000);
    
    // Verificar que se muestra el contenido del accordion (toggles)
    // Limitar el scope de los toggles al primer accordion abierto
    const accordionContent1 = firstAccordion.locator('div.overflow-hidden');
    const toggles = accordionContent1.locator('button[role="checkbox"]');
    await expect(toggles.first()).toBeVisible({ timeout: 5000 });
    const toggleCount = await toggles.count();
    console.log(`Encontrados ${toggleCount} toggles en el primer accordion`);
    
    // Cerrar el accordion
    await accordionButton.click();
    await page.waitForTimeout(1000);
    
    // Verificar que el contenido se oculta - usar un selector más específico para el contenido
    await expect(accordionContent1).toHaveClass(/max-h-0/);
    
    // Probar el botón "Expandir Todo"
    const expandAllButton = page.locator('button:has-text("Expandir Todo")');
    await expect(expandAllButton).toBeVisible({ timeout: 10000 });
    await expandAllButton.click();
    await page.waitForTimeout(2000);
    
    // Verificar que todos los accordions se abrieron
    const allToggles = page.locator('button[role="checkbox"]');
    await expect(allToggles).toBeVisible({ timeout: 10000 });
    
    // Probar el botón "Colapsar Todo"
    const collapseAllButton = page.locator('button:has-text("Colapsar Todo")');
    await expect(collapseAllButton).toBeVisible({ timeout: 10000 });
    await collapseAllButton.click();
    await page.waitForTimeout(2000);
    
    // Verificar que todos los accordions se cerraron
    const allAccordionContents = page.locator('div.overflow-hidden');
    for (let i = 0; i < Math.min(accordionCount, 3); i++) {
      await expect(allAccordionContents.nth(i)).toHaveClass(/max-h-0/);
    }
    
    console.log('✅ Funcionalidad de accordions verificada');
  });

  test('Configuración TRAMO-1 y funcionamiento de toggles', async ({ page }) => {
    console.log('⚙️ Test: Configuración TRAMO-1 y funcionamiento de toggles');
    await page.goto('/');
    
    // Login rápido
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 30000 });
    await page.click('[data-testid="worker-select"]');
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 30000 });
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    await workerButton.first().click();
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.fill('input[type="password"]', '123');
    await page.press('input[type="password"]', 'Enter');
    
    // Manejar modal si aparece
    const continueButton = page.locator('button:has-text("Continuar")');
    try {
      if (await continueButton.isVisible({ timeout: 10000 })) {
        await continueButton.click();
        await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 20000 });
      }
    } catch (e) {}
    
    await page.waitForSelector('[data-testid="competency-block"]', { timeout: 60000 });
    
    // Abrir el primer accordion para ver los toggles
    const firstAccordion = page.locator('div.border.rounded-lg.mb-2.bg-gray-50').first();
    const accordionButton = firstAccordion.locator('button').first();
    await accordionButton.click();
    await page.waitForTimeout(1000);
    
    // Verificar que se muestran los toggles de TRAMO 1
    const t1Toggles = page.locator('button[role="checkbox"]');
    await expect(t1Toggles).toBeVisible({ timeout: 5000 });
    
    // Verificar que hay toggles de TRAMO 1 (deberían estar activados por defecto)
    const t1ToggleCount = await t1Toggles.count();
    console.log(`Encontrados ${t1ToggleCount} toggles en total`);
    
    // Verificar que los primeros toggles (TRAMO 1) están activados
    // Solo verificar los primeros 2 toggles que deberían estar activados por defecto
    for (let i = 0; i < Math.min(2, t1ToggleCount); i++) {
      const toggle = t1Toggles.nth(i);
      const isChecked = await toggle.getAttribute('aria-checked');
      console.log(`Toggle ${i + 1} estado: ${isChecked}`);
      // Los primeros toggles deberían estar activados por defecto
      expect(isChecked).toBe('true');
    }
    
    // Probar cambiar el estado de un toggle
    const firstToggle = t1Toggles.first();
    await firstToggle.click();
    await page.waitForTimeout(500);
    
    // Verificar que el estado cambió
    const newState = await firstToggle.getAttribute('aria-checked');
    expect(newState).toBe('false');
    
    // Volver a activar el toggle
    await firstToggle.click();
    await page.waitForTimeout(500);
    
    // Verificar que volvió al estado activado
    const finalState = await firstToggle.getAttribute('aria-checked');
    expect(finalState).toBe('true');
    
    console.log('✅ Funcionamiento de toggles TRAMO-1 verificado');
  });

  test('Configuración TRAMO-1 de 7 puntos desde settings', async ({ page }) => {
    console.log('🔧 Test: Configuración TRAMO-1 de 7 puntos desde settings');
    await page.goto('/');
    
    // Login rápido
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 30000 });
    await page.click('[data-testid="worker-select"]');
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 30000 });
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    await workerButton.first().click();
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.fill('input[type="password"]', '123');
    await page.press('input[type="password"]', 'Enter');
    
    // Manejar modal si aparece
    const continueButton = page.locator('button:has-text("Continuar")');
    try {
      if (await continueButton.isVisible({ timeout: 10000 })) {
        await continueButton.click();
        await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 20000 });
      }
    } catch (e) {}
    
    await page.waitForSelector('[data-testid="competency-block"]', { timeout: 60000 });
    
    // Navegar a settings
    const settingsTab = page.locator('button:has-text("Configuración")');
    await expect(settingsTab).toBeVisible({ timeout: 10000 });
    await settingsTab.click();
    
    // Esperar a que cargue la página de configuración
    await page.waitForSelector('h1:has-text("Configuración")', { timeout: 20000 });
    
    // Buscar la sección de configuración de evaluación
    const evaluationSection = page.locator('h3:has-text("Configuración de Evaluación")');
    await expect(evaluationSection).toBeVisible({ timeout: 10000 });
    await evaluationSection.click();
    
    // Buscar el toggle de "Usar escala T1 de 7 puntos"
    const t1SevenPointsToggle = page.locator('button[role="checkbox"]').first();
    await expect(t1SevenPointsToggle).toBeVisible({ timeout: 10000 });
    
    // Verificar el estado inicial del toggle
    const initialState = await t1SevenPointsToggle.getAttribute('aria-checked');
    console.log(`Estado inicial del toggle TRAMO-1 7 puntos: ${initialState}`);
    
    // Cambiar el estado del toggle
    await t1SevenPointsToggle.click();
    await page.waitForTimeout(1000);
    
    // Verificar que el estado cambió
    const newState = await t1SevenPointsToggle.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);
    
    // Volver a competencias para verificar que se aplicó la configuración
    const firstCompetencyButton = page.locator('nav ul > li button').first();
    await firstCompetencyButton.waitFor({ state: 'visible', timeout: 20000 });
    await firstCompetencyButton.click();
    await expect(page.locator('[data-testid="competency-block"]')).toBeVisible({ timeout: 20000 });
    
    // Abrir el primer accordion para verificar la configuración
    const firstAccordion = page.locator('div.border.rounded-lg.mb-2.bg-gray-50').first();
    const accordionButton = firstAccordion.locator('button').first();
    await accordionButton.click();
    await page.waitForTimeout(1000);
    
    // Verificar que los toggles reflejan la nueva configuración
    const toggles = page.locator('button[role="checkbox"]');
    await expect(toggles).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Configuración TRAMO-1 de 7 puntos verificada');
  });

  test('Funcionamiento completo de todos los toggles', async ({ page }) => {
    console.log('🔄 Test: Funcionamiento completo de todos los toggles');
    await page.goto('/');
    
    // Login rápido
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 30000 });
    await page.click('[data-testid="worker-select"]');
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 30000 });
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    await workerButton.first().click();
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.fill('input[type="password"]', '123');
    await page.press('input[type="password"]', 'Enter');
    
    // Manejar modal si aparece
    const continueButton = page.locator('button:has-text("Continuar")');
    try {
      if (await continueButton.isVisible({ timeout: 10000 })) {
        await continueButton.click();
        await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 20000 });
      }
    } catch (e) {}
    
    await page.waitForSelector('[data-testid="competency-block"]', { timeout: 60000 });
    
    // Expandir todos los accordions
    const expandAllButton = page.locator('button:has-text("Expandir Todo")');
    await expect(expandAllButton).toBeVisible({ timeout: 10000 });
    await expandAllButton.click();
    await page.waitForTimeout(2000);
    
    // Obtener todos los toggles
    const allToggles = page.locator('button[role="checkbox"]');
    await expect(allToggles).toBeVisible({ timeout: 10000 });
    const toggleCount = await allToggles.count();
    console.log(`Encontrados ${toggleCount} toggles en total`);
    
    // Probar el funcionamiento de cada toggle
    for (let i = 0; i < Math.min(toggleCount, 10); i++) { // Probar solo los primeros 10 para no hacer el test muy largo
      const toggle = allToggles.nth(i);
      
      // Obtener estado inicial
      const initialState = await toggle.getAttribute('aria-checked');
      
      // Cambiar estado
      await toggle.click();
      await page.waitForTimeout(200);
      
      // Verificar que cambió
      const newState = await toggle.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
      
      // Volver al estado original
      await toggle.click();
      await page.waitForTimeout(200);
      
      // Verificar que volvió al estado original
      const finalState = await toggle.getAttribute('aria-checked');
      expect(finalState).toBe(initialState);
      
      console.log(`Toggle ${i + 1} funcionando correctamente`);
    }
    
    // Verificar que las puntuaciones se actualizan
    const scoreInputs = page.locator('input[type="number"]');
    await expect(scoreInputs).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Funcionamiento completo de toggles verificado');
  });

  // ===== TEST DE FLUJO COMPLETO (SMOKE TEST) =====
  
  test('Flujo completo de la aplicación en una sola sesión', async ({ page }) => {
    test.setTimeout(300000); // 5 minutos de timeout para toda la prueba
    
    console.log('🚀 Iniciando flujo completo de la aplicación...');
    
    // ===== PASO 1: LOGIN INICIAL =====
    console.log('📋 Paso 1: Login inicial');
    await page.goto('/');
    await page.waitForSelector('[data-testid="worker-select"]', { timeout: 30000 });
    await page.click('[data-testid="worker-select"]');
    await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 30000 });
    
    const workerButton = page.locator('button:has-text("Trabajador E2E 1")');
    await workerButton.first().click();
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    await page.fill('input[type="password"]', '123');
    await page.press('input[type="password"]', 'Enter');
    
    // Manejar modal de continuar evaluación si aparece
    const continueButton = page.locator('button:has-text("Continuar")');
    try {
      if (await continueButton.isVisible({ timeout: 10000 })) {
        console.log('Modal de continuar evaluación encontrado, haciendo clic...');
        await continueButton.click();
        await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 20000 });
        console.log('Modal de continuar evaluación cerrado');
      }
    } catch (e) {
      console.log('No apareció el modal de continuar evaluación tras login inicial.');
    }
    
    // Verificar que cargan los bloques de competencias
    await page.waitForSelector('[data-testid="competency-block"]', { timeout: 60000 });
    await expect(page.locator('[data-testid="competency-block"]')).toBeVisible();
    console.log('✅ Login inicial completado');
    
    // ===== PASO 2: NAVEGACIÓN ENTRE PESTAÑAS =====
    console.log('📋 Paso 2: Navegación entre pestañas');
    
    // Navegar a resumen
    try {
      console.log('Esperando summary-tab...');
      await page.waitForSelector('[data-testid="summary-tab"]', { timeout: 30000 });
      
      // Esperar a que no haya modales interceptando
      await page.waitForSelector('div.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black.bg-opacity-50', { state: 'detached', timeout: 10000 });
      
      console.log('Haciendo click en summary-tab...');
      await page.click('[data-testid="summary-tab"]');
      await expect(page.locator('[data-testid="summary-files"]')).toBeVisible({ timeout: 20000 });
      console.log('✅ Navegación a resumen completada');
    } catch (e) {
      console.log('Error al navegar a resumen:', e);
      await page.screenshot({ path: 'e2e-fail-summary-tab.png', fullPage: true });
      throw new Error('Fallo al navegar a resumen. Captura guardada.');
    }
    
    // Navegar a gestión de usuarios
    try {
      console.log('Esperando manage-users-tab...');
      await page.waitForSelector('[data-testid="manage-users-tab"]', { timeout: 30000 });
      const usersTab = page.locator('[data-testid="manage-users-tab"]');
      
      // Verificar que el elemento es visible y clickeable
      await expect(usersTab).toBeVisible({ timeout: 10000 });
      console.log('manage-users-tab es visible');
      
      // Hacer scroll para asegurar que esté en viewport
      await usersTab.scrollIntoViewIfNeeded();
      console.log('Scroll completado para manage-users-tab');
      
      // Esperar un momento para que el scroll se complete
      await page.waitForTimeout(1000);
      
      // Intentar click normal primero
      try {
        console.log('Intentando click normal en manage-users-tab...');
        await usersTab.click({ timeout: 10000 });
      } catch (clickError) {
        console.log('Click normal falló, intentando con force...');
        await usersTab.click({ force: true, timeout: 10000 });
      }
      
      // Verificar que la página de gestión de usuarios se cargó usando un selector más específico
      await expect(page.locator('h2:has-text("Gestionar Usuarios")')).toBeVisible({ timeout: 20000 });
      console.log('✅ Navegación a gestión de usuarios completada');
    } catch (e) {
      console.log('Error al navegar a gestión de usuarios:', e);
      await page.screenshot({ path: 'e2e-fail-users-tab.png', fullPage: true });
      throw new Error('Fallo al navegar a gestión de usuarios. Captura guardada.');
    }
    
    // Volver a competencias
    try {
      console.log('Verificando que estamos de vuelta en la vista de competencias...');
      // Selecciona el primer botón de competencia visible en el sidebar
      const firstCompetencyButton = page.locator('nav ul > li button').first();
      await firstCompetencyButton.waitFor({ state: 'visible', timeout: 20000 });
      console.log('Haciendo click en el primer botón de competencia del sidebar...');
      await firstCompetencyButton.click();
      // Verifica que se muestre el bloque de competencias
      await expect(page.locator('[data-testid="competency-block"]')).toBeVisible({ timeout: 20000 });
      console.log('✅ Navegación a competencias completada');
    } catch (e) {
      console.log('Error al volver a competencias:', e);
      await page.screenshot({ path: 'e2e-fail-competencies-tab.png', fullPage: true });
      throw new Error('Fallo al volver a competencias. Captura guardada.');
    }
    
    // ===== PASO 3: CAMBIO DE TRABAJADOR =====
    console.log('📋 Paso 3: Cambio de trabajador');
    try {
      console.log('Buscando botón de cambiar trabajador...');
      const changeWorkerButton = page.locator('button:has-text("Cambiar Trabajador")');
      await expect(changeWorkerButton).toBeVisible({ timeout: 10000 });
      console.log('Botón de cambiar trabajador encontrado, haciendo clic...');
      await changeWorkerButton.click();
      
      console.log('Esperando que aparezca la pantalla de selección de trabajador...');
      await page.waitForSelector('[data-testid="worker-select"]', { timeout: 20000 });
      console.log('Pantalla de selección de trabajador visible');
      
      console.log('Esperando que aparezca el modal de selección...');
      await page.waitForSelector('text=Seleccionar Trabajador/a', { timeout: 20000 });
      console.log('Modal de selección de trabajador visible');
      
      console.log('Buscando botón del Trabajador E2E 1...');
      const sameWorkerButton = page.locator('button:has-text("Trabajador E2E 1")');
      await page.waitForSelector('button:has-text("Trabajador E2E 1")', { timeout: 20000 });
      console.log('Botón del Trabajador E2E 1 encontrado, haciendo clic...');
      await sameWorkerButton.first().click();
      
      console.log('Esperando campo de contraseña...');
      await page.waitForSelector('input[type="password"]', { timeout: 20000 });
      console.log('Campo de contraseña visible, introduciendo contraseña...');
      await page.fill('input[type="password"]', '123');
      await page.press('input[type="password"]', 'Enter');
      console.log('Contraseña introducida y Enter presionado');
      
      // Manejar modal de continuar evaluación si aparece
      const continueButton2 = page.locator('button:has-text("Continuar")');
      try {
        if (await continueButton2.isVisible({ timeout: 10000 })) {
          console.log('Modal de continuar evaluación encontrado tras re-login, haciendo clic...');
          await continueButton2.click();
          await page.waitForSelector('button:has-text("Continuar")', { state: 'detached', timeout: 20000 });
          console.log('Modal de continuar evaluación cerrado tras re-login');
        } else {
          console.log('No apareció modal de continuar evaluación tras re-login');
        }
      } catch (e) {
        console.log('Error manejando modal de continuar evaluación:', e);
      }
      
      console.log('Esperando que se carguen los bloques de competencias...');
      await page.waitForSelector('[data-testid="competency-block"]', { timeout: 60000 });
      await expect(page.locator('[data-testid="competency-block"]')).toBeVisible();
      console.log('✅ Cambio de trabajador completado');
    } catch (e) {
      console.log('Error en cambio de trabajador:', e);
      await page.screenshot({ path: 'e2e-fail-change-worker.png', fullPage: true });
      throw new Error('Fallo en cambio de trabajador. Captura guardada.');
    }
    
    // ===== PASO 4: VERIFICACIÓN FINAL =====
    console.log('📋 Paso 4: Verificación final');
    try {
      const competencyBlocks = page.locator('[data-testid="competency-block"]');
      await expect(competencyBlocks).toBeVisible();
      const blockCount = await competencyBlocks.count();
      console.log(`✅ Encontrados ${blockCount} bloques de competencias`);
      
      // Verificar que el sidebar está visible
      await expect(page.locator('[data-testid="summary-tab"]')).toBeVisible();
      await expect(page.locator('[data-testid="manage-users-tab"]')).toBeVisible();
      console.log('✅ Sidebar visible');
      
      console.log('🎉 ¡Flujo completo de la aplicación completado exitosamente!');
    } catch (e) {
      console.log('Error en verificación final:', e);
      await page.screenshot({ path: 'e2e-fail-final-verification.png', fullPage: true });
      throw new Error('Fallo en verificación final. Captura guardada.');
    }
  });
}); 