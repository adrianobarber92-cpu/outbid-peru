import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, amount, bid_id } = body;

    const token = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: 'Falta la clave MP_ACCESS_TOKEN en .env.local' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const isLocalhost = baseUrl.includes('localhost');

    // Construcción del objeto de preferencia
    const preferenceData: any = {
      items: [
        {
          id: bid_id || 'rey-del-cerro',
          title: `Pujar por el Cerro: ${title || 'Nuevo Rey'}`,
          quantity: 1,
          unit_price: Number(amount),
          currency_id: 'PEN',
        },
      ],
      back_urls: {
        success: `${baseUrl}/?status=success`,
        failure: `${baseUrl}/?status=failure`,
        pending: `${baseUrl}/?status=pending`,
      },
      // Permite asociar el id de la puja a la transacción en los webhooks
      external_reference: bid_id || '',
    };

    // Solo se agregan auto_return y notification_url si está en producción (Vercel)
    if (!isLocalhost) {
      preferenceData.auto_return = 'approved';
      preferenceData.notification_url = `${baseUrl}/api/webhooks/mercadopago`;
    }

    const result = await preference.create({ body: preferenceData });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error: any) {
    console.error('Error detallado Mercado Pago:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al procesar la pasarela' },
      { status: 500 }
    );
  }
}