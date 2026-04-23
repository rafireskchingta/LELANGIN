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

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabsRef.current?.querySelector('.cara-tab.active');
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
  }, [activeRole]);

  return (
    <main className="page-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>

      <div className="status-banner" style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1.25rem 2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '2rem' }}>
        <i className="ph ph-clock" style={{ fontSize: '2rem' }}></i>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Status Penawaran Lelang</h2>
      </div>

      {/* Tabs Role - Conditional Rendering */}
      <div className="cara-tabs" ref={tabsRef} style={{ marginBottom: '2rem', position: 'relative' }}>
        <div
          className={`cara-tab ${activeRole === 'pembeli' ? 'active' : ''}`}
          style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
          onClick={() => setActiveRole('pembeli')}
        >Pembeli</div>
        <div
          className={`cara-tab ${activeRole === 'penjual' ? 'active' : ''}`}
          style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
          onClick={() => setActiveRole('penjual')}
        >Penjual</div>
        
        {/* Animated Slide Indicator */}
        <div className="cara-indicator" style={indicatorStyle}></div>
      </div>

      {/* Sub Tabs (Pills) */}
      <div className="status-pills" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        {activeRole === 'pembeli' ? (
          <>
            <button className={`status-pill ${activeSubTab === 'All' ? 'active' : ''}`} onClick={() => setActiveSubTab('All')}>All</button>
            <button className={`status-pill ${activeSubTab === 'Favorit' ? 'active' : ''}`} onClick={() => setActiveSubTab('Favorit')}>Favorit</button>
            <button className={`status-pill ${activeSubTab === 'Menang Lelang' ? 'active' : ''}`} onClick={() => setActiveSubTab('Menang Lelang')}>Menang Lelang</button>
            <button className="status-pill">Kalah Lelang</button>
            <button className="status-pill">Dikirim</button>
            <button className="status-pill">Selesai</button>
            <button className="status-pill">Dibatalkan</button>
          </>
        ) : (
          <>
            <button className="status-pill active">All</button>
            <button className="status-pill">Sedang Berlangsung</button>
            <button className="status-pill">Selesai</button>
            <button className="status-pill">Dibatalkan</button>
          </>
        )}
      </div>

      {/* Search Box */}
      <div className="search-box-j" style={{ marginBottom: '2rem', borderRadius: '8px' }}>
        <i className="ph ph-magnifying-glass" style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}></i>
        <input type="text" placeholder="Cari produk kamu disini" style={{ border: 'none', outline: 'none', width: '100%', padding: '0.5rem', fontFamily: 'inherit', fontSize: '0.95rem' }} />
      </div>

      {/* Conditional Rendering: Pembeli vs Penjual */}
      {activeRole === 'pembeli' ? (
        <div className="status-list smooth-fade" key={`pembeli-${activeSubTab}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
              <p className="value price-green">Rp 7.500.000</p>
              <p className="date">Hasil Lelang: 20 Maret 2026</p>
            </div>
            <div className="status-badge-container">
              <span className="badge-status badge-gray">Menunggu Hasil</span>
            </div>
          </Link>

          {/* Item 2: Kalah */}
          <Link href="/status-lelang/detail-kalah" className="status-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src="/assets/washer.png" alt="Pokemon Card" className="status-img" style={{ objectFit: 'cover' }} />
            <div className="status-info">
              <h3 className="status-title">Kartu Pokemon Charizard 1st Gen Holo</h3>
              <p className="status-location"><i className="ph ph-map-pin"></i> Cabang Gumaya</p>
            </div>
            <div className="status-bid-info">
              <p className="label">Penawaran Anda</p>
              <p className="value price-red">Rp 2.350.000</p>
              <p className="date">Hasil Lelang: 18 Maret 2026</p>
            </div>
            <div className="status-badge-container">
              <span className="badge-status badge-red">Anda Kalah</span>
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
              <p className="value price-green">Rp 25.550.000</p>
              <p className="date">Hasil Lelang: 15 Maret 2026</p>
            </div>
            <div className="status-badge-container">
              <span className="badge-status badge-green">Anda Menang</span>
            </div>
          </Link>
            </>
          )}
        </div>
      ) : (
        <div className="status-list smooth-fade" key="penjual" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Item 1: Berlangsung */}
          <Link href="/jelajahi/detail" className="status-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src="/assets/washer.png" alt="Washing Machine" className="status-img" />
            <div className="status-info">
              <h3 className="status-title">Toshiba Front Loading Washing Machine TW-BK115G4FN(SK) 10.5kg</h3>
              <p className="status-location"><i className="ph ph-map-pin"></i> Sukajadi, Bandung</p>
            </div>
            <div className="status-bid-info">
              <p className="label">Penawaran Anda</p>
              <p className="value text-green" style={{ fontWeight: 700, fontSize: '1.25rem' }}>Rp 7.500.000</p>
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
              <p className="value text-green" style={{ fontWeight: 700, fontSize: '1.25rem' }}>Rp 2.350.000</p>
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
              <p className="value text-green" style={{ fontWeight: 700, fontSize: '1.25rem' }}>Rp 25.550.000</p>
              <p className="date">Hasil Lelang : 15 Maret 2026</p>
            </div>
            <div className="status-badge-container">
              <span className="badge-status badge-green">Selesai</span>
            </div>
          </Link>
        </div>
      )}
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
