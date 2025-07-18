const { app, BrowserWindow, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // O preload não é estritamente necessário para este app de análise,
      // mas é uma boa prática mantê-lo.
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Hub de Análise de Dados'
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  // Configura a Política de Segurança de Conteúdo (CSP)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' https://*.firebaseio.com https://*.googleapis.com https://*.firebaseapp.com https://unpkg.com https://cdnjs.cloudflare.com https://www.gstatic.com;",
          "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com https://www.gstatic.com;",
          "script-src-elem 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com https://www.gstatic.com;",
          "style-src 'self' 'unsafe-inline';",
          "img-src 'self' data:;",
          "connect-src 'self' wss://*.firebaseio.com https://*.googleapis.com;"
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