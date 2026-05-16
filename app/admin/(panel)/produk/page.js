'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '../../../../src/lib/supabase'; // Sesuaikan path jika error

function AdminProdukContent() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');
  const [mounted, setMounted] = useState(false);

  // --- State Baru untuk Filter & Sorting ---
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [sortOrder, setSortOrder] = useState('terbaru');
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageUrl, setActiveImageUrl] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Mengambil data produk beserta nama penjualnya
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles(full_name)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Anda yakin ingin menghapus produk ini? Produk akan masuk ke daftar Terhapus.')) return;
    try {
      const { error } = await supabase
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
      alert('Produk berhasil dihapus.');
    } catch (error) {
      alert('Gagal menghapus produk: ' + error.message);
    }
  };

  const [highestBidInfo, setHighestBidInfo] = useState(null);

  const openDetailModal = async (product) => {
    setSelectedProduct(product);
    setActiveImageUrl(product.image_urls?.[0] || null);
    setIsDetailModalOpen(true);
    setHighestBidInfo(null); // Reset while loading

    try {
      // Fetch highest bid for "Harga Terakhir" & "Pemenang"
      const { data, error } = await supabase
        .from('bids')
        .select('amount, profiles(full_name, username)')
        .eq('product_id', product.id)
        .order('amount', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setHighestBidInfo(data[0]);
      } else {
        setHighestBidInfo({ amount: product.harga_awal, profiles: null });
      }
    } catch (err) {
      console.error('Error fetching bids:', err.message);
      setHighestBidInfo({ amount: product.harga_awal, profiles: null });
    }
  };

  const formatDateId = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\./g, ':');
  };

  const formatRupiah = (angka) => {
    if (!angka) return 'Rp 0';
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // --- Logika Filter & Sorting Dinamis ---
  let resultProducts = activeTab === 'Semua'
    ? products
    : products.filter(p => (p.kategori)?.toLowerCase() === activeTab.toLowerCase());

  // 1. Filter Pencarian (Search text)
  resultProducts = resultProducts.filter(p =>
    (p.nama_produk || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.kategori || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.lokasi || '').toLowerCase().includes(query.toLowerCase())
  );

  // 2. Filter Status
  if (statusFilter !== 'Semua') {
    resultProducts = resultProducts.filter(p => 
      (p.status || 'aktif').toLowerCase() === statusFilter.toLowerCase()
    );
  }

  // 3. Sorting (Terbaru / Terlama)
  const filteredProducts = resultProducts.sort((a, b) => {
    const dateA = new Date(a.created_at || a.waktu_mulai);
    const dateB = new Date(b.created_at || b.waktu_mulai);
    
    return sortOrder === 'terbaru' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="admin-produk-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Daftar Lelang</h1>
        <div className="admin-page-actions" style={{ alignItems: 'center' }}>
          <div className="tabs-container" style={{ margin: 0, gap: '0.5rem' }}>
            {['Semua', 'Seni', 'Hobi', 'Elektronik'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`btn-admin-outline ${activeTab === tab ? 'active-tab' : ''}`}
                style={{
                  background: activeTab === tab ? '#4F46E5' : 'white',
                  color: activeTab === tab ? 'white' : '#374151',
                  border: activeTab === tab ? '1px solid #4F46E5' : '1px solid #D1D5DB'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <Link href="/admin/produk/terhapus" className="btn-admin-outline" style={{ marginLeft: '1rem' }}>
            <i className="ph ph-archive-box"></i> Produk Terhapus
          </Link>
        </div>
      </div>

      {/* --- KONTROL FILTER & SORT BARU --- */}
      <div className="filter-controls" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#FFF', color: '#374151', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: '160px' }}
        >
          <option value="Semua">Semua Status</option>
          <option value="menunggu">Menunggu</option>
          <option value="aktif">Aktif</option>
          <option value="selesai">Selesai</option>
          <option value="dibatalkan">Dibatalkan</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#FFF', color: '#374151', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: '180px' }}
        >
          <option value="terbaru">Ditambahkan Terbaru</option>
          <option value="terlama">Ditambahkan Terlama</option>
        </select>
      </div>

      <div className="admin-products-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <>
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.25rem', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ width: '200px', height: '16px', borderRadius: '4px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                  <div style={{ width: '150px', height: '12px', borderRadius: '4px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                </div>
              </div>
            ))}
          </>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            Tidak ada produk lelang{query ? ' yang cocok dengan pencarian' : ''}.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="admin-product-card" onClick={() => openDetailModal(product)} style={{
              display: 'flex', alignItems: 'center', background: '#FFFFFF',
              border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.25rem', gap: '1rem', cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <div className="product-icon" style={{
                width: '48px', height: '48px', borderRadius: '8px', border: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#6B7280', overflow: 'hidden'
              }}>
                {product.image_urls && product.image_urls.length > 0 ? (
                  <img src={product.image_urls[0]} alt="Produk" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <i className="ph ph-package"></i>
                )}
              </div>
              <div className="product-info" style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                  {product.nama_produk || '-'}
                </h3>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#6B7280' }}>
                  {product.kategori || '-'} - {product.lokasi || '-'}
                </p>
                <div style={{ color: '#4F46E5', fontWeight: 600, fontSize: '0.9rem' }}>
                  {formatRupiah(product.harga_awal || 0)}
                </div>
              </div>
              <div className="product-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={(e) => e.stopPropagation()}>
                <span className="admin-badge" style={{
                  background: (product.status?.toLowerCase() === 'selesai') ? '#E5E7EB' : 
                              (product.status?.toLowerCase() === 'menunggu') ? '#FEF3C7' : 
                              (product.status?.toLowerCase() === 'dibatalkan') ? '#FEE2E2' : '#EEF2FF',
                  color: (product.status?.toLowerCase() === 'selesai') ? '#4B5563' : 
                         (product.status?.toLowerCase() === 'menunggu') ? '#92400E' : 
                         (product.status?.toLowerCase() === 'dibatalkan') ? '#991B1B' : '#4F46E5',
                  padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600'
                }}>
                  {(product.status || 'aktif').toUpperCase()}
                </span>
                <button className="admin-action-btn" onClick={() => router.push(`/admin/produk/edit/${product.id}`)} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.4rem', color: '#374151' }}>
                  <i className="ph ph-pencil-simple"></i>
                </button>
                <button className="admin-action-btn" onClick={() => handleDelete(product.id)} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.4rem', color: '#374151' }}>
                  <i className="ph ph-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Produk Modal */}
      {mounted && createPortal(
        <div className={`admin-modal-overlay ${isDetailModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target.classList.contains('admin-modal-overlay')) setIsDetailModalOpen(false) }}>
          <div className="admin-modal modal-large">
            <button className="admin-modal-close" onClick={() => setIsDetailModalOpen(false)} style={{ right: '1.5rem' }}>
              <i className="ph ph-x" style={{ background: '#F3F4F6', padding: '0.4rem', borderRadius: '8px', fontSize: '1rem' }}></i>
            </button>
            {selectedProduct && (
              <button className="admin-modal-close" onClick={() => router.push(`/admin/produk/edit/${selectedProduct.id}`)} style={{ right: '4rem' }}>
                <i className="ph ph-pencil-simple" style={{ background: '#F3F4F6', padding: '0.4rem', borderRadius: '8px', fontSize: '1rem' }}></i>
              </button>
            )}

            {selectedProduct && (
              <div className="product-detail-layout">
                <div className="product-detail-left">
                  <div className="product-id-badge">
                    <i className="ph ph-package"></i> ID PRODUK : {selectedProduct.id.substring(0, 5).toUpperCase()}
                  </div>
                  <h2 className="product-detail-title">{selectedProduct.nama_produk || '-'}</h2>
                  <div className="product-detail-img-box">
                    <img
                      src={activeImageUrl || "/assets/placeholder.png"}
                      alt={selectedProduct.nama_produk || 'Produk'}
                      style={{ height: '300px', width: '100%', objectFit: 'cover', borderRadius: '8px', transition: 'all 0.3s ease' }}
                    />
                  </div>
                  {/* Galeri Mini */}
                  {selectedProduct.image_urls && selectedProduct.image_urls.length > 1 && (
                    <div className="product-detail-gallery" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {selectedProduct.image_urls.map((url, i) => (
                        <img 
                          key={i} 
                          src={url} 
                          alt={`Foto ${i + 1}`} 
                          onClick={() => setActiveImageUrl(url)}
                          style={{ 
                            height: '60px', width: '60px', objectFit: 'cover', borderRadius: '6px', 
                            border: activeImageUrl === url ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                            cursor: 'pointer', opacity: activeImageUrl === url ? 1 : 0.6,
                            transition: 'all 0.2s ease'
                          }} 
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="product-detail-right" style={{ marginTop: '3.5rem' }}>
                  <div className="detail-item">
                    <label>STATUS LELANG</label>
                    <span className="admin-badge" style={{ display: 'inline-block', width: 'max-content', background: '#EEF2FF', color: '#4F46E5', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {(selectedProduct.status || 'aktif').toUpperCase()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>KATEGORI</label>
                    <span>{selectedProduct.kategori || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>PENJUAL/PEMILIK</label>
                    <span>{selectedProduct.profiles?.full_name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>MODEL</label>
                    <span>{selectedProduct.model || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>KONDISI BARANG</label>
                    <span>{selectedProduct.kondisi_fisik || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>LOKASI BARANG</label>
                    <span>{selectedProduct.lokasi || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>MERK</label>
                    <span>{selectedProduct.merk || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>TAHUN PRODUKSI</label>
                    <span>{selectedProduct.tahun_produksi || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>WAKTU MULAI</label>
                    <span>{formatDateId(selectedProduct.waktu_mulai)}</span>
                  </div>
                  <div className="detail-item">
                    <label>WAKTU SELESAI</label>
                    <span>{formatDateId(selectedProduct.waktu_selesai)}</span>
                  </div>
                  
                  {/* Container for prices */}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <div className="harga-terakhir-box" style={{ flex: 1, margin: 0 }}>
                      <label>HARGA AWAL</label>
                      <span>{formatRupiah(selectedProduct.harga_awal || 0)}</span>
                    </div>
                    <div className="harga-terakhir-box" style={{ flex: 1, margin: 0, background: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE' }}>
                      <label style={{ color: '#4F46E5' }}>HARGA SAAT INI</label>
                      <span>{highestBidInfo ? formatRupiah(highestBidInfo.amount) : 'Memuat...'}</span>
                    </div>
                  </div>

                  {/* Pemenang / Penawar Tertinggi */}
                  <div className="detail-item" style={{ gridColumn: '1 / -1', background: '#F9FAFB', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E5E7EB', marginTop: '0.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#6B7280' }}>
                      {selectedProduct.status?.toLowerCase() === 'selesai' ? 'PEMENANG LELANG' : 'PENAWAR TERTINGGI'}
                    </label>
                    <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '1rem' }}>
                      {highestBidInfo && highestBidInfo.profiles ? (
                        `${highestBidInfo.profiles.full_name || '-'} (@${highestBidInfo.profiles.username || '-'})`
                      ) : (
                        highestBidInfo ? 'Belum ada penawaran' : 'Memuat...'
                      )}
                    </span>
                  </div>

                  <div style={{ gridColumn: '1 / -1', marginTop: 'auto', paddingTop: '1rem' }}>
                    <button className="btn-tutup-detail" onClick={() => setIsDetailModalOpen(false)}>Tutup Detail</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function AdminProdukPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminProdukContent />
    </Suspense>
  );
}