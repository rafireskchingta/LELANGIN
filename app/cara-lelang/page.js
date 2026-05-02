'use client';

import { useState, useRef, useEffect } from 'react';

export default function CaraLelangPage() {
  const [activeTab, setActiveTab] = useState('beli');
  const tabsRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

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
  }, [activeTab]);

  const stepsBeli = [
    { num: 1, title: 'Cek Produk Lelang', desc: 'Lihat berbagai produk yang sedang dilelang beserta jadwalnya melalui platform Lelangin.' },
    { num: 2, title: 'Lihat Detail Produk', desc: 'Periksa informasi produk seperti deskripsi, foto, kondisi barang, dan harga awal lelang.' },
    { num: 3, title: 'Daftar atau Login', desc: 'Buat akun atau masuk ke akun Lelangin agar dapat mengikuti proses lelang.' },
    { num: 4, title: 'Ikuti Proses Lelang', desc: 'Ajukan penawaran harga pada produk yang diminati selama lelang berlangsung.' },
    { num: 5, title: 'Menang & Pembayaran', desc: 'Segera lakukan pelunasan pembayaran setelah Anda berhasil memenangkan lelang produk.' },
    { num: 6, title: 'Atur Pengiriman', desc: 'Setelah pembayaran selesai, pilih jasa pengiriman untuk mengirim produk ke alamat Anda.' },
  ];

  const benefitsBeli = [
    { num: 1, desc: 'Ribuan barang koleksi tersedia untuk dilelang secara berkala, mulai dari action figure, kartu koleksi, hingga berbagai item bernilai lainnya.' },
    { num: 4, desc: 'Sistem lelang yang fleksibel dan mudah digunakan, memungkinkan peserta mengikuti proses penawaran secara praktis melalui perangkat online.' },
    { num: 2, desc: 'Platform digital yang dapat diakses dari mana saja dan kapan saja, sehingga memudahkan pengguna mengikuti lelang tanpa batasan lokasi.' },
    { num: 5, desc: 'Berbagai event dan sesi lelang tersedia secara rutin, memberikan lebih banyak kesempatan untuk mendapatkan produk impian.' },
    { num: 3, desc: 'Setiap proses lelang dilakukan secara terbuka dan transparan, sehingga seluruh peserta dapat melihat perkembangan penawaran secara real-time.' },
    { num: 6, desc: 'Keamanan data dan transaksi pengguna menjadi prioritas, dengan sistem perlindungan yang dirancang untuk menjaga kenyamanan selama proses lelang berlangsung.' },
  ];

  const stepsJual = [
    { num: 1, title: 'Daftar Akun Penjual', desc: 'Buat akun penjual di Lelangin dengan melengkapi data yang diperlukan untuk mulai menjual produk.' },
    { num: 2, title: 'Tambah Produk', desc: 'Unggah produk yang ingin dilelang dengan menambahkan foto, deskripsi, dan informasi produk secara lengkap.' },
    { num: 3, title: 'Tentukan Harga dan Durasi', desc: 'Atur harga awal lelang serta waktu berlangsungnya lelang sesuai yang diinginkan.' },
    { num: 4, title: 'Tampilkan Produk', desc: 'Produk akan tampil di platform dan dapat dilihat serta diikuti oleh peserta lelang.' },
    { num: 5, title: 'Tentukan Pemenang', desc: 'Setelah waktu lelang berakhir, peserta dengan penawaran tertinggi akan menjadi pemenang.' },
    { num: 6, title: 'Kirim Produk', desc: 'Penjual dapat mengirimkan produk kepada pemenang lelang melalui layanan pengiriman.' },
  ];

  const benefitsJual = [
    { num: 1, desc: 'Menjangkau calon pembeli dari berbagai kota di Pulau Jawa tanpa perlu membuka toko fisik.' },
    { num: 4, desc: 'Praktis dan efisien dengan penjual cukup mendaftarkan produk, tanpa harus mengurus penjualan langsung.' },
    { num: 2, desc: 'Persaingan penawaran dari banyak peserta memungkinkan harga barang naik sesuai permintaan pasar.' },
    { num: 5, desc: 'Cocok untuk menjual berbagai jenis barang, mulai dari kendaraan hingga barang bernilai khusus kepada target pasar yang tepat.' },
    { num: 3, desc: 'Proses penjualan berlangsung transparan dan adil karena setiap penawaran tercatat secara jelas.' },
    { num: 6, desc: 'Keamanan transaksi lebih terjamin sehingga penjual dapat berjualan dengan tenang dan terpercaya.' },
  ];

  const steps = activeTab === 'beli' ? stepsBeli : stepsJual;
  const benefits = activeTab === 'beli' ? benefitsBeli : benefitsJual;
  const stepsTitle = activeTab === 'beli' ? 'Cara Beli Produk Lewat Lelang' : 'Cara Jual Produk Lewat Lelang';
  const benefitsTitle = activeTab === 'beli' ? 'Keuntungan Beli Produk di Lelangin' : 'Keuntungan Jual Produk di Lelangin';

  return (
    <main className="page-container cara-lelang-page">
      <h1 className="page-title mt-2">Cara Ikut Lelang di Lelangin Indonesia</h1>

      <div className="hero banner-cara-lelang"
        style={{ padding: '4rem 1rem', borderRadius: '20px', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, #FFFFFF 180%)', color: 'white', boxShadow: '0 20px 40px rgba(90, 98, 243, 0.2)' }}>
        <i className="ph-fill ph-lock-key"
          style={{ fontSize: '4rem', color: '#FBBF24', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}></i>
        <h1
          style={{ fontSize: '4rem', margin: 0, fontWeight: 800, letterSpacing: '1px', textShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          Lelangin</h1>
        <i className="ph-fill ph-handshake"
          style={{ fontSize: '4rem', color: '#FBBF24', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}></i>
      </div>

      <div className="cara-tabs mt-5" ref={tabsRef} style={{ position: 'relative' }}>
        <div className={`cara-tab ${activeTab === 'beli' ? 'active' : ''}`} onClick={() => setActiveTab('beli')}>Cara Beli</div>
        <div className={`cara-tab ${activeTab === 'jual' ? 'active' : ''}`} onClick={() => setActiveTab('jual')}>Cara Jual</div>
        
        {/* Animated Slide Indicator */}
        <div className="cara-indicator" style={indicatorStyle}></div>
      </div>

      {/* Content - Conditional Rendering */}
      <div className="cara-content-section smooth-fade" key={activeTab}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2rem', marginBottom: '1.5rem' }}>{stepsTitle}</h3>
        <div className="grid-steps" style={{ marginTop: '1rem' }}>
          {steps.map((step) => (
            <div key={step.num} className="step-box">
              <div className="step-num">{step.num}</div>
              <div className="step-text">
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginTop: '3rem', marginBottom: '1.5rem' }}>{benefitsTitle}</h3>
        <div className="grid-benefits" style={{ marginTop: '1rem' }}>
          {benefits.map((item, i) => (
            <div key={i} className="benefit-item">
              <div className="benefit-num">{item.num}</div>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
