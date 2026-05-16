'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../../../src/lib/supabase';
import CustomSelect from '../../../../../../components/CustomSelect';

export default function AdminEditProdukPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State disesuaikan dengan DATABASE_SCHEMA
  const [formData, setFormData] = useState({
    nama_produk: '',
    merk: '',
    tahun_produksi: '',
    kategori: '',
    model: '',
    harga_awal: '',
    lokasi: '',
    status: 'aktif'
  });

  const [imageUrls, setImageUrls] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      // HAPUS FALLBACK PALSU DI SINI
      if (error) throw error;

      if (data) {
        setFormData({
          nama_produk: data.nama_produk || '',
          merk: data.merk || '',
          tahun_produksi: data.tahun_produksi || '',
          kategori: data.kategori || '',
          model: data.model || '',
          harga_awal: data.harga_awal || '',
          lokasi: data.lokasi || '',
          status: data.status || 'aktif'
        });

        if (data.image_urls && data.image_urls.length > 0) {
          setImageUrls(data.image_urls);
        }
      }
    } catch (error) {
      console.error('Error in fetch:', error.message);
      alert('Gagal mengambil data produk: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const setStatus = (status) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleImageUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `admin-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setImageUrls(prev => [...prev, publicUrl]);
    } catch (err) {
      alert('Gagal mengunggah gambar: ' + err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove) => {
    setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          nama_produk: formData.nama_produk,
          merk: formData.merk,
          tahun_produksi: formData.tahun_produksi,
          kategori: formData.kategori,
          model: formData.model,
          harga_awal: formData.harga_awal,
          lokasi: formData.lokasi,
          status: formData.status,
          image_urls: imageUrls
        })
        .eq('id', id);

      if (error) throw error;

      alert('Informasi produk berhasil diperbarui!');
      router.push('/admin/produk');
    } catch (error) {
      alert('Gagal memperbarui produk: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', margin: '2rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
        <div style={{ width: '180px', height: '14px', borderRadius: '6px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>
    );
  }

  const kategoriOptions = [
    { value: 'Elektronik', label: 'Elektronik' },
    { value: 'Seni', label: 'Seni' },
    { value: 'Hobi', label: 'Hobi' },
  ];

  const lokasiOptions = [
    { value: 'Banten', label: 'Banten' },
    { value: 'DKI Jakarta', label: 'DKI Jakarta' },
    { value: 'Jawa Barat', label: 'Jawa Barat' },
    { value: 'Jawa Tengah', label: 'Jawa Tengah' },
    { value: 'DI Yogyakarta', label: 'DI Yogyakarta' },
    { value: 'Jawa Timur', label: 'Jawa Timur' }
  ];
  return (
    <div className="admin-produk-edit-page">
      <div className="admin-page-header">
        <div className="admin-header-with-back">
          <Link href="/admin/produk" className="admin-back-link">
            <i className="ph ph-arrow-left"></i>
          </Link>
          <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Edit Produk</h1>
        </div>
      </div>

      <div className="admin-edit-produk-container">
        <div className="admin-edit-header">
          <h2>Edit Informasi Produk</h2>
          <p>Sesuaikan data lelang dan spesifikasi barang</p>
        </div>

        <div className="admin-edit-body">
          {/* Kolom Kiri: INFORMASI DASAR */}
          <div>
            <h3 className="admin-edit-section-title">INFORMASI DASAR</h3>

            <div className="form-group-edit">
              <label>NAMA PRODUK</label>
              <input type="text" name="nama_produk" value={formData.nama_produk} onChange={handleChange} />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>ID PRODUK</label>
                <input type="text" value={id.substring(0, 5).toUpperCase()} disabled />
              </div>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>KATEGORI</label>
                <CustomSelect options={kategoriOptions} value={formData.kategori} onChange={(v) => handleSelectChange('kategori', v)} placeholder="Pilih Kategori" />
              </div>
            </div>

            <div className="form-group-edit">
              <label>HARGA TERAKHIR (RP)</label>
              <input type="number" name="harga_awal" value={formData.harga_awal} onChange={handleChange} />
            </div>

            <div className="form-group-edit">
              <label>STATUS LELANG</label>
              <div className="status-lelang-group">
                <button className={`status-lelang-btn ${formData.status === 'aktif' ? 'active' : ''}`} onClick={() => setStatus('aktif')}>AKTIF</button>
                <button className={`status-lelang-btn ${formData.status === 'selesai' ? 'active' : ''}`} onClick={() => setStatus('selesai')}>SELESAI</button>
                <button className={`status-lelang-btn ${formData.status === 'dibatalkan' ? 'active' : ''}`} onClick={() => setStatus('dibatalkan')}>DIBATALKAN</button>
              </div>
            </div>

            <div className="form-group-edit" style={{ marginTop: '2rem' }}>
              <label>FOTO PRODUK</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {imageUrls.map((url, index) => (
                  <div key={index} style={{ position: 'relative', width: '150px', height: '150px' }}>
                    <img 
                      src={url || "/assets/placeholder.png"} 
                      alt={`Produk ${index+1}`} 
                      className="foto-produk-preview" 
                      style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '8px', border: '1px solid #E5E7EB' }} 
                    />
                    <button 
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute', top: '6px', right: '6px',
                        width: '24px', height: '24px', borderRadius: '50%',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', zIndex: 10
                      }}
                    >
                      <i className="ph ph-x" style={{ fontSize: '14px', fontWeight: 'bold' }}></i>
                    </button>
                  </div>
                ))}
                
                <div 
                  className="foto-produk-upload" 
                  onClick={() => !uploadingImage && fileInputRef.current?.click()}
                  style={{ 
                    width: '150px', height: '150px', display: 'flex', flexDirection: 'column', 
                    justifyContent: 'center', alignItems: 'center', cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    opacity: uploadingImage ? 0.6 : 1
                  }}
                >
                  {uploadingImage ? (
                    <>
                      <i className="ph ph-spinner" style={{ animation: 'spin 1s linear infinite' }}></i>
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <i className="ph ph-upload-simple"></i>
                      <span>Tambah Foto</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
              </div>
            </div>
          </div>

          {/* Kolom Kanan: SPESIFIKASI DETAIL */}
          <div>
            <h3 className="admin-edit-section-title">SPESIFIKASI DETAIL</h3>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>MERK</label>
                <input type="text" name="merk" value={formData.merk} onChange={handleChange} />
              </div>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>TAHUN</label>
                <input type="number" name="tahun_produksi" value={formData.tahun_produksi} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group-edit">
              <label>MODEL</label>
              <input type="text" name="model" value={formData.model} onChange={handleChange} />
            </div>

            <div className="form-group-edit">
              <label>LOKASI BARANG</label>
              <CustomSelect options={lokasiOptions} value={formData.lokasi} onChange={(v) => handleSelectChange('lokasi', v)} placeholder="Pilih Lokasi" />
            </div>

            <div className="review-data-box" style={{ marginTop: '3rem' }}>
              <h4><i className="ph-fill ph-check-circle"></i> Review Data</h4>
              <p>Pastikan informasi merk dan tahun sesuai dengan dokumen fisik barang.</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button onClick={() => router.push('/admin/produk')} style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#EEF2FF', color: '#4F46E5', fontWeight: 600, cursor: 'pointer' }}>
                Kembali
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#4F46E5', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}