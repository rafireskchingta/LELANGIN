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

    useEffect(() => {
      setSearchQuery(searchParams.get('q') || '');
    }, [pathname, searchParams]);

    useEffect(() => {
      // FIX B-04: Verifikasi session Supabase + role admin, bukan hanya localStorage
      const verifyAdmin = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.push('/');
            return;
          }
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          if (!profile || profile.role !== 'admin') {
            router.push('/');
            return;
          }
          // Simpan flag lokal hanya sebagai cache UI, bukan sumber kebenaran
          localStorage.setItem('isAdminLoggedIn', 'true');
        } catch {
          router.push('/');
        }
      };
      verifyAdmin();
    }, [router]);

    const handleLogout = (e) => {
      e.preventDefault();
      localStorage.removeItem('isAdminLoggedIn');
      window.location.href = '/';
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

  return (
    <div className="admin-layout-wrapper">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-small">
            <div className="logo-icon admin-icon-small">
              <i className="ph-fill ph-gavel"></i>
            </div>
            <h2>Lelangin<span>Admin</span></h2>
          </div>
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