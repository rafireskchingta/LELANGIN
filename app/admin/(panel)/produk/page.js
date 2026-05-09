'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../src/lib/supabase';

export default function AdminProdukPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching products from Supabase:', error.message);
      }
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
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

  const openDetailModal = (product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const formatRupiah = (angka) => {
    if (!angka) return 'Rp 0';
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const filteredProducts = activeTab === 'Semua' 
    ? products 
    : products.filter(p => (p.kategori || p.category)?.toLowerCase() === activeTab.toLowerCase());

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

      <div className="admin-products-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Memuat produk...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            Tidak ada produk lelang.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="admin-product-card" onClick={() => openDetailModal(product)} style={{
              display: 'flex', alignItems: 'center', background: '#FFFFFF', 
              border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.25rem', gap: '1rem', cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <div className="product-icon" style={{
                width: '48px', height: '48px', borderRadius: '8px', border: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#6B7280'
              }}>
                <i className="ph ph-package"></i>
              </div>
              <div className="product-info" style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                  {product.nama || product.name || 'Nama Produk'}
                </h3>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#6B7280' }}>
                  {product.kategori || product.category || 'Kategori'} - {product.lokasi || product.location || 'Lokasi'}
                </p>
                <div style={{ color: '#4F46E5', fontWeight: 600, fontSize: '0.9rem' }}>
                  {formatRupiah(product.harga_awal || product.price || 0)}
                </div>
              </div>
              <div className="product-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={(e) => e.stopPropagation()}>
                <span className="admin-badge" style={{
                  background: (product.status?.toLowerCase() === 'selesai' || product.status?.toLowerCase() === 'selesai') ? '#E5E7EB' : '#EEF2FF',
                  color: (product.status?.toLowerCase() === 'selesai' || product.status?.toLowerCase() === 'selesai') ? '#4B5563' : '#4F46E5'
                }}>
                  {product.status || 'AKTIF'}
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
      <div className={`admin-modal-overlay ${isDetailModalOpen ? 'active' : ''}`} onClick={(e) => { if(e.target.classList.contains('admin-modal-overlay')) setIsDetailModalOpen(false) }}>
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
                <h2 className="product-detail-title">{selectedProduct.nama || selectedProduct.name || 'Nama Produk'}</h2>
                <div className="product-detail-img-box">
                  <img src={selectedProduct.image_url || "/assets/washer.png"} alt={selectedProduct.nama || 'Produk'} style={{ height: '300px', objectFit: 'cover' }} />
                </div>
              </div>
              
              <div className="product-detail-right" style={{ marginTop: '3.5rem' }}>
                <div className="detail-item">
                  <label>STATUS LELANG</label>
                  <span className="admin-badge" style={{ display: 'inline-block', width: 'max-content', background: '#EEF2FF', color: '#4F46E5', fontSize: '0.75rem', marginTop: '0.25rem' }}>{selectedProduct.status || 'AKTIF'}</span>
                </div>
                <div className="detail-item">
                  <label>KATEGORI</label>
                  <span>{selectedProduct.kategori || selectedProduct.category || '-'}</span>
                </div>
                
                <div className="detail-item">
                  <label>PENJUAL/PEMILIK</label>
                  <span>{selectedProduct.penjual_nama || 'Bagas Aksara'}</span>
                </div>
                <div className="detail-item">
                  <label>MODEL</label>
                  <span>{selectedProduct.model || '-'}</span>
                </div>

                <div className="detail-item">
                  <label>KONDISI BARANG</label>
                  <span>{selectedProduct.kondisi_fisik || 'Bekas - Mulus'}</span>
                </div>
                <div className="detail-item">
                  <label>LOKASI BARANG</label>
                  <span>{selectedProduct.lokasi || selectedProduct.location || '-'}</span>
                </div>

                <div className="detail-item">
                  <label>MERK</label>
                  <span>{selectedProduct.merk || 'Apple'}</span>
                </div>
                <div className="detail-item">
                  <label>TAHUN PRODUKSI</label>
                  <span>{selectedProduct.tahun_produksi || '2021'}</span>
                </div>

                <div className="detail-item">
                  <label>WAKTU MULAI</label>
                  <span>{selectedProduct.waktu_mulai ? new Date(selectedProduct.waktu_mulai).toLocaleString() : '2023-12-23 10:00'}</span>
                </div>
                <div className="detail-item">
                  <label>WAKTU SELESAI</label>
                  <span>{selectedProduct.waktu_selesai ? new Date(selectedProduct.waktu_selesai).toLocaleString() : '2023-12-23 11:00'}</span>
                </div>

                <div className="harga-terakhir-box">
                  <label>HARGA TERAKHIR</label>
                  <span>{formatRupiah(selectedProduct.harga_awal || selectedProduct.price || 0)}</span>
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: 'auto' }}>
                  <button className="btn-tutup-detail" onClick={() => setIsDetailModalOpen(false)}>Tutup Detail</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
