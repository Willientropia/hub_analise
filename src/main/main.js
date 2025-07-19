const { app, BrowserWindow, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    title: 'Solar Analytics Dashboard',
    titleBarStyle: 'default',
    frame: true,
    show: false // Não mostrar até estar pronto
  });

  // Mostrar apenas quando estiver pronto
  win.once('ready-to-show', () => {
    win.show();
  });

  win.loadFile('src/renderer/index.html');
  
  // Abrir DevTools apenas em desenvolvimento
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  // Configurar CSP para Firebase e bibliotecas necessárias
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' " +
          "https://unpkg.com " +
          "https://cdnjs.cloudflare.com " +
          "https://cdn.tailwindcss.com " +
          "https://www.gstatic.com " +
          "https://*.firebaseio.com " +
          "https://*.googleapis.com " +
          "https://*.firebaseapp.com; " +
          "connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://*.firebaseapp.com; " +
          "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
          "frame-src https://*.firebaseio.com https://*.firebaseapp.com; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' data: https:"
        ]
      }
    });
  });
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Eventos adicionais para analytics
app.on('before-quit', () => {
  // Log de analytics ou cleanup se necessário
  console.log('Solar Analytics Dashboard fechando...');
});