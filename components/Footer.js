'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="footer">
      <div className="footer-brand">
        <h3>Lelangin</h3>
        <p>
          Website Lelangin menyajikan informasi produk-produk yang dijual, baik melalui mekanisme lelang maupun jual
          damai. Aset-aset yang diinformasikan pada website info lelang ini merupakan aset yang aman untuk diperjual
          belikan.
        </p>
      </div>
      <div className="footer-contact">
        <h3>Hubungi Kami</h3>
        <ul className="contact-list">
          <li><i className="ph ph-phone"></i> 1345273</li>
          <li><i className="ph ph-instagram-logo"></i> @lelanginindonesia</li>
          <li><i className="ph ph-envelope"></i> lelanginindo@gmail.com</li>
        </ul>
      </div>
    </footer>
  );
}
