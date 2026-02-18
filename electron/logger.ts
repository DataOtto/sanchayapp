import { BrowserWindow } from 'electron';

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 500;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sendToRenderer(entry: LogEntry): void {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send('log:new', entry);
  }
}

export function log(level: LogLevel, category: string, message: string, data?: any): void {
  const entry: LogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
  };

  logs.push(entry);

  // Keep only last MAX_LOGS entries
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  // Send to renderer
  sendToRenderer(entry);

  // Also log to console for debugging
  const prefix = `[${category}]`;
  switch (level) {
    case 'error':
      console.error(prefix, message, data || '');
      break;
    case 'warning':
      console.warn(prefix, message, data || '');
      break;
    case 'debug':
      console.debug(prefix, message, data || '');
      break;
    default:
      console.log(prefix, message, data || '');
  }
}

export function getLogs(): LogEntry[] {
  return [...logs];
}

export function clearLogs(): void {
  logs.length = 0;
}

// Convenience methods
export const logger = {
  info: (category: string, message: string, data?: any) => log('info', category, message, data),
  success: (category: string, message: string, data?: any) => log('success', category, message, data),
  warning: (category: string, message: string, data?: any) => log('warning', category, message, data),
  error: (category: string, message: string, data?: any) => log('error', category, message, data),
  debug: (category: string, message: string, data?: any) => log('debug', category, message, data),
};
