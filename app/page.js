"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState(0);
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveAuctions = async () => {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'aktif')
          .gt('waktu_selesai', now)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(3);

        if (!error && data) {
          setActiveAuctions(data);
        }
      } catch (err) {
        console.error('Error fetching active auctions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveAuctions();
  }, []);

  const formatRupiah = (angka) => {
    if (!angka) return 'Rp 0';
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? -1 : index);
  };
  return (
    <main>
      {/* Hero Banner */}
      <section className="hero-container">
        <div className="hero">
          {/* SVG background shape from Figma */}
          <svg className="hero-bg-shape" viewBox="0 0 2891 698" xmlns="http://www.w3.org/2000/svg">
            <path d="M2856 0C2875.33 4.50983e-07 2891 15.67 2891 35V479C2891 498.33 2875.33 514 2856 514H2453C2433.67 514 2418 529.67 2418 549C2418 563.359 2406.36 575 2392 575H2135C2115.67 575 2100 590.67 2100 610V663C2100 682.33 2084.33 698 2065 698H35C15.67 698 0 682.33 0 663V35C0 15.67 15.67 4.50982e-07 35 0H2856Z" fill="#3361D5" />
          </svg>

          {/* Content overlay */}
          <div className="hero-content">
            <h1>Apa Itu Lelangin?</h1>
            <p>Platform lelang barang koleksi online terpercaya di Indonesia. Kami menghubungkan para kolektor dengan
              barang-barang unik, langka, dan berharga melalui proses yang transparan, aman, dan mudah.</p>
          </div>

          {/* CTA button with SVG shape from Figma */}
          <Link href="/jelajahi" className="hero-cta-link" style={{ textDecoration: 'none' }}>
            <div className="hero-cta">
              <svg className="hero-cta-shape" viewBox="0 0 774 168" xmlns="http://www.w3.org/2000/svg">
                <path d="M738 0C757.33 0 773 15.67 773 35V82C773 84.0622 773.172 86.1248 773.514 88.1584C773.833 90.058 774 92.0095 774 94V133C774 152.33 758.33 168 739 168H35C15.67 168 1.77183e-07 152.33 0 133V94C0 74.67 15.67 59 35 59H288C301.255 59 312 48.2548 312 35C312 15.67 327.67 0 347 0H738Z" fill="#EAEAEA" />
              </svg>
              <div className="hero-cta-text">
                <span className="small-text">Ingin mulai lelang sekarang?</span>
                <span className="main-text">Jelajahi Lelang Sekarang</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Kategori Lelang</h2>
        <div className="categories-grid">
          <Link href="/jelajahi?kategori=Seni" className="category-wrap" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="category-card">
              <i className="ph ph-palette category-icon"></i>
              <div className="category-name">Seni</div>
            </div>
          </Link>
          <Link href="/jelajahi?kategori=Elektronik" className="category-wrap" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="category-card">
              <i className="ph ph-television category-icon"></i>
              <div className="category-name">Elektronik</div>
            </div>
          </Link>
          <Link href="/jelajahi?kategori=Hobi" className="category-wrap" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="category-card">
              <i className="ph ph-game-controller category-icon"></i>
              <div className="category-name">Hobi</div>
            </div>
          </Link>
        </div>
      </section>

      {/* Ongoing Auctions Section */}
      <section className="auctions-section">
        <div className="auctions-header">
          <h2>Lelang<br />Berlangsung</h2>
          <p>Dapatkan barang lelang dengan harga termurah di sekitarmu</p>
        </div>

        <div className="auctions-list-wrap">
          <div className="auctions-view-all-container">
            <Link href="/jelajahi" className="auctions-view-all">Lihat Semua <i className="ph ph-plus-circle"></i></Link>
          </div>
          <div className="auctions-list" style={{ display: 'grid', gridTemplateColumns: `repeat(${activeAuctions.length === 2 ? 2 : 3}, minmax(0, 1fr))`, gap: '2rem' }}>
            {loading ? (
              <div style={{ color: 'white', padding: '2rem 0' }}>Memuat lelang aktif...</div>
            ) : activeAuctions.length === 0 ? (
              <div style={{ color: 'white', padding: '2rem 0', fontStyle: 'italic', opacity: 0.8 }}>
                Tidak ada lelang aktif...
              </div>
            ) : (
              activeAuctions.map((auction) => (
                <Link href={`/jelajahi/${auction.id}`} key={auction.id} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
                  <div className="auction-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="auction-fav"><i className="ph ph-heart"></i></div>
                    <img
                      src={auction.image_urls?.[0] || '/assets/placeholder.png'}
                      alt={auction.nama_produk}
                      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div className="auction-price">
                        {formatRupiah(auction.current_price || auction.harga_awal)}
                      </div>
                      {/* The old design had auction-price-old, since it's dynamic we could either hide it or just show harga_awal if current_price > harga_awal */}
                      <div className="auction-price-old" style={{ minHeight: '1.2rem' }}>
                        {(auction.current_price && auction.current_price > auction.harga_awal)
                          ? formatRupiah(auction.harga_awal)
                          : ''}
                      </div>
                      <div className="auction-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {auction.nama_produk}
                      </div>
                      <div className="auction-location" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 'auto' }}>
                        {auction.lokasi || '-'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="feature-box">
          <i className="ph ph-thumbs-up feature-icon"></i>
          <div className="feature-text">
            <h3>Mudah Ikut Lelang</h3>
            <p>Temukan berbagai barang menarik dan ikuti proses lelang dengan cepat dan praktis tanpa ribet.</p>
          </div>
        </div>
        <div className="feature-box">
          <i className="ph ph-users feature-icon"></i>
          <div className="feature-text">
            <h3>Sistem Transparan</h3>
            <p>Semua penawaran tercatat secara real-time sehingga proses lelang lebih adil dan terpercaya.</p>
          </div>
        </div>
        <div className="feature-box">
          <i className="ph ph-shield-check feature-icon"></i>
          <div className="feature-text">
            <h3>Aman &amp; Terjamin</h3>
            <p>Transaksi dan pengiriman diawasi sistem untuk memastikan keamanan bagi pembeli dan penjual.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2>Yang Sering Ditanyakan</h2>
        <div className="faq-container">
          {/* Sidebar Menu */}
          <div className="faq-sidebar">
            <div className="faq-menu-item">
              <i className="ph ph-info"></i> Informasi Umum
            </div>
          </div>

          {/* Accordion Items */}
          <div className="faq-content">
            <div className={`accordion-item ${activeFaq === 0 ? 'active' : ''}`}>
              <div className="accordion-header" onClick={() => toggleFaq(0)} style={{ cursor: 'pointer' }}>
                Informasi apa sajakah yang disajikan dalam website lelang ini?
                <i className="ph ph-caret-down accordion-icon"></i>
              </div>
              <div className="accordion-body">
                <div className="accordion-content">
                  <div className="accordion-text">
                    Website ini menyajikan informasi aset-aset yang dijual, baik melalui mekanisme lelang maupun jual damai.
                    Aset-aset yang diinformasikan pada website info lelang ini merupakan aset yang terpercaya.
                  </div>
                </div>
              </div>
            </div>

            <div className={`accordion-item ${activeFaq === 1 ? 'active' : ''}`}>
              <div className="accordion-header" onClick={() => toggleFaq(1)} style={{ cursor: 'pointer' }}>
                Siapakah pihak penjual dalam penjualan dengan mekanisme lelang?
                <i className="ph ph-caret-down accordion-icon"></i>
              </div>
              <div className="accordion-body">
                <div className="accordion-content">
                  <div className="accordion-text">
                    Pihak penjual di platform Lelangin dapat berupa perorangan, perusahaan swasta, kurator, maupun institusi pemerintah atau perbankan yang telah melewati proses verifikasi ketat dari tim internal kami. Hal ini dirancang untuk menjamin legalitas barang dan memberikan keamanan serta kepercayaan maksimal bagi Anda selaku peserta lelang.
                  </div>
                </div>
              </div>
            </div>

            <div className={`accordion-item ${activeFaq === 2 ? 'active' : ''}`}>
              <div className="accordion-header" onClick={() => toggleFaq(2)} style={{ cursor: 'pointer' }}>
                Apa yang dimaksud barang dengan status &quot;lelang&quot;?
                <i className="ph ph-caret-down accordion-icon"></i>
              </div>
              <div className="accordion-body">
                <div className="accordion-content">
                  <div className="accordion-text">
                    Status &quot;lelang&quot; menandakan bahwa sebuah aset sedang ditawarkan secara eksklusif kepada publik dan akan terjual kepada peserta yang mengajukan harga penawaran (bid) tertinggi pada saat batas waktu lelang berakhir. Sistem kami mencatat setiap penawaran secara real-time dan transparan untuk memastikan kompetisi berjalan adil.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
