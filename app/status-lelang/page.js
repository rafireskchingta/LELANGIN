'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function StatusLelangContent() {
  const searchParams = useSearchParams();
  const initRole = searchParams.get('role') || 'pembeli';

  const [activeRole, setActiveRole] = useState(initRole);
  const [activeSubTab, setActiveSubTab] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const tabsRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const fetchFavs = () => {
      setFavorites(JSON.parse(localStorage.getItem('lelangin_favorites') || '[]'));
    };
    fetchFavs();
    window.addEventListener('favorites-updated', fetchFavs);
    return () => window.removeEventListener('favorites-updated', fetchFavs);
  }, []);

  const toggleFavorite = (id, e) => {
    if (e) e.preventDefault();
    let newFavs = [...favorites];
    if (newFavs.includes(id)) {
      newFavs = newFavs.filter(f => f !== id);
    } else {
      newFavs.push(id);
    }
    setFavorites(newFavs);
    localStorage.setItem('lelangin_favorites', JSON.stringify(newFavs));
    window.dispatchEvent(new Event('favorites-updated'));
  };

  // Animated indicator for category tabs
  useEffect(() => {
    const updateIndicator = () => {
      if (!tabsRef.current) return;
      const activeEl = tabsRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1
        });
      }
    };
    updateIndicator();
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeSubTab, activeRole]);

  const pembeliTabs = ['All', 'Favorit', 'Menang Lelang', 'Kalah Lelang', 'Dikirim', 'Selesai', 'Dibatalkan'];
  const penjualTabs = ['All', 'Sedang Berlangsung', 'Selesai', 'Dibatalkan'];
  const currentTabs = activeRole === 'pembeli' ? pembeliTabs : penjualTabs;

  return (
    <main className="page-container" style={{ maxWidth: 'none', padding: '0 5%', margin: '0 auto', minHeight: '80vh' }}>

      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #7B83F5 50%, #A5AAFF 100%)',
        color: 'white', padding: '1.5rem 2rem', borderRadius: '14px',
        display: 'flex', alignItems: 'center', gap: '1rem',
        marginTop: '1rem', marginBottom: '2rem',
        boxShadow: '0 8px 24px rgba(90, 98, 243, 0.25)'
      }}>
        <i className="ph ph-clock" style={{ fontSize: '2.25rem', opacity: 0.9 }}></i>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Status Penawaran Lelang</h2>
      </div>

      {/* Role Toggle + Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Pembeli / Penjual Toggle */}
        <div style={{ display: 'inline-flex', border: '1.5px solid #D1D5DB', borderRadius: '999px', overflow: 'hidden' }}>
          <button
            onClick={() => { setActiveRole('pembeli'); setActiveSubTab('All'); }}
            style={{
              padding: '0.5rem 1.5rem', fontSize: '0.9rem', fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              borderRadius: '999px',
              background: activeRole === 'pembeli' ? 'var(--primary)' : 'transparent',
              color: activeRole === 'pembeli' ? 'white' : 'var(--text-main)',
              transition: 'all 0.25s ease'
            }}
          >Pembeli</button>
          <button
            onClick={() => { setActiveRole('penjual'); setActiveSubTab('All'); }}
            style={{
              padding: '0.5rem 1.5rem', fontSize: '0.9rem', fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              borderRadius: '999px',
              background: activeRole === 'penjual' ? 'var(--primary)' : 'transparent',
              color: activeRole === 'penjual' ? 'white' : 'var(--text-main)',
              transition: 'all 0.25s ease'
            }}
          >Penjual</button>
        </div>

        {/* Search Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          border: '1px solid #D1D5DB', borderRadius: '8px',
          padding: '0.5rem 1rem', minWidth: '260px', flex: '0 1 320px',
          background: 'white'
        }}>
          <i className="ph ph-magnifying-glass" style={{ color: '#9CA3AF', fontSize: '1.1rem' }}></i>
          <input
            type="text"
            placeholder="Cari produk kamu disini..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--text-main)', background: 'transparent' }}
          />
        </div>
      </div>

      {/* Category Tabs - Full Width with Animated Indicator */}
      <div ref={tabsRef} style={{
        display: 'flex', borderBottom: '2px solid #E5E7EB',
        position: 'relative', marginBottom: '2rem'
      }}>
        {currentTabs.map(tab => (
          <button
            key={tab}
            data-active={activeSubTab === tab ? 'true' : 'false'}
            onClick={() => setActiveSubTab(tab)}
            style={{
              flex: 1, padding: '0.75rem 0.5rem',
              background: 'none', border: 'none',
              color: activeSubTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeSubTab === tab ? 600 : 500,
              fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap', transition: 'color 0.3s ease'
            }}
          >{tab}</button>
        ))}
        {/* Sliding Indicator */}
        <div style={{
          position: 'absolute', bottom: '-2px', height: '2.5px',
          backgroundColor: 'var(--primary)', borderRadius: '2px',
          transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s',
          left: indicatorStyle.left, width: indicatorStyle.width, opacity: indicatorStyle.opacity,
          pointerEvents: 'none'
        }}></div>
      </div>

      {/* Product List */}
      <div style={{ minHeight: '400px' }}>
      {activeRole === 'pembeli' ? (
        <div className="status-list smooth-fade" key={`pembeli-${activeSubTab}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeSubTab === 'Favorit' ? (
            favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Belum ada produk favorit tersimpan.</div>
            ) : (
              favorites.map(favId => (
                <Link key={favId} href="/jelajahi/detail" className="status-card" style={{ textDecoration: 'none', color: 'inherit', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }} onClick={(e) => toggleFavorite(favId, e)}>
                    <i className="ph-fill ph-heart" style={{ color: 'var(--danger)', fontSize: '1.5rem', cursor: 'pointer' }}></i>
                  </div>
                  <img src="/assets/washer.png" alt="Produk Favorit" className="status-img" style={{ objectFit: 'cover' }} />
                  <div className="status-info">
                    <h3 className="status-title">Toshiba Front Loading Washing Machine TW-BK115G4FN(SK) 10.5kg (Item #{favId})</h3>
                    <p className="status-location"><i className="ph ph-map-pin"></i> Tersimpan di Favorit</p>
                  </div>
                  <div className="status-bid-info">
                     <p className="label">Harga Awal</p>
                     <p className="value" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>Rp 7.000.000</p>
                  </div>
                </Link>
              ))
            )
          ) : (
            <>
          {/* Item 1: Menunggu */}
          <Link href="/status-lelang/detail-menunggu" className="status-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src="/assets/washer.png" alt="Washing Machine" className="status-img" />
            <div className="status-info">
              <h3 className="status-title">Toshiba Front Loading Washing Machine TW-BK115G4FN(SK) 10.5kg</h3>
              <p className="status-location"><i className="ph ph-map-pin"></i> Cabang Ujungberung</p>
            </div>
            <div className="status-bid-info">
              <p className="label">Penawaran Anda</p>
              <p className="value" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>Rp 7.500.000</p>
              <p className="date">Hasil: 20 Maret 2024</p>
            </div>
            <div className="status-badge-container">
              <span className="badge-status" style={{ background: '#E0E7FF', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <i className="ph ph-clock"></i> Menunggu Hasil
              </span>
            </div>
          </Link>

          {/* Item 2: Kalah */}
          <Link href="/status-lelang/detail-kalah" className="status-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src="/assets/washer.png" alt="Pokemon Card" className="status-img" style={{ objectFit: 'cover' }} />
            <div className="status-info">
              <h3 className="status-title">Kartu Pokemon Charizard 1st Gen Holo Rare Mint Condition</h3>
              <p className="status-location"><i className="ph ph-map-pin"></i> Cabang Gumaya</p>
            </div>
            <div className="status-bid-info">
              <p className="label">Penawaran Anda</p>
              <p className="value" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>Rp 2.350.000</p>
              <p className="date">Hasil Lelang: 18 Maret 2026</p>
            </div>
            <div className="status-badge-container">
              <span className="badge-status" style={{ background: '#F3F4F6', color: '#4B5563', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <i className="ph ph-x-circle"></i> Anda Kalah
              </span>
            </div>
          </Link>

          {/* Item 3: Menang */}
          <Link href="/status-lelang/detail-menang" className="status-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src="/assets/washer.png" alt="Kamera Leica" className="status-img" style={{ objectFit: 'cover' }} />
            <div className="status-info">
              <h3 className="status-title">Kamera Leica M3 Vintage Body Only</h3>
              <p className="status-location"><i className="ph ph-map-pin"></i> Menteng, Jakarta Pusat</p>
            </div>
            <div className="status-bid-info">
              <p className="label">Penawaran Anda</p>
              <p className="value" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>Rp 25.550.000</p>
              <p className="date">Hasil Lelang: 15 Maret 2026</p>
            </div>
            <div className="status-badge-container">
              <span className="badge-status badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <i className="ph ph-check-circle"></i> Anda Menang
              </span>
            </div>
          </Link>
            </>
          )}
        </div>
      ) : (
        <div className="status-list smooth-fade" key="penjual" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Item 1: Berlangsung */}
          <Link href="/jelajahi/detail" className="status-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src="/assets/washer.png" alt="Washing Machine" className="status-img" />
            <div className="status-info">
              <h3 className="status-title">Toshiba Front Loading Washing Machine TW-BK115G4FN(SK) 10.5kg</h3>
              <p className="status-location"><i className="ph ph-map-pin"></i> Sukajadi, Bandung</p>
            </div>
            <div className="status-bid-info">
              <p className="label">Penawaran Anda</p>
              <p className="value" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>Rp 7.500.000</p>
              <p className="date">Hasil Lelang : 30 Maret 2026</p>
            </div>
            <div className="status-badge-container">
              <span className="badge-info">Sedang Berlangsung</span>
            </div>
          </Link>

          {/* Item 2: Berlangsung */}
          <Link href="/jelajahi/detail" className="status-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src="/assets/washer.png" alt="Pokemon Card" className="status-img" style={{ objectFit: 'cover' }} />
            <div className="status-info">
              <h3 className="status-title">Kartu Pokemon Charizard 1st Gen Holo</h3>
              <p className="status-location"><i className="ph ph-map-pin"></i> Gubeng, Surabaya</p>
            </div>
            <div className="status-bid-info">
              <p className="label">Penawaran Anda</p>
              <p className="value" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>Rp 2.350.000</p>
              <p className="date">Hasil Lelang : 10 Maret 2026</p>
            </div>
            <div className="status-badge-container">
              <span className="badge-info">Sedang Berlangsung</span>
            </div>
          </Link>

          {/* Item 3: Selesai */}
          <Link href="/status-lelang/detail-selesai" className="status-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src="/assets/washer.png" alt="Kamera Leica" className="status-img" style={{ objectFit: 'cover' }} />
            <div className="status-info">
              <h3 className="status-title">Kamera Leica M3 Vintage Body Only</h3>
              <p className="status-location"><i className="ph ph-map-pin"></i> Menteng, Jakarta Pusat</p>
            </div>
            <div className="status-bid-info">
              <p className="label">Penawaran Anda</p>
              <p className="value" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>Rp 25.550.000</p>
              <p className="date">Hasil Lelang : 15 Maret 2026</p>
            </div>
            <div className="status-badge-container">
              <span className="badge-status badge-green">Selesai</span>
            </div>
          </Link>
        </div>
      )}
      </div>
    </main>
  );
}

export default function StatusLelangPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Memuat...</div>}>
      <StatusLelangContent />
    </Suspense>
  );
}
