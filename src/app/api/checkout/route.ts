import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const MIN_FIRST_BID = 1;
const MIN_INCREMENT = 0.5;
const MAX_AMOUNT = 10000;
const MAX_TITLE_LENGTH = 80;
const MAX_URL_LENGTH = 500;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mercadoPagoToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizeUrl(value: unknown, required = false) {
  const raw = cleanText(value, MAX_URL_LENGTH);

  if (!raw) {
    if (required) throw new Error('El link es obligatorio.');
    return '';
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const parsed = new URL(withProtocol);

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('El link debe usar http o https.');
  }

  return parsed.toString();
}

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  const origin = request.headers.get('origin');
  if (origin) return origin.replace(/\/$/, '');

  return new URL(request.url).origin;
}

async function getCurrentHighestAmount() {
  if (!supabaseUrl || !supabaseServiceKey) return 0;

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('bids')
    .select('amount')
    .in('status', ['king', 'active', 'approved'])
    .order('amount', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('No se pudo consultar el monto actual:', error);
    throw new Error('No se pudo validar el monto actual.');
  }

  return Number(data?.amount ?? 0);
}

export async function POST(request: Request) {
  try {
    if (!mercadoPagoToken) {
      return NextResponse.json(
        { error: 'Mercado Pago no esta configurado en el servidor.' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const title = cleanText(body.title, MAX_TITLE_LENGTH);
    const url = normalizeUrl(body.url, true);
    const imageUrl = normalizeUrl(body.image_url, false);
    const amount = Math.round(Number(body.amount) * 100) / 100;

    if (title.length < 2) {
      return NextResponse.json({ error: 'Escribe un nombre valido.' }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      return NextResponse.json({ error: 'El monto no es valido.' }, { status: 400 });
    }

    const currentHighest = await getCurrentHighestAmount();
    const minAmount = currentHighest > 0 ? currentHighest + MIN_INCREMENT : MIN_FIRST_BID;

    if (amount < minAmount) {
      return NextResponse.json(
        { error: `El monto minimo para subir es S/ ${minAmount.toFixed(2)}.` },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(request);
    const isPublicHttps = baseUrl.startsWith('https://');
    const client = new MercadoPagoConfig({ accessToken: mercadoPagoToken });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        binary_mode: true,
        items: [
          {
            id: 'bajatelo-bid',
            title: `Bajatelo: ${title}`,
            unit_price: amount,
            quantity: 1,
            currency_id: 'PEN',
          },
        ],
        metadata: {
          bid_title: title,
          bid_url: url,
          bid_image_url: imageUrl,
          bid_amount: amount,
        },
        back_urls: {
          success: `${baseUrl}/?status=success`,
          failure: `${baseUrl}/?status=failure`,
          pending: `${baseUrl}/?status=pending`,
        },
        ...(isPublicHttps
          ? {
              notification_url: `${baseUrl}/api/webhooks/mercadopago`,
              auto_return: 'approved' as const,
            }
          : {}),
        statement_descriptor: 'BAJATELO',
      },
    });

    if (!result.init_point) {
      throw new Error('Mercado Pago no devolvio un link de pago.');
    }

    return NextResponse.json({ init_point: result.init_point });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear el checkout.';
    console.error('Error en /api/checkout:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
