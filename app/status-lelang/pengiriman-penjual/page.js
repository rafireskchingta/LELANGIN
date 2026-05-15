export default function PengirimanPenjualPage() {
  return (
    <main className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '3rem' }}>
      <div className="checkout-card" style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '2px solid #E5E7EB' }}>
          <i className="ph ph-cube"></i> Alamat Pengiriman
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Safira Zahra Asshifa</p>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>(+62) 876-1243-4567</p>
          </div>
          <div style={{ flex: 2 }}>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>Jalan Kelapa Geng Macang, RT.3/RW.3, Desa Beruas, Kelapa (sjd), KAB.<br />BANGKA BARAT - KELAPA, BANGKA BELITUNG, ID 33364</p>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ textAlign: 'left', paddingBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Produk Dipesan</th>
              <th style={{ paddingBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Harga</th>
              <th style={{ paddingBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Jumlah</th>
              <th style={{ textAlign: 'right', paddingBottom: '1rem', color: 'var(--primary)', fontSize: '0.9rem' }}>Subtotal Produk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '1.5rem 0' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img src="/assets/washer.png" alt="Leica" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', background: '#f3f4f6' }} />
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Kamera Leica M3 Vintage Body Only</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sukajadi, Bandung</p>
                  </div>
                </div>
              </td>
              <td style={{ textAlign: 'center', fontWeight: 500 }}>Rp 25.550.000</td>
              <td style={{ textAlign: 'center', fontWeight: 500 }}>1</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>Rp 25.550.000</td>
            </tr>
          </tbody>
        </table>
        <div style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '1.5rem 0', display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Opsi Pengiriman : <span style={{ fontWeight: 700 }}>Hemat Kargo</span></p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimasi Tiba 3 - 4 April 2026</p>
          </div>
          <div style={{ textAlign: 'right', fontWeight: 700 }}>Rp 15.000</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Pesanan :</span>
              <span style={{ fontWeight: 800, fontSize: '1.5rem' }}>Rp 25.565.000</span>
            </div>
            <a href="javascript:void(0)" className="btn-primary-full" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', borderRadius: '8px', padding: '0.85rem', fontWeight: 700 }}>Kirim Produk</a>
          </div>
        </div>
      </div>
    </main>
  );
}
