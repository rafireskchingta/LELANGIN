'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminPanelLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = (e) => {
    e.preventDefault();
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Beranda', path: '/admin/dashboard', icon: 'ph-squares-four' },
    { name: 'Manajemen Pengguna', path: '/admin/users', icon: 'ph-users' },
    { name: 'Verifikasi Penjual', path: '/admin/verifikasi', icon: 'ph-clipboard-text' },
    { name: 'Daftar Produk', path: '/admin/produk', icon: 'ph-package' },
    { name: 'Transaksi Produk', path: '/admin/transaksi', icon: 'ph-truck' },
  ];

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
