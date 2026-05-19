'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { supabase } from '../../../../../src/lib/supabase';

export default function AdminProdukTerhapusPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [productToRestore, setProductToRestore] = useState(null);
  
  const [isPermanentDeleteModalOpen, setIsPermanentDeleteModalOpen] = useState(false);
  const [productToDeletePermanent, setProductToDeletePermanent] = useState(null);

  useEffect(() => {
    setMounted(true);
    fetchDeletedProducts();
  }, []);

  const fetchDeletedProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.warn('Error fetching deleted products:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreClick = (product) => {
    setProductToRestore(product);
    setIsRestoreModalOpen(true);
  };

  const confirmRestore = async () => {
    if (!productToRestore) return;
    const targetId = typeof productToRestore === 'object' ? productToRestore.id : productToRestore;
    try {
      const { error } = await supabase
        .from('products')
        .update({ deleted_at: null })
        .eq('id', targetId);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== targetId));
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Produk berhasil dikembalikan.', 'success');
      } else {
        alert('Produk berhasil dikembalikan.');
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Gagal mengembalikan produk: ' + error.message, 'error');
      } else {
        alert('Gagal mengembalikan produk: ' + error.message);
      }
    } finally {
      setIsRestoreModalOpen(false);
      setProductToRestore(null);
    }
  };

  const handlePermanentDeleteClick = (product) => {
    setProductToDeletePermanent(product);
    setIsPermanentDeleteModalOpen(true);
  };

  const confirmPermanentDelete = async () => {
    if (!productToDeletePermanent) return;
    const targetId = typeof productToDeletePermanent === 'object' ? productToDeletePermanent.id : productToDeletePermanent;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', targetId);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== targetId));
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Produk berhasil dihapus permanen.', 'success');
      } else {
        alert('Produk berhasil dihapus permanen.');
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Gagal menghapus permanen: ' + error.message, 'error');
      } else {
        alert('Gagal menghapus permanen: ' + error.message);
      }
    } finally {
      setIsPermanentDeleteModalOpen(false);
      setProductToDeletePermanent(null);
    }
  };

  return (
    <div className="admin-produk-terhapus-page">
      <div className="admin-page-header">
        <div>
          <div className="admin-header-with-back">
            <Link href="/admin/produk" className="admin-back-link">
              <i className="ph ph-arrow-left"></i>
            </Link>
            <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Produk Terhapus</h1>
          </div>
          <span className="admin-subtitle" style={{ marginLeft: '56px', textDecoration: 'none', color: '#6B7280' }}>
            Riwayat barang lelang yang telah dihapus atau dibatalkan.
          </span>
        </div>
      </div>

      <div className="admin-products-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Memuat produk...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            Tidak ada produk yang terhapus.
          </div>
        ) : (
          products.map((product) => {
            const deletedDate = product.deleted_at 
              ? new Date(product.deleted_at).toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':')
              : '-';

            return (
              <div key={product.id} className="admin-product-card" style={{
                display: 'flex', alignItems: 'center', background: '#FFFFFF', 
                border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.25rem', gap: '1rem'
              }}>
                <div className="product-icon" style={{
                  width: '48px', height: '48px', borderRadius: '8px', background: '#FEE2E2', border: '1px solid #FECACA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#EF4444', overflow: 'hidden'
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
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#4F46E5', fontWeight: 500 }}>
                    {product.kategori || '-'} - {product.lokasi || '-'}
                  </p>
                  <div style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.75rem' }}>
                    Dihapus pada {deletedDate}
                  </div>
                </div>
                <div className="product-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button className="admin-badge-blue-text" onClick={() => handleRestoreClick(product)}>Kembalikan</button>
                  <button className="admin-badge-red-text" onClick={() => handlePermanentDeleteClick(product)}>Hapus Permanen</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {mounted && createPortal(
        <div className={`admin-modal-overlay ${isRestoreModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target.classList.contains('admin-modal-overlay')) setIsRestoreModalOpen(false) }}>
          <div className="admin-modal" style={{ maxWidth: '420px', padding: '2rem 2rem' }}>
            <button className="admin-modal-close" onClick={() => setIsRestoreModalOpen(false)} style={{ right: '1.5rem', top: '1.5rem' }}>
              <i className="ph ph-x" style={{ fontSize: '1.25rem', color: '#6B7280' }}></i>
            </button>
            <h2 style={{ color: '#059669', fontSize: '1.35rem', marginBottom: '0.75rem', fontWeight: '800', textAlign: 'left' }}>
              Kembalikan Produk?
            </h2>
            <p style={{ color: '#4B5563', marginBottom: '2rem', lineHeight: '1.6', fontSize: '0.95rem', textAlign: 'left', fontWeight: '500' }}>
              Produk <strong style={{ color: '#374151' }}>{typeof productToRestore === 'object' ? (productToRestore?.nama_produk || productToRestore?.nama || productToRestore?.name) : products.find(p => p.id === productToRestore)?.nama_produk}</strong> akan dikembalikan ke daftar produk aktif dan dapat diakses kembali.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setIsRestoreModalOpen(false)}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '9999px', border: 'none', background: '#F3F4F6', color: '#1F2937', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Kembali
              </button>
              <button 
                onClick={confirmRestore}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '9999px', border: 'none', background: '#D1FAE5', color: '#059669', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Ya, Kembalikan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Permanent Delete Confirmation Modal */}
      {mounted && createPortal(
        <div className={`admin-modal-overlay ${isPermanentDeleteModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target.classList.contains('admin-modal-overlay')) setIsPermanentDeleteModalOpen(false) }}>
          <div className="admin-modal" style={{ maxWidth: '420px', padding: '2rem 2rem' }}>
            <button className="admin-modal-close" onClick={() => setIsPermanentDeleteModalOpen(false)} style={{ right: '1.5rem', top: '1.5rem' }}>
              <i className="ph ph-x" style={{ fontSize: '1.25rem', color: '#6B7280' }}></i>
            </button>
            <h2 style={{ color: '#EF4444', fontSize: '1.35rem', marginBottom: '0.75rem', fontWeight: '800', textAlign: 'left' }}>
              Hapus Permanen Produk?
            </h2>
            <p style={{ color: '#4B5563', marginBottom: '2rem', lineHeight: '1.6', fontSize: '0.95rem', textAlign: 'left', fontWeight: '500' }}>
              Data produk <strong style={{ color: '#374151' }}>{typeof productToDeletePermanent === 'object' ? (productToDeletePermanent?.nama_produk || productToDeletePermanent?.nama || productToDeletePermanent?.name) : products.find(p => p.id === productToDeletePermanent)?.nama_produk}</strong> akan dihapus secara permanen dan <strong style={{ color: '#EF4444' }}>tidak dapat dikembalikan</strong>. Pastikan Anda yakin sebelum melanjutkan.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setIsPermanentDeleteModalOpen(false)}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '9999px', border: 'none', background: '#F3F4F6', color: '#1F2937', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Kembali
              </button>
              <button 
                onClick={confirmPermanentDelete}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '9999px', border: 'none', background: '#FEE2E2', color: '#EF4444', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
