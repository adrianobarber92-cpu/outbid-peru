import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, url, image_url, amount } = body;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'bid-cerro',
            title: `Pujar por el Cerro: ${title}`,
            quantity: 1,
            unit_price: Number(amount),
            currency_id: 'PEN',
          },
        ],
        metadata: {
          title,
          url,
          image_url,
          amount: Number(amount),
        },
        back_urls: {
          success: `${baseUrl}/?status=approved`,
          failure: `${baseUrl}/?status=failure`,
          pending: `${baseUrl}/?status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      },
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error) {
    console.error('Error creando preferencia en Mercado Pago:', error);
    return NextResponse.json({ error: 'Error al procesar el pago' }, { status: 500 });
  }
}