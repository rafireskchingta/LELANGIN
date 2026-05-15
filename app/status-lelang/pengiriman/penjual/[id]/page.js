'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../../../src/lib/supabase';
import { fetchProductDetail, fetchTransaction, updateTransactionStatus, generateResi } from '../../../../../src/services/productService';

export default function PengirimanPenjualPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (productId) {
        const productData = await fetchProductDetail(productId);
        setProduct(productData);

        const trxData = await fetchTransaction(productId);
        setTransaction(trxData);
      }
      setIsLoading(false);
    };
    loadData();
  }, [productId]);

  const handleConfirmShipping = async () => {
    if (!transaction) {
      alert('Data alamat pembeli belum lengkap.');
      return;
    }

    setIsSubmitting(true);
    try {
      const autoResi = generateResi();
      const success = await updateTransactionStatus(transaction.id, {
        status_transaksi: 'dikirim', // Sesuai enum Anda
        nomor_resi: autoResi,
        kurir: 'Internal Lelangin Express'
      });

      if (success) {
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast('Barang berhasil dikirim! Resi otomatis dibuat.', 'success');
        }
        router.push('/status-lelang?role=penjual&tab=Selesai');
      }
    } catch (error) {
      console.error('Error updating shipping:', error);
      alert('Gagal mengonfirmasi pengiriman.');
    }
    setIsSubmitting(false);
  };

  if (isLoading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Memuat data pengiriman...</div>;
  if (!product) return <div style={{ padding: '4rem', textAlign: 'center' }}>Produk tidak ditemukan.</div>;

  return (
    <main className="page-container" style={{ padding: '2rem 5%', maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => router.back()}
        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}
      >
        <i className="ph ph-arrow-left"></i> Kembali
      </button>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Proses Pengiriman Barang</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Anda akan mengirim produk <strong>{product.nama_produk}</strong></p>

        {!transaction || !transaction.alamat_lengkap ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FCA5A5' }}>
            <i className="ph ph-warning-circle" style={{ fontSize: '2.5rem', color: '#DC2626', marginBottom: '1rem' }}></i>
            <p style={{ fontWeight: 600, color: '#991B1B' }}>Pembeli Belum Mengisi Alamat</p>
            <p style={{ fontSize: '0.9rem', color: '#B91C1C' }}>Anda baru bisa memproses pengiriman setelah pembeli melengkapi data alamat pengirimannya.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {/* Kartu Alamat Tujuan */}
            <div style={{ padding: '1.5rem', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="ph-fill ph-map-pin" style={{ color: 'var(--primary)' }}></i> Alamat Tujuan Pengiriman
              </h3>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.95rem' }}>
                <p><strong>Nama:</strong> {transaction.recipient_name}</p>
                <p><strong>Telepon:</strong> {transaction.phone_number}</p>
                <p><strong>Provinsi:</strong> {transaction.provinsi}</p>
                <p><strong>Kota:</strong> {transaction.kota}</p>
                <p><strong>Alamat:</strong> {transaction.alamat_lengkap}</p>
                <p><strong>Kode Pos:</strong> {transaction.kode_pos}</p>
                {transaction.detail_lainnya && <p><strong>Catatan:</strong> {transaction.detail_lainnya}</p>}
              </div>
            </div>

            {/* Info Produk */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
              <img src={product.image_urls?.[0] || '/assets/placeholder.png'} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} alt="" />
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>{product.nama_produk}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, margin: 0 }}>Total Terbayar: Rp {product.current_price?.toLocaleString('id-ID')}</p>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#4B5563', marginBottom: '1rem', textAlign: 'center' }}>
                <i className="ph ph-info"></i> Dengan menekan tombol di bawah, sistem akan **otomatis membuatkan nomor resi** dan memberitahu pembeli bahwa barang sedang dikirim.
              </p>
              <button
                onClick={handleConfirmShipping} disabled={isSubmitting}
                style={{
                  width: '100%', padding: '1.25rem', borderRadius: '999px', border: 'none',
                  background: '#10B981', color: 'white', fontWeight: 800, fontSize: '1.1rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)', transition: 'all 0.3s'
                }}
              >
                {isSubmitting ? 'Memproses...' : 'Konfirmasi & Kirim Barang'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
