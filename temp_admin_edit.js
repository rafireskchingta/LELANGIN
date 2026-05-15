'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../../../src/lib/supabase';
import CustomDatePicker from '../../../../../../components/CustomDatePicker';
import CustomTimePicker from '../../../../../../components/CustomTimePicker';
import CustomSelect from '../../../../../../components/CustomSelect';

export default function AdminEditProdukPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nama_produk: '',
    merk: '',
    tahun_produksi: '',
    kategori: 'Elektronik',
    kondisi: 'Baru',
    model: '',
    warna: '',
    daya_listrik: '',
    kapasitas: '',
    tegangan: '',
    kondisi_fisik: '',
    kelengkapan: '',
    estetika: '',
    dokumen: '',
    kemasan: '',
    aksesoris: '',
    harga_awal: '',
    tglMulai: '',
    waktuMulai: '',
    tglSelesai: '',
    waktuSelesai: '',
    lokasi: '',
    status: 'aktif'
  });

  const [imageUrls, setImageUrls] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const formatRibuan = (val) => {
    if (!val) return '';
    const num = val.toString().replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

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

      if (error) throw error;

      if (data) {
        let tglMulai = '';
        let waktuMulai = '';
        if (data.waktu_mulai) {
          const d = new Date(data.waktu_mulai);
          tglMulai = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          waktuMulai = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        let tglSelesai = '';
        let waktuSelesai = '';
        if (data.waktu_selesai) {
          const d = new Date(data.waktu_selesai);
          tglSelesai = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          waktuSelesai = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        setFormData({
          nama_produk: data.nama_produk || '',
          merk: data.merk || '',
          tahun_produksi: data.tahun_produksi || '',
          kategori: data.kategori || 'Elektronik',
          kondisi: data.kondisi || 'Baru',
          model: data.model || '',
          warna: data.warna || '',
          daya_listrik: data.daya_listrik || '',
          kapasitas: data.kapasitas || '',
          tegangan: data.tegangan || '',
          kondisi_fisik: data.kondisi_fisik || '',
          kelengkapan: data.kelengkapan || '',
          estetika: data.estetika_tampilan || '',
          dokumen: data.dokumen_pendukung || '',
          kemasan: data.kemasan_box || '',
          aksesoris: data.aksesoris_tambahan || '',
          harga_awal: data.harga_awal ? formatRibuan(data.harga_awal) : '',
          lokasi: data.lokasi || '',
          status: data.status || 'aktif',
          tglMulai,
          waktuMulai,
          tglSelesai,
          waktuSelesai,
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

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHargaChange = (e) => {
    setFormData(prev => ({ ...prev, harga_awal: formatRibuan(e.target.value) }));
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
      let startDateTime = null;
      let endDateTime = null;

      if (formData.tglMulai && formData.waktuMulai && formData.tglSelesai && formData.waktuSelesai) {
        startDateTime = new Date(`${formData.tglMulai}T${formData.waktuMulai}`);
        endDateTime = new Date(`${formData.tglSelesai}T${formData.waktuSelesai}`);
      } else {
        throw new Error('Mohon lengkapi semua field Waktu Mulai dan Selesai');
      }

      const numericHarga = parseInt(formData.harga_awal.replace(/\./g, ''), 10);

      const { error } = await supabase
        .from('products')
        .update({
          nama_produk: formData.nama_produk,
          merk: formData.merk,
          tahun_produksi: parseInt(formData.tahun_produksi, 10),
          kategori: formData.kategori,
          kondisi: formData.kondisi,
          model: formData.model,
          warna: formData.warna,
          daya_listrik: formData.daya_listrik,
          kapasitas: formData.kapasitas,
          tegangan: formData.tegangan,
          kondisi_fisik: formData.kondisi_fisik,
          kelengkapan: formData.kelengkapan,
          estetika_tampilan: formData.estetika,
          dokumen_pendukung: formData.dokumen,
          kemasan_box: formData.kemasan,
          aksesoris_tambahan: formData.aksesoris,
          harga_awal: numericHarga,
          lokasi: formData.lokasi,
          waktu_mulai: startDateTime.toISOString(),
          waktu_selesai: endDateTime.toISOString(),
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

  const kondisiFisikOptions = [
    { value: 'Sangat Baik', label: 'Sangat Baik' },
    { value: 'Baik', label: 'Baik' },
    { value: 'Cukup Baik', label: 'Cukup Baik' },
  ];

  const kelengkapanOptions = [
    { value: 'Lengkap', label: 'Lengkap' },
    { value: 'Sebagian', label: 'Sebagian' },
    { value: 'Hanya Unit', label: 'Hanya Unit' },
  ];

  const estetikaOptions = [
    { value: 'Mulus', label: 'Mulus' },
    { value: 'Ada Goresan', label: 'Ada Goresan Halus' },
    { value: 'Banyak Goresan', label: 'Banyak Goresan/Lecet' },
  ];

  const ketersediaanOptions = [
    { value: 'Ada', label: 'Ada' },
    { value: 'Tidak Ada', label: 'Tidak Ada' },
  ];

  const kemasanOptions = [
    { value: 'Lengkap (Original)', label: 'Lengkap (Original)' },
    { value: 'Pengganti', label: 'Pengganti' },
    { value: 'Tanpa Kemasan', label: 'Tanpa Kemasan' },
  ];

  const aksesorisOptions = [
    { value: 'Lengkap', label: 'Lengkap' },
    { value: 'Sebagian', label: 'Sebagian' },
    { value: 'Tidak Ada', label: 'Tidak Ada' },
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
                <select name="kategori" value={formData.kategori} onChange={handleChange} className="admin-select-input">
                  <option value="Elektronik">Elektronik</option>
                  <option value="Seni">Seni</option>
                  <option value="Hobi">Hobi</option>
                </select>
              </div>
            </div>

            <div className="form-group-edit">
              <label>KONDISI</label>
              <div className="input-wrapper checkbox-list-inline" style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem', cursor: 'pointer' }}>
                  <input type="radio" name="kondisi" value="Baru" checked={formData.kondisi === 'Baru'} onChange={handleChange} style={{ width: '16px', height: '16px', cursor: 'pointer' }} /> Baru
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="kondisi" value="Bekas" checked={formData.kondisi === 'Bekas'} onChange={handleChange} style={{ width: '16px', height: '16px', cursor: 'pointer' }} /> Bekas
                </label>
              </div>
            </div>

            <div className="form-group-edit" style={{ marginTop: '1rem' }}>
              <label>HARGA TERAKHIR / AWAL (RP)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontWeight: '500' }}>Rp</span>
                <input type="text" inputMode="numeric" value={formData.harga_awal} onChange={handleHargaChange} style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div className="form-group-edit">
              <label>STATUS LELANG</label>
              <div className="status-lelang-group" style={{ opacity: 0.8 }}>
                {/* Disabled buttons so they cannot be clicked anymore */}
                <button type="button" disabled className={`status-lelang-btn ${formData.status === 'aktif' ? 'active' : ''}`} style={{ cursor: 'not-allowed' }}>AKTIF</button>
                <button type="button" disabled className={`status-lelang-btn ${formData.status === 'selesai' ? 'active' : ''}`} style={{ cursor: 'not-allowed' }}>SELESAI</button>
                <button type="button" disabled className={`status-lelang-btn ${formData.status === 'dibatalkan' ? 'active' : ''}`} style={{ cursor: 'not-allowed' }}>DIBATALKAN</button>
              </div>
            </div>

            <div className="form-group-edit" style={{ marginTop: '2rem' }}>
              <label>FOTO PRODUK</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {imageUrls.map((url, index) => (
                  <div key={index} style={{ position: 'relative', width: '120px', height: '120px' }}>
                    <img src={url || "/assets/placeholder.png"} alt={`Produk ${index+1}`} className="foto-produk-preview" style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                    <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                      <i className="ph ph-x" style={{ fontSize: '14px', fontWeight: 'bold' }}></i>
                    </button>
                  </div>
                ))}
                
                <div className="foto-produk-upload" onClick={() => !uploadingImage && fileInputRef.current?.click()} style={{ width: '120px', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: uploadingImage ? 'not-allowed' : 'pointer', opacity: uploadingImage ? 0.6 : 1, border: '2px dashed #D1D5DB', borderRadius: '8px', background: '#F9FAFB' }}>
                  {uploadingImage ? (
                    <>
                      <i className="ph ph-spinner" style={{ animation: 'spin 1s linear infinite' }}></i>
                      <span style={{ fontSize: '0.75rem' }}>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <i className="ph ph-upload-simple"></i>
                      <span style={{ fontSize: '0.75rem' }}>Tambah Foto</span>
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

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>MODEL</label>
                <input type="text" name="model" value={formData.model} onChange={handleChange} />
              </div>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>WARNA</label>
                <input type="text" name="warna" value={formData.warna} onChange={handleChange} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>DAYA LISTRIK</label>
                <input type="text" name="daya_listrik" value={formData.daya_listrik} onChange={handleChange} />
              </div>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>KAPASITAS</label>
                <input type="text" name="kapasitas" value={formData.kapasitas} onChange={handleChange} />
              </div>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>TEGANGAN</label>
                <input type="text" name="tegangan" value={formData.tegangan} onChange={handleChange} />
              </div>
            </div>

            <h3 className="admin-edit-section-title" style={{ marginTop: '2rem' }}>KONDISI PRODUK</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>KONDISI FISIK</label>
                <CustomSelect options={kondisiFisikOptions} value={formData.kondisi_fisik} onChange={(v) => handleSelectChange('kondisi_fisik', v)} placeholder="Pilih Kondisi Fisik" />
              </div>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>KELENGKAPAN</label>
                <CustomSelect options={kelengkapanOptions} value={formData.kelengkapan} onChange={(v) => handleSelectChange('kelengkapan', v)} placeholder="Pilih Kelengkapan" />
              </div>
            </div>
            <div className="form-group-edit">
              <label>ESTETIKA / TAMPILAN</label>
              <CustomSelect options={estetikaOptions} value={formData.estetika} onChange={(v) => handleSelectChange('estetika', v)} placeholder="Pilih Estetika" />
            </div>

            <h3 className="admin-edit-section-title" style={{ marginTop: '2rem' }}>DETAIL KELENGKAPAN</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>DOKUMEN PENDUKUNG</label>
                <CustomSelect options={ketersediaanOptions} value={formData.dokumen} onChange={(v) => handleSelectChange('dokumen', v)} placeholder="Pilih Ketersediaan" />
              </div>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>KEMASAN (BOX)</label>
                <CustomSelect options={kemasanOptions} value={formData.kemasan} onChange={(v) => handleSelectChange('kemasan', v)} placeholder="Pilih Kemasan" />
              </div>
            </div>
            <div className="form-group-edit">
              <label>AKSESORIS TAMBAHAN</label>
              <CustomSelect options={aksesorisOptions} value={formData.aksesoris} onChange={(v) => handleSelectChange('aksesoris', v)} placeholder="Pilih Aksesoris" />
            </div>
            
            <h3 className="admin-edit-section-title" style={{ marginTop: '2rem' }}>DETAIL LELANG</h3>
            <div className="form-group-edit" style={{ marginBottom: '1rem' }}>
              <label>LOKASI BARANG</label>
              <input type="text" name="lokasi" value={formData.lokasi} onChange={handleChange} />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>TANGGAL MULAI</label>
                <CustomDatePicker value={formData.tglMulai} onChange={(v) => handleSelectChange('tglMulai', v)} placeholder="Pilih Tanggal Mulai" />
              </div>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>WAKTU MULAI</label>
                <CustomTimePicker value={formData.waktuMulai} onChange={(v) => handleSelectChange('waktuMulai', v)} placeholder="HH:MM" />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>TANGGAL SELESAI</label>
                <CustomDatePicker value={formData.tglSelesai} onChange={(v) => handleSelectChange('tglSelesai', v)} minDate={formData.tglMulai ? new Date(formData.tglMulai) : null} placeholder="Pilih Tanggal Selesai" />
              </div>
              <div className="form-group-edit" style={{ flex: 1 }}>
                <label>WAKTU SELESAI</label>
                <CustomTimePicker value={formData.waktuSelesai} onChange={(v) => handleSelectChange('waktuSelesai', v)} placeholder="HH:MM" alignRight={true} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', justifyContent: 'flex-end' }}>
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
