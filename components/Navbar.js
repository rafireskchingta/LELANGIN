'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../src/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const isAdmin = pathname.startsWith('/admin');
  const isAkun = pathname.startsWith('/akun');

  useEffect(() => {
    if (isAdmin) return;
    const checkLogin = async () => {
      if (typeof window === 'undefined') return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsLoggedIn(true);
          localStorage.setItem('isLoggedIn', 'true');
        } else {
          setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
        }
      } catch {
        setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      }
    };

    checkLogin();
    window.addEventListener('auth-change', checkLogin);

    // FIX: Dengarkan perubahan sesi langsung dari Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('lelangin_user');
      } else if (session) {
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
      }
    });

    return () => {
      window.removeEventListener('auth-change', checkLogin);
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [isAdmin]);

  // Update sliding indicator kapanpun pathname berubah atau component di-mount
  useEffect(() => {
    if (isAdmin) return; // Skip untuk halaman admin
    const updateIndicator = () => {
      // Cari elemen tag <a> yang memiliki class active, dan kecualikan tombol akun
      const activeLink = navRef.current?.querySelector('a.active:not(.btn-akun)');
      if (activeLink) {
        setIndicatorStyle({
          left: activeLink.offsetLeft,
          width: activeLink.offsetWidth,
          opacity: 1
        });
      } else {
        setIndicatorStyle({ opacity: 0 });
      }
    };

    // Panggil langsung, dan beri slight delay agar posisi render dipastikan akurat
    updateIndicator();
    const timer = setTimeout(updateIndicator, 50);
    
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [pathname, isAdmin]);

  // Jangan render navbar di halaman admin
  if (isAdmin) return null;

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
      <nav className="nav-links" ref={navRef}>
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
        
        {/* Sliding Underline Indicator */}
        <div className="nav-indicator" style={indicatorStyle}></div>
      </nav>
    </header>
  );
}