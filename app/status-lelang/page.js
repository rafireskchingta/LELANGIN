'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';
import { fetchProductBids } from '../../src/services/productService';
import { useAdminGuard } from '../../src/hooks/useAdminGuard';

function StatusLelangContent() {
  useAdminGuard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initRole = searchParams.get('role') || 'pembeli';

  // --- 1. STATE UI & LAYOUT ---
  const [mounted, setMounted] = useState(false);
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
  const [nowTime, setNowTime] = useState(new Date());

  // --- 3. STATE SEARCH (DEBOUNCE) ---
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const pembeliTabs = ['Semua', 'Sedang Diikuti', 'Favorit', 'Menang Lelang', 'Kalah Lelang', 'Dikirim', 'Selesai', 'Dibatalkan'];
  const penjualTabs = ['Semua', 'Menunggu', 'Aktif', 'Selesai', 'Dibatalkan'];
  const currentTabs = activeRole === 'pembeli' ? pembeliTabs : penjualTabs;

  const tabsRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // CEK SINKRONISASI DOM & USER AUTH
  useEffect(() => {
    setMounted(true);
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

  // TIMER REAL-TIME
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // DEBOUNCE SEARCH FILTER
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput.toLowerCase());
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // FETCH DATA UTAMA BERDASARKAN TAB & ROLE
  useEffect(() => {
    if (!currentUser) return;

    const extractUniqueProducts = (dataArray) => {
      if (!dataArray) return [];
      const unique = [];
      const seen = new Set();
      dataArray.forEach(item => {
        const prod = item.products;
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
              const { data: winningBids } = await supabase
                .from('bids')
                .select('products(*)')
                .eq('bidder_id', currentUser.id)
                .eq('is_winning_bid', true)
                .lt('products.waktu_selesai', now);
              
              let wonProducts = extractUniqueProducts(winningBids);

              if (wonProducts.length > 0) {
                const { data: existingTrx } = await supabase
                  .from('transactions')
                  .select('product_id, status_transaksi, id')
                  .in('product_id', wonProducts.map(p => p.id));
                
                const existingMap = {};
                (existingTrx || []).forEach(t => existingMap[t.product_id] = t);

                for (const p of wonProducts) {
                  if (!existingMap[p.id]) {
                    const { data: newTrx } = await supabase
                      .from('transactions')
                      .insert({
                        product_id: p.id,
                        winner_id: currentUser.id,
                        status_transaksi: 'menunggu_pembayaran'
                      })
                      .select('product_id, status_transaksi, id')
                      .single();
                    if (newTrx) existingMap[p.id] = newTrx;
                  }
                }

                fetchedData = wonProducts.filter(p => {
                  const s = existingMap[p.id]?.status_transaksi;
                  return s === 'menunggu_pembayaran' || s === 'menunggu_alamat' || s === 'diproses';
                }).map(p => ({
                   ...p,
                   _trx_status: existingMap[p.id]?.status_transaksi,
                   _trx_id: existingMap[p.id]?.id
                }));
              }
              break;
            case 'Kalah Lelang':
              const { data: lostBids } = await supabase.from('bids').select('products(*)').eq('bidder_id', currentUser.id).eq('is_winning_bid', false).lt('products.waktu_selesai', now);
              fetchedData = extractUniqueProducts(lostBids);
              break;
            case 'Dikirim':
            case 'Selesai':
            case 'Dibatalkan':
              const { data: trxStatus } = await supabase.from('transactions').select('products(*), status_transaksi, id').eq('winner_id', currentUser.id).eq('status_transaksi', activeTab.toLowerCase());
              if (trxStatus) {
                fetchedData = trxStatus.filter(t => t.products).map(t => ({
                  ...t.products,
                  _trx_status: t.status_transaksi,
                  _trx_id: t.id
                }));
              }
              break;
            case 'Semua':
            default:
              const { data: allInteractions } = await supabase.from('bids').select('products(*)').eq('bidder_id', currentUser.id);
              fetchedData = extractUniqueProducts(allInteractions);
              break;
          }
        } else {
          if (activeTab === 'Selesai') {
            // Ambil semua produk penjual yang waktunya sudah habis
            const { data: finishedProducts, error: prodError } = await supabase
              .from('products')
              .select('*')
              .eq('seller_id', currentUser.id)
              .lt('waktu_selesai', now);

            if (prodError) throw prodError;

            if (finishedProducts && finishedProducts.length > 0) {
              const { data: existingTrx } = await supabase
                .from('transactions')
                .select('product_id, id, status_transaksi')
                .in('product_id', finishedProducts.map(p => p.id));
              
              const existingMap = {};
              (existingTrx || []).forEach(t => existingMap[t.product_id] = t);

              for (const p of finishedProducts) {
                if (!existingMap[p.id]) {
                  // Cari pemenang
                  const { data: topBid } = await supabase
                    .from('bids')
                    .select('bidder_id')
                    .eq('product_id', p.id)
                    .eq('is_winning_bid', true)
                    .maybeSingle();
                  
                  if (topBid) {
                    const { data: newTrx } = await supabase
                      .from('transactions')
                      .insert({
                        product_id: p.id,
                        winner_id: topBid.bidder_id,
                        status_transaksi: 'menunggu_pembayaran'
                      })
                      .select('product_id, id, status_transaksi')
                      .single();
                    if (newTrx) existingMap[p.id] = newTrx;
                  }
                }
              }

              // Gabungkan data produk + status transaksi ke dalam satu objek
              fetchedData = finishedProducts
                .filter(p => existingMap[p.id]) // hanya yang ada transaksi (ada pemenang)
                .map(p => ({
                  ...p,
                  _trx_status: existingMap[p.id].status_transaksi,
                  _trx_id: existingMap[p.id].id,
                }));
            }
          } else {
            let query = supabase.from('products').select('*').eq('seller_id', currentUser.id);

            switch (activeTab) {
              case 'Menunggu':
                query = query.eq('status', 'menunggu');
                break;
              case 'Aktif':
                query = query.eq('status', 'aktif').gt('waktu_selesai', now);
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
        }

        if (searchQuery) {
          fetchedData = fetchedData.filter(item => item && item.nama_produk && item.nama_produk.toLowerCase().includes(searchQuery));
        }

        // Post-processing: Pastikan semua produk punya data transaksi jika ada
        if (fetchedData.length > 0) {
          const productIds = fetchedData.map(p => p.id).filter(Boolean);
          if (productIds.length > 0) {
            const { data: trxData } = await supabase.from('transactions').select('*').in('product_id', productIds);
            if (trxData && trxData.length > 0) {
              const trxMap = {};
              trxData.forEach(t => trxMap[t.product_id] = t);
              fetchedData = fetchedData.map(p => {
                if (trxMap[p.id]) {
                  return {
                    ...p,
                    _trx_status: trxMap[p.id].status_transaksi,
                    _trx_winner_id: trxMap[p.id].winner_id,
                    _trx_id: trxMap[p.id].id,
                  };
                }
                return p;
              });
            }
          }
        }

        // Pastikan tidak ada id produk yang ganda (misal akibat duplikasi transaksi di DB)
        const uniqueItems = [];
        const seenIds = new Set();
        for (const item of fetchedData) {
          if (item && item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            uniqueItems.push(item);
          }
        }

        setItems(uniqueItems);
      } catch (error) {
        console.error("Gagal menarik data:", error);
      }
      setLoading(false);
    };

    fetchTabData();
  }, [activeRole, activeTab, currentUser, searchQuery]);

  // ANIMASI SLIDER INDIKATOR TAB GAUL
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

  // BUKA MODAL QUICK VIEW
  const handleOpenModal = async (item) => {
    setSelectedItem(item);
    setActiveModalImage(item.image_urls?.[0] || '/assets/placeholder.png');
    setIsModalOpen(true);
    setIsModalHistoryOpen(false);

    const { data: bidsData } = await supabase.from('bids').select('*, profiles(username)').eq('product_id', item.id).order('amount', { ascending: false });
    setModalBids(bidsData || []);
  };

  // FORMATTERS
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

  const calculateTimeLeft = (waktuSelesai, waktuMulai) => {
    if (!waktuSelesai) return { text: 'Waktu Habis', percent: 0 };
    const end = new Date(waktuSelesai);
    const start = new Date(waktuMulai || end.getTime() - 1000 * 60 * 60 * 24);
    const selisihMs = end - nowTime;

    if (selisihMs <= 0) return { text: 'Waktu Habis', percent: 0 };

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

    let text = '';
    if (hari > 0) text = `${hari} Hari`;
    else if (jam > 0) text = `${jam} Jam`;
    else if (menit > 0) text = `${menit} Menit`;
    else text = `${detik} Detik`;

    return { text, percent };
  };

  const getDefinitiveStatus = (item, role, userId) => {
    if (item.status === 'dibatalkan') return { label: 'Dibatalkan', bg: '#FEF2F2', color: '#DC2626' };
    
    const now = new Date();
    const start = new Date(item.waktu_mulai);
    const end = new Date(item.waktu_selesai);

    if (now < start) {
      if (role === 'penjual') return { label: 'Menunggu', bg: '#F3F4F6', color: '#6B7280' };
      return { label: 'Aktif', bg: '#E0E7FF', color: 'var(--primary)' }; 
    }
    
    if (now >= start && now < end) {
      return { label: 'Aktif', bg: '#E0E7FF', color: 'var(--primary)' };
    }

    if (!item._trx_status) {
      if (role === 'penjual') return { label: 'Selesai', bg: '#F3F4F6', color: '#6B7280' }; 
      return { label: 'Kalah Lelang', bg: '#FEF2F2', color: '#DC2626' }; 
    }

    if (role === 'penjual') {
      const map = {
        menunggu_pembayaran: { label: 'Menunggu Pembayaran', bg: '#FEF3C7', color: '#B45309' },
        menunggu_alamat:     { label: 'Menunggu Alamat', bg: '#DBEAFE', color: '#1D4ED8' },
        diproses:            { label: 'Diproses', bg: '#EDE9FE', color: '#6D28D9' },
        dikirim:             { label: 'Dikirim', bg: '#ECFDF5', color: '#059669' },
        selesai:             { label: 'Selesai', bg: '#D1FAE5', color: '#047857' },
      };
      return map[item._trx_status] || { label: item._trx_status, bg: '#F3F4F6', color: '#6B7280' };
    }

    if (role === 'pembeli') {
      if (item._trx_winner_id === userId) {
        if (item._trx_status === 'menunggu_pembayaran' || item._trx_status === 'menunggu_alamat') {
          return { label: 'Menang Lelang', bg: '#ECFDF5', color: '#059669' };
        }
        const map = {
          diproses: { label: 'Diproses', bg: '#EDE9FE', color: '#6D28D9' },
          dikirim:  { label: 'Dikirim', bg: '#ECFDF5', color: '#059669' },
          selesai:  { label: 'Selesai', bg: '#D1FAE5', color: '#047857' },
        };
        return map[item._trx_status] || { label: 'Menang Lelang', bg: '#ECFDF5', color: '#059669' };
      } else {
        return { label: 'Kalah Lelang', bg: '#FEF2F2', color: '#DC2626' };
      }
    }

    return { label: 'Selesai', bg: '#F3F4F6', color: '#6B7280' };
  };

  const getStatusBadge = (item) => {
    const statusInfo = getDefinitiveStatus(item, activeRole, currentUser?.id);
    return (
      <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '0.5rem 1.25rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {statusInfo.label}
      </span>
    );
  };

  const getPriceLabel = () => {
    if (activeRole === 'pembeli') {
      if (activeTab === 'Menang Lelang' || activeTab === 'Kalah Lelang') return 'Penawaran Anda';
      return 'Harga Terakhir';
    } else {
      if (activeTab === 'Selesai') return 'Terjual Seharga';
      return 'Bid Tertinggi Saat Ini';
    }
  };

  const getPriceColor = () => {
    if (activeRole === 'pembeli') {
      if (activeTab === 'Menang Lelang') return '#059669';
      if (activeTab === 'Kalah Lelang') return '#DC2626';
      return 'var(--primary)';
    } else {
      if (activeTab === 'Selesai') return '#059669';
      return 'var(--primary)';
    }
  };

  return (
    <main className="page-container" style={{ padding: '0 5%', margin: '0 auto', minHeight: '80vh' }}>

      {/* Banner Utama */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #7B83F5 50%, #A5AAFF 100%)', color: 'white', padding: '1.5rem 2rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '2rem' }}>
        <i className="ph ph-clock" style={{ fontSize: '2.25rem', opacity: 0.9 }}></i>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Status Penawaran Lelang</h2>
      </div>

      {/* Header Form & Role Kapsul Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>

        {/* Kapsul Role Switcher dengan Sliding Effect */}
        <div style={{ position: 'relative', display: 'inline-flex', background: '#F3F4F6', borderRadius: '999px', padding: '4px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
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
            style={{ position: 'relative', zIndex: 1, width: '120px', padding: '0.6rem 0', fontWeight: 700, border: 'none', background: 'transparent', color: activeRole === 'pembeli' ? 'white' : '#6B7280', cursor: 'pointer', transition: 'color 0.3s', fontFamily: 'inherit', fontSize: '0.9rem' }}
          >
            Pembeli
          </button>
          <button
            onClick={() => {
              if (userRole !== 'penjual') return;
              setActiveRole('penjual');
              setActiveTab('Semua');
            }}
            style={{ position: 'relative', zIndex: 1, width: '120px', padding: '0.6rem 0', fontWeight: 700, border: 'none', background: 'transparent', color: activeRole === 'penjual' ? 'white' : '#6B7280', cursor: userRole === 'penjual' ? 'pointer' : 'not-allowed', transition: 'color 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontFamily: 'inherit', fontSize: '0.9rem' }}
          >
            Penjual
            {userRole !== 'penjual' && <i className="ph-fill ph-lock-key" style={{ fontSize: '1rem', color: '#9CA3AF' }}></i>}
          </button>
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0.5rem 1rem', minWidth: '260px', flex: '0 1 320px', background: 'white' }}>
          <i className="ph ph-magnifying-glass" style={{ color: '#9CA3AF', fontSize: '1.1rem' }}></i>
          <input type="text" placeholder="Cari produk kamu disini" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--text-main)', background: 'transparent' }} />
        </div>
      </div>

      {/* Navigasi Tab Bar */}
      <div ref={tabsRef} style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', position: 'relative', marginBottom: '2rem' }}>
        {currentTabs.map(tab => (
          <button
            key={tab}
            data-active={activeTab === tab ? 'true' : 'false'}
            onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: '1rem 0.25rem', background: 'none', border: 'none', color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === tab ? 700 : 500, fontSize: '0.9rem', cursor: 'pointer', transition: 'color 0.3s ease', textAlign: 'center' }}
          >
            {tab}
          </button>
        ))}
        <div style={{ position: 'absolute', bottom: '-2px', height: '3px', backgroundColor: 'var(--primary)', borderRadius: '3px', transition: 'left 0.3s ease, width 0.3s ease', left: indicatorStyle.left, width: indicatorStyle.width }}></div>
      </div>

      {/* List Content Grid */}
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

              <div>
                {(() => {
                  const statusInfo = getDefinitiveStatus(item, activeRole, currentUser?.id);
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

      {/* --- OVERLAY DETIL POPUP UTUH (CREATEPORTAL) --- */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} id="statusDetailOverlay" onClick={(e) => { if (e.target.id === 'statusDetailOverlay') setIsModalOpen(false) }}>
          <div className={`modal modal-lg ${isModalOpen ? 'active' : ''}`} id="statusDetailModal" style={{ overflowY: 'auto', maxHeight: '90vh' }}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)} style={{ zIndex: 10 }}><i className="ph ph-x"></i></button>

            {selectedItem && (
              <div className="item-detail-layout">

                {/* SISI KIRI */}
                <div className="item-detail-image" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                  <img src={activeModalImage} className="main-img" alt={selectedItem.nama_produk} style={{ objectFit: 'cover', width: '100%', borderRadius: '8px' }} />

                  {selectedItem.image_urls?.length > 1 && (
                    <div style={{ width: '100%', overflow: 'hidden', marginTop: '1rem' }}>
                      <div className="small-gallery" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                        {selectedItem.image_urls.map((url, idx) => (
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
                      <i className="ph ph-caret-right ml-auto" style={{ transition: 'transform 0.3s', transform: isModalHistoryOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}></i>
                    </button>

                    <div className="riwayat-body" id="bodyRiwayatStatus" style={{ 
                      maxHeight: isModalHistoryOpen ? '200px' : '0', 
                      opacity: isModalHistoryOpen ? 1 : 0,
                      visibility: isModalHistoryOpen ? 'visible' : 'hidden',
                      overflowY: isModalHistoryOpen ? 'auto' : 'hidden',
                      transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, visibility 0.4s ease'
                    }}>
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
                  </div>
                </div>

                {/* SISI KANAN */}
                <div className="item-detail-info">
                  <h2 style={{ fontSize: '1.4rem' }}>{selectedItem.nama_produk}</h2>

                  {(() => {
                    let bidStatusText = getPriceLabel();
                    let bidStatusColor = getPriceColor();

                    if (activeRole === 'pembeli' && (activeTab === 'Semua' || activeTab === 'Sedang Diikuti' || activeTab === 'Favorit')) {
                      const isBiddedByUser = currentUser && modalBids.some(b => b.bidder_id === currentUser.id);
                      const isOriginalHighest = currentUser && modalBids.length > 0 && modalBids[0].bidder_id === currentUser.id;

                      if (modalBids.length === 0) {
                        bidStatusText = 'Belum Ada Penawaran';
                        bidStatusColor = 'var(--text-main)';
                      } else if (isOriginalHighest) {
                        bidStatusText = 'Anda Penawar Tertinggi Saat Ini!';
                        bidStatusColor = '#10B981';
                      } else if (isBiddedByUser) {
                        bidStatusText = 'Harga Tertinggi saat ini:';
                        bidStatusColor = '#EF4444';
                      }
                    }

                    return (
                      <div className="bid-section" style={{ padding: '0', marginBottom: '1rem' }}>
                        <p style={{ color: bidStatusColor, fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{bidStatusText}</p>
                        <h3 className="price-green" style={{ color: bidStatusColor, fontSize: '1.8rem', fontWeight: 800 }}>Rp {formatRupiah(modalBids.length > 0 ? modalBids[0].amount : (selectedItem.current_price || selectedItem.harga_awal))}</h3>
                      </div>
                    );
                  })()}

                  <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '0.5rem 0 1rem 0' }} />
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

                  <div className="info-legang-section">
                    <h4>Informasi Lelang</h4>
                    <div className="info-row"><span className="label">Lelang Berakhir</span><span className="value">{formatTanggalPukul(selectedItem.waktu_selesai)}</span></div>
                    <div className="info-row"><span className="label">Lokasi Barang</span><span className="value">{selectedItem.lokasi}</span></div>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '0.5rem 0 0' }} />

                  {/* PROGRESS BAR ANIMASI MENYUSUT */}
                  {(() => {
                    const timerData = calculateTimeLeft(selectedItem.waktu_selesai, selectedItem.created_at);
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

                  <button className="btn-primary-full" onClick={() => { setIsModalOpen(false); router.push(`/jelajahi/${selectedItem.id}?from=status-lelang`); }}>
                    Lihat Detail Penuh
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>,
        document.body
      )}
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