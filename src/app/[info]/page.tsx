import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const pages: Record<string, { title: string; sections: [string, string][] }> = {
  about: { title: 'Acerca del cerro', sections: [
    ['Tu enlace en la cima', 'El Rey del Cerro es un ranking de enlaces para nombres, marcas y negocios. Las pujas aprobadas se ordenan por monto: la mas alta ocupa la cima y las anteriores siguen en la lista.'],
    ['Hecho para Peru', 'La idea se inspira en el ranking de Outbid, con una identidad propia y pagos en soles mediante Yape. Este proyecto es independiente de Outbid y de Yape. No hay sorteos ni premios en dinero: participas por la ubicacion de tu enlace.'],
    ['Contacto', 'Consultas, pagos pendientes y solicitudes de devolucion se atienden por Instagram: @9luizo.'],
  ] },
  rules: { title: 'Reglas del cerro', sections: [
    ['1. Sube con una puja real', 'La primera puja parte de S/ 1.00. Para alcanzar la cima, tu monto debe superar al rey actual por al menos S/ 0.50. El limite por solicitud es S/ 999.99. Cada solicitud es una puja independiente: los montos no se acumulan.'],
    ['2. Yapea y envia tu solicitud', 'Completa tu nombre o negocio, enlace y monto. Paga al QR publicado e ingresa el numero de operacion de tu comprobante. No ingreses el codigo de seguridad de Yape. Conserva tu comprobante.'],
    ['3. Espera la verificacion', 'El administrador verifica el ingreso real en Yape y revisa la solicitud en un maximo de 20 minutos desde su envio. Un comprobante o una solicitud no equivalen a una aprobacion ni reservan la cima. Si pasan 20 minutos, contacta a @9luizo.'],
    ['4. La cima puede cambiar', 'Solo se publica una puja despues de aprobarla. Si ya no alcanza el minimo al revisarla, no se aprueba y se gestiona la devolucion del pago verificado. Una puja aprobada puede bajar de puesto cuando llegue una superior: no se garantiza tiempo en la cima.'],
    ['5. Devoluciones', 'Las pujas reales aprobadas no se devuelven por perder la cima o por recibir pocos clics. Los pagos verificados no aprobados se devuelven en un plazo de 20 a 30 minutos, con un maximo de 30 minutos desde que se confirma la no aprobacion. Coordina por @9luizo. Esto no limita los derechos que correspondan por ley ante un incumplimiento del servicio.'],
    ['6. Enlaces responsables', 'Publica solo nombres, imagenes y enlaces que tengas derecho a usar. No se permiten suplantaciones, estafas, malware ni contenido ilegal. Los enlaces externos son responsabilidad de quienes los publican.'],
  ] },
  faq: { title: 'Preguntas frecuentes', sections: [
    ['¿Que estoy pagando?', 'La publicacion y posicion de tu enlace en un ranking ordenado por el monto aprobado. No compras seguidores, ventas, un premio ni un numero garantizado de visitas.'],
    ['¿Por que mi Yape aun no aparece?', 'La revision es manual y tiene un plazo maximo de 20 minutos desde que enviaste la solicitud con el numero de operacion. Si ya paso ese tiempo, escribe a @9luizo con tu comprobante.'],
    ['¿Me devuelven si alguien me supera?', 'No se devuelve una puja aprobada por bajar de puesto. Si el pago verificado no se aprueba, se devuelve en 20 a 30 minutos, con un maximo de 30 minutos desde la confirmacion de no aprobacion.'],
    ['¿Que significa viendo ahora?', 'Es el numero de sesiones conectadas a la pagina principal en ese momento. Puede tardar un poco en reflejar una desconexion. No identifica personas: una misma persona puede abrir mas de una sesion.'],
    ['¿Que cuenta como visita?', 'Una entrada a la pagina principal, incluida una recarga. No son personas unicas ni usuarios conectados. Se omiten repeticiones inmediatas y el conteo empieza desde la activacion del contador; no reconstruye visitas antiguas.'],
    ['¿Que cuentan los clics?', 'Aperturas del enlace de cada participante desde el cerro. Se filtran repeticiones inmediatas de la misma sesion. No confirman que el destino haya cargado, ni equivalen a visitantes unicos o ventas. Los contadores se actualizan automaticamente y pueden tener un breve retraso.'],
    ['¿Como pido ayuda?', 'El unico contacto publico es Instagram @9luizo. Nunca compartas tu clave de Yape, codigos de acceso o datos completos de una tarjeta.'],
  ] },
  terms: { title: 'Terminos de uso', sections: [
    ['Responsable', 'Luis Valenzuela es el responsable de El Rey del Cerro. El contacto publico es @9luizo en Instagram. Estas condiciones describen el funcionamiento actual del sitio.'],
    ['Servicio y participacion', 'El Rey del Cerro publica enlaces en un ranking por monto aprobado. El pago se realiza en soles por Yape y requiere verificacion manual, con revision en un maximo de 20 minutos desde el envio de la solicitud. Las reglas del cerro forman parte de estas condiciones.'],
    ['Posicion y resultados', 'La cima corresponde a la puja aprobada mas alta. No se reserva por iniciar o enviar un pago. No se garantiza una duracion en el primer puesto, un volumen de trafico, conversiones ni beneficios economicos. Los contadores son orientativos y no una auditoria de audiencia.'],
    ['Pagos y devoluciones', 'No se devuelve una puja real aprobada por ser superada o por no obtener el resultado esperado. Los pagos verificados no aprobados se devuelven en 20 a 30 minutos, con un maximo de 30 minutos desde la confirmacion de no aprobacion, coordinando por @9luizo. Estas condiciones no excluyen los derechos obligatorios del consumidor ni remedios que correspondan por incumplimiento del servicio.'],
    ['Contenido y seguridad', 'Debes tener derecho a publicar el nombre, imagen y enlace enviados. No publiques contenido ilegal, fraudulento ni malicioso. Se podran revisar o retirar contenidos que infrinjan estas reglas. Los sitios enlazados son de terceros y tienen sus propias condiciones.'],
    ['Consultas y cambios', 'Contacta a @9luizo para incidencias o reclamaciones. Cualquier cambio de reglas debera comunicarse antes de aplicarse a nuevas solicitudes; no modifica retroactivamente las condiciones de un pago ya realizado.'],
  ] },
  privacy: { title: 'Privacidad', sections: [
    ['Responsable', 'Luis Valenzuela es el responsable del tratamiento de los datos de este sitio. Para consultas de privacidad, contacta a @9luizo en Instagram. Este aviso debe completarse antes del lanzamiento publico con el domicilio y los plazos de conservacion aplicables a las solicitudes de pago.'],
    ['Datos de participacion', 'Para tramitar una puja se guardan el nombre o negocio, enlace, imagen opcional, monto, numero de operacion, fecha y estado de revision. Se utilizan para verificar el pago, gestionar devoluciones y publicar el ranking. El numero de operacion y las solicitudes pendientes no se muestran publicamente.'],
    ['Datos visibles', 'Al aprobarse la puja, se publican el nombre, enlace, imagen si existe, monto y clics del participante. No envies informacion que no quieras asociar publicamente a tu participacion.'],
    ['Contadores', 'El navegador guarda un identificador aleatorio de sesion para limitar repeticiones. Se registran eventos con identificador aleatorio, fecha y participante cuando corresponda. Los eventos se eliminan al procesar nuevos eventos una vez superadas 24 horas; los totales agregados se conservan. El sistema de contadores no guarda direcciones IP ni usa cookies publicitarias. Los proveedores de alojamiento pueden mantener sus propios registros tecnicos.'],
    ['Proveedores y enlaces', 'Supabase almacena los datos del sitio. Las imagenes externas y el servicio de avatares pueden recibir datos tecnicos del navegador al cargar. Yape e Instagram procesan los datos de sus propios servicios conforme a sus politicas. Al abrir un enlace externo sales de este sitio.'],
    ['Tus derechos', 'Puedes solicitar acceso, rectificacion, cancelacion u oposicion al tratamiento de tus datos mediante @9luizo. La solicitud se evaluara conforme a la normativa peruana y a las obligaciones de conservacion que correspondan. No envies claves ni documentos sensibles por mensajes publicos.'],
  ] },
};

export function generateStaticParams() { return Object.keys(pages).map(info => ({ info })); }
export async function generateMetadata({ params }: { params: Promise<{ info: string }> }): Promise<Metadata> {
  const slug = (await params).info;
  const page = Object.hasOwn(pages, slug) ? pages[slug] : undefined;
  return { title: page ? `${page.title} | El Rey del Cerro` : 'Pagina no encontrada' };
}
export default async function InfoPage({ params }: { params: Promise<{ info: string }> }) {
  const { info } = await params;
  const page = Object.hasOwn(pages, info) ? pages[info] : undefined;
  if (!page) notFound();
  return <main className="info-page"><article>
    <Link href="/">Volver al cerro</Link>
    <h1>{page.title}</h1>
    {page.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}
    <p><a href="https://www.instagram.com/9luizo/" target="_blank" rel="noopener noreferrer">Contactar a @9luizo</a></p>
    <nav aria-label="Informacion del sitio">{Object.entries(pages).map(([slug, item]) => <Link key={slug} href={`/${slug}`} aria-current={slug === info ? 'page' : undefined}>{item.title}</Link>)}</nav>
  </article></main>;
}
