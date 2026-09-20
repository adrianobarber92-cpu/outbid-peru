import { createClient } from '@supabase/supabase-js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ error: 'Origen no permitido.' }, { status: 403 });
  }
  const raw = await request.text();
  if (raw.length > 1024) return new Response(null, { status: 413 });
  let body;
  try { body = JSON.parse(raw); } catch { return new Response(null, { status: 400 }); }
  if (!body || !uuid.test(body.event ?? '') || !uuid.test(body.visitor ?? '') ||
      !['visit', 'click'].includes(body.type) || (body.type === 'click' && !uuid.test(body.bid ?? ''))) {
    return new Response(null, { status: 400 });
  }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { error } = await db.rpc('record_site_metric', {
    p_event: body.event, p_visitor: body.visitor, p_bid: body.type === 'click' ? body.bid : null,
  });
  if (error) return Response.json({ error: 'No se pudo registrar la estadistica.' }, { status: 503 });
  return new Response(null, { status: 204 });
}
