// X Algorithm Toolkit — AI Engine v2
// Unified abstraction for OpenAI, Gemini, Claude, and Groq
// All calls are client-side: browser → AI provider directly. No backend.

export type AIProvider = 'openai' | 'gemini' | 'claude' | 'groq';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  niche: string;
}

// ── Provider Metadata ────────────────────────

export interface ProviderInfo {
  id: AIProvider;
  name: string;
  description: string;
  icon: string;
  models: { id: string; label: string }[];
  defaultModel: string;
  keyPlaceholder: string;
  keyHelpUrl: string;
  badge: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference with Llama models. Generous free tier.',
    icon: '⚡',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Best)' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Fastest)' },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    ],
    defaultModel: 'llama-3.3-70b-versatile',
    keyPlaceholder: 'gsk_...',
    keyHelpUrl: 'https://console.groq.com/keys',
    badge: '🟢 Free Tier',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI. Free tier with generous limits.',
    icon: '💎',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Recommended)' },
      { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (Fastest)' },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Best)' },
    ],
    defaultModel: 'gemini-2.0-flash',
    keyPlaceholder: 'AIza...',
    keyHelpUrl: 'https://aistudio.google.com/apikey',
    badge: '🟢 Free Tier',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o family. Industry standard, very reliable.',
    icon: '🧠',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Cheapest)' },
      { id: 'gpt-4o', label: 'GPT-4o (Best Quality)' },
      { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano (Fast)' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    ],
    defaultModel: 'gpt-4o-mini',
    keyPlaceholder: 'sk-...',
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    badge: '💰 Paid',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Claude Sonnet. Excellent writing quality and nuance.',
    icon: '🎭',
    models: [
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Latest)' },
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fastest)' },
    ],
    defaultModel: 'claude-sonnet-4-20250514',
    keyPlaceholder: 'sk-ant-...',
    keyHelpUrl: 'https://console.anthropic.com/settings/keys',
    badge: '💰 Paid',
  },
];

export function getProviderInfo(id: AIProvider): ProviderInfo {
  return PROVIDERS.find(p => p.id === id) || PROVIDERS[0];
}

export function getDefaultModel(provider: AIProvider): string {
  return getProviderInfo(provider).defaultModel;
}

// ── System Prompt ────────────────────────────

const SYSTEM_PROMPT_TEMPLATE = `You are an elite X (Twitter) content strategist and ghostwriter. You have studied X's open-source recommendation algorithm in depth — specifically the ranking_scorer.rs, author_diversity_scorer.rs, and topic_ids_filter.rs source files.

## ALGORITHMIC SCORING WEIGHTS (from source code)
These are the EXACT engagement prediction weights the algorithm uses:
- Reply = 27× baseline (THE most valuable action)
- Bookmark = 10× baseline
- Follow = 4× baseline  
- Dwell time = 2× baseline
- Like = 1× baseline
- Video quality view = 0.3× baseline
- Scrolled past (not_dwelled) = −11× penalty
- Not Interested / Block / Mute = −74× each (catastrophic)
- Report = −369× (nuclear)

## MANDATORY RULES FOR ALL CONTENT
1. NEVER place links in main post body. Links trigger a severe ranking penalty. Always instruct user to place links in the first reply.
2. Maximum 0-1 hashtags. 2+ triggers spam detection filters.
3. First line MUST be a scroll-stopping hook to prevent the −11× "not_dwelled" penalty. Use specificity (numbers, results, timeframes), contrarian angles, or curiosity gaps.
4. End EVERY post with a question or call-to-action to drive replies (the 27× signal).
5. Optimal single-tweet length: 100-250 characters. Long enough for dwell time, short enough to read fully.
6. Use multi-line formatting with line breaks to increase dwell time (the 2× signal).
7. Be hyper-specific (exact numbers, named entities, real data) — never generic.
8. Avoid ALL commonly muted spam words: "guaranteed returns", "get rich quick", "free money", "giveaway", "follow for follow", "link in bio", "dm me", etc.

## CONTENT FORMAT RULES
- No markdown formatting (no **, no ##, no bullet points with - or *)
- No emojis at the start of lines (feels spammy)
- Write in natural, conversational human voice — never robotic
- Each tweet must stand alone as valuable, even outside a thread

## USER'S NICHE: {{niche}}
Tailor ALL generated content specifically to this niche's audience, vocabulary, trending topics, and pain points. Write as a respected authority in this space.`;

export function getSystemPrompt(niche: string): string {
  return SYSTEM_PROMPT_TEMPLATE.replace('{{niche}}', niche || 'General / Multi-niche');
}

// ── Test Connection ──────────────────────────

export async function testConnection(settings: AISettings): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const start = Date.now();
  try {
    const result = await callAI('Reply with exactly: "Connection successful." Nothing else.', settings);
    const latencyMs = Date.now() - start;
    if (result && result.length > 0) {
      return { success: true, message: `Connected to ${settings.provider} (${settings.model}) in ${latencyMs}ms`, latencyMs };
    }
    return { success: false, message: 'Empty response received from provider.', latencyMs };
  } catch (error: any) {
    return { success: false, message: error.message || 'Connection failed.', latencyMs: Date.now() - start };
  }
}

// ── Core AI Call ─────────────────────────────

const REQUEST_TIMEOUT_MS = 30000;

export async function callAI(prompt: string, settings: AISettings): Promise<string> {
  const { provider, apiKey, model, niche } = settings;
  if (!apiKey) throw new Error('No API key configured. Go to Settings → AI Connection to add one.');

  const systemPrompt = getSystemPrompt(niche);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let result: string;
    switch (provider) {
      case 'openai':
        result = await callOpenAI(prompt, systemPrompt, apiKey, model, controller.signal);
        break;
      case 'gemini':
        result = await callGemini(prompt, systemPrompt, apiKey, model, controller.signal);
        break;
      case 'claude':
        result = await callClaude(prompt, systemPrompt, apiKey, model, controller.signal);
        break;
      case 'groq':
        result = await callGroq(prompt, systemPrompt, apiKey, model, controller.signal);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
    // Clean up any markdown artifacts the AI might add despite instructions
    return sanitizeResponse(result);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Try a faster model or check your connection.`);
    }
    throw new Error(error.message || 'Failed to generate content.');
  } finally {
    clearTimeout(timeoutId);
  }
}

function sanitizeResponse(text: string): string {
  if (!text) return '';
  // Strip leading/trailing whitespace
  let clean = text.trim();
  // Remove wrapping quotes if the entire response is quoted
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1);
  }
  return clean;
}

// ── Provider Adapters ────────────────────────

async function callOpenAI(prompt: string, systemPrompt: string, apiKey: string, model: string, signal: AbortSignal): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('Invalid OpenAI API key. Check your key in Settings.');
    if (res.status === 429) throw new Error('OpenAI rate limit reached. Wait a moment and try again.');
    throw new Error(err.error?.message || `OpenAI API Error (${res.status})`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(prompt: string, systemPrompt: string, apiKey: string, model: string, signal: AbortSignal): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 400) throw new Error('Invalid Gemini API key or model. Check Settings.');
    if (res.status === 429) throw new Error('Gemini rate limit reached. Wait a moment and try again.');
    throw new Error(err.error?.message || `Gemini API Error (${res.status})`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callClaude(prompt: string, systemPrompt: string, apiKey: string, model: string, signal: AbortSignal): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('Invalid Claude API key. Check Settings.');
    if (res.status === 429) throw new Error('Claude rate limit reached. Wait a moment and try again.');
    throw new Error(err.error?.message || `Claude API Error (${res.status})`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

async function callGroq(prompt: string, systemPrompt: string, apiKey: string, model: string, signal: AbortSignal): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('Invalid Groq API key. Check Settings.');
    if (res.status === 429) throw new Error('Groq rate limit reached. Wait a moment and try again.');
    throw new Error(err.error?.message || `Groq API Error (${res.status})`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
