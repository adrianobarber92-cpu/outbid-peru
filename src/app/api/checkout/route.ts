import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, amount, bid_id } = body;

    const token = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!token) {
      console.error('Error: No hay token de Mercado Pago en las variables de entorno.');
      return NextResponse.json(
        { error: 'Falta configurar el Token de Mercado Pago en Vercel.' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    // Limpieza de URL para asegurar que empiece con https:// y no termine en /
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    baseUrl = baseUrl.trim().replace(/\/+$/, '');

    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }

    const isLocalhost = baseUrl.includes('localhost');

    const preferenceData: any = {
      items: [
        {
          id: String(bid_id || 'rey-del-cerro'),
          title: `Pujar por el Cerro: ${title || 'Nuevo Rey'}`,
          quantity: 1,
          unit_price: Number(amount) || 1,
          currency_id: 'PEN',
        },
      ],
      back_urls: {
        success: `${baseUrl}/?status=success`,
        failure: `${baseUrl}/?status=failure`,
        pending: `${baseUrl}/?status=pending`,
      },
      external_reference: String(bid_id || ''),
    };

    // Solo enviamos URLs de retorno/notificación si estamos en producción (https)
    if (!isLocalhost && baseUrl.startsWith('https://')) {
      preferenceData.auto_return = 'approved';
      preferenceData.notification_url = `${baseUrl}/api/webhooks/mercadopago`;
    }

    const result = await preference.create({ body: preferenceData });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error: any) {
    console.error('Error detallado Mercado Pago:', error?.cause || error);
    return NextResponse.json(
      { error: error?.message || 'Error al generar la pasarela de pago.' },
      { status: 500 }
    );
  }
}