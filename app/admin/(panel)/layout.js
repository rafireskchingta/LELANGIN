'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../../src/lib/supabase';

  function AdminPanelLayoutContent({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    // Sembunyikan seluruh konten admin sampai verifikasi sesi selesai
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      setSearchQuery(searchParams.get('q') || '');
    }, [pathname, searchParams]);

    useEffect(() => {
      // Verifikasi session Supabase + role admin sebelum render konten apapun
      const verifyAdmin = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            window.location.replace('/');
            return;
          }
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          if (!profile || profile.role !== 'admin') {
            window.location.replace('/');
            return;
          }
          // Sesi valid & role admin terkonfirmasi — tampilkan konten
          localStorage.setItem('isAdminLoggedIn', 'true');
          setChecking(false);
        } catch {
          window.location.replace('/');
        }
      };
      verifyAdmin();
    }, []);

    const handleLogout = async (e) => {
      e.preventDefault();
      setChecking(true); // Sembunyikan UI seketika saat tombol keluar ditekan
      
      // Hapus data lokal kita terlebih dahulu
      localStorage.removeItem('isAdminLoggedIn');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('lelangin_user');

      // Logout dari Supabase
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Logout error:', err);
      }
      
      // Beri sedikit jeda agar Supabase selesai menghapus cookie dan localStorage 
      // sebelum browser melakukan navigasi penuh yang bisa menginterupsi prosesnya
      setTimeout(() => {
        window.location.href = '/';
      }, 200);
    };

  const navItems = [
    { name: 'Beranda', path: '/admin/dashboard', icon: 'ph-squares-four' },
    { name: 'Manajemen Pengguna', path: '/admin/users', icon: 'ph-users' },
    { name: 'Verifikasi Penjual', path: '/admin/verifikasi', icon: 'ph-clipboard-text' },
    { name: 'Daftar Produk', path: '/admin/produk', icon: 'ph-package' },
    { name: 'Transaksi Produk', path: '/admin/transaksi', icon: 'ph-truck' },
  ];
  const hideSearchRoutes = ['/admin/dashboard'];
  const isVerifikasiDetail = pathname.startsWith('/admin/verifikasi/') && pathname !== '/admin/verifikasi';
  const isEditProduk = pathname.startsWith('/admin/produk/edit/');
  const shouldHideSearch = hideSearchRoutes.includes(pathname) || isVerifikasiDetail || isEditProduk;

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Jangan render apapun jika sedang verifikasi auth atau sedang proses logout
  if (checking) {
    return null;
  }

  return (
    <div className="admin-layout-wrapper">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="admin-logo-small">
              <div className="logo-icon admin-icon-small" style={{ background: 'transparent' }}>
                <img src="/assets/logo.png" alt="Lelangin Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
              </div>
              <h2>Lelangin<span>Admin</span></h2>
            </div>
          </Link>
        </div>

        <nav className="admin-sidebar-nav">
          <ul>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link href={item.path} className={isActive ? 'active' : ''}>
                    <i className={`ph ${item.icon}`}></i>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <i className="ph ph-sign-out"></i> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-area">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            {!shouldHideSearch && (
              <div className="admin-topbar-search">
                <i className="ph ph-magnifying-glass"></i>
                <input 
                  type="text" 
                  placeholder="Cari data" 
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            )}
          </div>
          <div className="topbar-right">
            <div className="admin-role-badge">
              Super Admin
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content-container">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminPanelLayout({ children }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPanelLayoutContent>{children}</AdminPanelLayoutContent>
    </Suspense>
  );
}