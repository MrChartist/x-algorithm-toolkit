import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { scorePost } from '../engine/scorer';
import { toast } from './Toast';

interface SavedDraft {
  id: string;
  text: string;
  score: number;
  grade: string;
  gradeColor: string;
  savedAt: number;
  label: string;
}

const DRAFTS_KEY = 'x-algo-drafts';

function loadDrafts(): SavedDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDrafts(drafts: SavedDraft[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export function DraftManager({ onLoadDraft }: { onLoadDraft?: (text: string) => void }) {
  const [drafts, setDrafts] = useState<SavedDraft[]>(loadDrafts);
  const [newText, setNewText] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => { saveDrafts(drafts); }, [drafts]);

  const handleSave = () => {
    if (!newText.trim()) return;
    const r = scorePost(newText, { hasMedia: false });
    const draft: SavedDraft = {
      id: Date.now().toString(36),
      text: newText.trim(),
      score: r.totalScore,
      grade: r.grade,
      gradeColor: r.gradeColor,
      savedAt: Date.now(),
      label: newLabel.trim() || `Draft ${drafts.length + 1}`,
    };
    setDrafts(prev => [draft, ...prev]);
    setNewText('');
    setNewLabel('');
    setShowSaveForm(false);
    toast('success', 'Draft saved!');
  };

  const handleDelete = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
    toast('info', 'Draft deleted');
  };

  const handleRename = (id: string) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, label: editLabel.trim() || d.label } : d));
    setEditingId(null);
    toast('success', 'Draft renamed');
  };

  const handleRescore = (id: string) => {
    setDrafts(prev => prev.map(d => {
      if (d.id !== id) return d;
      const r = scorePost(d.text, { hasMedia: false });
      return { ...d, score: r.totalScore, grade: r.grade, gradeColor: r.gradeColor };
    }));
    toast('info', 'Score updated');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('success', 'Copied to clipboard!');
  };

  const sorted = [...drafts].sort((a, b) =>
    sortBy === 'score' ? b.score - a.score : b.savedAt - a.savedAt
  );

  const timeAgo = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2>📝 Draft Manager</h2>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
            Save, organize, and compare your tweet drafts. {drafts.length > 0 && <span className="font-mono text-accent">{drafts.length} saved</span>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowSaveForm(!showSaveForm)}>
          {showSaveForm ? '✕ Cancel' : '+ New Draft'}
        </button>
      </div>

      {/* Save form */}
      <AnimatePresence>
        {showSaveForm && (
          <motion.div className="card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input className="input" placeholder="Draft label (optional)" value={newLabel}
                onChange={e => setNewLabel(e.target.value)} style={{ maxWidth: 250 }} />
            </div>
            <textarea className="textarea" placeholder="Type or paste your tweet draft..."
              value={newText} onChange={e => setNewText(e.target.value)}
              style={{ minHeight: 100, marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: newText.length > 280 ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                {newText.length}/280
              </span>
              <button className="btn btn-primary" onClick={handleSave} disabled={!newText.trim()}>
                💾 Save & Score
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort controls */}
      {drafts.length > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Sort:</span>
          <button className={`btn ${sortBy === 'date' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSortBy('date')} style={{ fontSize: '0.72rem', padding: '4px 10px' }}>🕐 Newest</button>
          <button className={`btn ${sortBy === 'score' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSortBy('score')} style={{ fontSize: '0.72rem', padding: '4px 10px' }}>🏆 Top Score</button>
        </div>
      )}

      {/* Drafts list */}
      {sorted.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📝</div>
          <h4 style={{ color: 'var(--text-secondary)' }}>No drafts saved yet</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', maxWidth: 320, margin: '8px auto 0' }}>
            Save tweet drafts to compare versions, track scores, and find your best content before posting.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {sorted.map((draft, i) => (
              <motion.div key={draft.id} className="card"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{ position: 'relative' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    {editingId === draft.id ? (
                      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                        <input className="input" value={editLabel} onChange={e => setEditLabel(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleRename(draft.id)}
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }} autoFocus />
                        <button className="btn btn-primary" onClick={() => handleRename(draft.id)}
                          style={{ padding: '4px 10px', fontSize: '0.72rem' }}>✓</button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {draft.label}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>{timeAgo(draft.savedAt)}</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: draft.gradeColor }}>
                      {draft.score}
                    </span>
                    <span className="badge" style={{ background: draft.gradeColor + '20', color: draft.gradeColor, border: `1px solid ${draft.gradeColor}40`, fontSize: '0.6rem' }}>
                      {draft.grade}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{
                  background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                  fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', border: '1px solid var(--border)',
                  maxHeight: 120, overflow: 'hidden', position: 'relative',
                }}>
                  {draft.text}
                  {draft.text.length > 200 && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: 32,
                      background: 'linear-gradient(transparent, var(--bg-primary))',
                    }} />
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => handleCopy(draft.text)}
                    style={{ fontSize: '0.72rem', padding: '4px 10px' }}>📋 Copy</button>
                  {onLoadDraft && (
                    <button className="btn btn-secondary" onClick={() => { onLoadDraft(draft.text); toast('info', 'Loaded into Scorer'); }}
                      style={{ fontSize: '0.72rem', padding: '4px 10px' }}>🎯 Score</button>
                  )}
                  <button className="btn btn-secondary" onClick={() => handleRescore(draft.id)}
                    style={{ fontSize: '0.72rem', padding: '4px 10px' }}>🔄 Re-score</button>
                  <button className="btn btn-ghost" onClick={() => { setEditingId(draft.id); setEditLabel(draft.label); }}
                    style={{ fontSize: '0.72rem', padding: '4px 10px' }}>✏️ Rename</button>
                  <button className="btn btn-ghost" onClick={() => handleDelete(draft.id)}
                    style={{ fontSize: '0.72rem', padding: '4px 10px', color: 'var(--danger)' }}>🗑 Delete</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Stats */}
      {drafts.length >= 3 && (
        <div className="card" style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>
              {drafts.length}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Drafts</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
              {Math.max(...drafts.map(d => d.score))}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Best Score</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
              {Math.round(drafts.reduce((s, d) => s + d.score, 0) / drafts.length)}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Avg Score</div>
          </div>
        </div>
      )}
    </div>
  );
}
