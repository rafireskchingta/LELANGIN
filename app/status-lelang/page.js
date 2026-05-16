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

  // --- 1. STATE UI & AUTH ---
  const [mounted, setMounted] = useState(false);
  const [activeRole, setActiveRole] = useState(initRole); // 'pembeli' atau 'penjual'
  const [activeTab, setActiveTab] = useState('Semua');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nowTime, setNowTime] = useState(new Date());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalBids, setModalBids] = useState([]);

  // Data States
  const [items, setItems] = useState([]);

  const pembeliTabs = ['Semua', 'Sedang Diikuti', 'Favorit', 'Menang Lelang', 'Kalah Lelang', 'Dikirim', 'Selesai', 'Dibatalkan'];
  const penjualTabs = ['Semua', 'Menunggu', 'Aktif', 'Selesai', 'Dibatalkan'];

  useEffect(() => {
    setMounted(true);
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Timer interval 1 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. LOGIKA FETCH DATA BERDASARKAN ROLE & TAB ---
  const loadStatusData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      let fetchedData = [];

      if (activeRole === 'pembeli') {
        if (activeTab === 'Favorit') {
          const { data } = await supabase
            .from('favorites')
            .select('products(*)')
            .eq('user_id', currentUser.id);
          fetchedData = data?.map(f => f.products).filter(Boolean) || [];
        } else if (activeTab === 'Sedang Diikuti') {
          const { data } = await supabase
            .from('bids')
            .select('products(*)')
            .eq('bidder_id', currentUser.id)
            .gt('products.waktu_selesai', now);
          fetchedData = extractUniqueProducts(data);
        } else if (activeTab === 'Menang Lelang') {
          const { data } = await supabase
            .from('bids')
            .select('products(*)')
            .eq('bidder_id', currentUser.id)
            .eq('is_winning_bid', true)
            .lte('products.waktu_selesai', now);
          fetchedData = extractUniqueProducts(data);
        } else if (activeTab === 'Kalah Lelang') {
          // KIRI (MERAH): Logika efisien mencegah lag memori b.products
          const { data: allBidsEnded } = await supabase
            .from('bids')
            .select('is_winning_bid, products(*)')
            .eq('bidder_id', currentUser.id)
            .lt('products.waktu_selesai', now);

          if (allBidsEnded) {
            const wonProductIds = new Set(allBidsEnded.filter(b => b.is_winning_bid).map(b => b.products?.id));
            const lostBids = allBidsEnded.filter(b => b.products && !wonProductIds.has(b.products.id));
            fetchedData = extractUniqueProducts(lostBids);
          }
        } else {
          // Status pembeli lainnya (Dikirim, Selesai, Dibatalkan)
          let query = supabase.from('products').select('*');
          if (activeTab !== 'Semua') {
            query = query.eq('status', activeTab.toLowerCase());
          }
          const { data } = await query;
          fetchedData = data || [];
        }
      } else {
        // ROLE: PENJUAL
        let query = supabase.from('products').select('*').eq('seller_id', currentUser.id);
        if (activeTab === 'Aktif') {
          query = query.eq('status', 'aktif').gt('waktu_selesai', now);
        } else if (activeTab === 'Selesai') {
          query = query.or(`status.eq.selesai,waktu_selesai.lte.${now}`);
        } else if (activeTab !== 'Semua') {
          query = query.eq('status', activeTab.toLowerCase());
        }
        const { data } = await query;
        fetchedData = data || [];
      }

      setItems(fetchedData);
    } catch (err) {
      console.error('Error fetching status data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatusData();
  }, [currentUser, activeRole, activeTab]);

  const extractUniqueProducts = (bidsArray) => {
    if (!bidsArray) return [];
    const uniques = {};
    bidsArray.forEach(b => {
      if (b.products) uniques[b.products.id] = b.products;
    });
    return Object.values(uniques);
  };

  // --- 3. OPEN MODAL QUICK VIEW ---
  const openModal = async (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    const bidsData = await fetchProductBids(item.id);
    setModalBids(bidsData || []);
  };

  // --- 4. FORMATTER & PROGRESS TIMER BAR ---
  const formatRupiah = (angka) => {
    if (!angka) return '0';
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const calculateTimeLeft = (waktuSelesai, waktuMulai) => {
    if (!waktuSelesai) return { text: 'Waktu Habis', percent: 0 };
    const end = new Date(waktuSelesai);
    const start = new Date(waktuMulai || end.getTime() - 1000 * 60 * 60 * 24);
    const selisihMs = end - nowTime;

    if (selisihMs <= 0) return { text: 'Waktu Habis', percent: 0 };

    // KANAN (HIJAU) DENGAN REVISI MENYUSUT: (Sisa Waktu / Total Durasi) * 100
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

    const detikStr = String(detik).padStart(2, '0');
    let text = '';
    if (hari > 0) {
      text = `${hari} Hari : ${jam} Jam : ${menit} Menit`;
    } else if (jam > 0) {
      text = `${jam} Jam : ${menit} Menit`;
    } else {
      text = `${menit} Menit : ${detikStr} Detik`;
    }

    return { text, percent };
  };

  // --- 5. LOGIKA BADGE STATUS DINAMIS ---
  const getDynamicStatus = (item) => {
    if (activeTab !== 'Semua') return activeTab;
    const end = new Date(item.waktu_selesai);
    if (activeRole === 'penjual') {
      if (item.status === 'dibatalkan') return 'Dibatalkan';
      if (item.status === 'menunggu') return 'Menunggu';
      if (end <= nowTime) return 'Selesai';
      if (item.status === 'aktif') return 'Aktif';
      return item.status;
    } else {
      if (end <= nowTime) return 'Selesai';
      return 'Aktif';
    }
  };

  const getBadgeStyle = (status) => {
    if (status === 'Menang Lelang' || status === 'Selesai' || status === 'Aktif') {
      return { bg: '#ECFDF5', color: '#059669' }; // Hijau
    }
    if (status === 'Kalah Lelang' || status === 'Dibatalkan') {
      return { bg: '#FEF2F2', color: '#DC2626' }; // Merah
    }
    if (status === 'Menunggu' || status === 'Sedang Diikuti') {
      return { bg: '#FFFBEB', color: '#D97706' }; // Kuning
    }
    return { bg: '#EEF2FF', color: '#4F46E5' }; // Default Biru
  };

  return (
    <main className="page-container" style={{ padding: '0 5%', margin: '0 auto', minHeight: '80vh' }}>
      <div className="role-switcher" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', marginTop: '2rem' }}>
        <button className={`btn-role ${activeRole === 'pembeli' ? 'active' : ''}`} onClick={() => { setActiveRole('pembeli'); setActiveTab('Semua'); }}>Aktivitas Pembeli</button>
        <button className={`btn-role ${activeRole === 'penjual' ? 'active' : ''}`} onClick={() => { setActiveRole('penjual'); setActiveTab('Semua'); }}>Aktivitas Penjual</button>
      </div>

      <div className="tabs-container" style={{ overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {(activeRole === 'pembeli' ? pembeliTabs : penjualTabs).map((tab) => (
          <button key={tab} className={`tab-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* Grid List Item */}
      <div className="status-lelang-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat data aktivitas...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada aktivitas lelang di kategori ini.</div>
        ) : (
          items.map((item) => {
            const currentStatus = getDynamicStatus(item);
            const badgeStyle = getBadgeStyle(currentStatus);
            return (
              <div key={item.id} className="status-lelang-card" onClick={() => openModal(item)} style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.25rem', gap: '1rem', cursor: 'pointer' }}>
                <img src={item.image_urls?.[0] || '/assets/placeholder.png'} alt={item.nama_produk} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>{item.nama_produk}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280' }}>Harga Awal: Rp {formatRupiah(item.harga_awal)}</p>
                </div>
                <span style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color, padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {currentStatus.toUpperCase()}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* --- POPUP SAKTI OVERLAY PENUH (CREATEPORTAL) --- */}
      {mounted && isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay active" id="itemDetailOverlay" onClick={(e) => { if (e.target.id === 'itemDetailOverlay') setIsModalOpen(false) }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal modal-lg active" style={{ background: 'white', borderRadius: '16px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}><i className="ph ph-x"></i></button>

            {selectedItem && (
              <div className="item-detail-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* KIRI: Foto & Riwayat */}
                <div>
                  <img src={selectedItem.image_urls?.[0] || '/assets/placeholder.png'} alt={selectedItem.nama_produk} style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '8px' }} />
                  
                  <div className="riwayat-section border-rounded" style={{ marginTop: '1.5rem', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0' }}><i className="ph ph-clock-counter-clockwise"></i> Riwayat Penawaran ({modalBids.length})</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {modalBids.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280', textAlign: 'center' }}>Belum ada penawaran</p>
                      ) : (
                        modalBids.slice(0, 5).map((bid) => (
                          <div key={bid.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #E5E7EB', fontSize: '0.85rem' }}>
                            <span>@{bid.profiles?.username || 'User'}</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Rp {formatRupiah(bid.amount)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* KANAN: Detail & Tombol Aksi */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem' }}>{selectedItem.nama_produk}</h2>
                    <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#6B7280', display: 'block' }}>Harga Pengajuan Awal</span>
                      <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827' }}>Rp {formatRupiah(selectedItem.harga_awal)}</span>
                    </div>

                    <div style={{ fontSize: '0.9rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <div><strong>Kategori:</strong> {selectedItem.kategori}</div>
                      <div><strong>Lokasi Barang:</strong> {selectedItem.lokasi}</div>
                      <div><strong>Waktu Selesai:</strong> {formatDate(selectedItem.waktu_selesai)}</div>
                    </div>

                    {/* PROGRESS BAR BARU (MENYUSUT KE KIRI) */}
                    {selectedItem.status === 'aktif' && (
                      (() => {
                        const timerData = calculateTimeLeft(selectedItem.waktu_selesai, selectedItem.waktu_mulai || selectedItem.created_at);
                        return (
                          <div className="countdown-section text-center" style={{ marginBottom: '1.5rem', background: '#FEF2F2', padding: '1rem', borderRadius: '8px' }}>
                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem' }}>Sisa Waktu Lelang:</p>
                            <div className="countdown-timer" style={{ color: '#EF4444', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                              {timerData.text}
                            </div>
                            <div className="progress-bar" style={{ width: '100%', background: '#E5E7EB', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                              <div className="progress-fill" style={{ width: `${timerData.percent}%`, background: '#EF4444', height: '100%', transition: 'width 1s linear' }}></div>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* KIRI (MERAH): Tombol Sakti Alur Pembayaran Tetap Terjaga */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn-primary-full" onClick={() => { setIsModalOpen(false); router.push(`/jelajahi/${selectedItem.id}`); }}>
                      Lihat Detail Penuh
                    </button>

                    {activeRole === 'pembeli' && activeTab === 'Menang Lelang' && (
                      <button className="btn-secondary" onClick={() => { setIsModalOpen(false); router.push(`/status-lelang/pembayaran/${selectedItem.id}`); }} style={{ background: '#10B981', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Lanjut Pembayaran
                      </button>
                    )}

                    {activeRole === 'penjual' && activeTab === 'Selesai' && modalBids.length > 0 && (
                      <button className="btn-secondary" onClick={() => { setIsModalOpen(false); router.push(`/status-lelang/pengiriman/penjual/${selectedItem.id}`); }} style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Proses Pengiriman Barang
                      </button>
                    )}
                  </div>
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

// Helper formatting date
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function StatusLelangPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Memuat...</div>}>
      <StatusLelangContent />
    </Suspense>
  );
}