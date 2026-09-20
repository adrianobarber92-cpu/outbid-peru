import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const reply = (error: string, status = 400) => NextResponse.json({ error }, { status });
function admin(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  const received = request.headers.get('x-admin-password') || '';
  return !!expected && Buffer.byteLength(expected) === Buffer.byteLength(received) && timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
function link(value: unknown, optional = false) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw && optional) return '';
  if (!raw || raw.length > 500) throw new Error('Revisa el enlace.');
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) throw new Error('El enlace no es valido.');
  return url.toString();
}
export async function GET(request: Request) {
  if (!admin(request)) return reply('Clave incorrecta.', 401);
  const { data, error } = await db().from('bids').select('id,title,url,amount,status,operation_number,created_at').order('created_at', { ascending: true });
  if (error) return reply('No se pudieron cargar las solicitudes.', 500);
  return NextResponse.json({ bids: data }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return reply('Origen no permitido.', 403);
  let payload;
  try {
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const operation = typeof body.operation_number === 'string' ? body.operation_number.trim() : '';
    const amount = Number(body.amount);
    if (title.length < 2 || title.length > 80) return reply('El nombre debe tener entre 2 y 80 caracteres.');
    if (!/^[a-zA-Z0-9-]{4,40}$/.test(operation)) return reply('Escribe el numero de operacion del comprobante, no el codigo de seguridad de 3 digitos.');
    if (!Number.isFinite(amount) || amount < 1 || amount > 999.99 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001) return reply('El monto debe estar entre S/ 1 y S/ 999.99, con hasta dos decimales.');
    payload = { title, url: link(body.url), image_url: link(body.image_url, true), amount, operation_number: operation, status: 'pending' };
  } catch { return reply('Revisa los datos y los enlaces de tu solicitud.'); }
  // Keep already-paid requests even if the leading bid changed during payment.
  const client = db();
  const existing = await client.from('bids').select('id').eq('operation_number', payload.operation_number).limit(1);
  if (existing.error) return reply('No se pudo verificar la operacion.', 500);
  if (existing.data.length) return reply('Esta operacion ya fue enviada. Espera la revision del administrador.', 409);
  const result = await client.from('bids').insert(payload).select('id').single();
  if (result.error) return reply('No se pudo guardar la solicitud. Conserva tu comprobante e intenta nuevamente.', 500);
  return NextResponse.json({ id: result.data.id }, { status: 201 });
}
export async function PATCH(request: Request) {
  if (!admin(request)) return reply('Clave incorrecta.', 401);
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== 'string' || !['approved', 'rejected'].includes(body.status)) return reply('Solicitud invalida.');
  const client = db();
  const bid = await client.from('bids').select('amount,status').eq('id', body.id).single();
  if (bid.error || bid.data.status !== 'pending') return reply('La solicitud ya fue revisada o no existe.', 409);
  if (body.status === 'approved') {
    const top = await client.from('bids').select('amount').in('status', ['approved', 'king', 'active']).order('amount', { ascending: false }).limit(1).maybeSingle();
    if (top.error) return reply('No se pudo verificar al rey actual.', 500);
    const min = top.data ? Number(top.data.amount) + 0.5 : 1;
    if (Number(bid.data.amount) < min) return reply(`Esta puja ya no alcanza la cima (S/ ${min.toFixed(2)}). Gestiona la devolucion antes de rechazarla.`, 409);
  }
  const updated = await client.from('bids').update({ status: body.status }).eq('id', body.id).eq('status', 'pending').select('id');
  if (updated.error) return reply('No se pudo actualizar la solicitud.', 500);
  if (!updated.data.length) return reply('La solicitud ya fue revisada.', 409);
  return NextResponse.json({ ok: true });
}
