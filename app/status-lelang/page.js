'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';
import { upsertTransaction, fetchTransactionDetail } from '../../src/services/productService';

function StatusLelangContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initRole = searchParams.get('role') || 'pembeli';

  // --- 1. HOOKS & UI STATE ---
  // Penanganan status menunggu dan sinkronisasi modal
  const [activeRole, setActiveRole] = useState(initRole);
  const [activeTab, setActiveTab] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isModalHistoryOpen, setIsModalHistoryOpen] = useState(false);
  const galleryRef = useRef(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // State Data Popup
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeModalImage, setActiveModalImage] = useState('https://placehold.co/600x400?text=No+Image');
  const [modalBids, setModalBids] = useState([]);
  const [countdown, setCountdown] = useState('');

  // Form State Alamat
  const [addressData, setAddressData] = useState({
    recipient_name: '',
    phone_number: '',
    kota: '',
    kecamatan: '',
    alamat_lengkap: '',
    kode_pos: '',
    detail_lainnya: ''
  });

  // Harus didefinisikan sebelum useEffect yang memanggilnya
  const calculateTimeLeft = (waktuSelesai, waktuMulai) => {
    if (!waktuSelesai) return 'Waktu Habis';
    const now = new Date();
    const start = waktuMulai ? new Date(waktuMulai) : null;
    const end = new Date(waktuSelesai);

    if (start && now < start) {
      const selisihMs = start - now;
      const hari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
      const jam = Math.floor((selisihMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const menit = Math.floor((selisihMs % (1000 * 60 * 60)) / (1000 * 60));
      const detik = Math.floor((selisihMs % (1000 * 60)) / 1000);

      const timeStr = hari > 0 
        ? `${hari} Hari : ${jam} Jam : ${menit} Menit : ${detik} Detik`
        : (jam > 0 ? `${jam} Jam : ${menit} Menit : ${detik} Detik` : `${menit} Menit : ${detik} Detik`);
      
      return `Dimulai Dalam: ${timeStr}`;
    }

    const selisihMs = end - now;
    if (selisihMs <= 0) return 'Waktu Habis';

    const hari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
    const jam = Math.floor((selisihMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const menit = Math.floor((selisihMs % (1000 * 60 * 60)) / (1000 * 60));
    const detik = Math.floor((selisihMs % (1000 * 60)) / 1000);

    return hari > 0 
      ? `${hari} Hari : ${jam} Jam : ${menit} Menit : ${detik} Detik`
      : (jam > 0 ? `${jam} Jam : ${menit} Menit : ${detik} Detik` : `${menit} Menit : ${detik} Detik`);
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

  // Hapus Tick Global agar tidak re-render seluruh halaman

  // --- 2. STATE DATA UTAMA ---
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('pembeli');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 3. STATE SEARCH (DEBOUNCE) ---
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const pembeliTabs = ['Semua', 'Sedang Diikuti', 'Favorit', 'Menang Lelang', 'Kalah Lelang', 'Selesai', 'Dibatalkan'];
  const penjualTabs = ['Semua', 'Menunggu', 'Aktif', 'Selesai', 'Dibatalkan'];
  const currentTabs = activeRole === 'pembeli' ? pembeliTabs : penjualTabs;

  const tabsRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // CEK USER & ROLE
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log("[Auth] Cek user ID:", user?.id);
        setCurrentUser(user);
        
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile) {
            console.log("[Auth] Role User:", profile.role);
            setUserRole(profile.role);
            if (profile.role !== 'penjual' && activeRole === 'penjual') {
              setActiveRole('pembeli');
            }
          }
        }
      } catch (err) {
        console.error("[Auth] Error getting user:", err);
      }
    };
    getUser();
  }, [activeRole]);

  // SYNC TAB FROM URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // DEBOUNCE SEARCH
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput.toLowerCase());
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // FETCH DATA
  useEffect(() => {
    console.log("[Data] Trigger fetch data. User:", currentUser?.id, "Role:", activeRole, "Tab:", activeTab);
    if (!currentUser) return;

    const extractUniqueProducts = (dataArray) => {
      if (!dataArray) return [];
      console.log("[Debug extractUniqueProducts] Data mentah dari DB:", dataArray);
      const unique = [];
      const seen = new Set();
      dataArray.forEach(item => {
        const prod = item?.products;
        if (prod && !seen.has(prod.id)) {
          seen.add(prod.id);
          unique.push(prod);
        }
      });
      console.log("[Debug extractUniqueProducts] Jumlah produk unik ditemukan:", unique.length);
      return unique;
    };

    const fetchTabData = async () => {
      if (!currentUser) return;
      setLoading(true);
      let fetchedData = [];

      try {
        const now = new Date().toISOString();

        if (activeRole === 'pembeli') {
          switch (activeTab) {
            case 'Favorit':
              const { data: favs, error: eFav } = await supabase.from('favorites').select('products(*)').eq('user_id', currentUser.id);
              if (eFav) console.error("Error Favorit:", eFav);
              fetchedData = extractUniqueProducts(favs);
              break;
            case 'Sedang Diikuti':
              const { data: activeBids, error: eActive } = await supabase.from('bids').select('products(*)').eq('bidder_id', currentUser.id);
              if (eActive) console.error("Error Sedang Diikuti:", eActive);
              const followedProds = extractUniqueProducts(activeBids);
              fetchedData = followedProds.filter(p => p && new Date(p.waktu_selesai) > new Date());
              break;
            case 'Menang Lelang':
            case 'Kalah Lelang': {
              const { data: myBids, error: eMyBids } = await supabase.from('bids').select('product_id, products(*)').eq('bidder_id', currentUser.id);
              if (eMyBids) console.error("Error MyBids:", eMyBids);
              const myProds = extractUniqueProducts(myBids);
              
              if (myProds.length > 0) {
                const prodIds = myProds.map(p => p.id);
                // Ambil SEMUA bid untuk produk-produk yang pernah Anda ikuti
                const { data: allBids, error: eAllBids } = await supabase.from('bids')
                  .select('product_id, bidder_id, amount')
                  .in('product_id', prodIds)
                  .order('amount', { ascending: false });
                
                if (eAllBids) console.error("Error AllBids:", eAllBids);

                const topBidderMap = {};
                (allBids || []).forEach(b => {
                  if (!topBidderMap[b.product_id]) {
                    topBidderMap[b.product_id] = b.bidder_id;
                  }
                });
                fetchedData = myProds.filter(p => {
                  if (!p) return false;
                  const s = (p.status || '').toLowerCase();
                  const isOver = s === 'selesai' || new Date(p.waktu_selesai) <= new Date();
                  const isWinner = topBidderMap[p.id] === currentUser.id;
                  
                  console.log(`[FINAL CHECK] Produk: ${p.nama_produk} | Status Asli DB: "${p.status}" | Selesai: ${isOver} | isWinner: ${isWinner}`);
                  
                  if (!isOver) return false; 
                  return activeTab === 'Menang Lelang' ? isWinner : !isWinner;
                });
                console.log(`[FINAL CHECK] Hasil akhir tab ${activeTab}:`, fetchedData);
              } else {
                console.log(`[FINAL CHECK] Anda belum pernah ngebid apa pun.`);
              }
              break;
            }
            case 'Selesai':
            case 'Dibatalkan':
              const { data: bidsDone, error: eDone } = await supabase.from('bids').select('products(*)').eq('bidder_id', currentUser.id);
              if (eDone) console.error("Error BidsDone:", eDone);
              fetchedData = extractUniqueProducts(bidsDone).filter(p => {
                if (!p) return false;
                const s = (p.status || '').toLowerCase();
                const isOver = s === 'selesai' || new Date(p.waktu_selesai) <= new Date();
                if (activeTab === 'Selesai') return isOver && s !== 'dibatalkan';
                return s === 'dibatalkan';
              });
              break;
            case 'Semua':
            default:
              const { data: allUserBids, error: eAll } = await supabase.from('bids').select('products(*)').eq('bidder_id', currentUser.id);
              if (eAll) console.error("Error AllUserBids:", eAll);
              fetchedData = extractUniqueProducts(allUserBids);
              break;
          }
        } else {
          // LOGIKA PENJUAL
          const { data: prods, error: errProds } = await supabase
            .from('products')
            .select('*')
            .eq('seller_id', currentUser.id)
            .is('deleted_at', null); // Sembunyikan yang sudah dihapus
          
          if (errProds) console.error("Error Fetch Penjual:", errProds);
          
          console.log("Debug Penjual - Data Mentah:", prods);
          (prods || []).forEach(p => console.log(`Barang: ${p.nama_produk} | Status di DB: "${p.status}"`));

          switch (activeTab) {
            case 'Menunggu':
              fetchedData = (prods || []).filter(p => {
                const s = (p.status || '').toLowerCase().trim();
                const isWaiting = s === 'menunggu' || s === 'pending' || s === 'proses' || s === '' || !p.status;
                const isFuture = s === 'aktif' && new Date(p.waktu_mulai) > new Date();
                
                console.log(`[Cek Tab Menunggu] Barang: ${p.nama_produk} | Status: "${s}" | Lolos: ${isWaiting || isFuture}`);
                return isWaiting || isFuture;
              });
              console.log("Hasil Akhir Tab Menunggu:", fetchedData);
              break;
            case 'Aktif':
              fetchedData = (prods || []).filter(p => {
                const s = (p.status || '').toLowerCase();
                return s === 'aktif' && new Date(p.waktu_mulai) <= new Date() && new Date(p.waktu_selesai) > new Date();
              });
              break;
            case 'Selesai':
              fetchedData = (prods || []).filter(p => {
                const s = (p.status || '').toLowerCase();
                return s === 'selesai' || new Date(p.waktu_selesai) <= new Date();
              });
              break;
            case 'Dibatalkan':
              fetchedData = (prods || []).filter(p => (p.status || '').toLowerCase() === 'dibatalkan');
              break;
            case 'Semua':
            default:
              fetchedData = prods || [];
              break;
          }
        }

        if (searchQuery) {
          fetchedData = fetchedData.filter(item => {
            const nama = item?.nama_produk?.toLowerCase() || '';
            return nama.includes(searchQuery);
          });
        }

        setItems(fetchedData);
      } catch (error) {
        console.error("Gagal menarik data lelang:", error);
      }
      setLoading(false);
    };

    fetchTabData();
  }, [activeRole, activeTab, currentUser, searchQuery]);

  // Animasi Indikator Tab
  useEffect(() => {
    const updateIndicator = () => {
      if (!tabsRef.current) return;
      const activeEl = tabsRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        setIndicatorStyle({ left: activeEl.offsetLeft, width: activeEl.offsetWidth, opacity: 1 });
      }
    };
    updateIndicator();
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);
    return () => { clearTimeout(timer); window.removeEventListener('resize', updateIndicator); };
  }, [activeTab, activeRole]);

  // MODAL
  const handleOpenModal = async (item) => {
    setSelectedItem(item);
    setActiveModalImage(item.image_urls?.[0] || 'https://placehold.co/600x400?text=No+Image');
    setIsModalOpen(true);
    setIsModalHistoryOpen(false);

    const { data: bidsData } = await supabase.from('bids').select('*, profiles(username)').eq('product_id', item.id).order('amount', { ascending: false });
    setModalBids(bidsData || []);
  };

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000); // Update setiap 1 detik
    return () => clearInterval(timer);
  }, []);

  const formatRupiah = (angka) => {
    if (!angka) return '0';
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatTanggalPukul = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ' pukul ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
  };



  return (
    <main className="page-container" style={{ padding: '0 5%', margin: '0 auto', minHeight: '80vh' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #7B83F5 50%, #A5AAFF 100%)', color: 'white', padding: '1.5rem 2rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '2rem' }}>
        <i className="ph ph-clock" style={{ fontSize: '2.25rem', opacity: 0.9 }}></i>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Status Penawaran Lelang</h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', display: 'inline-flex', background: '#F3F4F6', borderRadius: '999px', padding: '4px' }}>
          <div style={{ position: 'absolute', top: '4px', bottom: '4px', left: activeRole === 'pembeli' ? '4px' : 'calc(50% + 2px)', width: 'calc(50% - 6px)', background: 'var(--primary)', borderRadius: '999px', transition: 'all 0.3s' }}></div>
          <button onClick={() => { setActiveRole('pembeli'); setActiveTab('Semua'); }} style={{ position: 'relative', zIndex: 1, width: '120px', padding: '0.6rem 0', fontWeight: 700, border: 'none', background: 'transparent', color: activeRole === 'pembeli' ? 'white' : '#6B7280', cursor: 'pointer' }}>Pembeli</button>
          <button 
            onClick={() => { 
              if (userRole === 'penjual') { 
                setActiveRole('penjual'); 
                setActiveTab('Semua'); 
              } 
            }} 
            style={{ 
              position: 'relative', 
              zIndex: 1, 
              width: '120px', 
              padding: '0.6rem 0', 
              fontWeight: 700, 
              border: 'none', 
              background: 'transparent', 
              color: activeRole === 'penjual' ? 'white' : '#6B7280', 
              cursor: userRole === 'penjual' ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            Penjual {userRole !== 'penjual' && <i className="ph ph-lock" style={{ fontSize: '0.9rem', opacity: 0.7 }}></i>}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0.5rem 1rem', background: 'white' }}>
          <i className="ph ph-magnifying-glass" style={{ color: '#9CA3AF' }}></i>
          <input type="text" placeholder="Cari produk kamu..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ border: 'none', outline: 'none' }} />
        </div>
      </div>

      <div ref={tabsRef} style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', position: 'relative', marginBottom: '2rem' }}>
        {currentTabs.map(tab => (
          <button key={tab} data-active={activeTab === tab ? 'true' : 'false'} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === tab ? 700 : 500, cursor: 'pointer' }}>{tab}</button>
        ))}
        <div style={{ position: 'absolute', bottom: '-2px', height: '3px', backgroundColor: 'var(--primary)', transition: 'all 0.3s', left: indicatorStyle.left, width: indicatorStyle.width }}></div>
      </div>

      <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Memuat...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Tidak ada data lelang di tab {activeTab}.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} onClick={() => handleOpenModal(item)} className="status-card">
              <img src={item.image_urls?.[0] || 'https://placehold.co/150x150?text=No+Image'} alt="" className="status-img" />
              <div className="status-info">
                <h3 className="status-title">{item.nama_produk}</h3>
                <div className="status-location">
                  <i className="ph ph-map-pin"></i> {item.lokasi}
                </div>
              </div>
              <div className="status-bid-info">
                <p className="label">Harga Terakhir</p>
                <p className="value price-red">Rp {formatRupiah(item.current_price || item.harga_awal)}</p>
                <p className="date">Berakhir: {formatTanggalPukul(item.waktu_selesai)}</p>
              </div>
              <div className="status-badge-container">
                <span className={`badge-status ${
                  activeRole === 'penjual' 
                    ? ((item.status === 'menunggu' || !item.status) ? 'badge-gray' : item.status === 'aktif' ? 'badge-blue' : 'badge-green')
                    : (activeTab === 'Menang Lelang' ? 'badge-green' : activeTab === 'Kalah Lelang' ? 'badge-red' : 'badge-blue')
                }`}>
                  {activeRole === 'penjual' ? (item.status || 'menunggu').toUpperCase() : (
                    activeTab === 'Menang Lelang' ? 'Menang' : 
                    activeTab === 'Kalah Lelang' ? 'Kalah' : 
                    (new Date(item.waktu_selesai) <= new Date() ? 'Selesai' : (new Date(item.waktu_mulai) > new Date() ? 'Segera' : 'Berjalan'))
                  )}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600, minWidth: '150px', textAlign: 'right' }}>
                {calculateTimeLeft(item.waktu_selesai, item.waktu_mulai)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setIsModalOpen(false) }}>
        <div className={`modal modal-lg ${isModalOpen ? 'active' : ''}`} style={{ overflowY: 'scroll', maxHeight: '90vh' }}>
          <button className="modal-close" onClick={() => setIsModalOpen(false)}><i className="ph ph-x"></i></button>
          {selectedItem && (
            <div className="item-detail-layout" style={{ display: 'flex', width: '100%', gap: '2rem' }}>
              {/* --- KIRI: IMAGE & HISTORY --- */}
              <div className="item-detail-image" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <img 
                  src={activeModalImage} 
                  alt={selectedItem.nama_produk} 
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
                  {selectedItem.image_urls?.map((url, i) => (
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
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{selectedItem.nama_produk}</h2>

                <div className="bid-section">
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#6B7280', marginBottom: '0.25rem' }}>Harga Terakhir saat ini:</p>
                  <div className="price-green" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                    Rp {formatRupiah(modalBids[0]?.amount || selectedItem.current_price || selectedItem.harga_awal)}
                  </div>
                </div>

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
                      <td style={{ fontWeight: 600 }}>{selectedItem.merk || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{selectedItem.tahun_produksi || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{selectedItem.model || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="info-lelang-section" style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Informasi Lelang</h4>
                  <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#6B7280' }}>Berakhir</span>
                    <span style={{ fontWeight: 600 }}>{formatTanggalPukul(selectedItem.waktu_selesai)}</span>
                  </div>
                  <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#6B7280' }}>Lokasi</span>
                    <span style={{ fontWeight: 600 }}>{selectedItem.lokasi}</span>
                  </div>
                </div>

                <TimerDisplay item={selectedItem} />

                <button 
                  onClick={() => router.push(`/jelajahi/${selectedItem.id}`)}
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

export default function StatusLelangPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Memuat...</div>}>
      <StatusLelangContent />
    </Suspense>
  );
}
