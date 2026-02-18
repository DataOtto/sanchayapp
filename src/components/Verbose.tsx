'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Terminal,
  Trash2,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Pause,
  Play,
} from 'lucide-react';
import { useTheme, themes } from '@/lib/theme';
import type { LogEntry, LogLevel } from '@/types';

interface VerboseProps {
  isElectron: boolean;
}

const LEVEL_CONFIG: Record<LogLevel, { icon: React.ReactNode; color: string; bg: string }> = {
  info: { icon: <Info size={14} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  success: { icon: <CheckCircle size={14} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  warning: { icon: <AlertTriangle size={14} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  error: { icon: <AlertCircle size={14} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  debug: { icon: <Bug size={14} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
};

export function Verbose({ isElectron }: VerboseProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const t = themes[theme];

  useEffect(() => {
    if (!isElectron || !window.electronAPI?.logs) return;

    // Load existing logs
    window.electronAPI.logs.getAll().then(setLogs);

    // Subscribe to new logs
    const unsubscribe = window.electronAPI.logs.onNewLog((entry) => {
      if (!isPaused) {
        setLogs((prev) => [...prev, entry]);
      }
    });

    return () => unsubscribe();
  }, [isElectron, isPaused]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleClearLogs = async () => {
    if (!window.electronAPI?.logs) return;
    await window.electronAPI.logs.clear();
    setLogs([]);
  };

  const handleExportLogs = () => {
    const content = logs
      .map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}${log.data ? ` | ${JSON.stringify(log.data)}` : ''}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanchay-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = Array.from(new Set(logs.map((l) => l.category))).sort();

  const filteredLogs = logs.filter((log) => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
    return true;
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
              <Terminal size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: t.text }}>
                Verbose Logs
              </h1>
              <p className="text-sm" style={{ color: t.textMuted }}>
                {logs.length} total logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: isPaused ? 'rgba(245, 158, 11, 0.1)' : t.bgInput,
                color: isPaused ? '#f59e0b' : t.textSecondary,
              }}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleExportLogs}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: t.bgInput, color: t.textSecondary }}
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-500"
              style={{ background: t.bgInput, color: t.textSecondary }}
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <Filter size={16} style={{ color: t.textMuted }} />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1">
            {(['all', 'info', 'success', 'warning', 'error', 'debug'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: filter === level
                    ? level === 'all'
                      ? t.accent
                      : LEVEL_CONFIG[level as LogLevel].bg
                    : t.bgInput,
                  color: filter === level
                    ? level === 'all'
                      ? 'white'
                      : LEVEL_CONFIG[level as LogLevel].color
                    : t.textMuted,
                }}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: t.bgInput,
              color: t.text,
              border: `1px solid ${t.border}`,
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex-1" />

          {/* Auto-scroll toggle */}
          <label className="flex items-center gap-2 text-xs" style={{ color: t.textMuted }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
        </div>

        {/* Log Container */}
        <div
          ref={logContainerRef}
          className="flex-1 rounded-xl overflow-y-auto font-mono text-sm"
          style={{
            background: t.bgCard,
            border: `1px solid ${t.border}`,
          }}
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full" style={{ color: t.textMuted }}>
              <div className="text-center">
                <Terminal size={48} className="mx-auto mb-4 opacity-50" />
                <p>No logs yet</p>
                <p className="text-xs mt-1">Logs will appear here as actions occur</p>
              </div>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: t.border }}>
              {filteredLogs.map((log) => {
                const config = LEVEL_CONFIG[log.level];
                return (
                  <div
                    key={log.id}
                    className="px-4 py-2 flex items-start gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Time */}
                    <span className="text-xs shrink-0 w-20" style={{ color: t.textDim }}>
                      {formatTime(log.timestamp)}
                    </span>

                    {/* Level Icon */}
                    <span
                      className="shrink-0 p-1 rounded"
                      style={{ background: config.bg, color: config.color }}
                    >
                      {config.icon}
                    </span>

                    {/* Category */}
                    <span
                      className="shrink-0 px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: t.bgInput, color: t.textSecondary }}
                    >
                      {log.category}
                    </span>

                    {/* Message */}
                    <span className="flex-1" style={{ color: t.text }}>
                      {log.message}
                    </span>

                    {/* Data */}
                    {log.data && (
                      <span
                        className="text-xs px-2 py-0.5 rounded max-w-xs truncate"
                        style={{ background: t.bgInput, color: t.textMuted }}
                        title={JSON.stringify(log.data, null, 2)}
                      >
                        {typeof log.data === 'object'
                          ? JSON.stringify(log.data)
                          : String(log.data)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div
          className="mt-2 flex items-center justify-between text-xs px-2"
          style={{ color: t.textDim }}
        >
          <span>
            Showing {filteredLogs.length} of {logs.length} logs
          </span>
          {isPaused && (
            <span className="flex items-center gap-1 text-amber-500">
              <Pause size={12} />
              Live updates paused
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
