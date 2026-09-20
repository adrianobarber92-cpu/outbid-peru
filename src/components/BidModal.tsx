'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHighestBid: number;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Error de conexión con la base de datos.';
}

export default function BidModal({ isOpen, onClose, currentHighestBid }: BidModalProps) {
  const [step, setStep] = useState<'form' | 'qr'>('form');
  const [bidId, setBidId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const minRequired = currentHighestBid > 0 ? currentHighestBid + 0.5 : 1;
  const [amount, setAmount] = useState<number>(minRequired);
  const [operationNumber, setOperationNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // PASO 1: Registrar datos y pasar a la pantalla de pago
  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amount < minRequired) {
      setError(`Mínimo billete para destronar: S/ ${minRequired.toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      const finalUrl = url ? (url.startsWith('http') ? url : `https://${url}`) : '';
      const finalImg = imageUrl ? imageUrl.trim() : '';

      const { data, error: insertError } = await supabase
        .from('bids')
        .insert([
          {
            title: title.trim(),
            username: title.trim(),
            url: finalUrl,
            image_url: finalImg,
            amount: Number(amount),
            operation_number: 'Pendiente',
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        setBidId(data.id);
      }

      setStep('qr');
    } catch (err: unknown) {
      console.error('Error detallado de Supabase:', JSON.stringify(err, null, 2));
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // PASO 2: Confirmar el código de operación Yape tras Yapear
  const handleConfirmPayment = async () => {
    if (!operationNumber.trim()) {
      setError('Ingresa el número de operación para verificar tu Yape.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (bidId) {
        await supabase
          .from('bids')
          .update({ operation_number: operationNumber.trim() })
          .eq('id', bidId);
      }
      handleClose();
    } catch (err: unknown) {
      console.error('Error al actualizar codigo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setBidId(null);
    setTitle('');
    setUrl('');
    setImageUrl('');
    setOperationNumber('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border-3 border-black rounded-3xl p-6 text-black shadow-[8px_8px_0px_#000000] relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 bg-white hover:bg-black hover:text-white border-2 border-black rounded-xl w-8 h-8 flex items-center justify-center font-black transition-colors shadow-[2px_2px_0px_#000]"
        >
          ✕
        </button>

        {step === 'form' ? (
          <>
            <div className="mb-4 pr-6">
              <span className="inline-block bg-[#FACC15] border-2 border-black px-3 py-1 rounded-xl text-xs font-black tracking-wider mb-2 shadow-[2px_2px_0px_#000]">
                🔥 ¡EL CERRO ES MÍO!
              </span>
              <h2 className="text-2xl md:text-3xl font-black leading-tight">
                Quítate tú para ponerme yo
              </h2>
              <p className="text-xs font-extrabold text-black/70 mt-1">
                Ingresa tus datos y continúa para realizar el pago por Yape.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border-2 border-black bg-red-100 p-3 text-xs font-black text-red-700 shadow-[2px_2px_0px_#000]">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleNextStep} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Nombre / Apodo de tu marca *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mi Startup Peruana"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border-2 border-black rounded-xl px-3.5 py-2.5 text-sm font-bold text-black outline-none shadow-[2px_2px_0px_#000] focus:bg-yellow-50"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Enlace Web / Red Social
                </label>
                <input
                  type="text"
                  placeholder="https://tuweb.pe"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-white border-2 border-black rounded-xl px-3.5 py-2.5 text-sm font-bold text-black outline-none shadow-[2px_2px_0px_#000] focus:bg-yellow-50"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">
                  URL del Logo / Imagen (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/logo.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-white border-2 border-black rounded-xl px-3.5 py-2.5 text-sm font-bold text-black outline-none shadow-[2px_2px_0px_#000] focus:bg-yellow-50"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Monto a pujar en Soles (S/) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-base text-black">
                    S/
                  </span>
                  <input
                    type="number"
                    min={minRequired}
                    step="0.50"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[#FEF08A] border-2 border-black rounded-xl pl-9 pr-3.5 py-2.5 text-lg font-black text-black outline-none shadow-[2px_2px_0px_#000]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full border-3 border-black bg-[#FACC15] hover:bg-[#eab308] text-black font-black py-3.5 px-4 rounded-2xl text-sm md:text-base tracking-wider uppercase shadow-[4px_4px_0px_#000000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 mt-4"
              >
                {loading ? 'CARGANDO...' : 'CONTINUAR AL PAGO CON YAPE 📱'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4 py-2">
            <span className="inline-block bg-[#FACC15] border-2 border-black px-3 py-1 rounded-xl text-xs font-black tracking-wider shadow-[2px_2px_0px_#000]">
              📱 REALIZA TU YAPE
            </span>

            <h3 className="text-2xl font-black text-black">Escanea y Yapea</h3>

            <p className="text-xs font-extrabold text-black/80">
              Monto exacto: <span className="text-orange-600 font-black text-sm">S/ {amount.toFixed(2)}</span>
            </p>

            <div className="bg-white p-3 rounded-2xl inline-block border-3 border-black shadow-[4px_4px_0px_#000]">
              <img
                src="/yape-qr.jpg"
                alt="QR Yape"
                className="w-48 h-48 object-contain mx-auto rounded-lg"
              />
            </div>

            {error && (
              <p className="text-xs font-black text-red-600 bg-red-50 p-2 rounded-xl border-2 border-black">
                ⚠️ {error}
              </p>
            )}

            {/* AHORA SÍ: EL CAMPO APARECE LUEGO DE YAPEAR */}
            <div className="text-left">
              <label className="block text-xs font-black text-black mb-1">
                Número de Operación de tu Yape *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. 9876543"
                value={operationNumber}
                onChange={(e) => setOperationNumber(e.target.value)}
                className="w-full bg-white border-2 border-black rounded-xl px-3.5 py-2.5 text-sm font-bold text-black outline-none shadow-[2px_2px_0px_#000] focus:bg-yellow-50"
              />
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              className="w-full border-3 border-black bg-[#FACC15] text-black font-black py-3.5 rounded-2xl shadow-[4px_4px_0px_#000] text-sm uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
            >
              {loading ? 'CONFIRMANDO...' : '¡YA YAPEE, CONFIRMAR MI PUJA! 🚀'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
