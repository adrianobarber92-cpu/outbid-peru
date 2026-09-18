'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Bid {
  id: string;
  title: string;
  url: string;
  image_url?: string;
  amount: number;
  status: 'king' | 'active';
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
    label: 'TARDECITO',
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
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);

    if (imageUrl && imageUrl.trim() !== '') {
      setImgSrc(imageUrl.trim());
      return;
    }

    if (url) {
      const cleanUrl = url.trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
      if (cleanUrl.includes('instagram.com/')) {
        const username = cleanUrl.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
        if (username) {
          setImgSrc(`https://unavatar.io/instagram/${username}`);
          return;
        }
      }
    }

    setImgSrc(null);
  }, [url, imageUrl]);

  if (!imgSrc || hasError) {
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
      onError={() => setHasError(true)}
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
  accent: string;
  small?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ backgroundColor: accent, boxShadow: '4px 4px 0px #000000' }}
      className={`border-3 border-black font-black rounded-2xl transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 ${
        small ? 'px-3 py-1.5 text-xs' : 'px-8 py-4 text-base md:text-lg tracking-wider animate-[breath_2.5s_ease-in-out_infinite]'
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

  return (
    <div className="flex gap-1.5 border-3 border-black bg-white p-1.5 rounded-2xl shadow-[4px_4px_0px_#000]">
      {options.map((opt) => {
        const cfg = TIME_CONFIG[opt];
        const isActive = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={
              isActive
                ? { backgroundColor: cfg.accentSoft, boxShadow: '2px 2px 0px #000' }
                : undefined
            }
            className={`px-3 py-1.5 text-xs font-black border-2 rounded-xl transition-all ${
              isActive
                ? 'border-black text-black font-black'
                : 'border-transparent text-black/50 hover:text-black'
            }`}
          >
            {cfg.emoji} {cfg.label}
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
  onConfirm: (data: { title: string; url: string; image_url: string; amount: number }) => void;
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [amount, setAmount] = useState<number | string>(minAmount);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (!title.trim() || !url.trim()) {
      setError('Escribe tu nombre o negocio y tu link.');
      return;
    }
    if (isNaN(numAmount) || numAmount < minAmount) {
      setError(`Mínimo billete para bajártelo: ${formatSoles(minAmount)}`);
      return;
    }

    setLoading(true);
    await onConfirm({
      title: title.trim(),
      url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
      image_url: imageUrl.trim(),
      amount: numAmount,
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border-3 border-black rounded-3xl shadow-[8px_8px_0px_#000000] p-6">
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

        <div className="mt-5 space-y-3">
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

          {error && <p className="text-red-600 text-xs font-black">{error}</p>}

          <ComicButton onClick={handleSubmit} accent={accent} disabled={loading}>
            {loading ? 'CONECTANDO A MERCADO PAGO...' : '💳 IR A PAGAR CON MERCADO PAGO 🚀'}
          </ComicButton>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('tarde');
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [justCrowned, setJustCrowned] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const cfg = TIME_CONFIG[timeOfDay];

  // OBTENER PUJAS DESDE SUPABASE
  const fetchBids = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
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

  // CAPTURAR RETORNO DE MERCADO PAGO EN ENTORNO LOCAL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const status = queryParams.get('status');

    if (status === 'approved') {
      const title = queryParams.get('title');
      const url = queryParams.get('url');
      const image_url = queryParams.get('image_url') || '';
      const amount = Number(queryParams.get('amount'));

      if (title && amount) {
        // Insertar directamente en Supabase si volvemos con pago aprobado
        supabase
          .from('bids')
          .insert({
            title,
            url,
            image_url,
            amount,
            status: 'active',
          })
          .then(() => {
            fetchBids();
            // Limpiar query params de la barra de direcciones
            window.history.replaceState({}, document.title, window.location.pathname);
          });
      }
    }
  }, [fetchBids]);

  // SUSCRIPCIÓN EN TIEMPO REAL
  useEffect(() => {
    fetchBids();

    const channel = supabase
      .channel('bids-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        () => fetchBids()
      )
      .subscribe();

    return () => {
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
    async (data: { title: string; url: string; image_url: string; amount: number }) => {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            url: data.url,
            image_url: data.image_url,
            amount: data.amount,
          }),
        });

        const responseData = await res.json();

        if (responseData.init_point) {
          window.location.href = responseData.init_point;
        } else {
          alert('Error al generar la pasarela de pago de Mercado Pago.');
        }
      } catch (err) {
        console.error(err);
        alert('Ocurrió un error al conectar con Mercado Pago.');
      }
    },
    []
  );

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col"
      style={{ backgroundImage: `url(${cfg.bg})` }}
    >
      <div className={`absolute inset-0 ${cfg.overlay}`} />

      {/* CINTILLO SUPERIOR */}
      <div className="relative z-20">
        <TickerBar king={king} runnerUp={runnerUp} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 w-full flex-1">
        {/* BARRA SUPERIOR */}
        <div className="flex items-center justify-between mb-4">
          <span className="bg-white border-3 border-black px-4 py-1.5 rounded-2xl text-xs font-black tracking-widest shadow-[3px_3px_0px_#000] text-black">
            BAJATELO.PE
          </span>
          <TimeSelector value={timeOfDay} onChange={setTimeOfDay} />
        </div>

        {/* HEADER CON LOGO */}
        <header className="mb-6 flex flex-col items-center text-center">
          <img
            src="/logo-rey.png"
            alt="El Rey del Cerro"
            className="w-full max-w-xs sm:max-w-md md:max-w-lg h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] animate-[breath_2.5s_ease-in-out_infinite]"
          />

          <p className="text-xs md:text-sm font-extrabold mt-3 max-w-lg bg-white border-3 border-black rounded-2xl px-5 py-2.5 shadow-[4px_4px_0px_#000] text-black">
            Cualquiera sube, pero solo el que tiene billete se queda arriba.
          </p>
        </header>

        {/* BOTÓN CTA PRINCIPAL */}
        <div className="mb-8 flex justify-center">
          <ComicButton onClick={() => setModalOpen(true)} accent={cfg.accentSoft}>
            ¡EL CERRO ES MÍO! ✌️😂
          </ComicButton>
        </div>

        {/* ESTADO CARGANDO */}
        {loading && (
          <div className="bg-white border-3 border-black rounded-2xl p-8 text-center font-black shadow-[5px_5px_0px_#000] text-black">
            CARGANDO EL CERRO...
          </div>
        )}

        {/* REY DEL CERRO (#1) */}
        {!loading && king && (
          <div className="mb-6">
            <div
              className={`bg-white border-3 border-black rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_#000000] transition-transform ${
                justCrowned === king.id ? 'scale-[1.02]' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  style={{ backgroundColor: cfg.accentSoft }}
                  className="text-xs font-black tracking-widest px-3 py-1 rounded-xl border-2 border-black text-black"
                >
                  👑 REY ACTUAL DEL CERRO (#1)
                </span>
              </div>

              {justCrowned === king.id && (
                <p className="text-xs font-black mb-3 text-emerald-600 animate-bounce">
                  🎉 ¡NUEVO REY EN LA CIMA!
                </p>
              )}

              <a
                href={king.url.startsWith('http') ? king.url : `https://${king.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col md:flex-row items-center gap-6 group"
              >
                <UserAvatar
                  url={king.url}
                  imageUrl={king.image_url}
                  alt={king.title}
                  className="w-28 h-28 md:w-36 md:h-36 group-hover:scale-105 transition-transform"
                />

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl md:text-4xl font-black leading-tight text-black">
                    {king.title}
                  </h3>
                  <p className="text-xs mt-1 truncate max-w-xs mx-auto md:mx-0 font-semibold text-black/75">
                    {king.url}
                  </p>
                  <p
                    className="text-3xl md:text-5xl font-black mt-2 tracking-tight"
                    style={{ color: cfg.accent }}
                  >
                    {formatSoles(king.amount)}
                  </p>
                </div>
              </a>
            </div>
          </div>
        )}

        {/* TABLERO PAGINADO DE ASPIRANTES (#2 EN ADELANTE) */}
        {!loading && rest.length > 0 && (
          <div className="mt-8">
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
                    className="flex items-center gap-3 px-4 py-3 border-b-2 last:border-b-0 border-black/15"
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
                      className="flex-1 min-w-0"
                    >
                      <p className="text-sm font-black text-black truncate">{bid.title}</p>
                      <p className="text-[11px] text-black/60 truncate font-semibold">{bid.url}</p>
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
                  className="px-3 py-1.5 border-2 border-black rounded-xl font-black text-sm disabled:opacity-30 disabled:hover:bg-transparent hover:bg-yellow-300 text-black transition-colors"
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
                  className="px-3 py-1.5 border-2 border-black rounded-xl font-black text-sm disabled:opacity-30 disabled:hover:bg-transparent hover:bg-yellow-300 text-black transition-colors"
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
          <span className="text-[11px] font-black bg-white border-2 border-black rounded-2xl px-4 py-2 shadow-[3px_3px_0px_#000] inline-block text-black">
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
        @keyframes breath {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }

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