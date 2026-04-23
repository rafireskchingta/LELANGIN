'use client';

import Link from 'next/link';

export default function TitipLelangPage() {
  const handleLogout = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lelangin_user');
      localStorage.removeItem('isLoggedIn');
      window.dispatchEvent(new Event('auth-change'));
      window.location.href = '/';
    }
  };

  return (
    <main className="akun-main-wrapper">
      <div className="akun-container-box">
        <div className="akun-header-banner"><h1>Informasi Akun Saya</h1></div>
        <div className="akun-layout-split">
          <aside className="akun-sidebar">
            <div className="sidebar-profile">
              <div className="sidebar-pic">S</div>
              <div className="sidebar-user"><h3>safirazahra123</h3><Link href="/akun">Ubah Profil</Link></div>
            </div>
            <ul className="sidebar-nav">
              <li><Link href="/akun"><i className="ph ph-smiley"></i> Akun Saya</Link></li>
              <li><Link href="/akun/penjual"><i className="ph ph-cube"></i> Penjual</Link></li>
              <li><Link href="/akun/titip-lelang" className="active"><i className="ph ph-envelope-simple-open"></i> Titip Lelang</Link></li>
              <li><a href="#" onClick={handleLogout} style={{ color: 'var(--danger)', cursor: 'pointer' }}><i className="ph ph-sign-out"></i> Keluar</a></li>
            </ul>
          </aside>
          <div className="akun-content smooth-fade">
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 700 }}>Produk Titip Lelang</h2>
            </div>
            <div style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', minHeight: '400px', padding: '2rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Link href="/status-lelang?role=penjual" className="btn-primary-full" style={{ width: 'auto', margin: 0, padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '999px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Tampilkan Seluruh Produk</Link>
                <button style={{ border: 'none', background: '#EEF2FF', color: 'var(--primary)', width: '35px', height: '35px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ph ph-plus"></i></button>
                <button style={{ border: 'none', background: '#EEF2FF', color: 'var(--primary)', width: '35px', height: '35px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ph ph-trash"></i></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', gap: '2rem' }}>
                <p style={{ fontWeight: 500, fontSize: '1rem' }}>Tambahkan produk untuk mulai lelang.</p>
                <Link href="/akun/tambah-produk" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#EEF2FF', color: 'var(--primary)', fontSize: '3rem', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.1)' }}>
                  <i className="ph ph-plus"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
