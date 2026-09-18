import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // Detectar el ID de pago (viene por Query Params o en el Body de la notificación)
    const id =
      url.searchParams.get('id') ||
      url.searchParams.get('data.id') ||
      body?.data?.id ||
      body?.id;

    const type =
      url.searchParams.get('type') ||
      url.searchParams.get('topic') ||
      body?.type ||
      body?.action;

    // Obtener la clave secreta del webhook (Soporta ambas convenciones)
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET;

    // 1. VALIDACIÓN DE SEGURIDAD (Firma de Mercado Pago)
    if (webhookSecret) {
      const xSignature = request.headers.get('x-signature');
      const xRequestId = request.headers.get('x-request-id');

      if (xSignature) {
        const parts = xSignature.split(',');
        let ts = '';
        let hash = '';

        parts.forEach((part) => {
          const [key, value] = part.split('=');
          if (key.trim() === 'ts') ts = value.trim();
          if (key.trim() === 'v1') hash = value.trim();
        });

        const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`;
        const cHMAC = crypto
          .createHmac('sha256', webhookSecret)
          .update(manifest)
          .digest('hex');

        if (cHMAC !== hash) {
          console.error('Firma de Webhook no válida.');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      }
    }

    // 2. PROCESAMIENTO DEL PAGO
    if ((type === 'payment' || type === 'payment.created' || type === 'payment.updated') && id) {
      // Soporta MP_ACCESS_TOKEN y MERCADOPAGO_ACCESS_TOKEN
      const token = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
      if (!token) return NextResponse.json({ error: 'No MP Token' }, { status: 500 });

      const client = new MercadoPagoConfig({ accessToken: token });
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: String(id) });

      if (paymentData.status === 'approved' && paymentData.metadata) {
        const { bid_title, bid_url, bid_image_url, bid_amount } = paymentData.metadata;

        // Comprobar si esta puja supera al Rey actual
        const { data: topBids } = await supabase
          .from('bids')
          .select('amount')
          .order('amount', { ascending: false })
          .limit(1);

        const currentKingAmount = topBids && topBids[0] ? topBids[0].amount : 0;
        const isNewKing = Number(bid_amount) > currentKingAmount;

        // Insertar la nueva puja confirmada en Supabase
        await supabase.from('bids').insert({
          title: bid_title,
          url: bid_url,
          image_url: bid_image_url,
          amount: Number(bid_amount),
          status: isNewKing ? 'king' : 'active',
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error procesando Webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}