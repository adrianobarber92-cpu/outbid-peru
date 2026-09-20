'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

let visitor: string;
let visitRequest: Promise<Response> | undefined;
function record(type: 'visit' | 'click', bid?: string) {
  if (!visitor) {
    try {
      visitor = sessionStorage.getItem('cerro-session') || crypto.randomUUID();
      sessionStorage.setItem('cerro-session', visitor);
    } catch { visitor = crypto.randomUUID(); }
  }
  return fetch('/api/metrics', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
    body: JSON.stringify({ type, bid, visitor, event: crypto.randomUUID() }),
  });
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null);
  const [online, setOnline] = useState<number | null>(null);
  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('site_metrics').select('key,total');
    if (!error && data) setMetrics(Object.fromEntries(data.map(row => [row.key, Number(row.total)])));
  }, []);
  useEffect(() => {
    // One entry per document load, including React's development effect replay.
    visitRequest ??= record('visit');
    void visitRequest.then(refresh).catch(() => refresh());
    const presence = supabase.channel('cerro-viewers', { config: { presence: { key: visitor } } });
    presence.on('presence', { event: 'sync' }, () => {
      setOnline(Object.keys(presence.presenceState()).length);
    }).subscribe(status => {
      if (status === 'SUBSCRIBED') void presence.track({ online: true });
      else if (['CLOSED', 'CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) setOnline(null);
    });
    const channel = supabase.channel('site-metrics').on('postgres_changes', {
      event: '*', schema: 'public', table: 'site_metrics',
    }, refresh).subscribe();
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 10000);
    const visible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
      void supabase.removeChannel(channel);
      void supabase.removeChannel(presence);
    };
  }, [refresh]);
  const trackClick = (id: string) => { void record('click', id).then(refresh).catch(() => {}); };
  return { metrics, online, trackClick };
}
