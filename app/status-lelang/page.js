'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function StatusLelangPage() {
  const [activeRole, setActiveRole] = useState('pembeli');

  return (
    <main className="page-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>

      <div className="status-banner" style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1.25rem 2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '2rem' }}>
        <i className="ph ph-clock" style={{ fontSize: '2rem' }}></i>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Status Penawaran Lelang</h2>
      </div>

      {/* Tabs Role - Conditional Rendering */}
      <div className="cara-tabs" style={{ marginBottom: '2rem' }}>
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
      </div>

      {/* Sub Tabs (Pills) */}
      <div className="status-pills" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        {activeRole === 'pembeli' ? (
          <>
            <button className="status-pill active">All</button>
            <button className="status-pill">Favorit</button>
            <button className="status-pill">Menang Lelang</button>
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
        <div className="status-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
        </div>
      ) : (
        <div className="status-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
