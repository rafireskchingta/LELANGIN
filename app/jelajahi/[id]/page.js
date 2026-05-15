'use client';

import { useState, useEffect, useRef } from 'react';
// TAMBAHAN: Import useSearchParams untuk menangkap parameter URL
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { fetchProductDetail, fetchProductBids } from '../../../src/services/productService';
import { supabase } from '../../../src/lib/supabase';

export default function DetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams(); // Inisialisasi search params
  const productId = params.id;
  const mainImgRef = useRef(null);

  // Cek apakah user datang dari halaman status lelang
  const fromStatus = searchParams.get('from') === 'status-lelang';

  // --- STATE ---
  const [product, setProduct] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidValue, setBidValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState(null);
  const [timeLeft, setTimeLeft] = useState('Menghitung...');
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(true); // Default terbuka

  // --- HELPERS ---
  const showToast = (msg, type = 'success') => {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(msg, type);
    } else {
      alert(msg);
    }
  };

  const closeAllModals = () => {
    setIsWarningModalOpen(false);
  };

  // --- EFEK UTAMA: Load Data & Real-time ---
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const productData = await fetchProductDetail(productId);
        if (productData) {
          setProduct(productData);
          const bidsData = await fetchProductBids(productId);
          setBids(bidsData);
        } else {
          console.error('Produk tidak ditemukan');
        }
      } catch (error) {
        console.error('Error loading product detail:', error);
      }
      setIsLoading(false);
    };

    if (productId) {
      loadInitialData();
    }

    // --- PERBAIKAN BUG NO 3: Real-time Instan Tanpa Replication Lag ---
    const channel = supabase
      .channel(`realtime:bids:${productId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `product_id=eq.${productId}` },
        async (payload) => {
          // Ambil HANYA profil dari user yang baru nge-bid biar cepat
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.bidder_id)
            .single();

          const newBid = {
            ...payload.new,
            profiles: profile || { username: 'User' }
          };

          // Suntikkan data baru langsung ke UI agar nominal harga instan berubah!
          setBids(prevBids => {
            if (prevBids.some(b => b.id === newBid.id)) return prevBids; // Cegah duplikat
            const updated = [newBid, ...prevBids];
            return updated.sort((a, b) => b.amount - a.amount); // Pastikan yang tertinggi di atas
          });

          if (currentUser && payload.new.bidder_id !== currentUser.id) {
            showToast('Ada penawaran baru masuk!', 'info');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, currentUser?.id]);

  // --- LOGIKA TIMER ---
  useEffect(() => {
    if (!product?.waktu_selesai) return;

    const timer = setInterval(() => {
      const now = new Date();
      const start = product.waktu_mulai ? new Date(product.waktu_mulai) : null;
      const end = new Date(product.waktu_selesai);

      if (start && now < start) {
        const selisihMs = start - now;
        const hari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
        const jam = Math.floor((selisihMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const menit = Math.floor((selisihMs % (1000 * 60 * 60)) / (1000 * 60));
        const detik = Math.floor((selisihMs % (1000 * 60)) / 1000);

        if (hari > 0) {
          setTimeLeft(`Dimulai Dalam: ${hari} Hari : ${jam} Jam : ${menit} Menit : ${detik} Detik`);
        } else {
          setTimeLeft(`Dimulai Dalam: ${jam} Jam : ${menit} Menit : ${detik} Detik`);
        }
        return;
      }

      const selisihMs = end - now;

      if (selisihMs <= 0) {
        setTimeLeft('Waktu Habis');
        clearInterval(timer);
        return;
      }

      const hari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
      const jam = Math.floor((selisihMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const menit = Math.floor((selisihMs % (1000 * 60 * 60)) / (1000 * 60));
      const detik = Math.floor((selisihMs % (1000 * 60)) / 1000);

      if (hari > 0) {
        setTimeLeft(`${hari} Hari : ${jam} Jam : ${menit} Menit : ${detik} Detik`);
      } else {
        setTimeLeft(`${jam} Jam : ${menit} Menit : ${detik} Detik`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [product?.waktu_selesai, product?.waktu_mulai]);

  // --- LOGIKA BID ---
  const handleSubmitBid = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      showToast('Anda harus login terlebih dahulu!', 'error');
      return;
    }

    const now = new Date();
    const start = product.waktu_mulai ? new Date(product.waktu_mulai) : null;
    if (start && now < start) {
      showToast('Lelang belum dimulai!', 'error');
      return;
    }

    const bidAmount = parseInt(bidValue.replace(/\./g, ''));
    if (isNaN(bidAmount) || bidAmount <= 0) {
      showToast('Masukkan nominal penawaran yang valid.', 'error');
      return;
    }

    const currentHighest = bids.length > 0 ? bids[0].amount : (product.harga_awal || 0);

    if (bidAmount <= currentHighest) {
      setModalMessage('Harga bid yang Anda tawarkan dibawah harga bid tertinggi saat ini, segera masukkan bid yang lebih tinggi!');
      setIsWarningModalOpen(true);
      return;
    }

    if (product.seller_id === currentUser.id) {
      showToast('Anda tidak bisa menawar barang Anda sendiri.', 'error');
      return;
    }

    try {
      showToast('Mengajukan penawaran...', 'info');
      const { error } = await supabase
        .from('bids')
        .insert([{ product_id: productId, bidder_id: currentUser.id, amount: bidAmount }]);

      if (error) throw error;

      showToast('Selamat! Penawaran Anda berhasil diajukan.', 'success');
      setBidValue('');

    } catch (error) {
      console.error('Gagal mengajukan bid:', error.message);
      showToast('Terjadi kesalahan teknis. Coba lagi nanti.', 'error');
    }
  };

  // --- FORMATTER ---
  const formatRibuanInput = (val) => {
    const num = val.replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatCurrency = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // --- LOGIKA STATE UI KOTAK BID (PERBAIKAN BUG NO 4) ---
  const hasBids = bids.length > 0;
  const highestBid = hasBids ? bids[0] : null;
  const highestBidderId = highestBid ? highestBid.bidder_id : null;

  // Cek apakah user pernah nawar di barang ini
  const hasUserBid = currentUser ? bids.some(b => b.bidder_id === currentUser.id) : false;
  const isWinning = currentUser && highestBidderId === currentUser.id;

  let boxBorder = '1px solid #E5E7EB';
  let boxBg = '#F9FAFB';
  let labelColor = 'var(--text-muted)';
  let priceColor = '#111827';
  let labelText = 'Harga Awal Lelang';

  if (hasBids) {
    if (isWinning) {
      boxBorder = '2px solid #10B981';
      boxBg = '#ECFDF5';
      labelColor = '#047857';
      priceColor = '#059669';
      labelText = 'Selamat, Anda Penawar Tertinggi!';
    } else if (hasUserBid) {
      // Hanya merah JIKA user pernah nawar dan kesalip
      boxBorder = '2px solid #EF4444';
      boxBg = '#FEF2F2';
      labelColor = '#B91C1C';
      priceColor = '#DC2626';
      labelText = 'Penawaran tertinggi saat ini:';
    } else {
      // General / Baru Liat
      boxBorder = '1px solid #E5E7EB';
      boxBg = '#F9FAFB';
      labelColor = 'var(--text-muted)';
      priceColor = '#111827';
      labelText = 'Penawaran Tertinggi Saat Ini';
    }
  }

  const currentDisplayPrice = highestBid ? highestBid.amount : (product?.harga_awal || 0);

  return (
    <main className="page-container detail-page">
      {/* PERBAIKAN: Tombol Kembali Dinamis */}
      <button
        onClick={() => {
          if (fromStatus) {
            router.push('/status-lelang'); // Kembali ke Dasbor jika dari Dasbor
          } else {
            router.back(); // Kembali ke halaman sebelumnya (Jelajah Biasa)
          }
        }}
        style={{ fontFamily: 'inherit', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '1.1rem', marginBottom: '2rem', padding: 0 }}
      >
        <i className="ph-bold ph-arrow-left"></i> Kembali
      </button>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat data produk...</div>
      ) : !product ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Produk tidak ditemukan</div>
      ) : (
        <div className="detail-layout">
          {/* --- KIRI: GALERI GAMBAR & RIWAYAT --- */}
          <div className="detail-left">
            <img
              ref={mainImgRef}
              src={product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : '/assets/placeholder.png'}
              className="main-img"
              alt={product.nama_produk}
              style={{ objectFit: 'cover', width: '100%', height: '400px', borderRadius: '8px' }}
            />

            {/* PERBAIKAN BUG NO 2: Flex Wrap ukuran FIX 80x80px */}
            <div className="thumbnail-gallery" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {product.image_urls && product.image_urls.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  className={`thumb ${idx === 0 ? 'active' : ''}`}
                  alt={`Thumb ${idx}`}
                  style={{ width: '80px', height: '80px', flexShrink: 0, objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid #E5E7EB' }}
                  onClick={(e) => {
                    if (mainImgRef.current) mainImgRef.current.src = img;
                    document.querySelectorAll('.thumbnail-gallery .thumb').forEach(t => t.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                  }}
                />
              ))}
            </div>

            {/* PERBAIKAN BUG NO 6: Animasi Riwayat Accordion */}
            <div className="riwayat-section border-rounded" style={{ marginTop: '1.5rem', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
              <button
                className="riwayat-header"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="ph ph-clock-counter-clockwise" style={{ fontSize: '1.2rem' }}></i>
                  Riwayat Penawaran ({bids.length})
                </div>
                <i className="ph ph-caret-down" style={{ transition: 'transform 0.3s', transform: isHistoryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}></i>
              </button>

              <div className="riwayat-body" style={{
                maxHeight: isHistoryOpen ? '250px' : '0px',
                overflowY: 'auto',
                transition: 'max-height 0.3s ease-in-out',
                background: '#F9FAFB',
                borderTop: isHistoryOpen ? '1px solid #E5E7EB' : 'none'
              }}>
                <div style={{ padding: '1rem' }}>
                  {bids.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada penawaran</div>
                  ) : (
                    // Maksimal tampil 15 di riwayat biar gak kepanjangan
                    bids.slice(0, 15).map((bid) => (
                      <div key={bid.id} className="riwayat-item" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid #E5E7EB' }}>
                        <span style={{ fontWeight: 500 }}>@{bid.profiles?.username || 'User'}</span>
                        <span className="price-blue" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                          Rp {formatCurrency(bid.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- KANAN: INFO & FORM --- */}
          <div className="detail-right">
            <h1 className="detail-title" style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>{product.nama_produk}</h1>

            <div className="bid-highest-box border-rounded" style={{ border: boxBorder, background: boxBg, padding: '1.5rem', transition: 'all 0.3s ease' }}>
              <div className="flex-bw" style={{ marginBottom: '0.5rem' }}>
                <span className="text-muted" style={{ color: labelColor, fontWeight: 600 }}>{labelText}</span>
                {hasBids && bids[0].profiles ? (
                  <span className="user-tag" style={{ background: isWinning ? '#10B981' : (hasUserBid ? '#EF4444' : '#6B7280'), color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    @{bids[0].profiles.username}
                  </span>
                ) : (
                  <span className="user-tag">-</span>
                )}
              </div>
              <div className="price-huge text-right" style={{ color: priceColor, fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.1 }}>
                <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '0.2rem' }}>Rp</span>
                {formatCurrency(currentDisplayPrice)}
              </div>
            </div>

            <table className="specs-table mt-1" style={{ marginTop: '2rem', width: '100%', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ paddingBottom: '0.5rem' }}>Merk</th>
                  <th style={{ paddingBottom: '0.5rem' }}>Tahun Pembuatan</th>
                  <th style={{ paddingBottom: '0.5rem' }}>Model</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ paddingTop: '0.5rem' }}>{product.merk || '-'}</td>
                  <td style={{ paddingTop: '0.5rem' }}>{product.tahun_produksi || '-'}</td>
                  <td style={{ paddingTop: '0.5rem' }}>{product.model || '-'}</td>
                </tr>
              </tbody>
            </table>

            <div className="info-lelang-section border-top-bottom" style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '1.5rem 0', margin: '1.5rem 0' }}>
              <h4 style={{ marginBottom: '1rem' }}>Informasi Lelang</h4>
              {new Date(product.waktu_mulai) > new Date() && (
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="label" style={{ color: 'var(--text-muted)' }}>Lelang Dimulai</span>
                  <span className="value" style={{ fontWeight: 600 }}>{formatDate(product.waktu_mulai)}</span>
                </div>
              )}
              <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="label" style={{ color: 'var(--text-muted)' }}>Lelang Berakhir</span>
                <span className="value" style={{ fontWeight: 600 }}>{formatDate(product.waktu_selesai)}</span>
              </div>
              <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="label" style={{ color: 'var(--text-muted)' }}>Lokasi Barang</span>
                <span className="value" style={{ fontWeight: 600 }}>{product.lokasi}</span>
              </div>
            </div>

            <div className="countdown-section text-center" style={{ marginBottom: '2rem' }}>
              <p>{timeLeft.startsWith('Dimulai Dalam') ? 'Lelang Dimulai Dalam :' : 'Sisa Waktu Lelang :'}</p>
              <div className="countdown-timer" style={{ color: timeLeft.startsWith('Dimulai Dalam') ? 'var(--primary)' : '#EF4444', fontWeight: 'bold', fontSize: '1.5rem' }}>
                {timeLeft.startsWith('Dimulai Dalam') ? timeLeft.replace('Dimulai Dalam: ', '') : timeLeft}
              </div>
              <div className="progress-bar" style={{ background: '#E5E7EB', height: '8px', borderRadius: '4px', marginTop: '0.5rem', overflow: 'hidden' }}>
                <div className="progress-fill" style={{
                  width: (() => {
                    if (timeLeft === 'Waktu Habis') return '100%';
                    if (!product?.waktu_mulai || !product?.waktu_selesai) return '0%';
                    const now = new Date();
                    const start = new Date(product.waktu_mulai);
                    const end = new Date(product.waktu_selesai);
                    
                    if (now < start) return '0%';
                    
                    const total = end - start;
                    const elapsed = now - start;
                    const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                    return `${pct}%`;
                  })(),
                  background: '#EF4444', height: '100%', transition: 'width 1s linear'
                }}></div>
              </div>
            </div>

            {/* FORM INLINE + PERBAIKAN BUG NO 1: Warna Biru Rp */}
            <div className="ajukan-penawaran" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
              <h2 className="text-primary section-title" style={{ margin: 0, whiteSpace: 'nowrap', color: '#4F46E5', fontSize: '1.2rem' }}>Ajukan Penawaran</h2>
              <form className="penawaran-form" id="formPenawaran" onSubmit={handleSubmitBid} style={{ margin: 0, flex: '1 1 250px' }}>
                <div className="input-bid-group" style={{ display: 'flex', width: '100%' }}>
                  <span className="rp-label" style={{ padding: '0.75rem 1rem', background: '#4F46E5', color: 'white', border: '1px solid #4F46E5', borderRight: 'none', borderRadius: '8px 0 0 8px', fontWeight: 'bold' }}>Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bidValue}
                    onChange={(e) => setBidValue(formatRibuanInput(e.target.value))}
                    placeholder="Masukan Nominal Penawaran"
                    required
                    style={{ flex: 1, padding: '0.75rem', border: '1px solid #D1D5DB', outline: 'none', fontSize: '1rem', minWidth: '0' }}
                  />
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={timeLeft.startsWith('Dimulai Dalam') || timeLeft === 'Waktu Habis'}
                    style={{ 
                      padding: '0.75rem 1.5rem', 
                      background: (timeLeft.startsWith('Dimulai Dalam') || timeLeft === 'Waktu Habis') ? '#9CA3AF' : '#4F46E5', 
                      color: 'white', 
                      borderRadius: '0 8px 8px 0', 
                      border: '1px solid #4F46E5', 
                      cursor: (timeLeft.startsWith('Dimulai Dalam') || timeLeft === 'Waktu Habis') ? 'not-allowed' : 'pointer', 
                      fontWeight: 'bold' 
                    }}
                  >
                    {timeLeft.startsWith('Dimulai Dalam') ? 'Segera' : 'Tawar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {product && (
        <>
          <div className="specs-details-grid border-top-bottom mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #E5E7EB' }}>
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#111827' }}>Info</h3>
              <ul className="key-value-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Merk</span><span style={{ fontWeight: 500 }}>{product.merk || '-'}</span></li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Model</span><span style={{ fontWeight: 500 }}>{product.model || '-'}</span></li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Daya Listrik</span><span style={{ fontWeight: 500 }}>{product.daya_listrik || '-'}</span></li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Kapasitas</span><span style={{ fontWeight: 500 }}>{product.kapasitas || '-'}</span></li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Warna</span><span style={{ fontWeight: 500 }}>{product.warna || '-'}</span></li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Tahun Produksi</span><span style={{ fontWeight: 500 }}>{product.tahun_produksi || '-'}</span></li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Tegangan</span><span style={{ fontWeight: 500 }}>{product.tegangan || '-'}</span></li>
              </ul>
            </div>
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#111827' }}>Kelas</h3>
              <ul className="key-value-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Kondisi Fisik</span><span style={{ fontWeight: 500 }}>{product.kondisi_fisik || '-'}</span></li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Kelengkapan</span><span style={{ fontWeight: 500 }}>{product.kelengkapan || '-'}</span></li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Estetika</span><span style={{ fontWeight: 500 }}>{product.estetika_tampilan || '-'}</span></li>
              </ul>
            </div>
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#111827' }}>Dokumen</h3>
              <ul className="key-value-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Dok. Pendukung</span><span style={{ fontWeight: 500 }}>{product.dokumen_pendukung || '-'}</span></li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Kemasan/Box</span><span style={{ fontWeight: 500 }}>{product.kemasan_box || '-'}</span></li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}><span style={{ color: 'var(--text-muted)' }}>Aksesoris Tambahan</span><span style={{ fontWeight: 500 }}>{product.aksesoris_tambahan || '-'}</span></li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* PERBAIKAN BUG NO 5: Modal Peringatan Merah */}
      <div className={`modal-overlay ${isWarningModalOpen ? 'active' : ''}`} id="modalOverlay" style={{ display: isWarningModalOpen ? 'flex' : 'none', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
        <div className={`modal modal-sm ${isWarningModalOpen ? 'active' : ''}`} id="warningModal" style={{ background: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center', maxWidth: '400px', width: '90%', position: 'relative' }}>
          <button className="modal-close" onClick={closeAllModals} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#6B7280' }}><i className="ph ph-x"></i></button>
          <div className="modal-header">
            <h2 style={{ color: '#EF4444', marginBottom: '1rem', fontSize: '1.5rem' }}>Peringatan!</h2>
            <p style={{ color: '#4B5563', fontWeight: 500, lineHeight: '1.6' }}>
              {modalMessage}
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={closeAllModals} style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Kembali</button>
        </div>
      </div>
    </main>
  );
}