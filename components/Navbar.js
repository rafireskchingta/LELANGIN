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
    if (isAdmin) return; // Skip untuk halaman admin

    // Sinkronisasi awal saat komponen mount
    const syncAuth = async () => {
      if (typeof window === 'undefined') return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
          if (!loggedInStatus) {
            // Sesi aktif tapi localStorage belum tersync
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            const userObj = {
              id: session.user.id,
              email: session.user.email,
              nama: profile?.full_name || session.user.email.split('@')[0],
              username: profile?.username || '',
              jenisKelamin: profile?.gender || '',
              noTelp: profile?.phone_number || '',
              role: profile?.role || 'pembeli',
              isPenjual: profile?.role === 'penjual',
              avatar: (profile?.full_name || session.user.email).charAt(0).toUpperCase()
            };
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('lelangin_user', JSON.stringify(userObj));
          }
          setIsLoggedIn(true);
        } else {
          // Tidak ada sesi — pastikan localStorage juga bersih
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('lelangin_user');
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error('Failed to sync auth in Navbar:', err);
      }
    };

    syncAuth();

    // Dengarkan langsung dari Supabase — ini yang paling andal!
    // Akan langsung terpicu saat signOut() dipanggil dari MANAPUN di aplikasi
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('lelangin_user');
        setIsLoggedIn(false);
      } else if (event === 'SIGNED_IN' && session) {
        setIsLoggedIn(true);
      }
    });

    // Tetap dengarkan event kustom untuk kompatibilitas mundur
    const checkLogin = () => {
      if (typeof window !== 'undefined') {
        const loggedInStatus = localStorage.getItem('isLoggedIn');
        setIsLoggedIn(loggedInStatus === 'true');
      }
    };
    window.addEventListener('auth-change', checkLogin);

    // Tangani navigasi back/forward cache (Bfcache)
    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('auth-change', checkLogin);
      window.removeEventListener('pageshow', handlePageShow);
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
      <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="logo-section">
          <div className="logo-icon" style={{ background: 'transparent' }}>
            <img src="/assets/logo.png" alt="Lelangin Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          </div>
          <h2>Lelangin</h2>
        </div>
      </Link>
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