'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../src/lib/supabase';
import { fetchProducts, fetchProductBids } from '../../src/services/productService';

function JelajahiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get('kategori') || 'Semua';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- 1. STATE UI ---
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalHistoryOpen, setIsModalHistoryOpen] = useState(false);

  // --- 2. STATE DATA ---
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]); 

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeModalImage, setActiveModalImage] = useState('/assets/placeholder.png');
  const [modalBids, setModalBids] = useState([]);

  // --- 3. STATE FILTER & PENCARIAN ---
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortOrder, setSortOrder] = useState('Terbaru');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [hargaMin, setHargaMin] = useState('');
  const [hargaMax, setHargaMax] = useState('');
  const [lokasi, setLokasi] = useState([]);
  const [tahunMin, setTahunMin] = useState('');
  const [tahunMax, setTahunMax] = useState('');
  const [nowTime, setNowTime] = useState(new Date());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2010 + 1 }, (_, i) => currentYear - i);

  // --- HELPER TOAST ---
  const showToast = (msg, type = 'success') => {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(msg, type);
    } else {
      alert(msg);
    }
  };

  // --- 4. LOAD USER & FAVORITES ---
  useEffect(() => {
    const fetchUserAndFavs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', user.id);

        if (!error && data) {
          setFavorites(data.map(item => item.product_id));
        }
      } else {
        setFavorites(JSON.parse(localStorage.getItem('lelangin_favorites') || '[]'));
      }
    };

    fetchUserAndFavs();

    const handleFavUpdate = () => fetchUserAndFavs();
    window.addEventListener('favorites-updated', handleFavUpdate);
    return () => window.removeEventListener('favorites-updated', handleFavUpdate);
  }, []);

  // --- 5. TOGGLE FAVORIT ---
  const toggleFavorite = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      showToast('Silakan login terlebih dahulu untuk menyimpan favorit', 'error');
      return;
    }

    const isFav = favorites.includes(id);
    setFavorites(prev => isFav ? prev.filter(f => f !== id) : [...prev, id]);

    try {
      if (isFav) {
        await supabase
          .from('favorites')
          .delete()
          .match({ user_id: currentUser.id, product_id: id });
      } else {
        await supabase
          .from('favorites')
          .insert([{ user_id: currentUser.id, product_id: id }]);
      }
      window.dispatchEvent(new Event('favorites-updated'));
    } catch (error) {
      console.error(error);
      showToast('Gagal memperbarui favorit', 'error');
      setFavorites(prev => isFav ? [...prev, id] : prev.filter(f => f !== id));
    }
  };

  // --- 6. DEBOUNCE SEARCH ---
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // TIMER REAL-TIME (1000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 7. FETCH PRODUCTS ---
  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchProducts({
      kategori: activeCategory,
      search: searchQuery,
      sortBy: sortOrder.toLowerCase(),
      hargaMin: hargaMin ? Number(hargaMin) : 0,
      hargaMax: hargaMax ? Number(hargaMax) : Infinity,
      lokasi: lokasi,
      tahunMin: tahunMin && tahunMin !== 'Dari' ? Number(tahunMin) : 0,
      tahunMax: tahunMax && tahunMax !== 'Sampai' ? Number(tahunMax) : 9999
    });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, [activeCategory, searchQuery, sortOrder]);

  const handleLokasiChange = (provinsi) => {
    setLocations(prev =>
      prev.includes(provinsi) ? prev.filter(p => p !== provinsi) : [...prev, provinsi]
    );
  };

  // --- 8. OPEN MODAL & FETCH BIDS ---
  const openModal = async (product) => {
    setSelectedProduct(product);
    setActiveModalImage(product.image_urls?.[0] || '/assets/placeholder.png');
    setIsModalOpen(true);
    setIsModalHistoryOpen(false);

    const bidsData = await fetchProductBids(product.id);
    setModalBids(bidsData || []);
  };

  // --- 9. FORMATTER ---
  const formatRupiah = (angka) => {
    if (!angka) return '0';
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // PERBAIKAN LOGIKA: Hanya menampilkan nilai terbesar di sisa waktunya
  const calculateTimeLeft = (waktuSelesai, waktuMulai) => {
    if (!waktuSelesai) return { text: 'Waktu Habis', percent: 0 };
    
    const end = new Date(waktuSelesai);
    const start = new Date(waktuMulai || end.getTime() - 1000 * 60 * 60 * 24); 
    const selisihMs = end - nowTime;

    if (selisihMs <= 0) return { text: 'Waktu Habis', percent: 0 };

    // Rumus menyusut: (Sisa Waktu / Total Durasi) * 100
    const totalDuration = end - start;
    let percent = 100;
    if (totalDuration > 0) {
      percent = (selisihMs / totalDuration) * 100;
      if (percent < 0) percent = 0;
      if (percent > 100) percent = 100;
    }

    const hari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
    const jam = Math.floor((selisihMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const menit = Math.floor((selisihMs % (1000 * 60 * 60)) / (1000 * 60));
    const detik = Math.floor((selisihMs % (1000 * 60)) / 1000);

    // KUNCI PERBAIKAN: Hanya return unit waktu terbesar yang tersedia
    let text = '';
    if (hari > 0) {
      text = `${hari} Hari`;
    } else if (jam > 0) {
      text = `${jam} Jam`;
    } else if (menit > 0) {
      text = `${menit} Menit`;
    } else {
      text = `${detik} Detik`;
    }

    return { text, percent };
  };

  return (
    <>
    <main className="page-container">
      <div className="page-header mt-2">
        <h2><i className="ph ph-books"></i> Jelajahi Lelang</h2>
      </div>

      <div className="tabs-container">
        {['Semua', 'Seni', 'Elektronik', 'Hobi'].map((cat) => (
          <div
            key={cat}
            className={`tab-item ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            style={{ cursor: 'pointer' }}
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
        {/* Sidebar Filter */}
        <aside className={`sidebar-filter ${isFilterOpen ? '' : 'closed'}`}>
          <h3 style={{ marginTop: '0.5rem' }}><i className="ph-fill ph-funnel" style={{ fontSize: '1.25rem' }}></i> Pencarian Detail</h3>

          <div className="filter-section">
            <label>Harga</label>
            <div className="input-with-icon">
              <span className="icon-rp">Rp</span>
              <input type="number" placeholder="Harga Minimum" value={hargaMin} onChange={(e) => setHargaMin(e.target.value)} />
            </div>
            <div className="input-with-icon">
              <span className="icon-rp">Rp</span>
              <input type="number" placeholder="Harga Maksimum" value={hargaMax} onChange={(e) => setHargaMax(e.target.value)} />
            </div>
          </div>

          <div className="filter-section">
            <label>Lokasi (Pulau Jawa)</label>
            {['DKI Jakarta', 'Banten', 'Jawa Tengah', 'Jawa Barat', 'DI Yogyakarta', 'Jawa Timur'].map(prov => (
              <label key={prov} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={lokasi.includes(prov)}
                  onChange={() => handleLokasiChange(prov)}
                /> {prov}
              </label>
            ))}
          </div>

          <div className="filter-section mt-1">
            <label>Tahun Produksi</label>
            <div className="dua-kolom">
              <select value={tahunMin} onChange={(e) => setTahunMin(e.target.value)}>
                <option value="">Dari</option>
                {years.map(y => <option key={`min-${y}`} value={y}>{y}</option>)}
              </select>
              <select value={tahunMax} onChange={(e) => setTahunMax(e.target.value)}>
                <option value="">Sampai</option>
                {years.map(y => <option key={`max-${y}`} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <button className="btn-primary-full" style={{ marginTop: '2rem' }} onClick={loadProducts}>
            Terapkan Filter
          </button>
        </aside>

        {/* Main Content */}
        <section className="jelajahi-content">
          <p className="summary-text">Menampilkan <strong>{products.length}</strong> produk lelang yang tersedia</p>

          <div className="top-bar-jelajahi">
            <div className="search-box-j">
              <i className="ph ph-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Cari produk"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button className="btn-primary-j" onClick={() => setSearchQuery(searchInput)}>Cari</button>
          </div>

          <div className="sort-bar">
            <label>Urutkan berdasarkan</label>
            <div className="custom-select" onClick={() => setIsSortOpen(!isSortOpen)}>
              <div className="custom-select-trigger" style={{ cursor: 'pointer' }}>
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

          {/* Grid Cards */}
          <div className="jelajahi-grid smooth-fade" key={activeCategory} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', width: '100%' }}>
            {loading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat data produk...</div>
            ) : products.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada barang lelang yang sesuai dengan pencarian/filter.</div>
            ) : (
              products.map((product) => (
                <div key={product.id} onClick={() => openModal(product)} className="auction-card card-jelajahi" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', cursor: 'pointer', height: '100%' }}>
                  <div className="badge-time">
                    <i className="ph ph-clock"></i> {calculateTimeLeft(product.waktu_selesai, product.waktu_mulai || product.created_at).text}
                  </div>
                  <img src={product.image_urls?.[0] || '/assets/placeholder.png'} alt={product.nama_produk} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', marginTop: '1rem' }}>
                    <div className="auction-price" style={{ marginBottom: 0, fontSize: '1.25rem', color: 'var(--primary)' }}>
                      Rp {formatRupiah(product.current_price || product.harga_awal)}
                    </div>
                    <i
                      className={`${favorites.includes(product.id) ? 'ph-fill' : 'ph'} ph-heart`}
                      style={{ color: favorites.includes(product.id) ? 'var(--danger)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.25rem' }}
                      onClick={(e) => toggleFavorite(product.id, e)}
                    ></i>
                  </div>
                  <div className="auction-title" style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, flexGrow: 1 }}>
                    {product.nama_produk}
                  </div>
                  <div className="auction-meta" style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: 'auto' }}>
                    <div>{product.tahun_produksi} | {product.merk}</div>
                    <div><i className="ph ph-calendar"></i> {new Date(product.waktu_selesai).toLocaleDateString('id-ID')}</div>
                    <div><i className="ph ph-map-pin"></i> {product.lokasi}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>

      {/* --- PORTAL DETAIL MODAL QUICK VIEW --- */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} id="itemDetailOverlay" onClick={(e) => { if (e.target.id === 'itemDetailOverlay') setIsModalOpen(false) }}>
        <div className={`modal modal-lg ${isModalOpen ? 'active' : ''}`} id="itemDetailModal" style={{ overflowY: 'auto', maxHeight: '90vh' }}>
          <button className="modal-close" onClick={() => setIsModalOpen(false)} style={{ zIndex: 10 }}><i className="ph ph-x"></i></button>

          {selectedProduct && (
            <div className="item-detail-layout">

              {/* SISI KIRI */}
              <div className="item-detail-image" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                <img src={activeModalImage} className="main-img" alt={selectedProduct.nama_produk} style={{ objectFit: 'cover', width: '100%', borderRadius: '8px' }} />

                {selectedProduct.image_urls && selectedProduct.image_urls.length > 1 && (
                  <div style={{ width: '100%', overflow: 'hidden', marginTop: '1rem' }}>
                    <div className="small-gallery" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                      {selectedProduct.image_urls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Thumb ${idx}`}
                          onClick={() => setActiveModalImage(url)}
                          className={`thumb ${activeModalImage === url ? 'active' : ''}`}
                          style={{ flexShrink: 0, objectFit: 'cover', width: '80px', height: '80px', borderRadius: '4px', cursor: 'pointer', scrollSnapAlign: 'start' }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="riwayat-section border-rounded" style={{ marginTop: '1rem' }}>
                  <button
                    className="riwayat-header"
                    onClick={() => setIsModalHistoryOpen(!isModalHistoryOpen)}
                    style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="ph ph-clock-counter-clockwise"></i>
                      Riwayat Penawaran ({modalBids.length})
                    </div>
                    <i className={`ph ph-caret-right ml-auto ${isModalHistoryOpen ? 'ph-caret-down' : ''}`} style={{ transition: 'transform 0.3s' }}></i>
                  </button>

                  {isModalHistoryOpen && (
                    <div className="riwayat-body" id="bodyRiwayat" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {modalBids.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>Belum ada penawaran</div>
                      ) : (
                        modalBids.slice(0, 3).map((bid) => (
                          <div key={bid.id} className="riwayat-item">
                            <span>@{bid.profiles?.username || 'User'}</span>
                            <span className="price-blue">Rp {formatRupiah(bid.amount)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SISI KANAN */}
              <div className="item-detail-info">
                <h2 style={{ fontSize: '1.4rem' }}>{selectedProduct.nama_produk}</h2>

                {(() => {
                  const isBiddedByUser = currentUser && modalBids.some(b => b.bidder_id === currentUser.id);
                  const isHighestBidder = currentUser && modalBids.length > 0 && modalBids[0].bidder_id === currentUser.id;

                  let bidStatusText = 'Penawaran Tertinggi Saat Ini';
                  let bidStatusColor = 'var(--text-main)';

                  if (modalBids.length === 0) {
                    bidStatusText = 'Belum Ada Penawaran';
                  } else if (isHighestBidder) {
                    bidStatusText = 'Anda Penawar Tertinggi Saat Ini!';
                    bidStatusColor = '#10B981';
                  } else if (isBiddedByUser) {
                    bidStatusText = 'Penawaran Tertinggi saat ini:';
                    bidStatusColor = '#EF4444';
                  }

                  return (
                    <div className="bid-section" style={{ padding: '0', marginBottom: '1rem' }}>
                      <p style={{ color: bidStatusColor, fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{bidStatusText}</p>
                      <h3 className="price-green" style={{ color: bidStatusColor, fontSize: '1.8rem', fontWeight: 800 }}>Rp {formatRupiah(modalBids.length > 0 ? modalBids[0].amount : (selectedProduct.current_price || selectedProduct.harga_awal))}</h3>
                    </div>
                  );
                })()}

                <table className="specs-table">
                  <thead>
                    <tr>
                      <th>Merk</th>
                      <th>Tahun</th>
                      <th>Model</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{selectedProduct.merk || '-'}</td>
                      <td>{selectedProduct.tahun_produksi || '-'}</td>
                      <td>{selectedProduct.model || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="info-legang-section">
                  <h4>Informasi Lelang</h4>
                  <div className="info-row"><span className="label">Lelang Berakhir</span><span className="value">
                    {new Date(selectedProduct.waktu_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span></div>
                  <div className="info-row"><span className="label">Lokasi Barang</span><span className="value">{selectedProduct.lokasi}</span></div>
                </div>

                {/* PROGRESS BAR ANIMASI MENYUSUT */}
                {(() => {
                  const timerData = calculateTimeLeft(selectedProduct.waktu_selesai, selectedProduct.waktu_mulai || selectedProduct.created_at);
                  return (
                    <div className="countdown-section text-center" style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
                      <p>Sisa Waktu Lelang :</p>
                      <div className="countdown-timer" style={{ color: '#EF4444', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                        {timerData.text}
                      </div>
                      <div className="progress-bar" style={{ width: '100%', background: '#E5E7EB', height: '8px', borderRadius: '4px', overflow: 'hidden', marginTop: '0.75rem' }}>
                        <div className="progress-fill" style={{ width: `${timerData.percent}%`, background: '#EF4444', height: '100%', transition: 'width 1s linear' }}></div>
                      </div>
                    </div>
                  );
                })()}

                <button className="btn-primary-full" onClick={() => router.push(`/jelajahi/${selectedProduct.id}`)}>Lihat Detail Penuh</button>
              </div>

            </div>
          )}
        </div>
      </div>
      , document.body)}
    </>
  );
}

export default function JelajahiPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Memuat...</div>}>
      <JelajahiContent />
    </Suspense>
  );
}