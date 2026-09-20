import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800", "900", "1000"],
});

export const metadata: Metadata = {
  title: "El Rey del Cerro | ELREYDELCERRO.PE",
  description: "Tu nombre, tu negocio y tu enlace en la cima del cerro. Puja con Yape y sube en el ranking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`min-h-full flex flex-col ${nunito.className}`}>{children}</body>
    </html>
  );
}
