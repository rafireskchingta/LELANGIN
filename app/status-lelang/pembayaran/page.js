import Link from 'next/link';

export default function PembayaranPage() {
  return (
    <main className="page-container" style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '4rem', paddingBottom: '5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ color: 'var(--primary)', fontSize: '2rem', fontWeight: 700 }}>Pembayaran</h1>
      </div>
      <div style={{ display: 'flex', gap: '3rem', marginBottom: '3rem', alignItems: 'stretch', justifyContent: 'center' }}>
        <div style={{ background: 'linear-gradient(135deg, #7E86F7 0%, #B0A0F6 100%)', borderRadius: '16px', padding: '2rem', color: 'white', width: '400px', boxShadow: '0 10px 20px rgba(126, 134, 247, 0.3)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.8rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.8)', marginBottom: '0.25rem' }}>NOMOR REKENING :</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '2px' }}>4674 45452 4324 3231</p>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.8rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.8)', marginBottom: '0.25rem' }}>ATAS NAMA :</p>
            <p style={{ fontSize: '1.15rem', fontWeight: 600 }}>Christian Anugrah</p>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.8)', marginBottom: '0.25rem' }}>BANK :</p>
            <p style={{ fontSize: '1.15rem', fontWeight: 600 }}>Mandiri</p>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '350px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 700 }}>Detail Pembayaran</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>SubTotal Pesanan :</span>
            <span style={{ fontWeight: 600 }}>Rp 25.550.000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>SubTotal Pengiriman :</span>
            <span style={{ fontWeight: 600 }}>Rp 15.000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Total Pembayaran :</span>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)' }}>Rp 25.565.000</span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Link href="/status-lelang/detail-menang" className="btn-primary-full" style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '0.85rem 3rem', borderRadius: '8px' }}>Bayar Sekarang</Link>
      </div>
    </main>
  );
}
