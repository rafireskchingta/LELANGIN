'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../../src/lib/supabase';
import { fetchProductDetail, upsertTransaction } from '../../../../src/services/productService';

export default function PembayaranPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    recipient_name: '',
    phone_number: '',
    provinsi: '',
    kota: '',
    alamat_lengkap: '',
    kode_pos: '',
    detail_lainnya: ''
  });

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (productId) {
        const productData = await fetchProductDetail(productId);
        setProduct(productData);

        // Cek jika sudah ada transaksi sebelumnya
        const { data: existingTrx } = await supabase
          .from('transactions')
          .select('*')
          .eq('product_id', productId)
          .maybeSingle();

        if (existingTrx) {
          setFormData({
            recipient_name: existingTrx.recipient_name || '',
            phone_number: existingTrx.phone_number || '',
            provinsi: existingTrx.provinsi || '',
            kota: existingTrx.kota || '',
            alamat_lengkap: existingTrx.alamat_lengkap || '',
            kode_pos: existingTrx.kode_pos || '',
            detail_lainnya: existingTrx.detail_lainnya || ''
          });
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, [productId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !product) return;

    setIsSubmitting(true);
    try {
      const trxData = {
        product_id: productId,
        winner_id: currentUser.id,
        ...formData,
        status_transaksi: 'menunggu_pembayaran', // Sesuai enum Anda
        updated_at: new Date().toISOString()
      };

      const result = await upsertTransaction(trxData);

      if (result) {
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast('Alamat berhasil disimpan! Silakan lakukan pembayaran.', 'success');
        }
        router.push('/status-lelang?tab=Menang Lelang');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Gagal menyimpan data. Pastikan semua kolom terisi dengan benar.');
    }
    setIsSubmitting(false);
  };

  if (isLoading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Memuat data lelang...</div>;
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Konfirmasi Pengiriman & Pembayaran</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Silakan lengkapi alamat pengiriman untuk produk <strong>{product.nama_produk}</strong></p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nama Penerima</label>
              <input
                type="text" name="recipient_name" value={formData.recipient_name} onChange={handleInputChange}
                placeholder="Nama Lengkap" required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nomor Telepon</label>
              <input
                type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange}
                placeholder="Contoh: 0812xxxx" required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Provinsi (Pulau Jawa)</label>
              <select
                name="provinsi" value={formData.provinsi} onChange={handleInputChange} required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', background: 'white' }}
              >
                <option value="">Pilih Provinsi</option>
                <option value="DKI Jakarta">DKI Jakarta</option>
                <option value="Banten">Banten</option>
                <option value="Jawa Barat">Jawa Barat</option>
                <option value="Jawa Tengah">Jawa Tengah</option>
                <option value="DI Yogyakarta">DI Yogyakarta</option>
                <option value="Jawa Timur">Jawa Timur</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Kota/Kabupaten</label>
              <input
                type="text" name="kota" value={formData.kota} onChange={handleInputChange}
                placeholder="Masukkan Nama Kota" required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Alamat Lengkap</label>
            <textarea
              name="alamat_lengkap" value={formData.alamat_lengkap} onChange={handleInputChange}
              placeholder="Nama jalan, nomor rumah, RT/RW, Kecamatan" required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', minHeight: '100px', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Kode Pos</label>
              <input
                type="number" name="kode_pos" value={formData.kode_pos} onChange={handleInputChange}
                placeholder="Contoh: 12345" required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Catatan Tambahan (Opsional)</label>
              <input
                type="text" name="detail_lainnya" value={formData.detail_lainnya} onChange={handleInputChange}
                placeholder="Warna pagar, patokan, dll"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', background: '#F9FAFB', borderRadius: '12px', border: '1px dashed #D1D5DB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Total Tagihan:</span>
              <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.2rem' }}>Rp {product.current_price?.toLocaleString('id-ID')}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>*Pembayaran dapat dilakukan melalui Transfer Bank/E-Wallet setelah alamat disimpan.</p>
          </div>

          <button
            type="submit" disabled={isSubmitting}
            style={{
              width: '100%', padding: '1rem', borderRadius: '999px', border: 'none',
              background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '1rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1,
              marginTop: '1rem', transition: 'all 0.2s'
            }}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Alamat & Lanjut'}
          </button>
        </form>
      </div>
    </main>
  );
}
