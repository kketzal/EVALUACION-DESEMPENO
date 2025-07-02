const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let serverProcess;

// Función para crear la ventana principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Cargar la aplicación
  if (isDev) {
    // En desarrollo, cargar desde el servidor de desarrollo
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, cargar desde los archivos construidos
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Mostrar la ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Manejar enlaces externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Crear menú personalizado
  createMenu();
}

// Función para crear el menú de la aplicación
function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nueva Evaluación',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-evaluation');
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de',
          click: () => {
            const aboutWindow = new BrowserWindow({
              width: 400,
              height: 300,
              resizable: false,
              minimizable: false,
              maximizable: false,
              parent: mainWindow,
              modal: true,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
              }
            });
            aboutWindow.loadFile(path.join(__dirname, 'about.html'));
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Función para iniciar el servidor backend
function startServer() {
  const serverPath = path.join(__dirname, '../server/server.js');
  
  serverProcess = spawn('node', [serverPath], {
    stdio: 'pipe',
    cwd: path.join(__dirname, '../server')
  });

  serverProcess.stdout.on('data', (data) => {
    console.log('Servidor:', data.toString());
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('Error del servidor:', data.toString());
  });

  serverProcess.on('close', (code) => {
    console.log(`Servidor cerrado con código ${code}`);
  });
}

// Eventos de la aplicación
app.whenReady().then(() => {
  // Iniciar el servidor backend
  startServer();
  
  // Crear la ventana principal
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Cerrar el servidor backend antes de salir
  if (serverProcess) {
    serverProcess.kill();
  }
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
}); 