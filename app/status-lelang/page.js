'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';

function StatusLelangContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initRole = searchParams.get('role') || 'pembeli';

  // --- 1. STATE UI ---
  const [activeRole, setActiveRole] = useState(initRole);
  const [activeTab, setActiveTab] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalHistoryOpen, setIsModalHistoryOpen] = useState(false);

  // State Data Popup
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeModalImage, setActiveModalImage] = useState('https://placehold.co/600x400?text=No+Image');
  const [modalBids, setModalBids] = useState([]);
  const [countdown, setCountdown] = useState('');
  const [tick, setTick] = useState(0); // State untuk memaksa re-render setiap detik

  // Harus didefinisikan sebelum useEffect yang memanggilnya
  const calculateTimeLeft = (waktuSelesai) => {
    if (!waktuSelesai) return 'Waktu Habis';
    const selisihMs = new Date(waktuSelesai) - new Date();
    if (selisihMs <= 0) return 'Waktu Habis';
    const hari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
    const jam = Math.floor((selisihMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const menit = Math.floor((selisihMs % (1000 * 60 * 60)) / (1000 * 60));
    const detik = Math.floor((selisihMs % (1000 * 60)) / 1000);
    if (hari > 0) return `${hari} Hari : ${jam} Jam : ${menit} Menit : ${detik} Detik`;
    return `${jam} Jam : ${menit} Menit : ${detik} Detik`;
  };

  // Tick setiap detik agar timer di modal auto-update
  useEffect(() => {
    if (!isModalOpen) return;
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isModalOpen]);

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
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) {
          setUserRole(profile.role);
          if (profile.role !== 'penjual' && activeRole === 'penjual') {
            setActiveRole('pembeli');
          }
        }
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
    if (!currentUser) return;

    const extractUniqueProducts = (dataArray) => {
      if (!dataArray) return [];
      const unique = [];
      const seen = new Set();
      dataArray.forEach(item => {
        const prod = item?.products;
        if (prod && !seen.has(prod.id)) {
          seen.add(prod.id);
          unique.push(prod);
        }
      });
      return unique;
    };

    const fetchTabData = async () => {
      setLoading(true);
      let fetchedData = [];

      try {
        const now = new Date().toISOString();

        if (activeRole === 'pembeli') {
          switch (activeTab) {
            case 'Favorit':
              const { data: favs } = await supabase.from('favorites').select('products(*)').eq('user_id', currentUser.id);
              fetchedData = extractUniqueProducts(favs);
              break;
            case 'Sedang Diikuti':
              const { data: activeBids } = await supabase.from('bids').select('products(*)').eq('bidder_id', currentUser.id);
              const followedProds = extractUniqueProducts(activeBids);
              fetchedData = followedProds.filter(p => p && new Date(p.waktu_selesai) > new Date());
              break;
            case 'Menang Lelang':
            case 'Kalah Lelang':
              // 1. Ambil semua produk yang pernah saya bid
              const { data: myTotalBids } = await supabase.from('bids').select('product_id, products(*)').eq('bidder_id', currentUser.id);
              const myUniqueProds = extractUniqueProducts(myTotalBids);
              
              // 2. Untuk setiap produk tersebut, cari bid tertingginya
              const prodIds = myUniqueProds.map(p => p.id);
              const { data: topBids } = await supabase.from('bids').select('product_id, bidder_id, amount').in('product_id', prodIds).order('amount', { ascending: false });
              
              // Map untuk menyimpan penawar tertinggi tiap produk
              const topBidderMap = {};
              (topBids || []).forEach(b => {
                if (!topBidderMap[b.product_id]) {
                  topBidderMap[b.product_id] = b.bidder_id;
                }
              });

              fetchedData = myUniqueProds.filter(p => {
                const isTop = topBidderMap[p.id] === currentUser.id;
                return activeTab === 'Menang Lelang' ? isTop : !isTop;
              });
              break;
            case 'Selesai':
            case 'Dibatalkan':
              const { data: bidsDone } = await supabase.from('bids').select('products(*)').eq('bidder_id', currentUser.id);
              fetchedData = extractUniqueProducts(bidsDone).filter(p => {
                const isOver = new Date(p.waktu_selesai) < new Date();
                if (activeTab === 'Selesai') return isOver;
                return p.status === 'dibatalkan';
              });
              break;
            case 'Semua':
            default:
              const { data: allBids } = await supabase.from('bids').select('products(*)').eq('bidder_id', currentUser.id);
              fetchedData = extractUniqueProducts(allBids);
              break;
          }
        } else {
          // LOGIKA PENJUAL
          switch (activeTab) {
            case 'Selesai':
              const { data: soldProds } = await supabase.from('products').select('*').eq('seller_id', currentUser.id).lt('waktu_selesai', now);
              fetchedData = soldProds || [];
              break;
            case 'Aktif':
              const { data: actProds } = await supabase.from('products').select('*').eq('seller_id', currentUser.id).eq('status', 'aktif').gt('waktu_selesai', now);
              fetchedData = actProds || [];
              break;
            case 'Menunggu':
              const { data: waitProds } = await supabase.from('products').select('*').eq('seller_id', currentUser.id).eq('status', 'menunggu');
              fetchedData = waitProds || [];
              break;
            case 'Dibatalkan':
              const { data: cancelProds } = await supabase.from('products').select('*').eq('seller_id', currentUser.id).eq('status', 'dibatalkan');
              fetchedData = cancelProds || [];
              break;
            case 'Semua':
            default:
              const { data: allSellerProds } = await supabase.from('products').select('*').eq('seller_id', currentUser.id);
              fetchedData = allSellerProds || [];
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
          <button onClick={() => { if (userRole === 'penjual') { setActiveRole('penjual'); setActiveTab('Semua'); } }} style={{ position: 'relative', zIndex: 1, width: '120px', padding: '0.6rem 0', fontWeight: 700, border: 'none', background: 'transparent', color: activeRole === 'penjual' ? 'white' : '#6B7280', cursor: userRole === 'penjual' ? 'pointer' : 'not-allowed' }}>Penjual</button>
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
            <div key={item.id} onClick={() => handleOpenModal(item)} className="status-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', cursor: 'pointer' }}>
              <img src={item.image_urls?.[0] || 'https://placehold.co/150x150?text=No+Image'} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#111827' }}>{item.nama_produk}</h3>
                <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>{item.lokasi}</p>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: '#6B7280', margin: 0 }}>Harga Terakhir</p>
                    <p style={{ fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Rp {formatRupiah(item.current_price || item.harga_awal)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: '#6B7280', margin: 0 }}>Berakhir</p>
                    <p style={{ fontWeight: 600, margin: 0, color: '#374151' }}>{formatTanggalPukul(item.waktu_selesai)}</p>
                  </div>
                </div>
              </div>
              <span style={{ background: '#E0E7FF', color: 'var(--primary)', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem' }}>
                {activeRole === 'penjual' ? item.status : 'Aktif'}
              </span>
            </div>
          ))
        )}
      </div>

      <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setIsModalOpen(false) }}>
        <div className={`modal modal-lg ${isModalOpen ? 'active' : ''}`} style={{ overflowY: 'auto', maxHeight: '90vh' }}>
          <button className="modal-close" onClick={() => setIsModalOpen(false)}><i className="ph ph-x"></i></button>
          {selectedItem && (
            <div className="item-detail-layout" style={{ padding: '2rem' }}>
              <div className="item-detail-image">
                <img src={activeModalImage} alt="" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', overflowX: 'auto' }}>
                  {selectedItem.image_urls?.map((url, i) => (
                    <img key={i} src={url} onClick={() => setActiveModalImage(url)} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: activeModalImage === url ? '2px solid var(--primary)' : '1px solid #eee' }} />
                  ))}
                </div>
              </div>
              <div className="item-detail-info">
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{selectedItem.nama_produk}</h2>
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Bid Tertinggi</p>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Rp {formatRupiah(modalBids[0]?.amount || selectedItem.current_price || selectedItem.harga_awal)}</h3>
                </div>
                <div className="riwayat-section border-rounded">
                  <button className="riwayat-header" onClick={() => setIsModalHistoryOpen(!isModalHistoryOpen)} style={{ display: 'flex', width: '100%', justifyContent: 'space-between', border: 'none', background: 'none' }}>
                    <span>Riwayat Penawaran ({modalBids.length})</span>
                    <i className={`ph ph-caret-${isModalHistoryOpen ? 'down' : 'right'}`}></i>
                  </button>
                  {isModalHistoryOpen && (
                    <div className="riwayat-body">
                      {modalBids.slice(0, 5).map((bid, i) => (
                        <div key={i} className="riwayat-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                          <span>@{bid.profiles?.username || 'User'}</span>
                          <span style={{ fontWeight: 700 }}>Rp {formatRupiah(bid.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lelang Berakhir: <strong>{formatTanggalPukul(selectedItem.waktu_selesai)}</strong></p>
                  <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#1F2937', fontWeight: 700 }}>Sisa Waktu Lelang :</p>
                    <div style={{ color: '#EF4444', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>
                      {calculateTimeLeft(selectedItem.waktu_selesai)}
                      {/* tick={tick} memaksa re-render setiap detik */}
                      <span style={{display:'none'}}>{tick}</span>
                    </div>
                    {/* PROGRESS BAR DINAMIS */}
                    <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', marginTop: '1.5rem', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.max(0, Math.min(100, (new Date(selectedItem.waktu_selesai) - new Date()) / (new Date(selectedItem.waktu_selesai) - new Date(selectedItem.created_at || Date.now() - 86400000)) * 100))}%`, 
                        height: '100%', 
                        background: '#EF4444', 
                        transition: 'width 1s linear' 
                      }}></div>
                    </div>
                  </div>
                </div>
                <button className="btn-primary-full" style={{ marginTop: '1.5rem' }} onClick={() => router.push(`/jelajahi/${selectedItem.id}`)}>Lihat Detail Penuh</button>
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
