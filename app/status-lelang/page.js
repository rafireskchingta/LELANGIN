'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';
import { fetchProductBids } from '../../src/services/productService';

function StatusLelangContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initRole = searchParams.get('role') || 'pembeli';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- 1. STATE UI ---
  const [activeRole, setActiveRole] = useState(initRole);
  const [activeTab, setActiveTab] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalHistoryOpen, setIsModalHistoryOpen] = useState(false);

  // State Data Popup
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeModalImage, setActiveModalImage] = useState('/assets/placeholder.png');
  const [modalBids, setModalBids] = useState([]);

  // --- 2. STATE DATA UTAMA ---
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('pembeli');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 3. STATE SEARCH (DEBOUNCE) ---
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const pembeliTabs = ['Semua', 'Sedang Diikuti', 'Favorit', 'Menang Lelang', 'Kalah Lelang', 'Dikirim', 'Selesai', 'Dibatalkan'];
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

  // DEBOUNCE SEARCH
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput.toLowerCase());
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);
  
  // TIMER UNTUK UPDATE REAL-TIME (Agar detik berjalan)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // FETCH DATA MENCEGAH ERROR NULL 'id'
  useEffect(() => {
    if (!currentUser) return;

    // Helper anti-error untuk menghapus duplikat dan data produk yang terhapus (null)
    const extractUniqueProducts = (dataArray) => {
      if (!dataArray) return [];
      const unique = [];
      const seen = new Set();
      dataArray.forEach(item => {
        const prod = item.products;
        // Hanya masukkan ke array JIKA prod nya ada (tidak null)
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
              const { data: activeBids } = await supabase.from('bids').select('products(*)').eq('bidder_id', currentUser.id).gt('products.waktu_selesai', now);
              fetchedData = extractUniqueProducts(activeBids);
              break;
            case 'Menang Lelang':
              const { data: wins } = await supabase.from('transactions').select('products(*)').eq('winner_id', currentUser.id).in('status_transaksi', ['menunggu_pembayaran', 'diproses']);
              fetchedData = extractUniqueProducts(wins);
              break;
            case 'Kalah Lelang':
              const { data: lostBids } = await supabase.from('bids').select('products(*)').eq('bidder_id', currentUser.id).eq('is_winning_bid', false).lt('products.waktu_selesai', now);
              fetchedData = extractUniqueProducts(lostBids);
              break;
            case 'Dikirim':
            case 'Selesai':
            case 'Dibatalkan':
              const { data: trxStatus } = await supabase.from('transactions').select('products(*)').eq('winner_id', currentUser.id).eq('status_transaksi', activeTab.toLowerCase());
              fetchedData = extractUniqueProducts(trxStatus);
              break;
            case 'Semua':
            default:
              const { data: allInteractions } = await supabase.from('bids').select('products(*)').eq('bidder_id', currentUser.id);
              fetchedData = extractUniqueProducts(allInteractions);
              break;
          }
        } else {
          // LOGIKA PENJUAL
          let query = supabase.from('products').select('*').eq('seller_id', currentUser.id);

          switch (activeTab) {
            case 'Menunggu':
              query = query.eq('status', 'menunggu');
              break;
            case 'Aktif':
              query = query.eq('status', 'aktif').gt('waktu_selesai', now);
              break;
            case 'Selesai':
              query = query.lt('waktu_selesai', now);
              break;
            case 'Dibatalkan':
              query = query.eq('status', 'dibatalkan');
              break;
            case 'Semua':
            default: break;
          }

          const { data, error } = await query.order('created_at', { ascending: false });
          if (error) throw error;
          fetchedData = data || [];
        }

        // Terapkan Local Search Filter
        if (searchQuery) {
          fetchedData = fetchedData.filter(item => item && item.nama_produk && item.nama_produk.toLowerCase().includes(searchQuery));
        }

        setItems(fetchedData);
      } catch (error) {
        console.error("Gagal menarik data:", error);
      }
      setLoading(false);
    };

    fetchTabData();
  }, [activeRole, activeTab, currentUser, searchQuery]);

  // Animasi Indikator Tab Bawah
  useEffect(() => {
    const updateIndicator = () => {
      if (!tabsRef.current) return;
      const activeEl = tabsRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        setIndicatorStyle({ left: activeEl.offsetLeft, width: activeEl.offsetWidth, opacity: 1 });
      }
    };
    updateIndicator();
    // Beri sedikit delay agar rendering DOM selesai sebelum menghitung lebar tab
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);
    return () => { clearTimeout(timer); window.removeEventListener('resize', updateIndicator); };
  }, [activeTab, activeRole]);

  // BUKA MODAL QUICK VIEW
  const handleOpenModal = async (item) => {
    setSelectedItem(item);
    setActiveModalImage(item.image_urls?.[0] || '/assets/placeholder.png');
    setIsModalOpen(true);
    setIsModalHistoryOpen(false);

    const { data: bidsData } = await supabase.from('bids').select('*, profiles(username)').eq('product_id', item.id).order('amount', { ascending: false });
    setModalBids(bidsData || []);
  };

  // FORMATTER
  const formatRupiah = (angka) => {
    if (!angka) return '0';
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatTanggalPukul = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const optionsTanggal = { day: 'numeric', month: 'long', year: 'numeric' };
    const tanggal = date.toLocaleDateString('id-ID', optionsTanggal);
    const waktu = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
    return `${tanggal} pukul ${waktu}`;
  };

  const calculateTimeLeft = (waktuSelesai) => {
    if (!waktuSelesai) return 'Waktu Habis';
    const selisihMs = new Date(waktuSelesai) - currentTime;
    if (selisihMs <= 0) return 'Waktu Habis';

    const hari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
    const jam = Math.floor((selisihMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const menit = Math.floor((selisihMs % (1000 * 60 * 60)) / (1000 * 60));
    const detik = Math.floor((selisihMs % (1000 * 60)) / 1000);

    const detikStr = String(detik).padStart(2, '0');
    if (hari > 0) return `${hari} Hari : ${jam} Jam : ${menit} Menit : ${detikStr} Detik`;
    if (jam > 0) return `${jam} Jam : ${menit} Menit : ${detikStr} Detik`;
    return `${menit} Menit : ${detikStr} Detik`;
  };

  // Penentuan Warna Harga Khusus Pembeli
  const getPriceColor = () => {
    if (activeRole === 'pembeli') {
      if (activeTab === 'Menang Lelang') return '#10B981'; // Hijau
      if (activeTab === 'Kalah Lelang') return '#EF4444'; // Merah
    } else {
      if (activeTab === 'Selesai') return '#10B981';
      if (activeTab === 'Dibatalkan') return '#EF4444';
    }
    return 'var(--text-main)'; // Hitam Netral
  };

  // Penentuan Teks Info Harga
  const getPriceLabel = () => {
    if (activeRole === 'pembeli') {
      if (activeTab === 'Menang Lelang' || activeTab === 'Kalah Lelang') return 'Penawaran Anda';
      return 'Harga Terakhir';
    } else {
      if (activeTab === 'Selesai') return 'Terjual Seharga';
      return 'Bid Tertinggi Saat Ini';
    }
  };

  // Penentuan Status Badge Dinamis
  const getDynamicStatus = (item) => {
    if (item.status === 'dibatalkan') return { label: 'Dibatalkan', bg: '#FEF2F2', color: '#DC2626' };
    if (item.status === 'menunggu') return { label: 'Menunggu', bg: '#E0E7FF', color: 'var(--primary)' };
    
    if (activeTab !== 'Semua') {
      if (activeTab === 'Menang Lelang' || activeTab === 'Selesai' || activeTab === 'Dikirim') return { label: activeTab, bg: '#ECFDF5', color: '#059669' };
      if (activeTab === 'Kalah Lelang' || activeTab === 'Dibatalkan') return { label: activeTab, bg: '#FEF2F2', color: '#DC2626' };
      return { label: activeTab, bg: '#E0E7FF', color: 'var(--primary)' };
    }

    const isFinished = new Date(item.waktu_selesai) <= currentTime;
    if (isFinished || item.status === 'selesai') {
      return { label: 'Selesai', bg: '#ECFDF5', color: '#059669' };
    } else {
      return { label: 'Berlangsung', bg: '#E0E7FF', color: 'var(--primary)' };
    }
  };

  return (
    <>
    <main className="page-container" style={{ padding: '0 5%', margin: '0 auto', minHeight: '80vh' }}>

      {/* Banner Utama */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #7B83F5 50%, #A5AAFF 100%)', color: 'white', padding: '1.5rem 2rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '2rem' }}>
        <i className="ph ph-clock" style={{ fontSize: '2.25rem', opacity: 0.9 }}></i>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Status Penawaran Lelang</h2>
      </div>

      {/* Header: Toggle Role Bergaya Kapsul & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>

        {/* PERBAIKAN ANIMASI TOGGLE (KAPSUL SLIDER) */}
        <div style={{ position: 'relative', display: 'inline-flex', background: '#F3F4F6', borderRadius: '999px', padding: '4px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
          {/* Background Biru yang Bergeser */}
          <div style={{
            position: 'absolute', top: '4px', bottom: '4px',
            left: activeRole === 'pembeli' ? '4px' : 'calc(50% + 2px)',
            width: 'calc(50% - 6px)',
            background: 'var(--primary)',
            borderRadius: '999px',
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
          }}></div>

          <button
            onClick={() => { setActiveRole('pembeli'); setActiveTab('Semua'); }}
            style={{ position: 'relative', zIndex: 1, width: '120px', padding: '0.6rem 0', fontWeight: 700, border: 'none', background: 'transparent', color: activeRole === 'pembeli' ? 'white' : '#6B7280', cursor: 'pointer', transition: 'color 0.3s' }}
          >
            Pembeli
          </button>
          <button
            onClick={() => {
              if (userRole !== 'penjual') return;
              setActiveRole('penjual');
              setActiveTab('Semua');
            }}
            style={{ position: 'relative', zIndex: 1, width: '120px', padding: '0.6rem 0', fontWeight: 700, border: 'none', background: 'transparent', color: activeRole === 'penjual' ? 'white' : '#6B7280', cursor: userRole === 'penjual' ? 'pointer' : 'not-allowed', transition: 'color 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            Penjual
            {userRole !== 'penjual' && <i className="ph-fill ph-lock-key" style={{ fontSize: '1rem', color: '#9CA3AF' }}></i>}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0.5rem 1rem', minWidth: '260px', flex: '0 1 320px', background: 'white' }}>
          <i className="ph ph-magnifying-glass" style={{ color: '#9CA3AF', fontSize: '1.1rem' }}></i>
          <input type="text" placeholder="Cari produk kamu disini" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--text-main)', background: 'transparent' }} />
        </div>
      </div>

      {/* PERBAIKAN TABS: DIbagi Rata Sempurna Tanpa Scroll Bar Vertikal/Horizontal */}
      <div ref={tabsRef} style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', position: 'relative', marginBottom: '2rem' }}>
        {currentTabs.map(tab => (
          <button
            key={tab}
            data-active={activeTab === tab ? 'true' : 'false'}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, // <--- Ini yang bikin tabnya terbagi rata persis 100% tanpa scroll
              padding: '1rem 0.25rem',
              background: 'none',
              border: 'none',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              textAlign: 'center'
            }}
          >
            {tab}
          </button>
        ))}
        {/* Garis Bawah yang Bergerak Mengikuti Tab */}
        <div style={{ position: 'absolute', bottom: '-2px', height: '3px', backgroundColor: 'var(--primary)', borderRadius: '3px', transition: 'left 0.3s ease, width 0.3s ease', left: indicatorStyle.left, width: indicatorStyle.width }}></div>
      </div>

      {/* Content Grid */}
      <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat status penawaran...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada data lelang di tab {activeTab}.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} onClick={() => handleOpenModal(item)} className="status-card smooth-fade" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <img src={item.image_urls?.[0] || '/assets/placeholder.png'} alt={item.nama_produk} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: '#111827' }}>{item.nama_produk}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}><i className="ph ph-map-pin"></i> {item.lokasi}</p>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{getPriceLabel()}</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 800, color: getPriceColor() }}>Rp {formatRupiah(item.current_price || item.harga_awal)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Batas / Hasil Lelang</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{formatTanggalPukul(item.waktu_selesai)}</p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {(() => {
                  const statusInfo = getDynamicStatus(item);
                  return (
                    <span style={{
                      background: statusInfo.bg,
                      color: statusInfo.color,
                      padding: '0.5rem 1.25rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                      {statusInfo.label}
                    </span>
                  );
                })()}
              </div>
            </div>
          ))
        )}
      </div>
    </main>

      {/* --- MODAL QUICK VIEW --- */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setIsModalOpen(false) }}>
        <div className={`modal modal-lg ${isModalOpen ? 'active' : ''}`} style={{ overflowY: 'auto', maxHeight: '90vh', padding: '2rem' }}>
          <button className="modal-close" onClick={() => setIsModalOpen(false)} style={{ zIndex: 10, position: 'absolute', top: '1.5rem', right: '1.5rem' }}><i className="ph ph-x"></i></button>

          {selectedItem && (
            <div className="item-detail-layout">

              {/* SISI KIRI: Gambar & Slider */}
              <div className="item-detail-image" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <img src={activeModalImage} alt={selectedItem.nama_produk} style={{ width: '100%', height: '350px', objectFit: 'cover', borderRadius: '12px' }} />

                {selectedItem.image_urls?.length > 1 && (
                  <div style={{ width: '100%', overflow: 'hidden', marginTop: '1rem' }}>
                    <div className="small-gallery" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                      {selectedItem.image_urls.map((url, idx) => (
                        <img key={idx} src={url} alt={`Thumb ${idx}`} onClick={() => setActiveModalImage(url)} style={{ width: '80px', height: '80px', flexShrink: 0, objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: activeModalImage === url ? '2px solid var(--primary)' : '1px solid #E5E7EB', scrollSnapAlign: 'start' }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Riwayat Penawaran Accordion (Max 3) */}
                <div className="riwayat-section border-rounded" style={{ marginTop: '1rem' }}>
                  <button className="riwayat-header" onClick={() => setIsModalHistoryOpen(!isModalHistoryOpen)} style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="ph ph-clock-counter-clockwise"></i>
                      Riwayat Penawaran ({modalBids.length})
                    </div>
                    <i className={`ph ph-caret-right ml-auto ${isModalHistoryOpen ? 'ph-caret-down' : ''}`} style={{ transition: 'transform 0.3s' }}></i>
                  </button>

                  {isModalHistoryOpen && (
                    <div className="riwayat-body" style={{ maxHeight: '200px', overflowY: 'auto' }}>
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

              {/* SISI KANAN: Informasi */}
              <div className="item-detail-info">
                <h2 style={{ fontSize: '1.4rem' }}>{selectedItem.nama_produk}</h2>

                {(() => {
                  let bidStatusText = getPriceLabel();
                  let bidStatusColor = getPriceColor();

                  if (activeRole === 'pembeli' && (activeTab === 'Semua' || activeTab === 'Sedang Diikuti' || activeTab === 'Favorit')) {
                    const isBiddedByUser = currentUser && modalBids.some(b => b.bidder_id === currentUser.id);
                    const isHighestBidder = currentUser && modalBids.length > 0 && modalBids[0].bidder_id === currentUser.id;

                    if (modalBids.length === 0) {
                      bidStatusText = 'Belum Ada Penawaran';
                      bidStatusColor = 'var(--text-main)';
                    } else if (isHighestBidder) {
                      bidStatusText = 'Anda Penawar Tertinggi Saat Ini!';
                      bidStatusColor = '#10B981'; // Hijau
                    } else if (isBiddedByUser) {
                      bidStatusText = 'Harga Tertinggi saat ini:';
                      bidStatusColor = '#EF4444'; // Merah
                    } else {
                      bidStatusText = 'Bid Tertinggi Saat Ini';
                      bidStatusColor = 'var(--text-main)';
                    }
                  }

                  return (
                    <div className="bid-section" style={{ border: 'none', background: 'transparent', padding: '0', marginBottom: '1rem' }}>
                      <p style={{ color: bidStatusColor, fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{bidStatusText}</p>
                      <h3 className="price-green" style={{ color: bidStatusColor, fontSize: '1.8rem', fontWeight: 800 }}>Rp {formatRupiah(modalBids.length > 0 ? modalBids[0].amount : (selectedItem.current_price || selectedItem.harga_awal))}</h3>
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
                      <td>{selectedItem.merk || '-'}</td>
                      <td>{selectedItem.tahun_produksi || '-'}</td>
                      <td>{selectedItem.model || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="info-lelang-section">
                  <h4>Informasi Lelang</h4>
                  <div className="info-row"><span className="label">Lelang Berakhir</span><span className="value">
                    {formatTanggalPukul(selectedItem.waktu_selesai)}
                  </span></div>
                  <div className="info-row"><span className="label">Lokasi Barang</span><span className="value">{selectedItem.lokasi}</span></div>
                </div>

                <div className="countdown-section">
                  <p>Sisa Waktu Lelang :</p>
                  <div className="countdown-timer" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                    {calculateTimeLeft(selectedItem.waktu_selesai)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                  <button className="btn-primary-full" onClick={() => router.push(`/jelajahi/${selectedItem.id}?from=status-lelang`)}>
                    Lihat Detail Penuh
                  </button>

                  {activeRole === 'pembeli' && activeTab === 'Menang Lelang' && (
                    <button className="btn-secondary" style={{ padding: '1rem', borderRadius: '999px', fontSize: '1rem', fontWeight: 700, background: '#10B981', color: 'white', border: 'none' }} onClick={() => router.push(`/status-lelang/pembayaran/${selectedItem.id}`)}>
                      Lanjut Pembayaran
                    </button>
                  )}
                  {activeRole === 'penjual' && activeTab === 'Selesai' && modalBids.length > 0 && (
                    <button className="btn-secondary" style={{ padding: '1rem', borderRadius: '999px', fontSize: '1rem', fontWeight: 700, background: '#10B981', color: 'white', border: 'none' }} onClick={() => router.push(`/status-lelang/pengiriman/penjual/${selectedItem.id}`)}>
                      Proses Pengiriman Barang
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
      , document.body)}
    </>
  );
}

export default function StatusLelangPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Memuat...</div>}>
      <StatusLelangContent />
    </Suspense>
  );
}