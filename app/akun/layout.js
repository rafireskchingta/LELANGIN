'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function AkunLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState({ username: '', nama: '', avatar: 'U' });
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
                avatar: (parsed.nama || 'U').charAt(0).toUpperCase()
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
          .select('username, full_name')
          .eq('id', session.user.id)
          .single();

        setUser({
          username: profile?.username || '',
          nama: profile?.full_name || session.user.email.split('@')[0],
          avatar: (profile?.full_name || session.user.email).charAt(0).toUpperCase()
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

  // Determine active nav item
  const isActive = (path) => {
    if (path === '/akun' && pathname === '/akun') return 'active';
    if (path !== '/akun' && pathname.startsWith(path)) return 'active';
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
              <div className="sidebar-pic">{user.avatar}</div>
              <div className="sidebar-user">
                <h3>{user.username || user.nama}</h3>
                <Link href="/akun">Ubah Profil</Link>
              </div>
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
