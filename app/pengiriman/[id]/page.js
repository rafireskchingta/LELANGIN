'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchProductDetail } from '../../../src/services/productService';

export default function PengirimanPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [address, setAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const productData = await fetchProductDetail(productId);
        setProduct(productData);
        
        // Ambil data alamat dari localStorage (dummy)
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

  const handleConfirm = () => {
    // Tampilkan pesan sukses dan arahkan ke halaman status lelang
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('Pengiriman berhasil dikonfirmasi! Pesanan Anda sedang diproses.', 'success');
    } else {
      alert('Pengiriman berhasil dikonfirmasi!');
    }
    setTimeout(() => {
      router.push('/status-lelang');
    }, 1500);
  };

  if (isLoading) {
    return <main className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat data pengiriman...</main>;
  }

  if (!product || !address) {
    return <main className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Data tidak lengkap.</main>;
  }

  // Harga tertinggi (karena dia pemenang)
  const productPrice = product.bids && product.bids.length > 0 ? product.bids[0].amount : product.harga_awal;
  const shippingCost = 15000;
  const totalCost = productPrice + shippingCost;

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
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>Estimasi Tiba 3 - 6 April 2026</p>
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
              style={{ width: '100%', padding: '1rem', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'background 0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#4338CA'}
              onMouseOut={(e) => e.currentTarget.style.background = '#4F46E5'}
            >
              Konfirmasi Pengiriman
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
