import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Lee el Access Token desde las variables de entorno para evitar exponer credenciales privadas
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.warn('Advertencia: No se encontró el ACCESS_TOKEN de Mercado Pago en las variables de entorno.');
}

const client = new MercadoPagoConfig({ 
  accessToken: ACCESS_TOKEN || '' 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, url, image_url, amount } = body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://outbid-peru.vercel.app';
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        binary_mode: true, // Forzar aprobación o rechazo inmediato sin dejar transacciones pendientes
        items: [
          {
            id: 'bajatelo-bid',
            title: `Pujar: ${title || 'Rey del Cerro'}`,
            unit_price: parsedAmount,
            quantity: 1,
            currency_id: 'PEN',
          },
        ],
        metadata: {
          bid_title: title,
          bid_url: url,
          bid_image_url: image_url,
          bid_amount: parsedAmount,
        },
        back_urls: {
          success: `${baseUrl}/?status=success`,
          failure: `${baseUrl}/?status=failure`,
          pending: `${baseUrl}/?status=pending`,
        },
        auto_return: 'approved',
      },
    });

    if (!result.init_point) {
      throw new Error('No se generó el init_point en Mercado Pago');
    }

    return NextResponse.json({ init_point: result.init_point });
  } catch (error: any) {
    console.error('Error en API Checkout Mercado Pago:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al conectar con Mercado Pago' },
      { status: 500 }
    );
  }
}