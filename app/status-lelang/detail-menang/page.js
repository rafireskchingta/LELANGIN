'use client';

import Link from 'next/link';

export default function DetailMenangPage() {
  return (
    <main className="page-container detail-page">
      <div className="detail-layout">
        {/* Kiri */}
        <div className="detail-left">
          <img src="/assets/washer.png" className="main-img" alt="Kamera Leica" style={{ objectFit: 'cover' }} />
        </div>

        {/* Kanan */}
        <div className="detail-right">
          <h1 className="detail-title">Kamera Leica M3 Vintage Body Only</h1>

          <div className="kalah-message text-center" style={{ marginBottom: '2rem' }}>
            <p style={{ color: '#4B5563', fontSize: '1.1rem', marginBottom: '2.5rem', fontWeight: 500 }}>Selamat, Anda Menang Lelang!</p>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Pemenang Lelang</p>
              <div className="user-tag" style={{ display: 'inline-block', fontSize: '1.25rem', padding: '0.5rem 2rem' }}>@Safira123</div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Nominal Lelang</p>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981' }}>Rp 25.550.000</div>
            </div>
          </div>

          <div className="riwayat-section border-rounded">
            <button className="riwayat-header" id="btnToggleRiwayat">
              <i className="ph ph-clock-counter-clockwise"></i> Riwayat Penawaran (15) <i className="ph ph-caret-up" id="iconRiwayatToggle"></i>
            </button>
            <div className="riwayat-body" id="bodyRiwayat">
              <div className="riwayat-item"><span>@Safira123</span><span className="price-blue" style={{ color: 'var(--primary)' }}>Rp 25.550.000</span></div>
              <div className="riwayat-item"><span>@Sandi99</span><span className="price-blue" style={{ color: 'var(--primary)' }}>Rp 25.000.000</span></div>
              <div className="riwayat-item"><span>@Bagus11</span><span className="price-blue" style={{ color: 'var(--primary)' }}>Rp 24.500.000</span></div>
            </div>
          </div>

          <div className="action-buttons-win" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '2rem' }}>
            <Link href="/status-lelang/pembayaran" id="btnLakukanPembayaran" className="btn-primary-full" style={{ textDecoration: 'none', textAlign: 'center', maxWidth: '300px', padding: '0.85rem', width: '100%' }}>Lakukan Pembayaran</Link>
            <button id="btnLakukanPengiriman" className="btn-outline" style={{ background: 'white', border: '1px solid #D1D5DB', color: 'var(--text-muted)', padding: '0.85rem', borderRadius: '999px', width: '100%', maxWidth: '300px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.6, cursor: 'not-allowed' }} disabled><i className="ph ph-lock"></i> Lakukan Pengiriman</button>
          </div>
        </div>
      </div>

      {/* Spesifikasi Grid Bawah */}
      <div className="specs-details-grid border-top-bottom mt-4" style={{ borderBottom: 'none', marginTop: '3rem' }}>
        <div>
          <h3>Info</h3>
          <ul className="key-value-list">
            <li><span>Nomor Produk</span><span>KM89921D</span></li>
            <li><span>Merk</span><span>Leica</span></li>
            <li><span>Model</span><span>M3 Vintage</span></li>
            <li><span>Warna</span><span>Silver / Black</span></li>
            <li><span>Tahun Produksi</span><span>1958</span></li>
          </ul>
        </div>
        <div>
          <h3>Grade</h3>
          <ul className="key-value-list">
            <li><span>Kondisi Fisik</span><span>Sangat Baik</span></li>
            <li><span>Kelengkapan</span><span>Baik</span></li>
            <li><span>Fungsi</span><span>Normal</span></li>
          </ul>
        </div>
        <div>
          <h3>Dokumen</h3>
          <ul className="key-value-list">
            <li><span>Buku Manual</span><span>Tidak Ada</span></li>
            <li><span>Kartu Garansi</span><span>Tidak Ada</span></li>
            <li><span>Surat Keaslian</span><span>Ada</span></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
