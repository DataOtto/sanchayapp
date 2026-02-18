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

  // AI operations
  ai: {
    getApiKey: () => ipcRenderer.invoke('ai:getApiKey'),
    setApiKey: (key: string) => ipcRenderer.invoke('ai:setApiKey', key),
    clearApiKey: () => ipcRenderer.invoke('ai:clearApiKey'),
    hasApiKey: () => ipcRenderer.invoke('ai:hasApiKey'),
  },
});
