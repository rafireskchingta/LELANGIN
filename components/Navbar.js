'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const isAkun = pathname.startsWith('/akun');

  useEffect(() => {
    const checkLogin = () => {
      if (typeof window !== 'undefined') {
        const loggedInStatus = localStorage.getItem('isLoggedIn');
        setIsLoggedIn(loggedInStatus === 'true');
      }
    };
    
    checkLogin();
    
    // Dengarkan event kustom 'auth-change' jika diloginkan
    window.addEventListener('auth-change', checkLogin);
    return () => window.removeEventListener('auth-change', checkLogin);
  }, []);

  const handleMasukClick = () => {
    if (typeof document !== 'undefined') {
      const modalOverlay = document.getElementById('modalOverlay');
      const loginModal = document.getElementById('loginModal');
      if (modalOverlay && loginModal) {
        modalOverlay.classList.add('active');
        modalOverlay.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        loginModal.classList.add('active');
      }
    }
  };

  return (
    <header className="header">
      <div className="logo-section">
        <div className="logo-icon">
          <i className="ph ph-gavel"></i>
        </div>
        <h2>Lelangin</h2>
      </div>
      <nav className="nav-links">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>
          Beranda
        </Link>
        <Link href="/jelajahi" className={pathname.startsWith('/jelajahi') ? 'active' : ''}>
          Jelajahi Lelang
        </Link>
        <Link href="/cara-lelang" className={pathname === '/cara-lelang' ? 'active' : ''}>
          Cara Lelang
        </Link>
        <Link href="/status-lelang" className={pathname.startsWith('/status-lelang') ? 'active' : ''}>
          Status Lelang
        </Link>
        {isLoggedIn || isAkun ? (
          <Link href="/akun" className="btn-akun">
            Akun Saya
          </Link>
        ) : (
          <button className="btn-akun" onClick={handleMasukClick}>Masuk</button>
        )}
      </nav>
    </header>
  );
}