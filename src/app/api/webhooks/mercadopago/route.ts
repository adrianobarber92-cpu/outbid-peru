import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    if (topic === 'payment' && id) {
      const token = process.env.MP_ACCESS_TOKEN;
      if (!token) return NextResponse.json({ error: 'No MP Token' }, { status: 500 });

      const client = new MercadoPagoConfig({ accessToken: token });
      const payment = new Payment(client);
      const paymentData = await payment.get({ id });

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