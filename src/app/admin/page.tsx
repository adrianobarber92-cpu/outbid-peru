'use client';

import { useState } from 'react';
import Link from 'next/link';

type Bid = { id: string; title: string; url: string; image_url?: string; amount: number; status: string; operation_number: string; created_at: string };
export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(false);
  async function refresh() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/yape', { headers: { 'x-admin-password': password }, cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setBids(data.bids); setSignedIn(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo conectar.'); }
    finally { setBusy(false); }
  }
  async function review(bid: Bid, status: string) {
    const message = status === 'approved'
      ? `Confirma que verificaste en TU Yape el ingreso de S/ ${Number(bid.amount).toFixed(2)} y la operacion ${bid.operation_number}. Aprobar a ${bid.title}?`
      : 'Rechazar solicitud? Si recibiste el dinero, gestiona la devolucion. Este boton no devuelve dinero.';
    if (!window.confirm(message)) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/yape', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-password': password }, body: JSON.stringify({ id: bid.id, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo conectar.'); }
    finally { setBusy(false); }
  }
  const highest = Math.max(0, ...bids.filter(b => ['approved', 'king', 'active'].includes(b.status)).map(b => Number(b.amount)));
  const visible = bids.filter(b => history ? b.status !== 'pending' : b.status === 'pending');
  const input = 'w-full border border-gray-400 rounded-lg p-3 bg-white text-black';
  return <main className="min-h-screen bg-gray-100 text-gray-950 p-4 sm:p-8">
    <div className="max-w-4xl mx-auto">
      <header className="flex flex-wrap gap-4 justify-between items-center border-b border-gray-300 pb-5 mb-6">
        <div><h1 className="text-2xl font-bold">Administracion de Yape</h1><Link href="/" className="text-sm underline">Ver el cerro</Link></div>
        {signedIn && <button onClick={() => { setSignedIn(false); setPassword(''); setBids([]); }} className="underline">Cerrar sesion</button>}
      </header>
      {error && <p role="alert" className="mb-4 p-3 bg-red-100 text-red-900 rounded-lg">{error}</p>}
      {!signedIn ? <form className="max-w-sm space-y-4" onSubmit={e => { e.preventDefault(); void refresh(); }}>
        <label className="block font-semibold">Clave de administrador<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className={`${input} mt-2`} /></label>
        <button disabled={busy} className="bg-black text-white rounded-lg px-5 py-3 disabled:opacity-50">{busy ? 'Entrando...' : 'Entrar'}</button>
      </form> : <>
        <p className="mb-4 font-semibold">Rey actual: S/ {highest.toFixed(2)} · Minimo: S/ {(highest ? highest + 0.5 : 1).toFixed(2)}</p>
        <div className="flex flex-wrap items-center gap-5 mb-5">
          <button onClick={() => setHistory(false)} aria-pressed={!history} className={!history ? 'font-bold underline' : ''}>Pendientes ({bids.filter(b => b.status === 'pending').length})</button>
          <button onClick={() => setHistory(true)} aria-pressed={history} className={history ? 'font-bold underline' : ''}>Historial</button>
          <button onClick={() => void refresh()} disabled={busy} className="ml-auto underline">Actualizar</button>
        </div>
        {!visible.length && <p className="py-10 text-gray-600">No hay solicitudes {history ? 'revisadas' : 'pendientes'}.</p>}
        <div className="divide-y divide-gray-300">{visible.map(bid => <article key={bid.id} className="py-5 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="min-w-0 break-words"><h2 className="font-bold text-lg">{bid.title} · S/ {Number(bid.amount).toFixed(2)}</h2>
            <p>Operacion: {bid.operation_number || 'Sin numero'}</p>
            <p className="text-sm mt-2 break-all"><span className="font-semibold">Link:</span> <a href={bid.url} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 underline">{bid.url}</a></p>
            <p className="text-sm break-all"><span className="font-semibold">Foto/logo:</span> {bid.image_url ? <a href={bid.image_url} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 underline">{bid.image_url}</a> : <span className="text-gray-500">No proporcionado</span>}</p>
            <p className="text-sm text-gray-600 mt-2">{new Date(bid.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</p>
            {bid.status === 'pending' && Number(bid.amount) < (highest ? highest + 0.5 : 1) && <p className="text-red-700 text-sm mt-2">Superada: revisar devolucion.</p>}
            {bid.status !== 'pending' && <p className="text-sm font-semibold">{bid.status === 'rejected' ? 'Rechazada' : 'Aprobada'}</p>}
          </div>
          {bid.status === 'pending' && <div className="flex gap-3 items-center flex-wrap"><button disabled={busy} onClick={() => void review(bid, 'approved')} className="px-4 py-2 rounded-lg bg-green-800 text-white disabled:opacity-50">Verifique el ingreso: aprobar</button><button disabled={busy} onClick={() => void review(bid, 'rejected')} className="px-4 py-2 rounded-lg border border-red-700 text-red-800 disabled:opacity-50">Rechazar</button></div>}
        </article>)}</div>
      </>}
    </div>
  </main>;
}
