'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchProductDetail } from '../../../src/services/productService';
import { supabase } from '../../../src/lib/supabase';

export default function PembayaranPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [sellerBank, setSellerBank] = useState({
    bankName: 'Mandiri',
    accountName: 'Christian Anugrah',
    accountNumber: '4674 45452 4324 3231'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const productData = await fetchProductDetail(productId);
        setProduct(productData);
        
        if (productData && productData.seller_id) {
          // Coba cari data bank dari seller_applications
          const { data: sellerApp } = await supabase
            .from('seller_applications')
            .select('bank_name, bank_account_name, bank_account')
            .eq('user_id', productData.seller_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (sellerApp && sellerApp.bank_account) {
            setSellerBank({
              bankName: sellerApp.bank_name || 'Bank',
              accountName: sellerApp.bank_account_name || productData.profiles?.full_name || 'Penjual',
              accountNumber: sellerApp.bank_account || '0000 0000 0000'
            });
          }
        }
      } catch (error) {
        console.error('Error loading payment data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      loadData();
    }
  }, [productId]);

  const formatCurrency = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePay = () => {
    // Simpan flag pembayaran ke localStorage (dummy)
    localStorage.setItem(`paid_${productId}`, 'true');
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('Pembayaran berhasil dikonfirmasi! Silakan lanjutkan pengiriman.', 'success');
    } else {
      alert('Pembayaran berhasil dikonfirmasi!');
    }
    setTimeout(() => {
      router.push(`/jelajahi/${productId}`);
    }, 1500);
  };

  if (isLoading) {
    return <main className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat data pembayaran...</main>;
  }

  if (!product) {
    return <main className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Produk tidak ditemukan.</main>;
  }

  const productPrice = product.bids && product.bids.length > 0 ? product.bids[0].amount : product.harga_awal;
  const shippingCost = 15000;
  const totalCost = productPrice + shippingCost;

  return (
    <main className="page-container" style={{ padding: '4rem 5%', minHeight: '80vh', background: '#F9FAFB' }}>
      <h1 style={{ color: '#4F46E5', textAlign: 'center', marginBottom: '3rem', fontSize: '2rem' }}>
        Pembayaran
      </h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', alignItems: 'stretch' }}>
        
        {/* KARTU BANK */}
        <div style={{ flex: '1 1 400px', maxWidth: '500px', background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)', borderRadius: '16px', padding: '2.5rem', color: 'white', boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.4), 0 10px 10px -5px rgba(79, 70, 229, 0.2)', position: 'relative', overflow: 'hidden' }}>
          {/* Efek Lingkaran Abstrak */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>NOMOR REKENING :</p>
            <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.8rem', letterSpacing: '2px' }}>{sellerBank.accountNumber}</h2>
            
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>ATAS NAMA :</p>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem' }}>{sellerBank.accountName}</h3>
            
            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>BANK :</p>
            <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{sellerBank.bankName}</h4>
          </div>
        </div>

        {/* DETAIL PEMBAYARAN */}
        <div style={{ flex: '1 1 400px', maxWidth: '500px', background: 'white', borderRadius: '16px', padding: '2.5rem', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 2rem 0', color: '#111827', fontSize: '1.3rem' }}>Detail Pembayaran</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#4B5563', fontSize: '1.05rem' }}>
            <span>SubTotal Pesanan :</span>
            <span>Rp {formatCurrency(productPrice)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', color: '#4B5563', fontSize: '1.05rem' }}>
            <span>SubTotal Pengiriman :</span>
            <span>Rp {formatCurrency(shippingCost)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '2rem', borderTop: '1px dashed #E5E7EB', marginBottom: '2rem' }}>
            <span style={{ color: '#111827', fontWeight: 600, fontSize: '1.1rem' }}>Total Pembayaran :</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#111827' }}>Rp {formatCurrency(totalCost)}</span>
          </div>

          <button 
            onClick={handlePay}
            style={{ width: '100%', padding: '1.25rem', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'background 0.3s', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#4338CA'}
            onMouseOut={(e) => e.currentTarget.style.background = '#4F46E5'}
          >
            Bayar Sekarang
          </button>
        </div>

      </div>
    </main>
  );
}
