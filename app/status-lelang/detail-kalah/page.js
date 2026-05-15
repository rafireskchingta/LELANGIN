'use client';

export default function DetailKalahPage() {
  return (
    <main className="page-container detail-page">
      <div className="detail-layout">
        {/* Kiri */}
        <div className="detail-left">
          <img src="/assets/washer.png" className="main-img" alt="Pokemon Card" style={{ objectFit: 'cover' }} />
        </div>

        {/* Kanan */}
        <div className="detail-right">
          <h1 className="detail-title">Kartu Pokemon Charizard 1st Gen Holo</h1>

          <div className="kalah-message text-center" style={{ marginBottom: '2rem' }}>
            <p style={{ color: '#4B5563', fontSize: '1.1rem', marginBottom: '2.5rem', fontWeight: 500 }}>Mohon maaf, Anda belum beruntung kali ini!</p>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Pemenang Lelang</p>
              <div className="user-tag" style={{ display: 'inline-block', fontSize: '1.25rem', padding: '0.5rem 2rem' }}>@adrie_123</div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Nominal Lelang</p>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#EF4444' }}>Rp 2.500.000</div>
            </div>
          </div>

          <div className="riwayat-section border-rounded">
            <button className="riwayat-header" id="btnToggleRiwayat">
              <i className="ph ph-clock-counter-clockwise"></i> Riwayat Penawaran (16) <i className="ph ph-caret-up" id="iconRiwayatToggle"></i>
            </button>
            <div className="riwayat-body" id="bodyRiwayat">
              <div className="riwayat-item"><span>@adrie_123</span><span className="price-blue" style={{ color: 'var(--primary)' }}>Rp 2.500.000</span></div>
              <div className="riwayat-item"><span>@Budi12</span><span className="price-blue" style={{ color: 'var(--primary)' }}>Rp 2.450.000</span></div>
              <div className="riwayat-item"><span>@Selly12</span><span className="price-blue" style={{ color: 'var(--primary)' }}>Rp 2.350.000</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Spesifikasi Grid Bawah */}
      <div className="specs-details-grid border-top-bottom mt-4" style={{ borderBottom: 'none', marginTop: '3rem' }}>
        <div>
          <h3>Info</h3>
          <ul className="key-value-list">
            <li><span>Nomor Produk</span><span>PKM1STGH</span></li>
            <li><span>Merk</span><span>Pokemon</span></li>
            <li><span>Model</span><span>Charizard 1st Gen Holo</span></li>
            <li><span>Tahun Produksi</span><span>1999</span></li>
          </ul>
        </div>
        <div>
          <h3>Grade</h3>
          <ul className="key-value-list">
            <li><span>Kondisi Fisik</span><span>Sangat Baik</span></li>
            <li><span>Kelengkapan</span><span>Sangat Baik</span></li>
            <li><span>Estetika/Tampilan</span><span>Baik</span></li>
          </ul>
        </div>
        <div>
          <h3>Dokumen</h3>
          <ul className="key-value-list">
            <li><span>Sertifikat Grading PSA</span><span>Ada</span></li>
            <li><span>Surat Keaslian</span><span>Ada</span></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
