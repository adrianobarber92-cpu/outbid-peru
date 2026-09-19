import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, url, image_url, amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Monto inválido' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://outbid-peru.vercel.app';
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'bajatelo-bid',
            title: `Pujar por el Cerro: ${title}`,
            unit_price: Number(amount),
            quantity: 1,
            currency_id: 'PEN',
          },
        ],
        // Especificamos el tipo de pago habilitado
        payment_methods: {
          excluded_payment_types: [],
          installments: 1,
        },
        back_urls: {
          success: baseUrl,
          failure: baseUrl,
          pending: baseUrl,
        },
        auto_return: 'approved',
        statement_descriptor: 'OUTBID PERU',
      },
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error: any) {
    console.error('Error Mercado Pago:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}