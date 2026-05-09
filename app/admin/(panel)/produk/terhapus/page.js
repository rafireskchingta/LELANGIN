'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../../src/lib/supabase';

export default function AdminProdukTerhapusPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const handleRestore = async (id) => {
    if (!confirm('Anda yakin ingin mengembalikan produk ini?')) return;
    try {
      const { error } = await supabase
        .from('products')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
      alert('Produk berhasil dikembalikan.');
    } catch (error) {
      alert('Gagal mengembalikan produk: ' + error.message);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!confirm('PERINGATAN: Tindakan ini akan menghapus produk secara permanen. Lanjutkan?')) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
      alert('Produk berhasil dihapus permanen.');
    } catch (error) {
      alert('Gagal menghapus permanen: ' + error.message);
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
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#EF4444'
                }}>
                  <i className="ph ph-package"></i>
                </div>
                <div className="product-info" style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                    {product.nama || product.name || 'Nama Produk'}
                  </h3>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#4F46E5', fontWeight: 500 }}>
                    {product.kategori || product.category || 'Kategori'} - {product.lokasi || product.location || 'Lokasi'}
                  </p>
                  <div style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.75rem' }}>
                    Dihapus pada {deletedDate}
                  </div>
                </div>
                <div className="product-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button className="admin-badge-blue-text" onClick={() => handleRestore(product.id)}>Kembalikan</button>
                  <button className="admin-badge-red-text" onClick={() => handlePermanentDelete(product.id)}>Hapus Permanen</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
