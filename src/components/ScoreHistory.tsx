import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from './Toast';

interface ScoreEntry {
  id: string;
  text: string;
  score: number;
  grade: string;
  gradeColor: string;
  timestamp: number;
}

const HISTORY_KEY = 'x-algo-score-history';
const MAX_HISTORY = 50;

function loadHistory(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addToHistory(text: string, score: number, grade: string, gradeColor: string) {
  const history = loadHistory();
  const entry: ScoreEntry = {
    id: Date.now().toString(36),
    text: text.substring(0, 280),
    score, grade, gradeColor,
    timestamp: Date.now(),
  };
  const updated = [entry, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('history-updated'));
}

export function ScoreHistory() {
  const [history, setHistory] = useState<ScoreEntry[]>(loadHistory);
  const [filter, setFilter] = useState<'all' | 'high' | 'mid' | 'low'>('all');

  const refresh = useCallback(() => setHistory(loadHistory()), []);

  useEffect(() => {
    window.addEventListener('history-updated', refresh);
    return () => window.removeEventListener('history-updated', refresh);
  }, [refresh]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'high': return history.filter(h => h.score >= 70);
      case 'mid':  return history.filter(h => h.score >= 40 && h.score < 70);
      case 'low':  return history.filter(h => h.score < 40);
      default:     return history;
    }
  }, [history, filter]);

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const scores = history.map(h => h.score);
    return {
      count: history.length,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      best: Math.max(...scores),
      worst: Math.min(...scores),
      trend: history.length >= 5
        ? Math.round(
            history.slice(0, 5).reduce((s, h) => s + h.score, 0) / 5 -
            history.slice(-5).reduce((s, h) => s + h.score, 0) / 5
          )
        : 0,
    };
  }, [history]);

  const handleClear = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    toast('info', 'History cleared');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('success', 'Copied!');
  };

  const timeAgo = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  // Mini bar chart (last 20)
  const chartData = history.slice(0, 20).reverse();
  const maxScore = 100;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2>📈 Score History</h2>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
            Track your scoring trends over time. Last {MAX_HISTORY} scores saved.
          </p>
        </div>
        {history.length > 0 && (
          <button className="btn btn-ghost" onClick={handleClear}
            style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>🗑 Clear All</button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Scored', value: stats.count, color: 'var(--accent)' },
            { label: 'Average', value: stats.avg, color: 'var(--text-primary)' },
            { label: 'Best', value: stats.best, color: 'var(--success)' },
            { label: 'Worst', value: stats.worst, color: 'var(--danger)' },
            { label: 'Trend', value: `${stats.trend >= 0 ? '+' : ''}${stats.trend}`, color: stats.trend >= 0 ? 'var(--success)' : 'var(--danger)' },
          ].map((s, i) => (
            <motion.div key={s.label} className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ flex: 1, minWidth: 90, textAlign: 'center', padding: '14px 12px' }}>
              <div className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Mini chart */}
      {chartData.length >= 3 && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>Score Trend (Last {chartData.length})</h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
            {chartData.map((entry, i) => {
              const height = (entry.score / maxScore) * 100;
              return (
                <motion.div key={entry.id} initial={{ height: 0 }} animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.02, duration: 0.3 }}
                  title={`${entry.score} — ${entry.grade}`}
                  style={{
                    flex: 1, borderRadius: '3px 3px 0 0',
                    background: entry.score >= 70 ? 'var(--success)' : entry.score >= 40 ? 'var(--warning)' : 'var(--danger)',
                    opacity: 0.8, minWidth: 4, cursor: 'pointer',
                  }} />
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${history.length})` },
            { id: 'high', label: `🟢 High (${history.filter(h => h.score >= 70).length})` },
            { id: 'mid', label: `🟡 Mid (${history.filter(h => h.score >= 40 && h.score < 70).length})` },
            { id: 'low', label: `🔴 Low (${history.filter(h => h.score < 40).length})` },
          ].map(f => (
            <button key={f.id} className={`btn ${filter === f.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f.id as typeof filter)}
              style={{ fontSize: '0.72rem', padding: '4px 10px' }}>{f.label}</button>
          ))}
        </div>
      )}

      {/* History list */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📈</div>
          <h4 style={{ color: 'var(--text-secondary)' }}>{history.length === 0 ? 'No history yet' : 'No matches for this filter'}</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', maxWidth: 320, margin: '8px auto 0' }}>
            {history.length === 0 ? 'Score tweets in the Post Scorer tab to build your history.' : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((entry, i) => (
            <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              }}
              onClick={() => handleCopy(entry.text)}>
              <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: entry.gradeColor, minWidth: 32 }}>
                {entry.score}
              </span>
              <span className="badge" style={{ background: entry.gradeColor + '20', color: entry.gradeColor, border: `1px solid ${entry.gradeColor}40`, fontSize: '0.58rem', flexShrink: 0 }}>
                {entry.grade}
              </span>
              <span style={{
                flex: 1, fontSize: '0.8rem', color: 'var(--text-secondary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {entry.text}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                {timeAgo(entry.timestamp)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
