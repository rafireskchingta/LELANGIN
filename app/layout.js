import Script from 'next/script';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthModals from '../components/AuthModals';
import './globals.css';

export const metadata = {
  title: 'Lelangin - Platform Lelang Online Terpercaya',
  description: 'Platform lelang barang koleksi online terpercaya di Indonesia. Menghubungkan para kolektor dengan barang-barang unik, langka, dan berharga.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <Script src="https://unpkg.com/@phosphor-icons/web" strategy="afterInteractive" />
        <Navbar />
        {children}
        <Footer />
        <AuthModals />
        <Script src="/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
