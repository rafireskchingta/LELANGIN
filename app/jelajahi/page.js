'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
// Import supabase untuk koneksi user dan favorit
import { supabase } from '../../src/lib/supabase';
import { fetchProducts, fetchProductBids } from '../../src/services/productService';

function JelajahiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get('kategori') || 'Semua';

  // --- 1. STATE UI ---
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const galleryRef = useRef(null);
  const [isModalHistoryOpen, setIsModalHistoryOpen] = useState(false);

  // --- 2. STATE DATA ---
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]); // Berisi kumpulan product_id

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

  // --- 4. CEK USER & LOAD FAVORITES (DATABASE) ---
  useEffect(() => {
    const fetchUserAndFavs = async () => {
      // 1. Cek User
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 2. Ambil data favorit dari tabel Supabase jika sudah login
      if (user) {
        const { data, error } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', user.id);

        if (!error && data) {
          setFavorites(data.map(item => item.product_id));
        }
      } else {
        // Jika guest, ambil dari localstorage sementara
        setFavorites(JSON.parse(localStorage.getItem('lelangin_favorites') || '[]'));
      }
    };

    fetchUserAndFavs();

    // Listener untuk sinkronisasi antar komponen
    const handleFavUpdate = () => fetchUserAndFavs();
    window.addEventListener('favorites-updated', handleFavUpdate);
    return () => window.removeEventListener('favorites-updated', handleFavUpdate);
  }, []);

  // --- 5. LOGIKA TOGGLE FAVORIT (DATABASE) ---
  const toggleFavorite = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      showToast('Silakan login terlebih dahulu untuk menyimpan favorit', 'error');
      return;
    }

    const isFav = favorites.includes(id);

    // Optimistic Update UI (Biar kerasa cepat di layar)
    setFavorites(prev => isFav ? prev.filter(f => f !== id) : [...prev, id]);

    try {
      if (isFav) {
        // Hapus dari database
        await supabase
          .from('favorites')
          .delete()
          .match({ user_id: currentUser.id, product_id: id });
      } else {
        // Tambah ke database
        await supabase
          .from('favorites')
          .insert([{ user_id: currentUser.id, product_id: id }]);
      }
      // Beri sinyal ke halaman lain kalau favorit diupdate
      window.dispatchEvent(new Event('favorites-updated'));
    } catch (error) {
      console.error('Error updating favorites:', error);
      showToast('Gagal memperbarui favorit', 'error');
      // Kembalikan UI kalau gagal
      setFavorites(prev => isFav ? [...prev, id] : prev.filter(f => f !== id));
    }
  };

  // --- 6. LIVE SEARCH (DEBOUNCE) ---
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // --- 7. LOGIKA FETCH DATA PRODUK ---
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
    setLokasi(prev =>
      prev.includes(provinsi) ? prev.filter(p => p !== provinsi) : [...prev, provinsi]
    );
  };

  // --- 8. MEMBUKA MODAL & FETCH BIDS ---
  const openModal = async (product) => {
    setSelectedProduct(product);
    setActiveModalImage(product.image_urls?.[0] || '/assets/placeholder.png');
    setIsModalOpen(true);
    setIsModalHistoryOpen(false);

    const bidsData = await fetchProductBids(product.id);
    setModalBids(bidsData || []);
  };

  // --- 9. FUNGSI FORMATTER ---
  const formatRupiah = (angka) => {
    if (!angka) return '0';
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const calculateTimeLeft = (waktuSelesai, waktuMulai) => {
    if (!waktuSelesai) return 'Waktu Habis';
    const now = new Date();
    const start = waktuMulai ? new Date(waktuMulai) : null;
    const end = new Date(waktuSelesai);

    const calc = (targetDate) => {
      const selisihMs = targetDate - now;
      if (selisihMs <= 0) return null;
      const hari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
      const jam = Math.floor((selisihMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const menit = Math.floor((selisihMs % (1000 * 60 * 60)) / (1000 * 60));
      const detik = Math.floor((selisihMs % (1000 * 60)) / 1000);
      return hari > 0 
        ? `${hari} Hari : ${jam} Jam : ${menit} Menit : ${detik} Detik`
        : (jam > 0 ? `${jam} Jam : ${menit} Menit : ${detik} Detik` : `${menit} Menit : ${detik} Detik`);
    };

    if (start && now < start) {
      const timeStr = calc(start);
      return timeStr ? `Dimulai Dalam: ${timeStr}` : 'Lelang Sedang Berlangsung';
    }

    const timeStr = calc(end);
    return timeStr || 'Waktu Habis';
  };

  // Sub-component for Timer to prevent whole modal re-render
  const TimerDisplay = ({ item }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    
    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    const timeLeft = calculateTimeLeft(item.waktu_selesai, item.waktu_mulai);
    const isExpired = timeLeft === 'Waktu Habis';
    const isSoon = timeLeft.startsWith('Dimulai Dalam');

    return (
      <div style={{ textAlign: 'center', margin: '1rem 0', height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
          {isSoon ? 'Lelang Dimulai Dalam :' : 'Sisa Waktu Lelang :'}
        </p>
        <div style={{ 
          color: isExpired ? '#6B7280' : '#EF4444', 
          fontSize: '1.5rem', 
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
          display: 'block',
          lineHeight: 1
        }}>
          {timeLeft.replace('Dimulai Dalam: ', '')}
        </div>
      </div>
    );
  };

  return (
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
                placeholder="Cari produk yang dicari"
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

          {/* Grid Auto-fill Responsive */}
          <div className="jelajahi-grid smooth-fade" key={activeCategory} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', width: '100%' }}>
            {loading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat data produk...</div>
            ) : products.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada barang lelang yang sesuai dengan pencarian/filter.</div>
            ) : (
              products.map((product) => (
                <div key={product.id} onClick={() => openModal(product)} className="auction-card card-jelajahi" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', cursor: 'pointer', height: '100%' }}>
                  <div className="badge-time">
                    <i className="ph ph-clock"></i> {calculateTimeLeft(product.waktu_selesai, product.waktu_mulai)}
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

      {/* --- ITEM DETAIL MODAL (QUICK VIEW) --- */}
      <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} id="itemDetailOverlay" onClick={(e) => { if (e.target.id === 'itemDetailOverlay') setIsModalOpen(false) }}>
        <div className={`modal modal-lg ${isModalOpen ? 'active' : ''}`} id="itemDetailModal" style={{ overflowY: 'scroll', maxHeight: '90vh' }}>
          <button className="modal-close" onClick={() => setIsModalOpen(false)} style={{ zIndex: 10 }}><i className="ph ph-x"></i></button>

          {selectedProduct && (
            <div className="item-detail-layout" style={{ display: 'flex', width: '100%', gap: '2rem' }}>
              {/* --- KIRI: IMAGE & HISTORY --- */}
              <div className="item-detail-image" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <img 
                  src={activeModalImage} 
                  alt={selectedProduct.nama_produk} 
                  className="main-img" 
                  style={{ width: '100%', height: '350px', objectFit: 'contain', background: '#F8F9FA', borderRadius: '12px' }}
                />
                
                {/* Thumbnails (Scrollable) */}
                <div 
                  ref={galleryRef}
                  className="small-gallery" 
                  onScroll={(e) => {
                    const { scrollLeft, scrollWidth, clientWidth } = e.target;
                    const progress = scrollLeft / (scrollWidth - clientWidth);
                    setScrollProgress(progress || 0);
                  }}
                  onMouseDown={(e) => {
                    const el = galleryRef.current;
                    if (!el) return;
                    el.isDown = true;
                    el.classList.add('active');
                    el.startX = e.pageX - el.offsetLeft;
                    el.scrollLeftInitial = el.scrollLeft;
                  }}
                  onMouseLeave={() => {
                    const el = galleryRef.current;
                    if (!el) return;
                    el.isDown = false;
                    el.classList.remove('active');
                  }}
                  onMouseUp={() => {
                    const el = galleryRef.current;
                    if (!el) return;
                    el.isDown = false;
                    el.classList.remove('active');
                  }}
                  onMouseMove={(e) => {
                    const el = galleryRef.current;
                    if (!el || !el.isDown) return;
                    e.preventDefault();
                    const x = e.pageX - el.offsetLeft;
                    const walk = (x - el.startX) * 2; // scroll-speed
                    el.scrollLeft = el.scrollLeftInitial - walk;
                  }}
                  style={{ 
                    display: 'flex', 
                    gap: '0.6rem', 
                    overflowX: 'auto', 
                    whiteSpace: 'nowrap', 
                    paddingBottom: '0.5rem',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    cursor: 'grab'
                  }}
                >
                  {selectedProduct.image_urls?.map((url, i) => (
                    <img 
                      key={i} 
                      src={url} 
                      draggable={false}
                      onClick={() => setActiveModalImage(url)} 
                      style={{ 
                        width: '70px', 
                        height: '70px', 
                        minWidth: '70px',
                        objectFit: 'cover', 
                        borderRadius: '10px', 
                        cursor: 'pointer',
                        flexShrink: 0,
                        border: activeModalImage === url ? '2.5px solid var(--primary)' : '1px solid #E5E7EB',
                        transition: 'all 0.2s',
                        userSelect: 'none'
                      }}
                    />
                  ))}
                </div>
                {/* Custom Scroll Indicator */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginTop: '0.25rem', 
                  marginBottom: '1rem',
                  padding: '0 0.5rem'
                }}>
                  <i 
                    className="ph ph-caret-left" 
                    onClick={() => { if (galleryRef.current) galleryRef.current.scrollBy({ left: -200, behavior: 'smooth' }) }}
                    style={{ fontSize: '1rem', color: '#9CA3AF', cursor: 'pointer', padding: '0.25rem' }}
                  ></i>
                  <div style={{ 
                    flex: 1, 
                    height: '6px', 
                    background: '#F3F4F6', 
                    borderRadius: '10px', 
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: `${scrollProgress * 70}%`, 
                      top: '0', 
                      height: '100%', 
                      width: '30%', 
                      background: '#9CA3AF', 
                      borderRadius: '10px' 
                    }}></div>
                  </div>
                  <i 
                    className="ph ph-caret-right" 
                    onClick={() => { if (galleryRef.current) galleryRef.current.scrollBy({ left: 200, behavior: 'smooth' }) }}
                    style={{ fontSize: '1rem', color: '#9CA3AF', cursor: 'pointer', padding: '0.25rem' }}
                  ></i>
                </div>
                <style>{`
                  .small-gallery::-webkit-scrollbar { display: none; }
                `}</style>

                <button className="btn-history" onClick={() => setIsModalHistoryOpen(!isModalHistoryOpen)}>
                  <i className="ph ph-clock-counter-clockwise"></i>
                  Riwayat Penawaran ({modalBids.length})
                  <i className={`ph ph-caret-${isModalHistoryOpen ? 'down' : 'right'} ml-auto`}></i>
                </button>
                
                {isModalHistoryOpen && (
                  <div style={{ padding: '1rem', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', maxHeight: '200px', overflowY: 'auto' }}>
                    {modalBids.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#6B7280' }}>Belum ada penawaran</div>
                    ) : (
                      modalBids.map((bid, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}>
                          <span>@{bid.profiles?.username || 'User'}</span>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Rp {formatRupiah(bid.amount)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* --- KANAN: INFO & ACTION --- */}
              <div className="item-detail-info" style={{ flex: 1.2, minWidth: 0 }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{selectedProduct.nama_produk}</h2>

                {(() => {
                  const isHighestBidder = currentUser && modalBids.length > 0 && modalBids[0].bidder_id === currentUser.id;
                  let bidStatusText = 'Penawaran Tertinggi saat ini:';
                  let bidStatusColor = '#EF4444';

                  if (modalBids.length === 0) {
                    bidStatusText = 'Belum Ada Penawaran:';
                    bidStatusColor = '#6B7280';
                  } else if (isHighestBidder) {
                    bidStatusText = 'Anda Penawar Tertinggi Saat Ini!';
                    bidStatusColor = '#10B981';
                  }

                  return (
                    <div className="bid-section">
                      <p style={{ color: bidStatusColor, fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{bidStatusText}</p>
                      <div style={{ color: bidStatusColor, fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                        Rp {formatRupiah(modalBids.length > 0 ? modalBids[0].amount : (selectedProduct.current_price || selectedProduct.harga_awal))}
                      </div>
                    </div>
                  );
                })()}

                <table className="specs-table" style={{ width: '100%', marginBottom: '1.5rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', color: '#6B7280', fontSize: '0.8rem' }}>Merk</th>
                      <th style={{ textAlign: 'left', color: '#6B7280', fontSize: '0.8rem' }}>Tahun</th>
                      <th style={{ textAlign: 'left', color: '#6B7280', fontSize: '0.8rem' }}>Model</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>{selectedProduct.merk || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{selectedProduct.tahun_produksi || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{selectedProduct.model || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="info-lelang-section" style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Informasi Lelang</h4>
                  <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#6B7280' }}>Berakhir</span>
                    <span style={{ fontWeight: 600 }}>
                      {new Date(selectedProduct.waktu_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#6B7280' }}>Lokasi</span>
                    <span style={{ fontWeight: 600 }}>{selectedProduct.lokasi}</span>
                  </div>
                </div>

                <TimerDisplay item={selectedProduct} />

                <button 
                  onClick={() => router.push(`/jelajahi/${selectedProduct.id}`)}
                  className="btn-primary-full"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                >
                  Lihat Detail Penuh
                </button>
              </div>
            </div>
          )}
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