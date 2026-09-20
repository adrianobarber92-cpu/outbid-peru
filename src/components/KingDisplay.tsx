'use client';

import type { ReactNode } from 'react';

interface KingDisplayProps {
  king?: { title: string; url: string; amount: number };
  avatar?: ReactNode;
  accentColor?: string;
  clicks?: number;
  onVisit?: () => void;
}

export default function KingDisplay({ king, avatar, clicks, onVisit, accentColor = '#EA580C' }: KingDisplayProps) {
  const amount = new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN', minimumFractionDigits: 2,
  }).format(king?.amount ?? 1);

  const content = <>
    <span className="king-frame__badge">{king && <span className="king-frame__rank">#1</span>}{king ? 'REY DEL CERRO' : 'LA CIMA ESTA LIBRE'}</span>
    <div className="king-frame__identity">
      {avatar && <div className="king-frame__avatar">{avatar}</div>}
      <div className="king-frame__name">
        <h2 className={(king?.title.length ?? 0) > 18 ? 'king-frame__title-long' : undefined} title={king?.title}>{king?.title ?? 'Tu lugar esta aqui'}</h2>
        {king && <p title={king.url}>{king.url.replace(/^https?:\/\//i, '')}</p>}
        {king && <p className="king-frame__clicks">{clicks === undefined ? '...' : clicks.toLocaleString('es-PE')} {clicks === 1 ? 'clic' : 'clics'}</p>}
      </div>
    </div>
    <div className={`king-frame__amount${(king?.amount ?? 1) >= 1000 ? ' king-frame__amount-long' : ''}`}>
      <span>{king ? 'ES EL REY POR' : 'SE EL PRIMER REY POR'}</span>
      <strong style={{ color: accentColor }}>{amount}</strong>
    </div>
  </>;

  return <section className="king-frame" aria-label={king ? 'Rey del cerro' : 'Cima vacante'}>
    {king ? <a
      href={/^https?:\/\//i.test(king.url) ? king.url : `https://${king.url}`}
      target="_blank" rel="noopener noreferrer nofollow"
      onClick={onVisit}
      onAuxClick={event => { if (event.button === 1) onVisit?.(); }}
      className="king-frame__content king-frame__link"
    >{content}</a> : <div className="king-frame__content">{content}</div>}
  </section>;
}
