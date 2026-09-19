import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request: Request) {
  try {
    const token = process.env.MP_ACCESS_TOKEN;

    if (!token) {
      console.error('CRÍTICO: MP_ACCESS_TOKEN no está definido en Vercel.');
      return NextResponse.json(
        { error: 'Falta configurar MP_ACCESS_TOKEN' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const body = await request.json();
    const { title, url, image_url, amount } = body;

    if (!amount || Number(amount) <= 0) {
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
        metadata: {
          bid_title: title,
          bid_url: url,
          bid_image_url: image_url,
          bid_amount: Number(amount),
        },
        back_urls: {
          success: `${baseUrl}/?status=success`,
          failure: `${baseUrl}/?status=failure`,
          pending: `${baseUrl}/?status=pending`,
        },
        auto_return: 'approved',
      },
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error: any) {
    console.error('Error en Mercado Pago backend:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}