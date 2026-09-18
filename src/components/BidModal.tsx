'use client';

import { useState } from 'react';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHighestBid: number;
}

export default function BidModal({ isOpen, onClose, currentHighestBid }: BidModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [amount, setAmount] = useState<number>(currentHighestBid + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amount <= currentHighestBid) {
      setError(`La puja debe ser mayor a S/ ${currentHighestBid} para bajarte al Rey.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          url: url.startsWith('http') ? url : `https://${url}`,
          image_url: imageUrl || 'https://placehold.co/400x400/1a1a1a/38bdf8?text=PUJA',
          amount: Number(amount),
        }),
      });

      const data = await res.json();

      // Si la API devuelve un error HTTP (500, 400, etc.)
      if (!res.ok || data.error) {
        setError(data.error || 'Ocurrió un error al procesar el pago.');
        return;
      }

      if (data.init_point) {
        // Redirigir a Mercado Pago
        window.location.href = data.init_point;
      } else {
        setError('No se pudo obtener el enlace de Mercado Pago.');
      }
    } catch (err) {
      console.error('Error de conexión:', err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-amber-400/30 bg-[#121118] p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-lg"
        >
          ✕
        </button>

        <h3 className="text-2xl font-black text-amber-300 mb-1">🔥 Quítate tú para ponerme yo</h3>
        <p className="text-xs text-gray-400 mb-6">
          Paga con Yape, Tarjeta o PagoEfectivo para adueñarte del cerro.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-xs text-red-400 font-bold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Título / Nombre de tu marca
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Mi Startup Peruana"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Enlace (URL al hacer clic)
            </label>
            <input
              type="text"
              required
              placeholder="https://tuweb.pe"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              URL de la imagen / Logo (Opcional)
            </label>
            <input
              type="url"
              placeholder="https://ejemplo.com/logo.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-1">
              Monto a pujar en Soles (S/)
            </label>
            <input
              type="number"
              min={currentHighestBid + 0.50}
              step="0.50"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 text-lg font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Mínimo sugerido para superar la cima: S/ {(currentHighestBid + 0.50).toFixed(2)}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 p-3.5 font-black text-black shadow-lg transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            {loading ? 'CONECTANDO A MERCADO PAGO...' : '💳 IR A PAGAR CON MERCADO PAGO'}
          </button>
        </form>
      </div>
    </div>
  );
}