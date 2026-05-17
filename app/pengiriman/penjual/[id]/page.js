'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchProductDetail } from '../../../../src/services/productService';

export default function PengirimanPenjualPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState(null);
  const [buyerAddress, setBuyerAddress] = useState(null);

  useEffect(() => {
    setMounted(true);
    
    // Fetch product details
    const loadData = async () => {
      try {
        const data = await fetchProductDetail(productId);
        setProduct(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadData();

    // Get address from localStorage
    const savedAddress = localStorage.getItem(`address_${productId}`);
    if (savedAddress) {
      try {
        setBuyerAddress(JSON.parse(savedAddress));
      } catch (e) {
        console.error('Failed to parse address', e);
      }
    }
  }, [productId]);

  const handleKirim = () => {
    // Dummy logic
    localStorage.setItem(`shipped_${productId}`, 'true');
    
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('Produk berhasil dikirim!', 'success');
    } else {
      alert('Produk berhasil dikirim!');
    }
    router.push(`/jelajahi/${productId}`);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID').format(val || 0);
  };

  if (!mounted) return null;

  const productPrice = product?.current_price || product?.harga_awal || 0;
  const shippingCost = 15000;
  const total = productPrice + shippingCost;

  return (
    <main className="page-container" style={{ padding: '2rem 5%', minHeight: '80vh', maxWidth: '1000px', margin: '0 auto', background: '#F9FAFB' }}>
      
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        
        {/* Header Alamat */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <i className="ph-fill ph-package" style={{ color: '#4F46E5', fontSize: '1.5rem' }}></i>
          <h2 style={{ margin: 0, color: '#4F46E5', fontSize: '1.3rem' }}>Alamat Pengiriman</h2>
        </div>

        {/* Detail Alamat */}
        <div style={{ padding: '2rem', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: '2rem' }}>
          <div style={{ width: '30%' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
              {buyerAddress?.namaLengkap || 'Nama Pembeli'}
            </div>
            <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>
              (+62) {buyerAddress?.nomorTelp ? buyerAddress.nomorTelp.replace(/^0/, '') : '812-3456-7890'}
            </div>
          </div>
          <div style={{ width: '70%', color: '#374151', lineHeight: '1.5' }}>
            {buyerAddress ? (
              `${buyerAddress.alamatLengkap}, ${buyerAddress.kecamatan}, ${buyerAddress.kota}, ${buyerAddress.kodePos}`
            ) : (
              'Jalan Kelapa Gang Macang, RT.3/RW.3, Desa Beruas, Kelapa (sjd), KAB. BANGKA BARAT - KELAPA, BANGKA BELITUNG, ID 33364'
            )}
          </div>
        </div>

        {/* Tabel Produk */}
        <div style={{ padding: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingBottom: '1rem', color: '#111827', fontWeight: 'bold' }}>Produk Dipesan</th>
                <th style={{ textAlign: 'right', paddingBottom: '1rem', color: '#111827', fontWeight: 'bold' }}>Harga</th>
                <th style={{ textAlign: 'center', paddingBottom: '1rem', color: '#111827', fontWeight: 'bold' }}>Jumlah</th>
                <th style={{ textAlign: 'right', paddingBottom: '1rem', color: '#111827', fontWeight: 'bold' }}>Subtotal Produk</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ paddingTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', background: '#F3F4F6', borderRadius: '8px', overflow: 'hidden' }}>
                    {product?.image_urls?.[0] ? (
                      <img src={product.image_urls[0]} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Img</div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: '0.25rem' }}>{product?.nama_produk || 'Nama Produk'}</div>
                    <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>{product?.lokasi || 'Lokasi'}</div>
                  </div>
                </td>
                <td style={{ paddingTop: '1.5rem', textAlign: 'right', color: '#374151' }}>Rp {formatCurrency(productPrice)}</td>
                <td style={{ paddingTop: '1.5rem', textAlign: 'center', color: '#374151' }}>1</td>
                <td style={{ paddingTop: '1.5rem', textAlign: 'right', color: '#374151', fontWeight: 500 }}>Rp {formatCurrency(productPrice)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Opsi Pengiriman */}
        <div style={{ padding: '2rem', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: '0.25rem' }}>Opsi Pengiriman : Hemat Kargo</div>
            <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>Estimasi Tiba 3 - 4 April 2026</div>
          </div>
          <div style={{ fontWeight: 500, color: '#111827' }}>
            Rp {formatCurrency(shippingCost)}
          </div>
        </div>

        {/* Total Pesanan */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.1rem' }}>
            <span style={{ color: '#6B7280' }}>Total Pesanan :</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827' }}>Rp {formatCurrency(total)}</span>
          </div>
          
          <button 
            onClick={handleKirim}
            style={{ padding: '0.8rem 3rem', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#4338CA'}
            onMouseOut={(e) => e.currentTarget.style.background = '#4F46E5'}
          >
            Kirim Produk
          </button>
        </div>
      </div>
    </main>
  );
}
