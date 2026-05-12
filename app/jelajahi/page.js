'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function JelajahiContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('kategori') || 'Semua';

  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [favorites, setFavorites] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('Terbaru');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFavs = () => {
      setFavorites(JSON.parse(localStorage.getItem('lelangin_favorites') || '[]'));
    };
    fetchFavs();
    window.addEventListener('favorites-updated', fetchFavs);
    return () => window.removeEventListener('favorites-updated', fetchFavs);
  }, []);

  const toggleFavorite = (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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

  return (
    <main className="page-container">
      <div className="page-header mt-2">
        <h2><i className="ph ph-books"></i> Jelajahi Lelang</h2>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        {['Semua', 'Seni', 'Elektronik', 'Hobi'].map((cat) => (
          <div 
            key={cat} 
            className={`tab-item ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="sidebar-toggle-btn"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          title={isFilterOpen ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
        >
          <i className={`ph-bold ${isFilterOpen ? 'ph-caret-left' : 'ph-caret-right'}`}></i>
        </button>
        <span className="smooth-fade" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="ph ph-funnel"></i> Filter
        </span>
      </div>

      <div className="jelajahi-layout">
        {/* Sidebar / Filter */}
        <aside className={`sidebar-filter ${isFilterOpen ? '' : 'closed'}`}>
          <h3 style={{ marginTop: '0.5rem' }}><i className="ph-fill ph-funnel" style={{ fontSize: '1.25rem' }}></i> Pencarian Detail</h3>

          <div className="filter-section">
            <label>Harga</label>
            <div className="input-with-icon">
              <span className="icon-rp">Rp</span>
              <input type="number" placeholder="Harga Minimum" />
            </div>
            <div className="input-with-icon">
              <span className="icon-rp">Rp</span>
              <input type="number" placeholder="Harga Maksimum" />
            </div>
          </div>

          <div className="filter-section">
            <label>Lokasi (Pulau Jawa)</label>
            <label className="checkbox-label"><input type="checkbox" /> DKI Jakarta</label>
            <label className="checkbox-label"><input type="checkbox" /> Banten</label>
            <label className="checkbox-label"><input type="checkbox" /> Jawa Tengah</label>
            <label className="checkbox-label"><input type="checkbox" /> Jawa Barat</label>
            <label className="checkbox-label"><input type="checkbox" /> DI Yogyakarta</label>
            <label className="checkbox-label"><input type="checkbox" /> Jawa Timur</label>
          </div>

          <div className="filter-section mt-1">
            <label>Tahun Produksi</label>
            <div className="dua-kolom">
              <select defaultValue="Dari">
                <option>Dari</option>
              </select>
              <select defaultValue="Sampai">
                <option>Sampai</option>
              </select>
            </div>
          </div>

          <button className="btn-primary-full" style={{ marginTop: '2rem' }}>Terapkan</button>
        </aside>

        {/* Main Content */}
        <section className="jelajahi-content">
          <p className="summary-text">Menampilkan <strong>10</strong> dari Total <strong>10</strong> untuk semua objek lelang</p>

          <div className="top-bar-jelajahi">
            <div className="search-box-j">
              <i className="ph ph-magnifying-glass"></i>
              <input 
                type="text" 
                placeholder="Cari Barang Berdasarkan Kata Kunci" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setSearchQuery(searchInput); }}
              />
            </div>
            <button className="btn-primary-j" onClick={() => setSearchQuery(searchInput)}>Cari</button>
          </div>

          <div className="sort-bar">
            <label>Urutkan berdasarkan</label>
            <div className="custom-select" onClick={() => setIsSortOpen(!isSortOpen)}>
              <div className="custom-select-trigger">
                {sortOrder} <i className={`ph-bold ${isSortOpen ? 'ph-caret-up' : 'ph-caret-down'}`}></i>
              </div>
              {isSortOpen && (
                <div className="custom-options smooth-fade">
                  <div className={`custom-option ${sortOrder === 'Terbaru' ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); setSortOrder('Terbaru'); setIsSortOpen(false); }}>Terbaru</div>
                  <div className={`custom-option ${sortOrder === 'Terlama' ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); setSortOrder('Terlama'); setIsSortOpen(false); }}>Terlama</div>
                </div>
              )}
            </div>
          </div>

          <div className="jelajahi-grid smooth-fade" key={activeCategory}>
            {(() => {
              const title = 'Toshiba Front Loading Washing Machine TW-BK115G4F(SK) 10.5kg';
              const items = [1,2,3,4,5,6,7,8].filter(i => !searchQuery || title.toLowerCase().includes(searchQuery.toLowerCase()));
              
              if (items.length === 0) {
                return <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada barang lelang yang sesuai dengan pencarian.</div>;
              }

              return items.map((i) => (
              <div key={i} onClick={() => setIsModalOpen(true)} className="auction-card card-jelajahi" style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}>
                <div className="badge-time"><i className="ph ph-clock"></i> 12 Hari</div>
                <img src="/assets/washer.png" alt="Washing Machine" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <div className="auction-price" style={{ marginBottom: 0, fontSize: '1.25rem' }}>Rp 7.000.000</div>
                  <i 
                    className={`${favorites.includes(i) ? 'ph-fill' : 'ph'} ph-heart`} 
                    style={{ color: favorites.includes(i) ? 'var(--danger)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.25rem' }}
                    onClick={(e) => toggleFavorite(i, e)}
                  ></i>
                </div>
                <div className="auction-title" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>Toshiba Front Loading Washing
                  Machine TW-BK115G4F(SK) 10.5kg</div>
                <div className="auction-meta">
                  <div>2025 | Washing Machine</div>
                  <div><i className="ph ph-calendar"></i> 12 Maret 2026</div>
                  <div><i className="ph ph-map-pin"></i> Sukajadi, Bandung</div>
                </div>
              </div>
            ))})()}
          </div>
        </section>
      </div>

      {/* Item Detail Modal */}
      <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} id="itemDetailOverlay" onClick={(e) => { if (e.target.id === 'itemDetailOverlay') setIsModalOpen(false) }}>
        <div className={`modal modal-lg ${isModalOpen ? 'active' : ''}`} id="itemDetailModal">
          <button className="modal-close" onClick={() => setIsModalOpen(false)}><i className="ph ph-x"></i></button>
          <div className="item-detail-layout">
            <div className="item-detail-image">
              <img src="/assets/washer.png" className="main-img" alt="Washing Machine" />
              <div className="small-gallery">
                <img src="/assets/washer.png" alt="Thumb" />
                <img src="/assets/washer.png" alt="Thumb" />
                <img src="/assets/washer.png" alt="Thumb" />
              </div>
              <div className="bid-history">
                <button className="btn-history"><i className="ph ph-clock-counter-clockwise"></i> Riwayat Penawaran (45) <i
                    className="ph ph-caret-down ml-auto"></i></button>
              </div>
            </div>
            <div className="item-detail-info">
              <h2>Toshiba Front Loading Washing Machine TW-BK115G4F(SK) 10.5kg</h2>
              <div className="bid-section">
                <p>Bid Tertinggi Saat Ini</p>
                <h3 className="price-green">Rp 7.000.000</h3>
              </div>
              <table className="specs-table">
                <thead>
                  <tr>
                    <th>Merk</th>
                    <th>Tahun Pembuatan</th>
                    <th>Model</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Toshiba</td>
                    <td>2025</td>
                    <td>TW-BK115G4F(SK)</td>
                  </tr>
                </tbody>
              </table>
              <div className="info-lelang-section">
                <h4>Informasi Lelang</h4>
                <div className="info-row">
                  <span className="label">Lelang Berakhir</span>
                  <span className="value">12 Maret 2026, 12:00</span>
                </div>
                <div className="info-row">
                  <span className="label">Lokasi Barang</span>
                  <span className="value">Sukajadi, Bandung</span>
                </div>
              </div>
              <div className="countdown-section">
                <p>Sisa Waktu Lelang :</p>
                <div className="countdown-timer">21 Jam : 21 Menit : 12 Detik</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '80%' }}></div>
                </div>
              </div>
              <button className="btn-primary-full" onClick={() => window.location.href='/jelajahi/detail'}>Detail Barang</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function JelajahiPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Memuat...</div>}>
      <JelajahiContent />
    </Suspense>
  );
}
