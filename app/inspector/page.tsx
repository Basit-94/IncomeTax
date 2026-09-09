'use client';

/**
 * /inspector — who is on Wapsi, live. Team-only page; nothing on the citizen-facing site links here.
 *
 * Redesign 2026-09-09 on the Sunrise/Lilac + Navy & Coral tokens (docs/DESIGN.md §0): glass cards
 * at 24 px, ink surfaces, Outfit 800 figures, mono eyebrows, Munshi ji on the brand box and on every
 * assistant bubble. Viewer buckets (judge · tester · agent) come from lib/telemetry/bucket.ts.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Moon,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Smartphone,
  Sun,
} from 'lucide-react';
import { Munshi, MunshiAvatar } from '@/components/brand/munshi';

interface ActivityEvent {
  id: string;
  session_id: string;
  pan: string;
  user_name: string;
  user_kind: string;
  event_type: string;
  details: string | Record<string, unknown>;
  user_agent: string;
  screen_size: string;
  lang: string;
  created_at: string;
  origin?: string | null;
  tester?: string | null;
  automation?: boolean;
  bucket?: 'judge' | 'tester' | 'agent';
}

interface AgentRun {
  id: string;
  owner_pan: string;
  owner_kind: string;
  task: string;
  status: string;
  lang: string;
  created_at: string;
  updated_at: string;
}

interface AgentEvent {
  id?: string;
  run_id: string;
  seq: number;
  type?: string;
  payload: { type?: string; role?: string; text?: string; name?: string; args?: Record<string, unknown> };
  created_at: string;
}

interface CAReview { id: string; code: string; citizen_pan: string; status: string; mode: string; created_at: string }
interface CAAccount { id: string; membership_no: string; name: string; firm_name: string; city: string; email: string }
interface JudgeAlert { session_id: string; kind: 'arrival' | 'sign_in'; pan: string | null; user_name: string | null; origin: string | null; sent_at: string }

interface StatsData {
  activities: ActivityEvent[];
  bucketCounts: Record<string, number>;
  runs: AgentRun[];
  runEvents: AgentEvent[];
  vaultDocuments: Array<{ id: string; category: string; file_name: string; updated_at: string }>;
  snapshots: Array<{ id: string; pan: string; status: string; created_at: string }>;
  caReviews: CAReview[];
  caAccounts: CAAccount[];
  alerts: JudgeAlert[];
  alertsConfigured: boolean;
}

type Bucket = 'judge' | 'tester' | 'agent' | 'all';
type Range = 'today' | 'yesterday' | '7d' | 'all';

interface Session {
  id: string;
  pan: string;
  userName: string;
  userKind: string;
  bucket: 'judge' | 'tester' | 'agent';
  origin: string;
  tester: string | null;
  userAgent: string;
  screenSize: string;
  lang: string;
  firstSeen: string;
  lastSeen: string;
  events: ActivityEvent[];
  chats: Array<{ run: AgentRun; events: AgentEvent[] }>;
}

const BUCKET_LABEL: Record<Bucket, string> = { judge: 'Judges', tester: 'Testers', agent: 'Agents', all: 'Everyone' };
const RANGE_LABEL: Record<Range, string> = { today: 'Today', yesterday: 'Yesterday', '7d': '7 days', all: 'All time' };

const KIND_PILL: Record<string, string> = {
  judge: 'bg-amber-bg text-amber-ink',
  tester: 'bg-tertiary/15 text-tertiary',
  agent: 'bg-warn-soft text-warn',
  ca: 'bg-ok-soft text-ok-ink',
  demo: 'bg-white/55 dark:bg-white/10 text-ink-2 border border-glass-edge',
};

const REVIEW_PILL: Record<string, string> = {
  accepted: 'bg-ok-soft text-ok-ink',
  reviewed: 'bg-tertiary/15 text-tertiary',
  declined: 'bg-bad-soft text-bad',
};

const EVENT_LABEL: Record<string, string> = {
  page_view: 'Opened a page',
  sign_in: 'Signed in',
  sign_out: 'Signed out',
  switch_lang: 'Changed language',
  switch_theme: 'Changed theme',
  switch_mode: 'Switched mode',
  upload_doc: 'Uploaded a document',
  tab_switch: 'Switched tab',
  step_advance: 'Moved to the next step',
  compute_tax: 'Computed tax',
  regime_select: 'Chose a regime',
  dispute_create: 'Raised a dispute',
  bank_fix: 'Fixed bank details',
  challan_pay: 'Paid a challan',
  itrv_download: 'Downloaded the ITR-V',
  itrv_print: 'Printed the ITR-V',
  agent_prompt: 'Asked Munshi ji',
  agent_reply: 'Munshi ji replied',
  mic_dictation: 'Dictated by voice',
  vault_open: 'Opened the Tax Vault',
  vault_doc_view: 'Viewed a vault document',
  ca_share_open: 'Opened CA sharing',
  ca_request_send: 'Sent a CA request',
  ca_review_view: 'Viewed a CA review',
  ca_adopt_version: 'Adopted the CA version',
  ca_register: 'Registered as a CA',
  ca_login: 'Signed in to the CA portal',
  error_encounter: 'Hit an error',
};

const inr = (n: unknown) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const clock = (iso: string, seconds = false) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}) });
const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

function parseDetails(details: string | Record<string, unknown>): Record<string, unknown> {
  if (typeof details === 'object' && details !== null) return details;
  try { return JSON.parse(details || '{}'); } catch { return {}; }
}

function describe(evt: ActivityEvent): string {
  const d = parseDetails(evt.details);
  switch (evt.event_type) {
    case 'page_view': return `Opened ${String(d.path || '/')}`;
    case 'sign_in': return `Signed in as ${String(d.name || d.pan || 'Citizen')}${d.method ? ` · ${String(d.method).replace(/_/g, ' ')}` : ''}`;
    case 'upload_doc': return `Uploaded ${String(d.filename || d.name || 'a document')}${d.kind ? ` (${String(d.kind)})` : ''}`;
    case 'tab_switch': return `Switched to ${String(d.tab || 'a tab')}`;
    case 'switch_theme': return `Switched to the ${String(d.theme || '')} theme`;
    case 'switch_lang': return `Changed language to ${String(d.lang || d.to || '')}`;
    case 'compute_tax': return `Computed tax on ${inr(d.grossSalary)} · tax ${inr(d.tax)}`;
    case 'regime_select': return `Chose the ${String(d.regime || '').toUpperCase()} regime${d.savings ? ` · saves ${inr(d.savings)}` : ''}`;
    case 'challan_pay': return `Paid self-assessment tax of ${inr(d.amount)}`;
    case 'agent_prompt': return `Asked Munshi ji: “${String(d.prompt || d.text || '')}”`;
    case 'agent_reply': return 'Munshi ji replied';
    default: return EVENT_LABEL[evt.event_type] || evt.event_type.replace(/_/g, ' ');
  }
}

function deviceOf(ua: string): string {
  if (!ua) return '';
  if (/iPhone|iPad/i.test(ua)) return 'iPhone';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Browser';
}

function Pill({ tone, children, mono = false }: { tone: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${mono ? 'font-mono tracking-wider' : ''} ${tone}`}>
      {children}
    </span>
  );
}

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ v: T; label: string; count?: number }>; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg inline-flex" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)} className="cursor-pointer transition inline-flex items-center gap-1.5">
          {o.label}
          {typeof o.count === 'number' && <span className={`font-mono text-[10.5px] ${value === o.v ? 'opacity-80' : 'text-ink-3'}`}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export default function InspectorPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('today');
  const [bucket, setBucket] = useState<Bucket>('judge');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'journeys' | 'ca'>('journeys');
  const [lastUpdated, setLastUpdated] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    try { if (localStorage.getItem('wapsi_theme') === 'light') setTheme('light'); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    for (const el of [document.documentElement, document.body]) {
      el?.classList.toggle('dark', theme === 'dark');
      el?.classList.toggle('dark-mode', theme === 'dark');
    }
    try { localStorage.setItem('wapsi_theme', theme); } catch { /* ignore */ }
  }, [theme]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/telemetry/stats?range=${range}&bucket=${bucket}&user=${encodeURIComponent(search)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data) {
          setData(json.data);
          setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch {
      // safe failover
    } finally {
      setLoading(false);
    }
  }, [range, bucket, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(fetchData, 3000);
    return () => clearInterval(t);
  }, [autoRefresh, fetchData]);

  const sessions = useMemo<Session[]>(() => {
    if (!data) return [];
    const map = new Map<string, Session>();

    for (const act of data.activities) {
      const sid = act.session_id || act.pan || 's_anon';
      if (!map.has(sid)) {
        map.set(sid, {
          id: sid,
          pan: act.pan || 'ANONYMOUS',
          userName: act.user_name || 'Visitor',
          userKind: act.user_kind || 'citizen',
          bucket: act.bucket || 'judge',
          origin: act.origin || '',
          tester: act.tester || null,
          userAgent: act.user_agent || '',
          screenSize: act.screen_size || '',
          lang: act.lang || 'en',
          firstSeen: act.created_at,
          lastSeen: act.created_at,
          events: [],
          chats: [],
        });
      }
      const s = map.get(sid)!;
      if (new Date(act.created_at) > new Date(s.lastSeen)) s.lastSeen = act.created_at;
      if (new Date(act.created_at) < new Date(s.firstSeen)) s.firstSeen = act.created_at;
      if (act.pan && act.pan !== 'ANONYMOUS') s.pan = act.pan;
      if (act.user_name && act.user_name !== 'Visitor') s.userName = act.user_name;
      if (act.user_kind) s.userKind = act.user_kind;
      if (act.origin && !s.origin) s.origin = act.origin;
      if (act.tester && !s.tester) s.tester = act.tester;
      if (act.user_agent && !s.userAgent) s.userAgent = act.user_agent;
      if (act.screen_size && !s.screenSize) s.screenSize = act.screen_size;
      s.events.push(act);

      if (act.event_type === 'agent_prompt' || act.event_type === 'agent_reply') {
        const d = parseDetails(act.details);
        const runId = `copilot_${sid}`;
        let chat = s.chats.find((c) => c.run.id === runId);
        if (!chat) {
          chat = {
            run: { id: runId, owner_pan: s.pan, owner_kind: s.userKind, task: 'Munshi ji conversation', status: 'live', lang: s.lang, created_at: act.created_at, updated_at: act.created_at },
            events: [],
          };
          s.chats.push(chat);
        }
        const text = act.event_type === 'agent_prompt' ? (d.prompt || d.text) : (d.reply || d.text);
        if (text) {
          chat.events.push({
            id: act.id,
            run_id: runId,
            seq: chat.events.length + 1,
            payload: { type: 'message', role: act.event_type === 'agent_prompt' ? 'user' : 'assistant', text: String(text) },
            created_at: act.created_at,
          });
        }
      }
    }

    // Autonomous runs carry no bucket; attach to the session with the same PAN, otherwise only under "Everyone".
    for (const run of data.runs) {
      const byPan = Array.from(map.values()).find((s) => s.pan === run.owner_pan);
      const rEvents = data.runEvents.filter((e) => e.run_id === run.id);
      if (byPan) {
        byPan.chats.push({ run, events: rEvents });
        if (new Date(run.updated_at || run.created_at) > new Date(byPan.lastSeen)) byPan.lastSeen = run.updated_at || run.created_at;
        continue;
      }
      if (bucket !== 'all') continue;
      const sid = `run_${run.owner_pan || 'anon'}`;
      if (!map.has(sid)) {
        map.set(sid, {
          id: sid, pan: run.owner_pan || 'ANONYMOUS', userName: run.owner_kind === 'demo' ? `Demo (${run.owner_pan})` : run.owner_pan,
          userKind: run.owner_kind, bucket: 'judge', origin: '', tester: null, userAgent: '', screenSize: '', lang: run.lang || 'en',
          firstSeen: run.created_at, lastSeen: run.updated_at || run.created_at, events: [], chats: [],
        });
      }
      map.get(sid)!.chats.push({ run, events: rEvents });
    }

    for (const s of map.values()) {
      s.events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      for (const c of s.chats) c.events.sort((a, b) => a.seq - b.seq);
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
  }, [data, bucket]);

  const stats = useMemo(() => {
    const prompts = data?.activities.filter((a) => a.event_type === 'agent_prompt').length || 0;
    const signedIn = sessions.filter((s) => s.events.some((e) => e.event_type === 'sign_in' || e.event_type === 'ca_login')).length;
    return {
      sessions: sessions.length,
      signedIn,
      chats: sessions.filter((s) => s.chats.length > 0).length,
      prompts,
      vault: data?.vaultDocuments.length || 0,
      filed: data?.snapshots.length || 0,
      reviews: data?.caReviews.length || 0,
      cas: data?.caAccounts.length || 0,
    };
  }, [data, sessions]);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const exportReport = () => {
    if (!data) return;
    let text = 'WAPSI — ACTIVITY REPORT\n';
    text += `Generated ${new Date().toLocaleString('en-IN')} · ${RANGE_LABEL[range]} · ${BUCKET_LABEL[bucket]}\n\n`;
    text += `Sessions ${stats.sessions} · signed in ${stats.signedIn} · Munshi ji chats ${stats.chats} · vault documents ${stats.vault} · returns filed ${stats.filed} · CA reviews ${stats.reviews}\n`;
    sessions.forEach((s, i) => {
      text += `\n[${i + 1}] ${s.userName} · ${s.pan} · ${s.bucket}${s.tester ? ` (${s.tester})` : ''} · ${s.origin || '—'} · ${s.lang} · ${s.screenSize || '—'}\n`;
      text += `    ${day(s.firstSeen)} ${clock(s.firstSeen, true)} → ${clock(s.lastSeen, true)}\n`;
      for (const e of s.events) text += `    - ${clock(e.created_at, true)}  ${describe(e)}\n`;
      for (const c of s.chats) for (const ev of c.events) {
        if (ev.payload?.type === 'message' && ev.payload.text) text += `    ${ev.payload.role === 'user' ? '[Visitor]' : '[Munshi ji]'} ${ev.payload.text}\n`;
      }
    });
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wapsi-activity-${range}-${bucket}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = data?.bucketCounts || { judge: 0, tester: 0, agent: 0 };
  const everyone = (counts.judge || 0) + (counts.tester || 0) + (counts.agent || 0);

  return (
    <div className="min-h-dvh text-ink font-sans">
      <div className="max-w-[1180px] mx-auto px-4 md:px-6 py-5 md:py-7 space-y-5">
        {/* Header */}
        <header className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-[52px] rounded-[16px] ink-surface grid place-items-center shrink-0"><Munshi size={38} animated /></div>
            <div className="min-w-0">
              <div className="font-mono text-[11px] font-bold uppercase tracking-[.12em] text-ink-3 flex items-center gap-2">
                Inspector
                <span className={`inline-flex items-center gap-1.5 ${autoRefresh ? 'text-ok' : 'text-ink-3'}`}>
                  <span className={`size-1.5 rounded-full ${autoRefresh ? 'bg-ok animate-pulse' : 'bg-ink-3'}`} />
                  {autoRefresh ? 'Live' : 'Paused'}
                </span>
              </div>
              <h1 className="text-[26px] md:text-[30px] font-extrabold tracking-[-.03em] leading-tight">Who is on Wapsi</h1>
            </div>
          </div>
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" className="size-10 rounded-[14px] glass-flat grid place-items-center text-ink-2 cursor-pointer hover:text-ink">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button type="button" onClick={() => setAutoRefresh((v) => !v)} className="h-10 px-3.5 rounded-[14px] glass-flat text-[12.5px] font-bold text-ink-2 inline-flex items-center gap-2 cursor-pointer hover:text-ink">
              {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
              {autoRefresh ? 'Pause' : 'Resume'}
            </button>
            <button type="button" onClick={exportReport} className="btn-primary h-10 px-4 rounded-[14px] text-[13px] inline-flex items-center gap-2 cursor-pointer">
              <Download size={14} /> Export
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Seg
            label="Who"
            value={bucket}
            onChange={(v) => { setBucket(v); setExpanded({}); }}
            options={[
              { v: 'judge', label: 'Judges', count: counts.judge || 0 },
              { v: 'tester', label: 'Testers', count: counts.tester || 0 },
              { v: 'agent', label: 'Agents', count: counts.agent || 0 },
              { v: 'all', label: 'Everyone', count: everyone },
            ]}
          />
          <Seg label="When" value={range} onChange={setRange} options={(['today', 'yesterday', '7d', 'all'] as Range[]).map((r) => ({ v: r, label: RANGE_LABEL[r] }))} />
          <div className="relative flex-1 min-w-[220px] max-w-[320px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="PAN, name or tester"
              className="h-10 w-full rounded-[14px] border-[1.5px] border-glass-edge bg-white/80 dark:bg-white/10 ps-9 pe-3 font-mono text-[12.5px] text-ink placeholder:text-ink-3 placeholder:font-sans outline-none focus:border-money"
            />
          </div>
          {lastUpdated && (
            <span className="ms-auto font-mono text-[11px] text-ink-3 inline-flex items-center gap-1.5"><Clock size={12} />{lastUpdated}</span>
          )}
        </div>

        {/* Figures */}
        <section className="glass rounded-[24px] px-[22px] py-[18px]">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-y-5">
            {[
              { k: BUCKET_LABEL[bucket].toLowerCase() === 'everyone' ? 'Visitors' : BUCKET_LABEL[bucket], v: stats.sessions, d: `${stats.signedIn} signed in` },
              { k: 'Munshi ji chats', v: stats.chats, d: `${stats.prompts} questions` },
              { k: 'Vault documents', v: stats.vault, d: 'Form 16 · AIS · 26AS' },
              { k: 'Returns filed', v: stats.filed, d: 'ITR-1' },
              { k: 'CA reviews', v: stats.reviews, d: `${stats.cas} registered CAs` },
            ].map((f, i) => (
              <div key={f.k} className={`px-1 ${i > 0 ? 'md:border-s md:border-line md:ps-6' : ''}`}>
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.08em] text-ink-3">{f.k}</div>
                <div className="font-sans font-extrabold text-[34px] leading-none tracking-[-.03em] mt-1.5 tabular-nums">{f.v}</div>
                <div className="text-[12px] text-ink-2 mt-1.5">{f.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Phone alerts */}
        <section className="ink-surface rounded-[24px] px-[22px] py-[16px] flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-[12px] bg-white/10 grid place-items-center shrink-0">{data?.alertsConfigured ? <Bell size={16} /> : <BellOff size={16} />}</div>
            <div className="min-w-0">
              <div className="text-[14px] font-extrabold flex items-center gap-2">
                Phone alerts
                <Pill tone={data?.alertsConfigured ? 'bg-ok/20 text-ok-ink dark:text-ok' : 'bg-white/10 text-on-ink/70'}>{data?.alertsConfigured ? 'On' : 'Not set up'}</Pill>
              </div>
              <p className="text-[12px] opacity-75 mt-0.5">
                {data?.alertsConfigured
                  ? 'One push when a judge arrives, one more when they sign in. Testers and agents never ring.'
                  : 'Set JUDGE_ALERT_NTFY_TOPIC on the server and subscribe to that topic in the ntfy app.'}
              </p>
            </div>
          </div>
          {data && data.alerts.length > 0 && (
            <ul className="ms-auto flex flex-wrap gap-2 max-w-full">
              {data.alerts.slice(0, 4).map((a) => (
                <li key={`${a.session_id}_${a.kind}`} className="rounded-[12px] bg-white/10 px-3 py-1.5 text-[11.5px] inline-flex items-center gap-2">
                  <Smartphone size={12} className="opacity-70" />
                  <span className="font-bold">{a.kind === 'sign_in' ? (a.user_name && a.user_name !== 'Visitor' ? a.user_name : a.pan || 'Sign-in') : 'Arrived'}</span>
                  <span className="font-mono opacity-70">{day(a.sent_at)} {clock(a.sent_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Tabs */}
        <div className="flex items-center gap-5 border-b border-line">
          {([
            { k: 'journeys', label: `Journeys · ${sessions.length}` },
            { k: 'ca', label: `CA portal · ${stats.cas}` },
          ] as const).map((t) => (
            <button key={t.k} type="button" onClick={() => setActiveTab(t.k)} className={`pb-2.5 -mb-px text-[13px] font-bold border-b-2 transition cursor-pointer ${activeTab === t.k ? 'border-money text-ink' : 'border-transparent text-ink-3 hover:text-ink-2'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'journeys' && (
          <div className="space-y-3">
            {loading && !data ? (
              <div className="glass rounded-[24px] p-10 text-center text-ink-3 text-[13px]">Loading…</div>
            ) : sessions.length === 0 ? (
              <div className="glass rounded-[24px] p-10 text-center">
                <div className="grid place-items-center"><Munshi size={96} state="idle" /></div>
                <h3 className="text-[16px] font-extrabold mt-3">Nobody in this bucket yet</h3>
                <p className="text-[12.5px] text-ink-3 mt-1 max-w-sm mx-auto">
                  {bucket === 'judge'
                    ? 'Every unmarked visitor on the deployed site lands here the moment they open a page.'
                    : bucket === 'tester'
                    ? 'Open any page with ?tester=yourname once per browser. Anything from localhost is a tester too.'
                    : bucket === 'agent'
                    ? 'Send agents in with ?tester=agent-name. Headless or webdriver browsers land here on their own.'
                    : 'No activity in this time range.'}
                </p>
              </div>
            ) : (
              sessions.map((s, idx) => {
                const open = !!expanded[s.id];
                const durSec = Math.max(1, Math.round((new Date(s.lastSeen).getTime() - new Date(s.firstSeen).getTime()) / 1000));
                const dur = durSec >= 60 ? `${Math.floor(durSec / 60)}m ${durSec % 60}s` : `${durSec}s`;
                const initials = s.userName.replace(/[^A-Za-z\s]/g, ' ').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '·';
                return (
                  <article key={s.id} className="glass rounded-[24px] overflow-hidden">
                    <button type="button" onClick={() => toggle(s.id)} className="w-full text-start px-5 py-4 flex flex-wrap items-center gap-3.5 cursor-pointer">
                      <div className="size-10 rounded-[12px] ink-surface grid place-items-center font-extrabold text-[13px] shrink-0">{initials}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[15px] font-extrabold truncate">{s.userName}</span>
                          <Pill mono tone="bg-white/55 dark:bg-white/10 border border-glass-edge text-ink-2">{s.pan}</Pill>
                          <Pill tone={KIND_PILL[s.bucket]}>{s.bucket === 'judge' ? 'Judge' : s.bucket === 'tester' ? `Tester${s.tester ? ` · ${s.tester}` : ''}` : `Agent${s.tester ? ` · ${s.tester.replace(/^agent-?/, '')}` : ''}`}</Pill>
                          {s.userKind === 'ca' && <Pill tone={KIND_PILL.ca}>CA</Pill>}
                          {s.userKind === 'demo' && <Pill tone={KIND_PILL.demo}>Demo</Pill>}
                        </div>
                        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[12px] text-ink-3 mt-1">
                          <span className="font-mono">{day(s.firstSeen)} {clock(s.firstSeen)}</span>
                          <span>{dur}</span>
                          {s.origin && <span className="font-mono">{s.origin}</span>}
                          <span className="uppercase font-mono">{s.lang}</span>
                          {s.userAgent && <span>{deviceOf(s.userAgent)}{s.screenSize ? ` · ${s.screenSize}` : ''}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ms-auto">
                        <Pill tone="bg-white/55 dark:bg-white/10 border border-glass-edge text-ink-2">{s.events.length} actions</Pill>
                        {s.chats.length > 0 && <Pill tone="bg-amber-bg text-amber-ink">{s.chats.reduce((n, c) => n + c.events.filter((e) => e.payload?.role === 'user').length, 0)} questions</Pill>}
                        <span className="text-ink-3">{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                      </div>
                    </button>

                    {open && (
                      <div className="border-t border-line px-5 py-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6">
                        <div>
                          <div className="font-mono text-[11px] font-bold uppercase tracking-[.08em] text-ink-3 mb-3">Timeline</div>
                          {s.events.length === 0 ? (
                            <p className="text-[12.5px] text-ink-3">No page actions — only an autonomous run.</p>
                          ) : (
                            <ol className="relative border-s border-line ms-1.5 space-y-2.5">
                              {s.events.map((e) => {
                                const tone = e.event_type === 'sign_in' || e.event_type === 'ca_login' ? 'bg-ok' : e.event_type === 'error_encounter' ? 'bg-bad' : e.event_type.startsWith('agent_') ? 'bg-money' : 'bg-tertiary';
                                return (
                                  <li key={e.id} className="ps-4 relative text-[12.5px]">
                                    <span className={`absolute -start-[5px] top-[6px] size-2 rounded-full ${tone}`} />
                                    <span className="font-mono text-[10.5px] text-ink-3 me-2">{clock(e.created_at, true)}</span>
                                    <span className="text-ink-2">{describe(e)}</span>
                                  </li>
                                );
                              })}
                            </ol>
                          )}
                        </div>
                        <div>
                          <div className="font-mono text-[11px] font-bold uppercase tracking-[.08em] text-ink-3 mb-3">Munshi ji</div>
                          {s.chats.length === 0 ? (
                            <p className="text-[12.5px] text-ink-3">No conversation yet.</p>
                          ) : (
                            <div className="space-y-4">
                              {s.chats.map((c) => (
                                <div key={c.run.id} className="space-y-2.5">
                                  {c.run.id.startsWith('copilot_') ? null : (
                                    <div className="flex items-center justify-between text-[11.5px] text-ink-3">
                                      <span>{c.run.task}</span>
                                      <Pill mono tone="bg-white/55 dark:bg-white/10 border border-glass-edge text-ink-2">{c.run.status}</Pill>
                                    </div>
                                  )}
                                  {c.events.map((ev) => {
                                    const p = ev.payload || {};
                                    const text = p.text;
                                    if (!text) return null;
                                    const isUser = p.role === 'user';
                                    return (
                                      <div key={ev.id || `${c.run.id}_${ev.seq}`} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        {!isUser && <MunshiAvatar size={24} animated={false} />}
                                        <div className={`max-w-[85%] ${isUser ? 'glass-flat rounded-[18px_18px_4px_18px] px-3.5 py-2.5 text-[13px] text-ink' : 'munshi-bubble text-[13px]'}`}>
                                          <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
                                          {ev.created_at && <div className={`font-mono text-[9.5px] mt-1 ${isUser ? 'text-ink-3' : 'opacity-60'}`}>{clock(ev.created_at, true)}</div>}
                                        </div>
                                        {isUser && <div className="size-6 rounded-full bg-amber-bg text-amber-ink grid place-items-center text-[10px] font-extrabold shrink-0">{initials.slice(0, 1)}</div>}
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'ca' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="glass rounded-[24px] px-[22px] py-[18px]">
              <h3 className="text-[15px] font-extrabold flex items-center gap-2 mb-3"><ShieldCheck size={16} className="text-ok" />Registered CAs · {stats.cas}</h3>
              <div className="space-y-2">
                {data?.caAccounts.map((ca) => (
                  <div key={ca.id} className="rounded-[14px] bg-white/55 dark:bg-white/10 border border-glass-edge px-3.5 py-2.5 text-[12.5px]">
                    <div className="flex items-center justify-between gap-2"><span className="font-bold">{ca.name}</span><span className="font-mono text-[11px] text-ink-3">ICAI {ca.membership_no}</span></div>
                    <div className="text-ink-2 mt-0.5">{ca.firm_name} · {ca.city}</div>
                    <div className="font-mono text-[10.5px] text-ink-3 mt-0.5">{ca.email}</div>
                  </div>
                ))}
                {!data?.caAccounts.length && <p className="text-[12.5px] text-ink-3">No CA has registered yet.</p>}
              </div>
            </section>
            <section className="glass rounded-[24px] px-[22px] py-[18px]">
              <h3 className="text-[15px] font-extrabold mb-3">Review requests · {stats.reviews}</h3>
              <div className="space-y-2">
                {data?.caReviews.map((r) => (
                  <div key={r.id} className="rounded-[14px] bg-white/55 dark:bg-white/10 border border-glass-edge px-3.5 py-2.5 text-[12.5px] flex items-center justify-between gap-2">
                    <div><div className="font-bold font-mono">{r.code}</div><div className="text-ink-3 text-[11.5px]">{r.citizen_pan} · {r.mode === 'wapc' ? 'Wapsi certified' : r.mode}</div></div>
                    <Pill tone={REVIEW_PILL[r.status] || 'bg-amber-bg text-amber-ink'}>{r.status}</Pill>
                  </div>
                ))}
                {!data?.caReviews.length && <p className="text-[12.5px] text-ink-3">No review requests in this range.</p>}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
