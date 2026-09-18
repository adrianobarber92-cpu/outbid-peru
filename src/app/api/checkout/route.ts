import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, amount, bid_id } = body;

    const token = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: 'Falta configurar el Token de Mercado Pago en las variables de entorno.' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    const parsedAmount = parseFloat(Number(amount).toFixed(2));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'El monto ingresado no es válido.' },
        { status: 400 }
      );
    }

    // Configuración de la preferencia
    const preferenceData: any = {
      items: [
        {
          id: String(bid_id || 'rey-del-cerro'),
          title: `Pujar por el Cerro: ${title || 'Nuevo Rey'}`,
          quantity: 1,
          unit_price: parsedAmount,
          currency_id: 'PEN',
        },
      ],
      back_urls: {
        success: 'https://outbid-peru.vercel.app/?status=success',
        failure: 'https://outbid-peru.vercel.app/?status=failure',
        pending: 'https://outbid-peru.vercel.app/?status=pending',
      },
      auto_return: 'approved',
    };

    // Solo agregar notification_url en la URL de producción activa
    if (process.env.NODE_ENV === 'production') {
      preferenceData.notification_url = 'https://outbid-peru.vercel.app/api/webhooks/mercadopago';
    }

    const result = await preference.create({ body: preferenceData });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error: any) {
    console.error('Error en checkout:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al generar la pasarela de pago.' },
      { status: 500 }
    );
  }
}