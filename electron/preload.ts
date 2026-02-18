import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  db: {
    getTransactions: (filters?: any) => ipcRenderer.invoke('db:getTransactions', filters),
    addTransaction: (transaction: any) => ipcRenderer.invoke('db:addTransaction', transaction),
    bulkAddTransactions: (transactions: any[]) => ipcRenderer.invoke('db:bulkAddTransactions', transactions),
    getSubscriptions: () => ipcRenderer.invoke('db:getSubscriptions'),
    addSubscription: (subscription: any) => ipcRenderer.invoke('db:addSubscription', subscription),
    getSpendingByCategory: (params: { startDate: string; endDate: string }) =>
      ipcRenderer.invoke('db:getSpendingByCategory', params),
    getMonthlySpending: (params: { year: number }) => ipcRenderer.invoke('db:getMonthlySpending', params),
    getIncomeSummary: (params: { startDate: string; endDate: string }) =>
      ipcRenderer.invoke('db:getIncomeSummary', params),
    getTotalBalance: () => ipcRenderer.invoke('db:getTotalBalance'),
    getSetting: (key: string) => ipcRenderer.invoke('db:getSetting', key),
    setSetting: (key: string, value: any) => ipcRenderer.invoke('db:setSetting', key, value),
    isEmailProcessed: (emailId: string) => ipcRenderer.invoke('db:isEmailProcessed', emailId),
    markEmailProcessed: (emailId: string) => ipcRenderer.invoke('db:markEmailProcessed', emailId),
    clearAllData: () => ipcRenderer.invoke('db:clearAllData'),
  },

  // Google credentials
  google: {
    getCredentials: () => ipcRenderer.invoke('google:getCredentials'),
    setCredentials: (credentials: { clientId: string; clientSecret: string }) =>
      ipcRenderer.invoke('google:setCredentials', credentials),
    clearCredentials: () => ipcRenderer.invoke('google:clearCredentials'),
    hasCredentials: () => ipcRenderer.invoke('google:hasCredentials'),
  },

  // Gmail operations
  gmail: {
    checkAuth: () => ipcRenderer.invoke('gmail:checkAuth'),
    authenticate: () => ipcRenderer.invoke('gmail:authenticate'),
    disconnect: () => ipcRenderer.invoke('gmail:disconnect'),
    syncEmails: (options?: { fullSync?: boolean }) => ipcRenderer.invoke('gmail:syncEmails', options),
    getLastSync: () => ipcRenderer.invoke('gmail:getLastSync'),
    onSyncProgress: (callback: (data: { processed: number; total: number; newTransactions: number }) => void) => {
      const listener = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('gmail:syncProgress', listener);
      return () => ipcRenderer.removeListener('gmail:syncProgress', listener);
    },
  },

  // AI provider operations
  ai: {
    getConfig: () => ipcRenderer.invoke('ai:getConfig'),
    setConfig: (config: {
      type?: string;
      enabled?: boolean;
      apiKey?: string;
      baseUrl?: string;
      model?: string;
    }) => ipcRenderer.invoke('ai:setConfig', config),
    clearConfig: () => ipcRenderer.invoke('ai:clearConfig'),
    checkStatus: (type?: string) => ipcRenderer.invoke('ai:checkStatus', type),
    getMaskedKey: (type: string) => ipcRenderer.invoke('ai:getMaskedKey', type),
    getProviders: () => ipcRenderer.invoke('ai:getProviders'),
  },

  // Logger operations
  logs: {
    getAll: () => ipcRenderer.invoke('log:getAll'),
    clear: () => ipcRenderer.invoke('log:clear'),
    onNewLog: (callback: (data: any) => void) => {
      const listener = (_event: IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('log:new', listener);
      return () => ipcRenderer.removeListener('log:new', listener);
    },
  },
});
