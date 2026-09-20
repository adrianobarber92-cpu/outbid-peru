import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mercadoPagoToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET;

function hasValidSignature(request: Request, paymentId: string | null) {
  if (!webhookSecret) return true;

  const signature = request.headers.get('x-signature');
  const requestId = request.headers.get('x-request-id');
  if (!signature || !requestId || !paymentId) return false;

  const values = Object.fromEntries(
    signature.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key?.trim(), value?.trim()];
    })
  );

  if (!values.ts || !values.v1) return false;

  const manifest = `id:${paymentId};request-id:${requestId};ts:${values.ts};`;
  const expected = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');
  const received = values.v1;

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))
  );
}

async function insertApprovedBid(metadata: Record<string, unknown>, paymentId: string) {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase no esta configurado para el webhook.');
  }

  const title = String(metadata.bid_title || '').trim().slice(0, 80);
  const url = String(metadata.bid_url || '').trim().slice(0, 500);
  const imageUrl = String(metadata.bid_image_url || '').trim().slice(0, 500);
  const amount = Number(metadata.bid_amount);

  if (!title || !url || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('Metadata de pago incompleta.');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const { data: existing, error: existingError } = await supabase
    .from('bids')
    .select('id')
    .eq('payment_id', paymentId)
    .maybeSingle();

  const hasPaymentIdColumn = !(
    existingError && String(existingError.message).includes('payment_id')
  );

  if (existingError && existingError.code !== 'PGRST116' && hasPaymentIdColumn) {
    throw existingError;
  }

  if (existing) return;

  const payload = {
    title,
    url,
    image_url: imageUrl,
    amount,
    status: 'approved',
    ...(hasPaymentIdColumn ? { payment_id: paymentId } : {}),
  };

  const { error } = await supabase.from('bids').insert(payload);

  if (error) {
    if (String(error.message).includes('payment_id')) {
      const fallback = await supabase.from('bids').insert({
        title,
        url,
        image_url: imageUrl,
        amount,
        status: 'approved',
      });

      if (fallback.error) throw fallback.error;
      return;
    }

    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const paymentId =
      url.searchParams.get('id') ||
      url.searchParams.get('data.id') ||
      body?.data?.id ||
      body?.id ||
      null;

    const topic = url.searchParams.get('topic') || url.searchParams.get('type') || body?.type;

    if (!paymentId || (topic && !String(topic).includes('payment'))) {
      return NextResponse.json({ received: true });
    }

    if (!hasValidSignature(request, String(paymentId))) {
      return NextResponse.json({ error: 'Firma invalida.' }, { status: 401 });
    }

    if (!mercadoPagoToken) {
      return NextResponse.json({ error: 'Mercado Pago no esta configurado.' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken: mercadoPagoToken });
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: String(paymentId) });

    if (paymentData.status === 'approved' && paymentData.metadata) {
      await insertApprovedBid(paymentData.metadata as Record<string, unknown>, String(paymentId));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error en webhook Mercado Pago:', error);
    const message = error instanceof Error ? error.message : 'Error procesando webhook.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
