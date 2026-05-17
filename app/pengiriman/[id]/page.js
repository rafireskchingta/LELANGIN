'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchProductDetail } from '../../../src/services/productService';
import { supabase } from '../../../src/lib/supabase';
import { useAdminGuard } from '../../../src/hooks/useAdminGuard';

export default function PengirimanPage() {
  useAdminGuard();
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [address, setAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hitung estimasi pengiriman dinamis: 5–7 hari dari sekarang
  const getEstimasiPengiriman = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 5);
    const end = new Date(today);
    end.setDate(today.getDate() + 7);

    const opts = { day: 'numeric', month: 'long', year: 'numeric' };
    const locale = 'id-ID';

    // Jika bulan sama, tampilkan "5 - 7 Mei 2026"
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.toLocaleDateString(locale, opts)}`;
    }
    // Beda bulan: "30 April - 2 Mei 2026"
    return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString(locale, opts)}`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const productData = await fetchProductDetail(productId);
        setProduct(productData);

        // Ambil data alamat dari localStorage
        const savedAddress = localStorage.getItem(`address_${productId}`);
        if (savedAddress) {
          setAddress(JSON.parse(savedAddress));
        } else {
          // Jika belum isi alamat, arahkan balik ke halaman detail
          router.push(`/jelajahi/${productId}`);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      loadData();
    }
  }, [productId, router]);

  const formatCurrency = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User tidak ditemukan. Silakan login ulang.');

      console.log('[Pengiriman] User ID:', user.id, '| Product ID:', productId);

      // Cari transaksi yang berhubungan dengan produk dan user ini
      const { data: trxList, error: trxError } = await supabase
        .from('transactions')
        .select('id, status_transaksi')
        .eq('product_id', productId)
        .eq('winner_id', user.id);

      console.log('[Pengiriman] Transaksi ditemukan:', trxList, '| Error:', trxError);

      if (trxError) throw new Error('Gagal query transaksi: ' + trxError.message);
      if (!trxList || trxList.length === 0) {
        throw new Error('Transaksi tidak ditemukan. Pastikan pembayaran sudah dikonfirmasi terlebih dahulu.');
      }

      const trx = trxList[0];

      // Update transaksi dengan setiap field alamat ke kolom masing-masing
      const { error: updateError, data: updateData } = await supabase
        .from('transactions')
        .update({
          recipient_name: address.namaLengkap || null,
          phone_number: address.nomorTelp || null,
          kota: address.kota || null,
          kecamatan: address.kecamatan || null,
          alamat_lengkap: address.alamatLengkap || null,
          kode_pos: address.kodePos || null,
          detail_lainnya: address.detailLainnya || null,
          status_transaksi: 'dikirim',
        })
        .eq('id', trx.id)
        .select();

      console.log('[Pengiriman] Hasil update:', updateData, '| Error:', updateError);

      if (updateError) {
        // Fallback: kalau ada kolom yang tidak ada, coba hanya update status
        console.warn('[Pengiriman] Error update lengkap, coba minimal:', updateError.message);
        const { error: minimalError } = await supabase
          .from('transactions')
          .update({
            phone_number: address.nomorTelp || null,
            kota: address.kota || null,
            alamat_lengkap: address.alamatLengkap || null,
            kode_pos: address.kodePos || null,
            status_transaksi: 'dikirim',
          })
          .eq('id', trx.id);
        if (minimalError) throw new Error('Gagal update: ' + minimalError.message);
      }

      // Bersihkan localStorage
      localStorage.removeItem(`address_${productId}`);
      localStorage.removeItem(`paid_${productId}`);

      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Pengiriman berhasil dikonfirmasi! Pesanan Anda sedang diproses.', 'success');
      }

      setTimeout(() => {
        router.push('/status-lelang');
      }, 1500);

    } catch (error) {
      console.error('[Pengiriman] ERROR:', error.message);
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Gagal: ' + error.message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <main className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat data pengiriman...</main>;
  }

  if (!product || !address) {
    return <main className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Data tidak lengkap.</main>;
  }

  const productPrice = product.bids && product.bids.length > 0 ? product.bids[0].amount : product.harga_awal;
  const shippingCost = 15000;
  const totalCost = productPrice + shippingCost;
  const estimasiTiba = getEstimasiPengiriman();

  return (
    <main className="page-container" style={{ padding: '2rem 5%', minHeight: '80vh', background: '#F9FAFB' }}>
      <h1 style={{ color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '1.5rem' }}>
        <i className="ph-bold ph-package"></i> Alamat Pengiriman
      </h1>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{address.namaLengkap}</h3>
            <p style={{ margin: 0, color: '#6B7280', fontWeight: '500' }}>(+62) {address.nomorTelp}</p>
          </div>
          <div>
            <p style={{ margin: 0, color: '#4B5563', lineHeight: '1.5' }}>
              {address.alamatLengkap}, {address.detailLainnya ? `(${address.detailLainnya})` : ''} <br/>
              {address.kecamatan}, {address.kota}, {address.kodePos}
            </p>
          </div>
        </div>
        <button onClick={() => router.push(`/jelajahi/${productId}`)} style={{ color: '#4F46E5', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Ubah</button>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>Produk Dipesan</th>
              <th style={{ paddingBottom: '1rem', fontWeight: 600 }}>Harga</th>
              <th style={{ paddingBottom: '1rem', fontWeight: 600, textAlign: 'center' }}>Jumlah</th>
              <th style={{ paddingBottom: '1rem', fontWeight: 600, textAlign: 'right' }}>Subtotal Produk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ paddingTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={product.image_urls?.[0] || '/assets/placeholder.png'} alt={product.nama_produk} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#111827' }}>{product.nama_produk}</h4>
                  <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>{product.lokasi}</span>
                </div>
              </td>
              <td style={{ paddingTop: '1.5rem', color: '#4B5563', fontWeight: 500 }}>Rp {formatCurrency(productPrice)}</td>
              <td style={{ paddingTop: '1.5rem', color: '#4B5563', textAlign: 'center', fontWeight: 500 }}>1</td>
              <td style={{ paddingTop: '1.5rem', color: '#111827', textAlign: 'right', fontWeight: 'bold' }}>Rp {formatCurrency(productPrice)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Opsi Pengiriman : <span style={{ fontWeight: 600 }}>Hemat Kargo</span></h3>
            {/* ESTIMASI DINAMIS: 5-7 hari dari sekarang */}
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>Estimasi Tiba {estimasiTiba}</p>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            Rp {formatCurrency(shippingCost)}
          </div>
        </div>
        <div style={{ borderTop: '1px dashed #E5E7EB', marginTop: '1.5rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#6B7280' }}>Total Pesanan :</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>Rp {formatCurrency(totalCost)}</span>
        </div>
      </div>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0 }}>Metode Pembayaran</h3>
          <span style={{ padding: '0.25rem 0.75rem', background: '#F3F4F6', color: '#374151', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #D1D5DB' }}>Transfer Bank</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#4B5563' }}>
              <span>Subtotal Pesanan :</span>
              <span>Rp {formatCurrency(productPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: '#4B5563' }}>
              <span>Subtotal Pengiriman :</span>
              <span>Rp {formatCurrency(shippingCost)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
              <span style={{ color: '#111827', fontWeight: 600 }}>Total Pembayaran :</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4F46E5' }}>Rp {formatCurrency(totalCost)}</span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '1rem', background: isSubmitting ? '#A5B4FC' : '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'background 0.3s' }}
              onMouseOver={(e) => { if (!isSubmitting) e.currentTarget.style.background = '#4338CA'; }}
              onMouseOut={(e) => { if (!isSubmitting) e.currentTarget.style.background = '#4F46E5'; }}
            >
              {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Pengiriman'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
