'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Users,
  MessageSquare,
  FileText,
  FileCheck,
  ShieldCheck,
  Search,
  RefreshCw,
  Download,
  Clock,
  Laptop,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bot,
  User,
  CreditCard,
  Scale,
  Upload,
  ArrowRight,
} from 'lucide-react';

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
  id: string;
  run_id: string;
  seq: number;
  type?: string;
  payload: {
    type?: string;
    role?: string;
    text?: string;
    name?: string;
    args?: Record<string, unknown>;
  };
  created_at: string;
}

interface CAReview {
  id: string;
  code: string;
  citizen_pan: string;
  status: string;
  mode: string;
  created_at: string;
}

interface CAAccount {
  id: string;
  membership_no: string;
  name: string;
  firm_name: string;
  city: string;
  email: string;
}

interface StatsData {
  activities: ActivityEvent[];
  runs: AgentRun[];
  runEvents: AgentEvent[];
  vaultDocuments: Array<{ id: string; category: string; file_name: string; updated_at: string }>;
  snapshots: Array<{ id: string; pan: string; status: string; created_at: string }>;
  caReviews: CAReview[];
  caAccounts: CAAccount[];
}

export default function InspectorPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'today' | 'yesterday' | '7d' | 'all'>('today');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'journeys' | 'ca' | 'vault'>('journeys');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/telemetry/stats?range=${range}&user=${encodeURIComponent(search)}`);
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
  }, [range, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Aggregate user sessions
  const sessions = useMemo(() => {
    if (!data) return [];
    const map = new Map<
      string,
      {
        id: string;
        pan: string;
        userName: string;
        userKind: string;
        userAgent: string;
        screenSize: string;
        lang: string;
        firstSeen: string;
        lastSeen: string;
        events: ActivityEvent[];
        chats: Array<{ run: AgentRun; events: AgentEvent[] }>;
      }
    >();

    for (const act of data.activities) {
      const sid = act.session_id || act.pan || 's_anon';
      if (!map.has(sid)) {
        map.set(sid, {
          id: sid,
          pan: act.pan || 'ANONYMOUS',
          userName: act.user_name || 'Visitor',
          userKind: act.user_kind || 'citizen',
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
      if (act.pan && act.pan !== 'ANONYMOUS') s.pan = act.pan;
      if (act.user_name && act.user_name !== 'Visitor') s.userName = act.user_name;
      if (act.user_kind) s.userKind = act.user_kind;
      s.events.push(act);

      // Extract Copilot chats from activity stream
      if (act.event_type === 'agent_prompt' || act.event_type === 'agent_reply') {
        const d = typeof act.details === 'string' ? JSON.parse(act.details || '{}') : (act.details || {});
        let chatGroup = s.chats.find((c) => c.run.id === `copilot_${sid}`);
        if (!chatGroup) {
          chatGroup = {
            run: {
              id: `copilot_${sid}`,
              owner_pan: s.pan,
              owner_kind: s.userKind,
              task: 'Assistant Dialogue',
              status: 'completed',
              lang: s.lang,
              created_at: act.created_at,
              updated_at: act.created_at,
            },
            events: [],
          };
          s.chats.push(chatGroup);
        }
        if (act.event_type === 'agent_prompt' && (d.prompt || d.text)) {
          chatGroup.events.push({
            id: act.id,
            run_id: `copilot_${sid}`,
            seq: chatGroup.events.length + 1,
            payload: {
              type: 'message',
              role: 'user',
              text: d.prompt || d.text,
            },
            created_at: act.created_at,
          });
        } else if (act.event_type === 'agent_reply' && (d.reply || d.text)) {
          chatGroup.events.push({
            id: act.id,
            run_id: `copilot_${sid}`,
            seq: chatGroup.events.length + 1,
            payload: {
              type: 'message',
              role: 'assistant',
              text: d.reply || d.text,
            },
            created_at: act.created_at,
          });
        }
      }
    }

    for (const run of data.runs) {
      const sid = run.owner_pan || 's_agent';
      if (!map.has(sid)) {
        map.set(sid, {
          id: sid,
          pan: run.owner_pan || 'ANON',
          userName: run.owner_kind === 'demo' ? `Demo (${run.owner_pan})` : run.owner_pan,
          userKind: run.owner_kind,
          userAgent: '',
          screenSize: '',
          lang: run.lang || 'en',
          firstSeen: run.created_at,
          lastSeen: run.updated_at || run.created_at,
          events: [],
          chats: [],
        });
      }
      const s = map.get(sid)!;
      const rEvents = data.runEvents.filter((e) => e.run_id === run.id);
      s.chats.push({ run, events: rEvents });
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );
  }, [data]);

  const toggleSession = (id: string) => {
    setExpandedSessions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadReport = () => {
    if (!data) return;
    let text = '================================================================================\n';
    text += '            WAPSI PLATFORM — JUDGE & USER ACTIVITY AUDIT REPORT\n';
    text += '================================================================================\n';
    text += `Generated At : ${new Date().toLocaleString('en-IN')} IST\n`;
    text += `Time Range   : ${range.toUpperCase()}\n\n`;
    text += `• Unique Visitors / Judges      : ${sessions.length}\n`;
    text += `• AI Conversation Turns (Munshi): ${data.runs.length}\n`;
    text += `• Vault Documents Processed     : ${data.vaultDocuments.length}\n`;
    text += `• Tax Returns Prepared/Filed    : ${data.snapshots.length}\n`;
    text += `• CA Review Interactions        : ${data.caReviews.length}\n\n`;

    sessions.forEach((s, i) => {
      text += `\n[#${i + 1}] Session: ${s.id} | User: ${s.pan} (${s.userName}) [${s.userKind.toUpperCase()}]\n`;
      text += `     First Seen: ${new Date(s.firstSeen).toLocaleTimeString('en-IN')} | Language: ${s.lang} | Screen: ${s.screenSize || 'N/A'}\n`;
      if (s.events.length > 0) {
        text += '     Timeline:\n';
        s.events.forEach((e) => {
          text += `       - [${new Date(e.created_at).toLocaleTimeString('en-IN')}] ${e.event_type}\n`;
        });
      }
      if (s.chats.length > 0) {
        text += '     AI Chat Logs:\n';
        s.chats.forEach((c) => {
          c.events.forEach((ev) => {
            if (ev.payload?.type === 'message') {
              text += `       ${ev.payload.role === 'user' ? '[Judge/User]' : '[Munshi ji]'}: ${ev.payload.text}\n`;
            }
          });
        });
      }
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wapsi-activity-report-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseDetails = (details: string | Record<string, unknown>) => {
    if (typeof details === 'object' && details !== null) return details;
    try {
      return JSON.parse(details || '{}');
    } catch {
      return {};
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 selection:bg-teal-500 selection:text-black">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/30 text-teal-400">
                <Activity className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                  Wapsi Activity Inspector
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 font-medium">
                    LIVE
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                  Real-time judge telemetry, document uploads, regime calculations & AI dialogue monitor
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                autoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live Polling ON (3s)' : 'Auto-refresh Paused'}
            </button>

            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-teal-500 text-slate-950 hover:bg-teal-400 transition shadow-lg shadow-teal-500/10"
            >
              <Download className="w-3.5 h-3.5" />
              Export .txt Report
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            {(['today', 'yesterday', '7d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  range === r
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === '7d' ? 'Last 7 Days' : r === 'all' ? 'All Time' : r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PAN or Judge Name..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {lastUpdated && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastUpdated}
              </span>
            )}
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Judges & Visitors</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{sessions.length}</div>
            <div className="text-[11px] text-teal-400/80 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tracked Sessions
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">AI Conversations</span>
              <MessageSquare className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{data?.runs.length || 0}</div>
            <div className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Munshi ji Turns
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Vault Documents</span>
              <FileText className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{data?.vaultDocuments.length || 0}</div>
            <div className="text-[11px] text-sky-400/80 mt-1">Form 16 / AIS / 26AS</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Returns Filed</span>
              <FileCheck className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{data?.snapshots.length || 0}</div>
            <div className="text-[11px] text-violet-400/80 mt-1">ITR-1 Records</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">CA Reviews</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{data?.caReviews.length || 0}</div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              {data?.caAccounts.length || 0} Registered CAs
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('journeys')}
            className={`pb-3 text-xs md:text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'journeys'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Judge & Visitor Journeys ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('ca')}
            className={`pb-3 text-xs md:text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'ca'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Chartered Accountant Portal ({data?.caAccounts.length || 0} CAs)
          </button>
        </div>

        {/* Tab 1: Visitor Journeys */}
        {activeTab === 'journeys' && (
          <div className="space-y-4">
            {loading && !data ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">Loading live activity...</div>
            ) : sessions.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-300">No Judge Journeys in this Timeframe</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  As soon as a judge or visitor opens the website or tests any flow, their actions and chats will appear here live.
                </p>
              </div>
            ) : (
              sessions.map((sess, idx) => {
                const isExpanded = !!expandedSessions[sess.id];
                const durMs = new Date(sess.lastSeen).getTime() - new Date(sess.firstSeen).getTime();
                const durSec = Math.max(1, Math.round(durMs / 1000));
                const durStr = durSec > 60 ? `${Math.floor(durSec / 60)}m ${durSec % 60}s` : `${durSec}s`;

                return (
                  <div
                    key={sess.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl transition overflow-hidden shadow-sm"
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => toggleSession(sess.id)}
                      className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex items-start md:items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-teal-400">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm md:text-base font-bold text-white">{sess.userName}</span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                              {sess.pan}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                                sess.userKind === 'ca'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : sess.userKind === 'demo'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {sess.userKind}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {new Date(sess.firstSeen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>•</span>
                            <span>Duration: <strong className="text-slate-200">{durStr}</strong></span>
                            <span>•</span>
                            <span>Lang: <strong className="uppercase text-slate-200">{sess.lang}</strong></span>
                            {sess.screenSize && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Laptop className="w-3 h-3 text-slate-500" />
                                  {sess.screenSize}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                            {sess.events.length} clicks/actions
                          </span>
                          {sess.chats.length > 0 && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              {sess.chats.length} chats
                            </span>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expandable Journey Body */}
                    {isExpanded && (
                      <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 md:p-6 space-y-6">
                        {/* Event Timeline */}
                        {sess.events.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5 text-teal-400" />
                              Action Timeline ({sess.events.length})
                            </h4>
                            <div className="space-y-2 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                              {sess.events.map((evt) => {
                                const t = new Date(evt.created_at).toLocaleTimeString('en-IN');
                                const d = parseDetails(evt.details);
                                let icon = <Activity className="w-3 h-3 text-teal-400" />;
                                let label = evt.event_type;

                                if (evt.event_type === 'sign_in') {
                                  icon = <User className="w-3 h-3 text-emerald-400" />;
                                  label = `Signed in as ${d.pan || 'Citizen'}`;
                                } else if (evt.event_type === 'doc_upload') {
                                  icon = <Upload className="w-3 h-3 text-sky-400" />;
                                  label = `Uploaded document: ${d.name || 'Form 16'}`;
                                } else if (evt.event_type === 'tab_change') {
                                  icon = <ArrowRight className="w-3 h-3 text-slate-400" />;
                                  label = `Switched view tab to: ${d.tab}`;
                                } else if (evt.event_type === 'compute_tax') {
                                  icon = <Scale className="w-3 h-3 text-amber-400" />;
                                  label = `Computed tax for ₹${Number(d.grossSalary || 0).toLocaleString('en-IN')} (Tax: ₹${Number(d.tax || 0).toLocaleString('en-IN')})`;
                                } else if (evt.event_type === 'regime_select') {
                                  icon = <Scale className="w-3 h-3 text-teal-400" />;
                                  label = `Selected regime: ${String(d.regime || '').toUpperCase()} (Saved ₹${Number(d.savings || 0).toLocaleString('en-IN')})`;
                                } else if (evt.event_type === 'challan_pay') {
                                  icon = <CreditCard className="w-3 h-3 text-purple-400" />;
                                  label = `Paid Self-Assessment Tax: ₹${Number(d.amount || 0).toLocaleString('en-IN')}`;
                                } else if (evt.event_type === 'itrv_download') {
                                  icon = <FileCheck className="w-3 h-3 text-emerald-400" />;
                                  label = 'Generated & Downloaded official ITR-V Ack Receipt PDF';
                                } else if (evt.event_type === 'agent_prompt') {
                                  icon = <MessageSquare className="w-3 h-3 text-amber-400" />;
                                  label = `Asked Munshi: "${d.prompt || d.text}"`;
                                }

                                return (
                                  <div key={evt.id} className="flex items-start gap-3 relative pl-6 text-xs">
                                    <span className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                                      {icon}
                                    </span>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] text-slate-500">{t}</span>
                                        <span className="font-medium text-slate-200">{label}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* AI Conversations */}
                        {sess.chats.length > 0 && (
                          <div className="pt-4 border-t border-slate-800">
                            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Bot className="w-3.5 h-3.5" />
                              Munshi ji AI Dialogue Transcripts
                            </h4>
                            <div className="space-y-3">
                              {sess.chats.map((chat) => (
                                <div key={chat.run.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60 pb-2">
                                    <span>Task: <strong className="text-slate-200">{chat.run.task}</strong></span>
                                    <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-400 font-mono text-[10px]">
                                      {chat.run.status}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {chat.events.map((ev) => {
                                      const p = ev.payload || {};
                                      const text = p.text || (typeof p === 'string' ? p : '');
                                      if (!text && ev.type !== 'message' && p.type !== 'message') return null;
                                      if (!text) return null;
                                      const isUser = p.role === 'user' || ev.payload?.role === 'user';
                                      return (
                                        <div
                                          key={ev.id || `${ev.seq}_${chat.run.id}`}
                                          className={`flex items-start gap-2.5 text-xs ${
                                            isUser ? 'justify-end' : 'justify-start'
                                          }`}
                                        >
                                          {!isUser && (
                                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] shrink-0 font-bold border border-amber-500/30">
                                              M
                                            </span>
                                          )}
                                          <div
                                            className={`p-3 rounded-xl max-w-[85%] ${
                                              isUser
                                                ? 'bg-teal-500/15 border border-teal-500/30 text-teal-100'
                                                : 'bg-slate-800/80 border border-slate-700/80 text-slate-200'
                                            }`}
                                          >
                                            <div className="text-[10px] text-slate-400 font-semibold mb-1 flex items-center justify-between gap-4">
                                              <span>{isUser ? '👤 Judge / Citizen' : '🤖 Munshi ji'}</span>
                                              {ev.created_at && (
                                                <span className="text-[9px] font-mono text-slate-500">
                                                  {new Date(ev.created_at).toLocaleTimeString('en-IN')}
                                                </span>
                                              )}
                                            </div>
                                            <p className="whitespace-pre-wrap leading-relaxed text-slate-100">{text}</p>
                                          </div>
                                          {isUser && (
                                            <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] shrink-0 font-bold border border-teal-500/30">
                                              J
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: CA Portal */}
        {activeTab === 'ca' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Registered Chartered Accountants ({data?.caAccounts.length || 0})
                </h3>
                <div className="space-y-2.5">
                  {data?.caAccounts.map((ca) => (
                    <div key={ca.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{ca.name}</span>
                        <span className="font-mono text-teal-400 text-[11px]">ICAI: {ca.membership_no}</span>
                      </div>
                      <div className="text-slate-400 mt-1">{ca.firm_name} • {ca.city}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{ca.email}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  CA Review Cases ({data?.caReviews.length || 0})
                </h3>
                <div className="space-y-2.5">
                  {data?.caReviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">{rev.code}</div>
                        <div className="text-slate-400 text-[11px]">PAN: {rev.citizen_pan} • Mode: {rev.mode}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rev.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-300' :
                        rev.status === 'reviewed' ? 'bg-blue-500/20 text-blue-300' :
                        rev.status === 'declined' ? 'bg-red-500/20 text-red-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {rev.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
