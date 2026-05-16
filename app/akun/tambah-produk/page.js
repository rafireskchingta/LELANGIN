'use client';

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CustomDatePicker from '../../../components/CustomDatePicker';
import CustomTimePicker from '../../../components/CustomTimePicker';
import CustomSelect from '../../../components/CustomSelect';
import { supabase } from '../../../src/lib/supabase';

export default function TambahProdukPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [toast, setToast] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);

  // Form states
  const [namaProduk, setNamaProduk] = useState("");
  const [kategori, setKategori] = useState("");
  const [kondisi, setKondisi] = useState("");
  const [merk, setMerk] = useState("");
  const [model, setModel] = useState("");
  const [warna, setWarna] = useState("");
  const [tahunProduk, setTahunProduk] = useState("");
  const [dayaListrik, setDayaListrik] = useState("");
  const [kapasitas, setKapasitas] = useState("");
  const [tegangan, setTegangan] = useState("");
  
  const [kondisiFisik, setKondisiFisik] = useState("");
  const [kelengkapan, setKelengkapan] = useState("");
  const [estetika, setEstetika] = useState("");
  const [dokumen, setDokumen] = useState("");
  const [kemasan, setKemasan] = useState("");
  const [aksesoris, setAksesoris] = useState("");
  
  const [hargaAwal, setHargaAwal] = useState("");
  const [tglMulai, setTglMulai] = useState("");
  const [tglSelesai, setTglSelesai] = useState("");
  const [waktuMulai, setWaktuMulai] = useState("");
  const [waktuSelesai, setWaktuSelesai] = useState("");

  const [images, setImages] = useState([]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        setUserId(session.user.id);
      }
    }
    checkAuth();
  }, [router]);

  const showToast = (msg, type = 'success') => {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(msg, type);
    } else {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3500);
    }
  };

  const formatRibuan = (val) => {
    const num = val.replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    const errors = {};
    
    // Check text fields
    if (!namaProduk) errors.namaProduk = true;
    if (!kategori) errors.kategori = true;
    if (!kondisi) errors.kondisi = true;
    if (!merk) errors.merk = true;
    if (!model) errors.model = true;
    if (!warna) errors.warna = true;
    if (!tahunProduk) errors.tahunProduk = true;
    if (!kondisiFisik) errors.kondisiFisik = true;
    if (!kelengkapan) errors.kelengkapan = true;
    if (!estetika) errors.estetika = true;
    if (!dokumen) errors.dokumen = true;
    if (!kemasan) errors.kemasan = true;
    if (!aksesoris) errors.aksesoris = true;
    if (!hargaAwal) errors.hargaAwal = true;
    if (!tglMulai) errors.tglMulai = true;
    if (!tglSelesai) errors.tglSelesai = true;
    if (!waktuMulai) errors.waktuMulai = true;
    if (!waktuSelesai) errors.waktuSelesai = true;

    let mainErrorMsg = null;

    // Check images
    if (images.length === 0) {
      errors.images = true;
      mainErrorMsg = 'Mohon unggah minimal 1 foto produk';
    }

    let startDateTime = null;
    let endDateTime = null;

    // Check dates ONLY if they are filled
    if (tglMulai && waktuMulai && tglSelesai && waktuSelesai) {
      startDateTime = new Date(`${tglMulai}T${waktuMulai}`);
      endDateTime = new Date(`${tglSelesai}T${waktuSelesai}`);
      const now = new Date();

      if (startDateTime < now) {
        if (startDateTime.toDateString() === now.toDateString()) {
          errors.waktuMulai = true;
        } else {
          errors.tglMulai = true;
          errors.waktuMulai = true;
        }
        mainErrorMsg = 'Waktu mulai tidak boleh sebelum waktu saat ini';
      }

      if (endDateTime <= startDateTime) {
        errors.tglSelesai = true;
        errors.waktuSelesai = true;
        if (!mainErrorMsg) mainErrorMsg = 'Waktu selesai harus setelah waktu mulai';
      }

      const diffTime = Math.abs(endDateTime - startDateTime);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays > 31) {
        errors.tglSelesai = true;
        if (!mainErrorMsg) mainErrorMsg = 'Batas maksimal durasi lelang adalah 1 bulan';
      }
    }

    // Prioritize "lengkapi field" if text fields are missing
    if (Object.keys(errors).some(k => !['images', 'tglMulai', 'waktuMulai', 'tglSelesai', 'waktuSelesai'].includes(k)) || (!tglMulai || !waktuMulai || !tglSelesai || !waktuSelesai)) {
      mainErrorMsg = 'Mohon lengkapi semua field bertanda *';
    }

    // Show combined errors
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast(mainErrorMsg || 'Mohon cek kembali form Anda', 'error');
      return;
    }

    setLoading(true);

    try {
      // 1. Get seller location from seller_applications
      const { data: sellerData, error: sellerError } = await supabase
        .from('seller_applications')
        .select('lokasi')
        .eq('user_id', userId)
        .limit(1)
        .single();
        
      if (sellerError || !sellerData?.lokasi) {
        throw new Error('Tidak dapat menemukan data lokasi penjual. Pastikan profil penjual Anda lengkap.');
      }
      const sellerLokasi = sellerData.lokasi;

      // 2. Upload Images
      const uploadedUrls = [];
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(publicUrl);
      }

      // 3. Insert Product
      const numericHarga = parseInt(hargaAwal.replace(/\./g, ''), 10);
      
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          seller_id: userId,
          nama_produk: namaProduk,
          kategori: kategori,
          kondisi: kondisi,
          merk: merk,
          model: model,
          warna: warna,
          tahun_produksi: parseInt(tahunProduk, 10),
          daya_listrik: dayaListrik,
          kapasitas: kapasitas,
          tegangan: tegangan,
          kondisi_fisik: kondisiFisik,
          kelengkapan: kelengkapan,
          estetika_tampilan: estetika,
          dokumen_pendukung: dokumen,
          kemasan_box: kemasan,
          aksesoris_tambahan: aksesoris,
          harga_awal: numericHarga,
          current_price: numericHarga,
          waktu_mulai: startDateTime.toISOString(),
          waktu_selesai: endDateTime.toISOString(),
          image_urls: uploadedUrls,
          lokasi: sellerLokasi,
          status: 'menunggu'
        });

      if (insertError) throw insertError;

      alert('Berhasil menambah produk! Produk dalam status "Menunggu" persetujuan Admin.');
      router.push('/status-lelang?role=penjual');

    } catch (error) {
      console.error(error);
      showToast('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const kategoriOptions = [
    { value: 'Elektronik', label: 'Elektronik' },
    { value: 'Seni', label: 'Seni' },
    { value: 'Hobi', label: 'Hobi' },
  ];

  const kondisiOptions = [
    { value: 'Baru', label: 'Baru' },
    { value: 'Bekas', label: 'Bekas' },
  ];

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

  const tahunOptions = Array.from({ length: 100 }, (_, i) => {
    const year = String(new Date().getFullYear() - i);
    return { value: year, label: year };
  });

  const todayDate = new Date();
  
  // Calculate max date based on start date (or today if none selected)
  let maxEndDate = null;
  if (tglMulai) {
    maxEndDate = new Date(tglMulai);
    maxEndDate.setMonth(maxEndDate.getMonth() + 1);
  } else {
    maxEndDate = new Date();
    maxEndDate.setMonth(maxEndDate.getMonth() + 1);
  }

  return (
    <>
      <h2 className="akun-section-title">Tambah Produk Jual</h2>
      <p className="akun-section-desc">Yuk, mulai titipkan produkmu dan ikuti proses lelang dengan mudah!</p>
      
      <form onSubmit={handleSubmit} id="formTambahProduk">
        <div className="form-horizontal-group">
          <label>Nama Produk <span className="required">*</span></label>
          <div className="input-wrapper">
            <input type="text" value={namaProduk} onChange={(e) => setNamaProduk(e.target.value)} className={formErrors.namaProduk ? 'error-shake' : ''} />
          </div>
        </div>
        
        <div className="form-horizontal-group">
          <label>Kategori <span className="required">*</span></label>
          <div className="input-wrapper">
            <CustomSelect options={kategoriOptions} value={kategori} onChange={setKategori} placeholder="Pilih Kategori" error={formErrors.kategori} />
          </div>
        </div>

        <h3 className="sub-title">Info Produk</h3>
        <div className="form-horizontal-group">
          <label>Kondisi <span className="required">*</span></label>
          <div className="input-wrapper">
            <CustomSelect options={kondisiOptions} value={kondisi} onChange={setKondisi} placeholder="Pilih Kondisi" error={formErrors.kondisi} />
          </div>
        </div>
        
        <div className="form-horizontal-group"><label>Merk <span className="required">*</span></label><div className="input-wrapper"><input type="text" value={merk} onChange={(e) => setMerk(e.target.value)} className={formErrors.merk ? 'error-shake' : ''} /></div></div>
        <div className="form-horizontal-group"><label>Model <span className="required">*</span></label><div className="input-wrapper"><input type="text" value={model} onChange={(e) => setModel(e.target.value)} className={formErrors.model ? 'error-shake' : ''} /></div></div>
        <div className="form-horizontal-group"><label>Warna <span className="required">*</span></label><div className="input-wrapper"><input type="text" value={warna} onChange={(e) => setWarna(e.target.value)} className={formErrors.warna ? 'error-shake' : ''} /></div></div>
        <div className="form-horizontal-group">
          <label>Tahun Produksi <span className="required">*</span></label>
          <div className="input-wrapper">
            <CustomSelect options={tahunOptions} value={tahunProduk} onChange={setTahunProduk} placeholder="Pilih Tahun Produksi" error={formErrors.tahunProduk} />
          </div>
        </div>
        <div className="form-horizontal-group"><label>Daya Listrik</label><div className="input-wrapper"><input type="text" value={dayaListrik} onChange={(e) => setDayaListrik(e.target.value)} /></div></div>
        <div className="form-horizontal-group"><label>Kapasitas</label><div className="input-wrapper"><input type="text" value={kapasitas} onChange={(e) => setKapasitas(e.target.value)} /></div></div>
        <div className="form-horizontal-group"><label>Tegangan</label><div className="input-wrapper"><input type="text" value={tegangan} onChange={(e) => setTegangan(e.target.value)} /></div></div>

        <h3 className="sub-title">Kondisi Produk</h3>
        <div className="form-horizontal-group">
          <label>Kondisi Fisik <span className="required">*</span></label>
          <div className="input-wrapper">
            <CustomSelect options={kondisiFisikOptions} value={kondisiFisik} onChange={setKondisiFisik} placeholder="Pilih Kondisi Fisik" error={formErrors.kondisiFisik} />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>Kelengkapan <span className="required">*</span></label>
          <div className="input-wrapper">
            <CustomSelect options={kelengkapanOptions} value={kelengkapan} onChange={setKelengkapan} placeholder="Pilih Kelengkapan" error={formErrors.kelengkapan} />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>Estetika/Tampilan <span className="required">*</span></label>
          <div className="input-wrapper">
            <CustomSelect options={estetikaOptions} value={estetika} onChange={setEstetika} placeholder="Pilih Estetika" error={formErrors.estetika} />
          </div>
        </div>

        <h3 className="sub-title">Detail Kelengkapan</h3>
        <div className="form-horizontal-group">
          <label>Dokumen<br />Pendukung <span className="required">*</span></label>
          <div className="input-wrapper">
            <CustomSelect options={ketersediaanOptions} value={dokumen} onChange={setDokumen} placeholder="Pilih Ketersediaan" error={formErrors.dokumen} />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>Kemasan (Box) <span className="required">*</span></label>
          <div className="input-wrapper">
            <CustomSelect options={kemasanOptions} value={kemasan} onChange={setKemasan} placeholder="Pilih Kemasan" error={formErrors.kemasan} />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>Aksesoris<br />Tambahan <span className="required">*</span></label>
          <div className="input-wrapper">
            <CustomSelect options={aksesorisOptions} value={aksesoris} onChange={setAksesoris} placeholder="Pilih Aksesoris" error={formErrors.aksesoris} />
          </div>
        </div>

        <h3 className="sub-title">Detail Lelang</h3>
        <div className="form-horizontal-group">
          <label>Harga Awal <span className="required">*</span></label>
          <div className="input-wrapper" style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontWeight: '500' }}>Rp</span>
            <input 
              type="text" 
              inputMode="numeric" 
              value={hargaAwal} 
              onChange={(e) => setHargaAwal(formatRibuan(e.target.value))} 
              placeholder="0" 
              className={formErrors.hargaAwal ? 'error-shake' : ''}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
        
        <div className="form-horizontal-group" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
          <label style={{ whiteSpace: 'nowrap', width: '140px', minWidth: '140px' }}>Tanggal Mulai <span className="required">*</span></label>
          <div className="input-wrapper" style={{ flex: 1, position: 'relative' }}>
            <CustomDatePicker value={tglMulai} onChange={setTglMulai} minDate={todayDate} placeholder="Pilih Tanggal Mulai" error={formErrors.tglMulai} />
          </div>
          <label style={{ whiteSpace: 'nowrap', marginLeft: '1.5rem', width: '140px', minWidth: '140px' }}>Tanggal Selesai <span className="required">*</span></label>
          <div className="input-wrapper" style={{ flex: 1, position: 'relative' }}>
            <CustomDatePicker value={tglSelesai} onChange={setTglSelesai} minDate={tglMulai ? new Date(tglMulai) : todayDate} maxDate={maxEndDate} placeholder="Pilih Tanggal Selesai" alignRight={true} error={formErrors.tglSelesai} />
          </div>
        </div>
        
        <div className="form-horizontal-group" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
          <label style={{ whiteSpace: 'nowrap', width: '140px', minWidth: '140px' }}>Waktu Mulai <span className="required">*</span></label>
          <div className="input-wrapper" style={{ flex: 1, position: 'relative' }}>
            <CustomTimePicker value={waktuMulai} onChange={setWaktuMulai} placeholder="HH:MM" error={formErrors.waktuMulai} />
          </div>
          <label style={{ whiteSpace: 'nowrap', marginLeft: '1.5rem', width: '140px', minWidth: '140px' }}>Waktu Selesai <span className="required">*</span></label>
          <div className="input-wrapper" style={{ flex: 1, position: 'relative' }}>
            <CustomTimePicker value={waktuSelesai} onChange={setWaktuSelesai} placeholder="HH:MM" alignRight={true} error={formErrors.waktuSelesai} />
          </div>
        </div>

        <h3 className="sub-title">Foto Produk</h3>
        <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1rem' }}>Unggah satu atau beberapa foto produk yang jelas.</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          {images.map((img, index) => (
            <div key={index} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
              <img src={URL.createObjectURL(img)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="ph ph-x"></i>
              </button>
            </div>
          ))}
          
          <div 
            onClick={() => fileInputRef.current.click()}
            className={formErrors.images ? 'error-shake' : ''}
            style={{ 
              width: '100px', height: '100px', borderRadius: '8px', border: '2px dashed', 
              borderColor: formErrors.images ? '#EF4444' : '#D1D5DB',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', background: '#F9FAFB', color: '#6B7280',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="ph ph-plus" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}></i>
            <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>Tambah</span>
          </div>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          multiple 
          style={{ display: 'none' }} 
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
          <button type="submit" disabled={loading} className="btn-primary-full" style={{ width: 'auto', padding: '0.8rem 2.5rem', borderRadius: '6px', margin: 0, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Menyimpan...' : 'Tambah Produk'}
          </button>
        </div>
      </form>
    </>
  );
}