'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import KingDisplay from '../components/KingDisplay';
import Link from 'next/link';
import { useMetrics } from '../lib/useMetrics';
import { Moon, Sun, Sunset } from 'lucide-react';

interface Bid {
  id: string;
  title: string;
  url: string;
  image_url?: string;
  amount: number;
  status: 'king' | 'active' | 'approved';
  created_at?: string;
}

type TimeOfDay = 'dia' | 'tarde' | 'noche';

interface TimeConfig {
  label: string;
  emoji: string;
  bg: string;
  overlay: string;
  accent: string;
  accentSoft: string;
}

const TIME_CONFIG: Record<TimeOfDay, TimeConfig> = {
  dia: {
    label: 'DÍA',
    emoji: '☀️',
    bg: '/cerro-dia.jpeg',
    overlay: 'bg-white/10',
    accent: '#2563EB',
    accentSoft: '#60A5FA',
  },
  tarde: {
    label: 'TARDECIDO',
    emoji: '🌅',
    bg: '/cerro-tarde.jpeg',
    overlay: 'bg-orange-950/20',
    accent: '#EA580C',
    accentSoft: '#FACC15',
  },
  noche: {
    label: 'NOCHE',
    emoji: '🌙',
    bg: '/cerro-noche.jpeg',
    overlay: 'bg-[#0D0714]/70',
    accent: '#EC4899',
    accentSoft: '#FACC15',
  },
};

const ITEMS_PER_PAGE = 10;

function UserAvatar({
  url,
  imageUrl,
  alt,
  className = 'w-12 h-12',
}: {
  url?: string;
  imageUrl?: string;
  alt: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgSrc = useMemo(() => {
    if (imageUrl && imageUrl.trim() !== '') {
      return imageUrl.trim();
    }

    if (url) {
      const cleanUrl = url.trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
      if (cleanUrl.includes('instagram.com/')) {
        const username = cleanUrl.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
        if (username) {
          return `https://unavatar.io/instagram/${username}`;
        }
      }
    }

    return null;
  }, [url, imageUrl]);

  if (!imgSrc || failedSrc === imgSrc) {
    return (
      <div
        className={`${className} bg-[#CBD5E1] border-2 border-black rounded-2xl flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000] overflow-hidden`}
      >
        <svg className="w-3/4 h-3/4 text-[#64748B]" viewBox="0 0 24 24" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.6-7.812-1.7a.75.75 0 01-.437-.695z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`${className} object-cover border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] bg-gray-100 shrink-0`}
      onError={() => setFailedSrc(imgSrc)}
    />
  );
}

const formatSoles = (amount: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);

function ComicButton({
  children,
  onClick,
  accent,
  small = false,
  disabled = false,
  breathe = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  accent: string;
  small?: boolean;
  disabled?: boolean;
  breathe?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ backgroundColor: accent, boxShadow: '4px 4px 0px #000000' }}
      className={`max-w-full whitespace-normal break-words border-3 border-black font-black rounded-2xl leading-tight transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 ${
        small ? 'px-3 py-1.5 text-xs' : `mobile-safe-box px-5 py-4 text-base tracking-wider sm:w-auto sm:px-8 md:text-lg${breathe ? ' cerro-cta' : ''}`
      } text-black`}
    >
      {children}
    </button>
  );
}

function TimeSelector({
  value,
  onChange,
}: {
  value: TimeOfDay;
  onChange: (t: TimeOfDay) => void;
}) {
  const options: TimeOfDay[] = ['dia', 'tarde', 'noche'];
  const icons = { dia: Sun, tarde: Sunset, noche: Moon };

  return (
    <div className="cerro-time-selector mobile-safe-box grid max-w-full grid-cols-3 gap-1.5 border-3 border-black bg-white p-1 rounded-2xl shadow-[4px_4px_0px_#000] sm:w-auto">
      {options.map((opt) => {
        const cfg = TIME_CONFIG[opt];
        const isActive = value === opt;
        const Icon = icons[opt];
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={
              isActive
                ? { backgroundColor: '#FACC15', boxShadow: '2px 2px 0px #000' }
                : undefined
            }
            className={`flex min-w-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap px-1 py-1 text-center text-[8px] font-black border-2 rounded-xl transition-all min-[300px]:gap-1.5 min-[300px]:px-1.5 min-[300px]:text-[10px] sm:gap-2 sm:px-3 sm:text-xs ${
              isActive
                ? 'border-black text-black font-black'
                : 'border-transparent text-black/50 hover:text-black'
            }`}
          >
            <Icon aria-hidden="true" strokeWidth={2.5} className="size-2.5 shrink-0 min-[300px]:size-3 sm:size-3.5" />
            <span>{cfg.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TickerBar({ king, runnerUp }: { king?: Bid; runnerUp?: Bid }) {
  const messages = useMemo(() => {
    if (!king) {
      return [
        '🔥 El Cerro está vacante. Pon tus monedas y sé el primer Rey por solo S/ 1.00',
        '🚀 Pon tu marca o negocio en lo más alto de BAJATELO.PE',
      ];
    }

    const diff = runnerUp ? king.amount - runnerUp.amount + 0.5 : 0.5;

    return [
      `👑 ${king.title} domina la cima con ${formatSoles(king.amount)}`,
      runnerUp
        ? `⚡ A ${runnerUp.title} le faltan solo ${formatSoles(diff)} para bajárselo a ${king.title}`
        : `👀 ${king.title} reina con puro billete... ¿Nadie se atreve a bajárselo?`,
      `🔥 Pon tu marca o link en lo más alto de BAJATELO.PE`,
    ];
  }, [king, runnerUp]);

  return (
    <div className="w-full bg-yellow-300 border-b-3 border-black text-black text-xs md:text-sm font-black py-2.5 overflow-hidden shadow-sm whitespace-nowrap">
      <div className="inline-flex gap-12 animate-[marquee_20s_linear_infinite]">
        {[...messages, ...messages, ...messages].map((msg, index) => (
          <span key={index} className="inline-block flex-shrink-0">
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}

function BidModal({
  minAmount,
  accent,
  onClose,
  onConfirm,
}: {
  minAmount: number;
  accent: string;
  onClose: () => void;
  onConfirm: (data: { title: string; url: string; image_url: string; amount: number; operation_number: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [amount, setAmount] = useState<number | string>(minAmount);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'qr' | 'sent'>('form');
  const [operation, setOperation] = useState('');

  const handleSubmit = async () => {
    if (loading) return;
    setError('');
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (!title.trim() || !url.trim()) {
      setError('Escribe tu nombre o negocio y tu link.');
      return;
    }
    if (title.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    const isValidLink = (value: string) => {
      try {
        const parsed = new URL(/^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`);
        return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname.includes('.') && !parsed.username && !parsed.password;
      } catch {
        return false;
      }
    };
    if (!isValidLink(url)) {
      setError('Escribe un enlace valido, por ejemplo: instagram.com/tu_negocio');
      return;
    }
    if (imageUrl.trim() && !isValidLink(imageUrl)) {
      setError('El enlace de la foto no es valido. Corrigelo o deja ese campo vacio.');
      return;
    }
    if (!Number.isFinite(numAmount) || (step === 'form' && numAmount < minAmount)) {
      setError(`Mínimo billete para bajártelo: ${formatSoles(minAmount)}`);
      return;
    }

    if (numAmount > 999.99) {
      setError('El monto maximo por solicitud es S/ 999.99.');
      return;
    }
    if (step === 'form') { setStep('qr'); return; }
    if (!/^[a-zA-Z0-9-]{4,40}$/.test(operation.trim())) {
      setError('Ingresa el numero de operacion del comprobante, no el codigo de seguridad de 3 digitos.');
      return;
    }
    setLoading(true);
    try {
      await onConfirm({
      title: title.trim(),
      url: /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`,
      image_url: imageUrl.trim(),
      amount: numAmount,
      operation_number: operation.trim(),
      });
      setStep('sent');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo iniciar el pago. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="yape-modal w-full max-w-md bg-white border-3 border-black rounded-3xl shadow-[8px_8px_0px_#000000] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-black tracking-widest text-black uppercase bg-yellow-300 px-2.5 py-1 border-2 border-black rounded-xl">
            SOLTAR BILLETE
          </span>
          <button
            onClick={onClose}
            className="border-2 border-black rounded-xl w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white font-black"
          >
            ✕
          </button>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-black">Bájate al Rey del Cerro</h2>
        <p className="text-xs text-black/80 mt-1 font-bold">
          BILLETE MÍNIMO PARA LA CIMA: <span className="text-orange-600 font-black">{formatSoles(minAmount)}</span>
        </p>

        {step === 'form' && <div className="mt-6 space-y-3">
          <input
            type="text"
            placeholder="Tu nombre o el de tu negocio"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-2 border-black rounded-xl px-4 py-3 text-sm font-semibold outline-none text-black bg-white"
          />
          <input
            type="text"
            placeholder="Link (Instagram, TikTok, Web...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border-2 border-black rounded-xl px-4 py-3 text-sm font-semibold outline-none text-black bg-white"
          />
          <input
            type="text"
            placeholder="Link directo de foto/logo (Opcional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full border-2 border-black rounded-xl px-4 py-3 text-sm font-semibold outline-none text-black bg-white"
          />
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-base text-black">
              S/
            </span>
            <input
              type="number"
              min={minAmount}
              step="0.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border-2 border-black rounded-xl pl-10 pr-4 py-3 text-lg font-black text-black outline-none bg-white"
            />
          </div>

          {error && <p role="alert" className="text-red-600 text-xs font-black">{error}</p>}

          <ComicButton onClick={handleSubmit} accent={accent} disabled={loading}>
            CONTINUAR CON YAPE
          </ComicButton>
          <p className="text-xs text-black leading-relaxed">Revisaremos tu solicitud en un máximo de 20 minutos. Si todo está correcto, tu nombre estará listo para subir al cerro. 👑 Estás a un paso de la cima.</p>
        </div>}
        {step === 'qr' && <div className="mt-5 space-y-4 text-black text-center">
          <h3 className="text-xl font-black">Paga con Yape</h3>
          <p className="font-bold">Monto: {formatSoles(Number(amount))}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/yape-qr.jpg" alt="QR de Yape del administrador" className="w-full max-w-64 max-h-72 object-contain mx-auto" />
          <a href="/yape-qr.jpg" download="yape-qr.jpg" className="underline font-bold inline-block">Descargar QR</a>
          <p className="text-sm">La publicacion es manual, despues de verificar el ingreso. El pago no reserva la cima; si otra puja te supera antes de la revision, el administrador gestionara tu devolucion.</p>
          <label className="block text-left text-sm font-bold">Numero de operacion
            <input value={operation} onChange={e => setOperation(e.target.value)} maxLength={40} autoComplete="off" className="mt-1 w-full border-2 border-black rounded-lg p-3 bg-white" />
          </label>
          {error && <p role="alert" className="text-red-700 font-bold text-sm">{error}</p>}
          <ComicButton onClick={handleSubmit} accent={accent} disabled={loading}>{loading ? 'ENVIANDO...' : 'YA YAPEE, ENVIAR SOLICITUD'}</ComicButton>
          <button onClick={() => { setStep('form'); setError(''); }} disabled={loading} className="underline text-sm">Volver a mis datos</button>
        </div>}
        {step === 'sent' && <div className="mt-6 space-y-4 text-black">
          <h3 className="text-xl font-black">Solicitud enviada</h3>
          <p>Tu Yape de {formatSoles(Number(amount))} esta pendiente de verificacion. Conserva tu comprobante. Tu puja aparecera cuando el administrador la apruebe.</p>
          <p>Revision en un maximo de 20 minutos. Para consultas: <a href="https://www.instagram.com/9luizo/" target="_blank" rel="noopener noreferrer" className="underline">@9luizo</a>.</p>
          <ComicButton onClick={onClose} accent={accent}>ENTENDIDO</ComicButton>
        </div>}
      </div>
    </div>
  );
}

export default function Home() {
  const { metrics, online, trackClick } = useMetrics();
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('tarde');
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const cfg = TIME_CONFIG[timeOfDay];

  // OBTENER PUJAS DESDE SUPABASE
  const fetchBids = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select('id,title,url,image_url,amount,status,created_at')
        .in('status', ['king', 'active', 'approved'])
        .order('amount', { ascending: false });

      if (!error && data) {
        setBids(data as Bid[]);
      }
    } catch (err) {
      console.error('Error al obtener pujas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // RETORNO DE PAGO SI APLICA
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const status = queryParams.get('status');

    if (status) {
      const messageByStatus: Record<string, string> = {
        success: 'Pago recibido. Tu puja aparecerá apenas Mercado Pago confirme la operación.',
        approved: 'Pago recibido. Tu puja aparecerá apenas Mercado Pago confirme la operación.',
        pending: 'Tu pago quedó pendiente. Lo publicaremos cuando Mercado Pago lo apruebe.',
        failure: 'El pago no se completó. Puedes intentarlo otra vez cuando quieras.',
      };

      const message = messageByStatus[status];
      if (message) {
        alert(message);
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchBids]);

  // SUSCRIPCIÓN EN TIEMPO REAL
  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchBids();
    }, 0);

    const channel = supabase
      .channel('bids-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        () => fetchBids()
      )
      .subscribe();

    return () => {
      window.clearTimeout(initialFetch);
      supabase.removeChannel(channel);
    };
  }, [fetchBids]);

  const sortedBids = useMemo(() => [...bids].sort((a, b) => b.amount - a.amount), [bids]);
  
  const king = sortedBids[0];
  const runnerUp = sortedBids[1];
  
  const rest = useMemo(() => sortedBids.slice(1), [sortedBids]);
  const minToBeKing = king ? king.amount + 0.5 : 1;

  const totalPages = Math.ceil(rest.length / ITEMS_PER_PAGE) || 1;
  const paginatedRest = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return rest.slice(start, start + ITEMS_PER_PAGE);
  }, [rest, currentPage]);

  const fromIndex = rest.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const toIndex = Math.min(currentPage * ITEMS_PER_PAGE, rest.length);

  const handleConfirmBid = useCallback(
    async (data: { title: string; url: string; image_url: string; amount: number; operation_number: string }) => {
      try {
        const res = await fetch('/api/yape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            url: data.url,
            image_url: data.image_url,
            amount: data.amount,
            operation_number: data.operation_number,
          }),
        });

        const responseData = await res.json().catch(() => ({}));

        if (!res.ok || !responseData.id) {
          throw new Error(responseData.error || 'No se pudo guardar la solicitud.');
        }
      } catch (err) {
        console.error(err);
        throw new Error(err instanceof Error && !(err instanceof TypeError)
          ? err.message
          : 'No se pudo conectar con el servidor. Revisa tu conexion e intenta nuevamente.');
      }
    },
    []
  );

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col overflow-x-hidden"
      style={{ backgroundImage: `url(${cfg.bg})` }}
    >
      <div className={`absolute inset-0 ${cfg.overlay}`} />

      {/* CINTILLO SUPERIOR */}
      <div className="relative z-20">
        <TickerBar king={king} runnerUp={runnerUp} />
      </div>

      <div className="relative z-10 max-w-[672px] mx-auto px-4 py-6 w-full flex-1">
        {/* BARRA SUPERIOR */}
        <div className="cerro-topbar mb-4">
          <span className="cerro-brand self-start bg-white border-3 border-black rounded-2xl text-xs font-black tracking-widest shadow-[3px_3px_0px_#000] text-black">
              ELREYDELCERRO.PE
          </span>
          <TimeSelector value={timeOfDay} onChange={setTimeOfDay} />

          <div className="cerro-stats" aria-label="Estadisticas del cerro">
          <div title="Entradas acumuladas desde la activacion del contador; no son personas unicas."><strong>{metrics ? (metrics.visits ?? 0).toLocaleString('es-PE') : '...'}</strong><span>visitas al cerro</span></div>
          <div title="Sesiones conectadas ahora. Una persona puede tener mas de una sesion."><i className={online === null ? 'live-dot offline' : 'live-dot'} /><strong>{online === null ? '...' : online.toLocaleString('es-PE')}</strong><span>viendo ahora</span></div>
          </div>
        </div>

        {/* HEADER CON LOGO */}
        <header className="mb-6 flex flex-col items-center text-center">
          <img
            src="/logo-rey.png"
            alt="El Rey del Cerro"
            className="cerro-logo w-full max-w-xs sm:max-w-md md:max-w-lg h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
          />

          <p className="mobile-safe-box max-w-full text-center text-xs md:text-sm font-extrabold mt-3 sm:max-w-lg bg-white border-3 border-black rounded-2xl px-5 py-2.5 shadow-[4px_4px_0px_#000] text-black">
            Cualquiera sube, pero solo el que tiene billete se queda arriba.
          </p>
        </header>

        {/* BOTÓN CTA PRINCIPAL */}
        <div className="mb-3 flex justify-center">
          <ComicButton onClick={() => setModalOpen(true)} accent={cfg.accentSoft} breathe>
            ¡EL CERRO ES MÍO! ✌️😂
          </ComicButton>
        </div>

        {/* ESTADO CARGANDO */}
        {loading && (
          <div className="mobile-safe-box mx-auto max-w-full bg-white border-3 border-black rounded-2xl p-8 text-center font-black shadow-[5px_5px_0px_#000] text-black">
            CARGANDO EL CERRO...
          </div>
        )}

        {/* REY DEL CERRO (#1) */}
        {!loading && (
          <KingDisplay
            king={king}
            clicks={metrics && king ? (metrics[`click:${king.id}`] ?? 0) : undefined}
            onVisit={() => king && trackClick(king.id)}
            accentColor={cfg.accent}
            avatar={king ? <UserAvatar url={king.url} imageUrl={king.image_url} alt={king.title} className="w-full h-full" /> : undefined}
          />
        )}

        {/* TABLERO PAGINADO DE ASPIRANTES (#2 EN ADELANTE) */}
        {!loading && rest.length > 0 && (
          <div className="mt-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="bg-white border-2 border-black px-3 py-1 rounded-xl shadow-[2px_2px_0px_#000]">
                <p className="text-xs font-black tracking-wider uppercase text-black">
                  🎯 LISTOS PARA SERRUCHAR AL REY
                </p>
              </div>

              <span className="text-xs font-black bg-white/90 border-2 border-black px-2.5 py-0.5 rounded-lg text-black">
                Pág {currentPage} de {totalPages}
              </span>
            </div>

            <div className="border-3 border-black bg-white rounded-3xl overflow-hidden shadow-[6px_6px_0px_#000]">
              {paginatedRest.map((bid, index) => {
                const globalRank = (currentPage - 1) * ITEMS_PER_PAGE + index + 2;
                return (
                  <div
                    key={bid.id}
                    className="bid-row border-b-2 last:border-b-0 border-black/15"
                  >
                    <span className="text-base md:text-lg font-black text-black/50 w-8 text-center shrink-0">
                      #{globalRank}
                    </span>

                    <UserAvatar
                      url={bid.url}
                      imageUrl={bid.image_url}
                      alt={bid.title}
                      className="w-12 h-12"
                    />

                    <a
                      href={bid.url.startsWith('http') ? bid.url : `https://${bid.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick(bid.id)}
                      onAuxClick={event => { if (event.button === 1) trackClick(bid.id); }}
                      className="flex-1 min-w-0"
                    >
                      <p className="text-sm font-black text-black truncate">{bid.title}</p>
                      <p className="text-[11px] text-[#64748B] truncate font-semibold">{bid.url}</p>
                      <p className="text-[11px] text-black/70 font-extrabold">{metrics ? (metrics[`click:${bid.id}`] ?? 0).toLocaleString('es-PE') : '...'} {metrics?.[`click:${bid.id}`] === 1 ? 'clic' : 'clics'}</p>
                    </a>

                    <span className="text-sm md:text-base font-black shrink-0 mr-1" style={{ color: cfg.accent }}>
                      {formatSoles(bid.amount)}
                    </span>

                    <ComicButton small accent="#FACC15" onClick={() => setModalOpen(true)}>
                      BÁJATELO
                    </ComicButton>
                  </div>
                );
              })}
            </div>

            {/* BARRA DE PAGINACIÓN */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 bg-white border-3 border-black p-2 rounded-2xl shadow-[4px_4px_0px_#000]">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border-2 border-black rounded-xl font-black text-sm disabled:opacity-30 text-black transition-colors"
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, idx, array) => {
                    const prev = array[idx - 1];
                    const showEllipsis = prev && page - prev > 1;

                    return (
                      <div key={page} className="flex items-center gap-2">
                        {showEllipsis && <span className="font-black text-black px-1">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center border-2 border-black rounded-xl text-xs font-black transition-all ${
                            currentPage === page
                              ? 'bg-orange-500 text-white scale-110 shadow-[2px_2px_0px_#000]'
                              : 'bg-white hover:bg-gray-100 text-black'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border-2 border-black rounded-xl font-black text-sm disabled:opacity-30 text-black transition-colors"
                >
                  &gt;
                </button>
              </div>

              <p className="text-xs font-black bg-white border-2 border-black px-3 py-1 rounded-xl shadow-[2px_2px_0px_#000] text-black">
                {fromIndex} - {toIndex} de {rest.length} aspirantes
              </p>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-12 text-center">
          <div className="site-footer">
            <nav aria-label="Informacion del sitio" className="flex flex-wrap justify-center gap-x-5 gap-y-3 my-4 text-sm">
              <Link href="/about">About</Link><Link href="/rules">Rules</Link><Link href="/faq">FAQ</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link>
            </nav>
            <a href="https://www.instagram.com/9luizo/" target="_blank" rel="noopener noreferrer" className="text-sm underline">Contacto: @9luizo</a>
          </div>
          <span className="mobile-safe-box max-w-full text-[11px] font-black bg-white border-2 border-black rounded-2xl px-4 py-2 shadow-[3px_3px_0px_#000] inline-block text-black whitespace-normal break-words">
            METE TU BILLETE, BÁJATE AL REY Y QUÉDATE CON TODO EL CERRO.
          </span>
        </footer>
      </div>

      {modalOpen && (
        <BidModal
          minAmount={minToBeKing}
          accent={cfg.accentSoft}
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirmBid}
        />
      )}

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </main>
  );
}
