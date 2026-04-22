import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      {/* Hero Banner */}
      <section className="hero-container">
        <div className="hero">
          <h1>Apa Itu Lelangin?</h1>
          <p>Platform lelang barang koleksi online terpercaya di Indonesia. Kami menghubungkan para kolektor dengan
            barang-barang unik, langka, dan berharga melalui proses yang transparan, aman, dan mudah.</p>

          <div className="hero-btn-container">
            <Link href="/jelajahi" className="hero-btn" style={{ textDecoration: 'none' }}>
              <div className="hero-btn-content">
                <span className="small-text">Ingin Mulai Lelang Sekarang?</span>
                <span className="main-text">Jelajahi Lelang Sekarang</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Kategori Lelang</h2>
        <div className="categories-grid">
          <div className="category-wrap">
            <div className="category-card">
              <i className="ph ph-palette category-icon"></i>
            </div>
            <div className="category-name">Seni</div>
          </div>
          <div className="category-wrap">
            <div className="category-card">
              <i className="ph ph-television category-icon"></i>
            </div>
            <div className="category-name">Elektronik</div>
          </div>
          <div className="category-wrap">
            <div className="category-card">
              <i className="ph ph-game-controller category-icon"></i>
            </div>
            <div className="category-name">Hobi</div>
          </div>
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
          <div className="auctions-list">
            {/* Card 1 */}
            <div className="auction-card">
              <div className="auction-fav"><i className="ph ph-heart"></i></div>
              <img src="/assets/tv.png" alt="TV Android" />
              <div className="auction-price">Rp 5.000.000</div>
              <div className="auction-price-old">Rp 7.299.000</div>
              <div className="auction-title">TV Android POLYTRON Smart Android TV 32 inch PLD 32AG5759</div>
              <div className="auction-location">Kalipancur, Semarang</div>
            </div>

            {/* Card 2 */}
            <div className="auction-card">
              <div className="auction-fav"><i className="ph ph-heart"></i></div>
              <img src="/assets/bag.png" alt="Chanel Bag" />
              <div className="auction-price">Rp 13.000.000</div>
              <div className="auction-price-old">Rp 15.000.000</div>
              <div className="auction-title">C25 Shopping Bag Shiny Lambskin Leather Black Ghw</div>
              <div className="auction-location">Kedungmundu, Semarang</div>
            </div>
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
            <div className="accordion-item active">
              <div className="accordion-header">
                Informasi apa sajakah yang disajikan dalam website lelang ini?
                <i className="ph ph-caret-up"></i>
              </div>
              <div className="accordion-body">
                Website ini menyajikan informasi aset-aset yang dijual, baik melalui mekanisme lelang maupun jual damai.
                Aset-aset yang diinformasikan pada website info lelang ini merupakan aset yang terpercaya.
              </div>
            </div>

            <div className="accordion-item">
              <div className="accordion-header">
                Siapakah pihak penjual dalam penjualan dengan mekanisme lelang?
                <i className="ph ph-caret-down"></i>
              </div>
              <div className="accordion-body">
                Beragam pihak penjual terverifikasi mulai dari pelelang pribadi hingga lembaga resmi sesuai regulasi yang
                berlaku.
              </div>
            </div>

            <div className="accordion-item">
              <div className="accordion-header">
                Apa yang dimaksud barang dengan status &quot;lelang&quot;?
                <i className="ph ph-caret-down"></i>
              </div>
              <div className="accordion-body">
                Barang lelang adalah barang yang siap untuk ditawarkan kepada publik, dan pihak yang menawarkan harga
                tertinggi akan memenangkan barang tersebut setelah rentang waktu tertentu.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
