'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function AkunLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState({ username: '', nama: '', avatar: 'U', role: 'pembeli' });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (typeof window === 'undefined') return;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          const localUser = localStorage.getItem('lelangin_user');
          const isLoggedIn = localStorage.getItem('isLoggedIn');

          if (isLoggedIn === 'true' && localUser) {
            try {
              const parsed = JSON.parse(localUser);
              setUser({
                username: parsed.username || '',
                nama: parsed.nama || '',
                avatar: (parsed.nama || 'U').charAt(0).toUpperCase(),
                role: parsed.role || 'pembeli' // SINKRONISASI: Menjaga role tetap aman dari cache local
              });
              setLoaded(true);
              return;
            } catch (parseErr) {
              console.error('Failed to parse local user data:', parseErr);
            }
          }

          router.push('/');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name, role')
          .eq('id', session.user.id)
          .single();

        setUser({
          username: profile?.username || '',
          nama: profile?.full_name || session.user.email.split('@')[0],
          avatar: (profile?.full_name || session.user.email).charAt(0).toUpperCase(),
          role: profile?.role || 'pembeli'
        });
        setLoaded(true);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn !== 'true') {
          router.push('/');
        } else {
          setLoaded(true);
        }
      }
    }

    fetchUser();
  }, [router]);

  const handleLogout = async (e) => {
    e.preventDefault();
    localStorage.removeItem('lelangin_user');
    localStorage.removeItem('isLoggedIn');
    window.dispatchEvent(new Event('auth-change'));
    await supabase.auth.signOut();

    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('Berhasil keluar!', 'info');
    }

    router.push('/');
  };

  const isActive = (path) => {
    if (path === '/akun' && pathname === '/akun') return 'active';
    if (path === '/akun/titip-lelang' && (pathname.startsWith('/akun/titip-lelang') || pathname.startsWith('/akun/tambah-produk'))) return 'active';
    if (path !== '/akun' && path !== '/akun/titip-lelang' && pathname.startsWith(path)) return 'active';
    return '';
  };

  return (
    <main className="akun-main-wrapper">
      <div className="akun-container-box">
        <div className="akun-header-banner">
          <h1>Informasi Akun Saya</h1>
        </div>
        <div className="akun-layout-split">
          <aside className="akun-sidebar">
            <div className="sidebar-profile">
              {/* HASIL GABUNGAN: Fitur Animasi Shimmer dari Code Hijau */}
              {!loaded ? (
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginRight: '1rem', flexShrink: 0 }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <div style={{ width: '80%', height: '14px', borderRadius: '4px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                    <div style={{ width: '50%', height: '10px', borderRadius: '4px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                  </div>
                  <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
                </div>
              ) : (
                <>
                  <div className="sidebar-pic">{user.avatar}</div>
                  <div className="sidebar-user">
                    <h3>{user.username || user.nama}</h3>
                    {/* KHUSUS: Warna teks role dikunci tetap biru var(--primary) */}
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {user.role === 'penjual' ? 'Penjual' : 'Pembeli'}
                    </span>
                  </div>
                </>
              )}
            </div>
            <ul className="sidebar-nav">
              <li><Link href="/akun" className={isActive('/akun')}><i className="ph ph-smiley"></i> Akun Saya</Link></li>
              <li><Link href="/akun/penjual" className={isActive('/akun/penjual')}><i className="ph ph-cube"></i> Penjual</Link></li>
              <li><Link href="/akun/titip-lelang" className={isActive('/akun/titip-lelang')}><i className="ph ph-envelope-simple-open"></i> Titip Lelang</Link></li>
              <li><a href="#" onClick={handleLogout} style={{ color: 'var(--danger)', cursor: 'pointer' }}><i className="ph ph-sign-out"></i> Keluar</a></li>
            </ul>
          </aside>
          <div className="akun-content">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}