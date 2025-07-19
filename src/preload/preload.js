const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o processo de renderização
contextBridge.exposeInMainWorld('electronAPI', {
  // Exemplo de como expor métodos do IPC:
  send: (channel, data) => {
    // Lista de canais permitidos para envio
    const validChannels = ['analytics-export', 'analytics-data'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    // Lista de canais permitidos para recepção
    const validChannels = ['analytics-response', 'analytics-update'];
    if (validChannels.includes(channel)) {
      // Remover o ouvinte antigo para evitar duplicação
      ipcRenderer.removeAllListeners(channel);
      // Adicionar o novo ouvinte
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  // API específica para analytics
  analytics: {
    exportData: (data) => {
      ipcRenderer.send('export-analytics-data', data);
    },
    getSystemInfo: () => {
      return {
        platform: process.platform,
        version: process.versions.electron,
        arch: process.arch
      };
    }
  }
});