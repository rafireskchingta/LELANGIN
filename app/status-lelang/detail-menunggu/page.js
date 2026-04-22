'use client';

export default function DetailMenungguPage() {
  return (
    <main className="page-container detail-page">
      <div className="detail-layout">
        {/* Kiri */}
        <div className="detail-left">
          <img src="/assets/washer.png" className="main-img" id="detailMainImg" alt="Washing Machine" />
          <div className="thumbnail-gallery">
            <img src="/assets/washer.png" className="thumb active" alt="Thumb" />
            <img src="/assets/washer.png" className="thumb" alt="Thumb" />
            <img src="/assets/washer.png" className="thumb" alt="Thumb" />
          </div>

          <div className="riwayat-section border-rounded">
            <button className="riwayat-header" id="btnToggleRiwayat">
              <i className="ph ph-clock-counter-clockwise"></i> Riwayat Penawaran (42) <i className="ph ph-caret-up" id="iconRiwayatToggle"></i>
            </button>
            <div className="riwayat-body" id="bodyRiwayat">
              <div className="riwayat-item"><span>@Selly125</span><span className="price-blue" style={{ color: 'var(--primary)' }}>Rp 7.000.000</span></div>
              <div className="riwayat-item"><span>@Adrie1123</span><span className="price-blue" style={{ color: 'var(--primary)' }}>Rp 6.900.000</span></div>
              <div className="riwayat-item"><span>@Budi88</span><span className="price-blue" style={{ color: 'var(--primary)' }}>Rp 6.800.000</span></div>
            </div>
          </div>
        </div>

        {/* Kanan */}
        <div className="detail-right">
          <h1 className="detail-title">Toshiba Front Loading Washing Machine TW-BK115G4FN(SK) 10.5kg</h1>
          <div className="bid-highest-box border-rounded">
            <div className="flex-bw">
              <span className="text-muted" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bid Tertinggi Saat Ini</span>
              <span className="badge-info" style={{ border: 'none' }}>Safira123</span>
            </div>
            <div className="price-huge text-right" style={{ color: '#10B981' }}>Rp 7.000.000</div>
          </div>

          <table className="specs-table mt-1" style={{ marginTop: '2rem' }}>
            <thead><tr><th>Merk</th><th>Tahun Pembuatan</th><th>Model</th></tr></thead>
            <tbody><tr><td>Toshiba</td><td>2025</td><td>TW-BK115G4FN(SK)</td></tr></tbody>
          </table>

          <div className="info-lelang-section border-top-bottom">
            <h4>Informasi Lelang</h4>
            <div className="info-row" style={{ marginTop: '1rem' }}>
              <span className="label">Lelang Berakhir</span>
              <span className="value">12 Maret 2026, 12:00</span>
            </div>
            <div className="info-row">
              <span className="label">Lokasi Barang</span>
              <span className="value">Sukajadi, Bandung</span>
            </div>
          </div>

          <div className="countdown-section text-center" style={{ marginBottom: '3rem' }}>
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Sisa Waktu Lelang :</p>
            <div className="countdown-timer" style={{ color: '#EF4444', marginBottom: '0.5rem' }}>21 Jam : 23 Menit : 12 Detik</div>
            <div className="progress-bar" style={{ background: '#FEE2E2' }}>
              <div className="progress-fill" style={{ width: '80%', background: '#FF8A8A' }}></div>
            </div>
          </div>

          <div className="ajukan-penawaran text-center">
            <h2 className="text-primary section-title" style={{ color: 'var(--primary)' }}>Ajukan Penawaran Anda</h2>
            <form className="penawaran-form" id="formPenawaran">
              <div className="input-bid-group">
                <span className="rp-label">Rp</span>
                <input type="number" placeholder="Masukkan Nominal Penawaran Anda" required />
                <button type="submit" className="btn-primary">Tawar</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Spesifikasi Grid Bawah */}
      <div className="specs-details-grid border-top-bottom mt-4" style={{ borderBottom: 'none', marginTop: '3rem' }}>
        <div>
          <h3>Info</h3>
          <ul className="key-value-list">
            <li><span>Nomor Produk</span><span>WM11SBK24</span></li>
            <li><span>Merk</span><span>Toshiba</span></li>
            <li><span>Model</span><span>TW-BK115G4FN(SK)</span></li>
            <li><span>Daya Listrik</span><span>450 Watt</span></li>
            <li><span>Kapasitas</span><span>10.5 Kg</span></li>
            <li><span>Warna</span><span>Silver</span></li>
            <li><span>Tahun Produksi</span><span>2025</span></li>
            <li><span>Tegangan</span><span>220V</span></li>
          </ul>
        </div>
        <div>
          <h3>Grade</h3>
          <ul className="key-value-list">
            <li><span>Kondisi Fisik</span><span>Sangat Baik</span></li>
            <li><span>Kelengkapan</span><span>Baik</span></li>
            <li><span>Estetika/Tampilan</span><span>Baik</span></li>
          </ul>
        </div>
        <div>
          <h3>Dokumen</h3>
          <ul className="key-value-list">
            <li><span>Buku Manual</span><span>Ada</span></li>
            <li><span>Kartu Garansi</span><span>Tidak Ada</span></li>
            <li><span>Kardus Pembelian</span><span>Ada</span></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
