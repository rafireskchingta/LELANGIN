'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import CustomSelect from '../../../components/CustomSelect';

export default function AkunPenjualPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // sellerStatus: null (belum daftar), 'menunggu', 'disetujui', 'ditolak'
  const [sellerStatus, setSellerStatus] = useState(null);
  const [userId, setUserId] = useState(null);
  const [toast, setToast] = useState(null);
  const [hasHistory, setHasHistory] = useState(false);
  const [showVerifPopup, setShowVerifPopup] = useState(false);

  // State KTP
  const [ktpFile, setKtpFile] = useState(null);
  const [ktpPreview, setKtpPreview] = useState(null);
  const [ktpUrl, setKtpUrl] = useState(null);
  // FIX B-13: Simpan nilai KTP asli untuk restore saat batal
  const [originalKtpPreview, setOriginalKtpPreview] = useState(null);
  const [originalKtpUrl, setOriginalKtpUrl] = useState(null);
  const [ktpUploading, setKtpUploading] = useState(false);
  const [ktpDragOver, setKtpDragOver] = useState(false);
  const [currentAppId, setCurrentAppId] = useState(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [originalPenjual, setOriginalPenjual] = useState(null);
  const [penjual, setPenjual] = useState({
    username: '', nama: '', email: '', jenisKelamin: '',
    noTelp: '', tglLahirTgl: '', tglLahirBulan: '', tglLahirTahun: '',
    alamat: '', namaBank: '', noRekening: '', namaPemilikRekening: '',
  });

  const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const bulanMap = { 'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04', 'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08', 'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12' };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) { router.push('/'); return; }

        setUserId(session.user.id);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        // Ambil data pengajuan penjual secara langsung (RLS sudah diperbaiki)
        const { data: appsData, error: appsError, count: appsCount } = await supabase
          .from('seller_applications')
          .select('*', { count: 'exact' })
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (appsError) throw appsError;

        const sellerApp = appsData?.[0] || null;

        // Simpan status: null, 'menunggu', 'disetujui', 'ditolak'
        setSellerStatus(sellerApp?.status || null);
        
        // hasHistory: True jika pernah daftar sebelumnya (jumlah baris > 0)
        setHasHistory(appsCount > 0);

        let tglLahirTgl = '', tglLahirBulan = '', tglLahirTahun = '';
        if (profile?.birth_date) {
          const parts = profile.birth_date.split('-');
          if (parts.length === 3) {
            tglLahirTahun = parts[0];
            tglLahirBulan = bulanArr[parseInt(parts[1]) - 1] || '';
            tglLahirTgl = parseInt(parts[2]).toString();
          }
        }

        const penjualObj = {
          username: profile?.username || '',
          nama: profile?.full_name || '',
          email: session.user.email || '',
          jenisKelamin: profile?.gender || '',
          noTelp: profile?.phone_number || '',
          tglLahirTgl, tglLahirBulan, tglLahirTahun,
          alamat: sellerApp?.lokasi || '',
          namaBank: sellerApp?.nama_bank || '',
          noRekening: sellerApp?.no_rekening || '',
          namaPemilikRekening: sellerApp?.nama_pemilik || '',
        };

        setPenjual(penjualObj);
        setOriginalPenjual(penjualObj);

        if (!sellerApp?.status || sellerApp?.status === 'ditolak') {
          setIsEditMode(true);
        }
        if (sellerApp?.status === 'menunggu') {
          setShowVerifPopup(true);
        }

        // Load KTP jika sudah ada
        if (sellerApp?.ktp_url) {
          setKtpUrl(sellerApp.ktp_url);
          setOriginalKtpUrl(sellerApp.ktp_url); // FIX B-13
          const { data: signed } = await supabase.storage
            .from('ktp-uploads')
            .createSignedUrl(sellerApp.ktp_url, 60 * 60);
          if (signed?.signedUrl) {
            setKtpPreview(signed.signedUrl);
            setOriginalKtpPreview(signed.signedUrl); // FIX B-13
          }
        }
        
        // Simpan ID pengajuan saat ini
        if (sellerApp?.id) setCurrentAppId(sellerApp.id);
      } catch (err) {
        console.error(err);
        showToast('Gagal memuat data profil', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const handleChange = (field) => (e) => {
    setPenjual(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Handle pilih / drop file KTP
  const handleKtpFileSelect = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file maksimal 5 MB.', 'error');
      return;
    }
    setKtpFile(file);
    setKtpPreview(URL.createObjectURL(file));
  };

  const handleKtpDrop = (e) => {
    e.preventDefault();
    setKtpDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleKtpFileSelect(file);
  };

  const handleKtpInputChange = (e) => {
    handleKtpFileSelect(e.target.files?.[0]);
  };

  // Upload KTP ke Supabase Storage
  const handleUploadKtp = async () => {
    if (!ktpFile || !userId) {
      console.warn('[KTP] Upload dibatalkan: ktpFile=', ktpFile, 'userId=', userId);
      return null;
    }
    setKtpUploading(true);
    try {
      const ext = ktpFile.name.split('.').pop();
      const filePath = `${userId}/ktp-${Date.now()}.${ext}`;
      console.log('[KTP] Mulai upload ke storage:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ktp-uploads')
        .upload(filePath, ktpFile, { upsert: true });

      console.log('[KTP] Storage result:', uploadData, uploadError);
      if (uploadError) throw uploadError;

      // Ambil signed URL untuk preview
      const { data: signedData, error: signedError } = await supabase.storage
        .from('ktp-uploads')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (signedError) throw signedError;

      setKtpUrl(filePath);
      setKtpPreview(signedData.signedUrl);
      setKtpFile(null);
      showToast('Foto KTP siap. Klik "Daftar Penjual" untuk menyimpan.', 'success');
      return filePath;
    } catch (err) {
      const msg = err?.message || err?.error_description || JSON.stringify(err);
      console.error('[KTP] Error detail:', JSON.stringify(err, null, 2));
      showToast('Gagal upload KTP: ' + msg, 'error');
      return null;
    } finally {
      setKtpUploading(false);
    }
  };

  // Hapus KTP
  const handleHapusKtp = async () => {
    if (!ktpUrl || !userId) return;
    try {
      const { error } = await supabase.storage
        .from('ktp-uploads')
        .remove([ktpUrl]);
      if (error) throw error;

      await supabase.from('seller_applications').update({ ktp_url: null }).eq('user_id', userId);

      setKtpUrl(null);
      setKtpPreview(null);
      setKtpFile(null);
      showToast('KTP berhasil dihapus.', 'success');
    } catch (err) {
      showToast('Gagal menghapus KTP: ' + err.message, 'error');
    }
  };

  // Batal edit
  const handleBatal = () => {
    if (originalPenjual) {
      setPenjual(originalPenjual);
    }
    // FIX B-13: Restore KTP preview dan URL ke nilai asli sebelum edit
    setKtpFile(null);
    setKtpPreview(originalKtpPreview);
    setKtpUrl(originalKtpUrl);
    setIsEditMode(false);
  };

  // Submit daftar penjual — update role + data bank
  const handleDaftarPenjual = async (e) => {
    if (e) e.preventDefault();
    if (!userId) return;
    if (!penjual.alamat || !penjual.namaBank || !penjual.noRekening || !penjual.namaPemilikRekening) {
      showToast('Lengkapi semua field yang wajib diisi', 'error');
      return;
    }
    if (!ktpUrl && !ktpFile) {
      showToast('KTP wajib diunggah sebelum mendaftar sebagai penjual', 'error');
      return;
    }
    // Upload KTP dulu jika belum terupload, gunakan path yang dikembalikan
    let finalKtpPath = ktpUrl;
    if (ktpFile && !ktpUrl) {
      finalKtpPath = await handleUploadKtp();
      if (!finalKtpPath) return; // upload gagal, berhenti
    }
    setSubmitting(true);
    try {
      let result;
      
      if (sellerStatus === 'disetujui' && currentAppId) {
        // UPDATE baris yang sudah disetujui (Sesuai instruksi flow baru)
        result = await supabase
          .from('seller_applications')
          .update({
            lokasi: penjual.alamat,
            ktp_url: finalKtpPath,
            nama_bank: penjual.namaBank,
            no_rekening: penjual.noRekening,
            nama_pemilik: penjual.namaPemilikRekening,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentAppId);
      } else {
        // INSERT baris baru (Pengajuan Baru / Ulang setelah ditolak)
        result = await supabase
          .from('seller_applications')
          .insert({
            user_id: userId,
            lokasi: penjual.alamat,
            ktp_url: finalKtpPath,
            nama_bank: penjual.namaBank,
            no_rekening: penjual.noRekening,
            nama_pemilik: penjual.namaPemilikRekening,
            status: 'menunggu' // Selalu mulai dari menunggu
          })
          .select();
        
        if (!result.error && result.data?.[0]) {
          setCurrentAppId(result.data[0].id);
        }
      }

      if (result.error) throw result.error;

      // Update profil user (data pribadi)
      const tgl = (penjual.tglLahirTgl || '1').padStart(2, '0');
      const bln = bulanMap[penjual.tglLahirBulan] || '01';
      const thn = penjual.tglLahirTahun || '2000';

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          username: penjual.username,
          full_name: penjual.nama,
          gender: penjual.jenisKelamin,
          phone_number: penjual.noTelp,
          birth_date: `${thn}-${bln}-${tgl}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (profileUpdateError) console.error("Error updating profile during seller save:", profileUpdateError);

      setOriginalPenjual({ ...penjual });
      setIsEditMode(false);

      if (sellerStatus !== 'disetujui') {
        setSellerStatus('menunggu');
        setHasHistory(true);
        showToast('Pendaftaran penjual berhasil dikirim! Menunggu persetujuan admin.', 'success');
      } else {
        showToast('Perubahan profil penjual berhasil disimpan.', 'success');
      }
    } catch (err) {
      showToast('Terjadi kesalahan: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>      {/* Toast notifikasi */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          color: toast.type === 'success' ? '#065F46' : '#991B1B',
          border: `1px solid ${toast.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
          borderRadius: '8px', padding: '0.85rem 1.25rem',
          fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <i className={`ph ${toast.type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}`}></i>
          {toast.msg}
        </div>
      )}

      {/* Popup Verifikasi - floating card tanpa blur */}
      {sellerStatus === 'menunggu' && showVerifPopup && (
        <div style={{
          position: 'absolute', top: '2.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, background: 'white', borderRadius: '14px', padding: '1.75rem 2rem',
          maxWidth: '400px', width: '85%',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          animation: 'fadeInScale 0.3s ease'
        }}>
          <button
            onClick={() => setShowVerifPopup(false)}
            style={{
              position: 'absolute', top: '0.75rem', right: '1rem',
              background: 'none', border: 'none', fontSize: '1.1rem',
              color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit',
              lineHeight: 1
            }}
          >✕</button>
          <h3 style={{ color: '#D97706', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.6rem' }}>
            Menunggu Verifikasi Admin!
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
            Data profil penjual Anda sedang ditinjau. Anda akan mendapatkan akses penuh untuk menitipkan barang setelah pengajuan disetujui.
          </p>
        </div>
      )}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Content wrapper - blurs when popup is showing */}
      <div style={{ filter: sellerStatus === 'menunggu' && showVerifPopup ? 'blur(4px)' : 'none', transition: 'filter 0.3s ease', pointerEvents: sellerStatus === 'menunggu' && showVerifPopup ? 'none' : 'auto' }}>
      {sellerStatus === 'disetujui' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '8px', padding: '0.75rem 1.1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#065F46', fontWeight: 500 }}>
          <i className="ph ph-check-circle" style={{ fontSize: '1.1rem' }}></i>
          Akun kamu sudah terdaftar sebagai <strong>Penjual</strong>
        </div>
      )}
      {sellerStatus === 'ditolak' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '0.75rem 1.1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#991B1B', fontWeight: 500 }}>
          <i className="ph ph-x-circle" style={{ fontSize: '1.1rem' }}></i>
          Pendaftaran penjual <strong>ditolak</strong>. Silakan perbaiki data dan ajukan kembali.
        </div>
      )}

      <h2 className="akun-section-title">Profil Penjual</h2>
      <p className="akun-section-desc">
        {sellerStatus === 'menunggu'
          ? 'Data pendaftaran kamu sedang ditinjau oleh admin. Semua data dikunci selama proses peninjauan.'
          : sellerStatus === 'disetujui'
            ? 'Data akun penjual kamu. Untuk mengedit data pribadi, silakan ke halaman Akun Saya.'
            : 'Lengkapi data berikut untuk mulai menjual produk melalui sistem lelang di Lelangin'}
      </p>

      <form onSubmit={handleDaftarPenjual} id="formDaftarPenjual">
        {/* === Data Pribadi (read-only, edit di Akun Saya) === */}
        <div className="form-horizontal-group">
          <label>Username</label>
          <div className="input-wrapper">
            <input type="text" value={penjual.username} disabled={!isEditMode || sellerStatus === 'menunggu'} onChange={handleChange('username')} />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>Nama</label>
          <div className="input-wrapper">
            <input type="text" value={penjual.nama} disabled={!isEditMode || sellerStatus === 'menunggu'} onChange={handleChange('nama')} />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>Email</label>
          <div className="input-wrapper">
            <input type="email" value={penjual.email} disabled />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>Jenis Kelamin</label>
          <div className="input-wrapper">
            <CustomSelect 
              disabled={!isEditMode || sellerStatus === 'menunggu'}
              options={[
                { label: 'Pria', value: 'Pria' },
                { label: 'Wanita', value: 'Wanita' }
              ]}
              value={penjual.jenisKelamin}
              onChange={(val) => setPenjual(prev => ({ ...prev, jenisKelamin: val }))}
              placeholder="Pilih"
            />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>No Telp</label>
          <div className="input-wrapper">
            <input type="tel" value={penjual.noTelp} disabled={!isEditMode || sellerStatus === 'menunggu'} onChange={(e) => setPenjual(prev => ({ ...prev, noTelp: e.target.value.replace(/\D/g, '') }))} />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>Tanggal Lahir</label>
          <div className="input-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <CustomSelect 
              disabled={!isEditMode || sellerStatus === 'menunggu'}
              options={Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) }))}
              value={penjual.tglLahirTgl}
              onChange={(val) => setPenjual(prev => ({ ...prev, tglLahirTgl: val }))}
              placeholder="Tgl"
            />
            <CustomSelect 
              disabled={!isEditMode || sellerStatus === 'menunggu'}
              options={bulanArr.map(b => ({ label: b, value: b }))}
              value={penjual.tglLahirBulan}
              onChange={(val) => setPenjual(prev => ({ ...prev, tglLahirBulan: val }))}
              placeholder="Bulan"
            />
            <CustomSelect 
              disabled={!isEditMode || sellerStatus === 'menunggu'}
              options={Array.from({ length: 66 }, (_, i) => ({ label: String(1950 + i), value: String(1950 + i) }))}
              value={penjual.tglLahirTahun}
              onChange={(val) => setPenjual(prev => ({ ...prev, tglLahirTahun: val }))}
              placeholder="Tahun"
            />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>Lokasi <span className="required">*</span></label>
          <div className="input-wrapper">
            <CustomSelect
              value={penjual.alamat}
              onChange={(val) => setPenjual(prev => ({ ...prev, alamat: val }))}
              placeholder="Pilih Provinsi"
              disabled={!isEditMode || sellerStatus === 'menunggu'}
              options={[
                { value: 'Banten', label: 'Banten' },
                { value: 'DKI Jakarta', label: 'DKI Jakarta' },
                { value: 'Jawa Barat', label: 'Jawa Barat' },
                { value: 'Jawa Tengah', label: 'Jawa Tengah' },
                { value: 'DI Yogyakarta', label: 'DI Yogyakarta' },
                { value: 'Jawa Timur', label: 'Jawa Timur' }
              ]}
            />
          </div>
        </div>


        {/* === Upload KTP === */}
        <h3 className="sub-title" style={{ marginTop: '2.5rem' }}>Upload KTP</h3>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.75rem' }}>KTP <span className="required">*</span></label>
          <div>
            {/* Preview jika sudah ada file/URL */}
            {ktpPreview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '320px' }}>
                  <img
                    src={ktpPreview}
                    alt="Preview KTP"
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #E5E7EB', objectFit: 'cover' }}
                  />
                  {ktpUrl && (
                    <span style={{
                      position: 'absolute', top: '8px', right: '8px',
                      backgroundColor: '#D1FAE5', color: '#065F46',
                      fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
                      borderRadius: '999px', border: '1px solid #6EE7B7'
                    }}>
                      ✓ Tersimpan
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Tombol upload jika file baru dipilih tapi belum diupload */}
                  {ktpFile && !ktpUploading && (
                    <button
                      type="button"
                      onClick={handleUploadKtp}
                      className="btn-primary-full"
                      style={{ width: 'auto', margin: 0, padding: '0.45rem 1.25rem', fontSize: '0.82rem', borderRadius: '6px' }}
                    >
                      Upload KTP
                    </button>
                  )}
                  {ktpUploading && (
                    <span style={{ fontSize: '0.82rem', color: '#6B7280', padding: '0.45rem 0' }}>
                      Mengupload...
                    </span>
                  )}
                  {/* Ganti foto */}
                  <label style={{
                    cursor: isEditMode && sellerStatus !== 'menunggu' ? 'pointer' : 'not-allowed', fontSize: '0.82rem', 
                    color: isEditMode && sellerStatus !== 'menunggu' ? 'var(--primary)' : '#9CA3AF',
                    border: `1px solid ${isEditMode && sellerStatus !== 'menunggu' ? 'var(--primary)' : '#E5E7EB'}`, 
                    borderRadius: '6px',
                    padding: '0.45rem 1rem', fontWeight: 500,
                    opacity: isEditMode && sellerStatus !== 'menunggu' ? 1 : 0.6
                  }}>
                    Ganti Foto
                    <input
                      type="file"
                      disabled={!isEditMode || sellerStatus === 'menunggu'}
                      style={{ display: 'none' }}
                      onChange={handleKtpInputChange}
                    />
                  </label>
                  {/* Hapus */}
                  {ktpUrl && (
                    <button
                      type="button"
                      onClick={handleHapusKtp}
                      disabled={!isEditMode || sellerStatus === 'menunggu'}
                      style={{
                        background: 'none', 
                        border: `1px solid ${!isEditMode || sellerStatus === 'menunggu' ? '#E5E7EB' : '#FCA5A5'}`, 
                        borderRadius: '6px',
                        padding: '0.45rem 1rem', fontSize: '0.82rem', 
                        color: !isEditMode || sellerStatus === 'menunggu' ? '#9CA3AF' : '#DC2626', 
                        cursor: !isEditMode || sellerStatus === 'menunggu' ? 'not-allowed' : 'pointer',
                        opacity: !isEditMode || sellerStatus === 'menunggu' ? 0.6 : 1
                      }}
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Dropzone saat belum ada file — horizontal/wide layout */
              <label
                htmlFor="ktp-file-input"
                className={`upload-dropzone${ktpDragOver ? ' drag-over' : ''}`}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.5rem 2rem', textAlign: 'left', width: '100%' }}
                onDragOver={(e) => { if (isEditMode && sellerStatus !== 'menunggu') { e.preventDefault(); setKtpDragOver(true); } }}
                onDragLeave={() => setKtpDragOver(false)}
                onDrop={(e) => { if (isEditMode && sellerStatus !== 'menunggu') handleKtpDrop(e); }}
              >
                <i className="ph ph-identification-card" style={{ fontSize: '2.5rem', flexShrink: 0, color: 'var(--primary)' }}></i>
                <div>
                  <span style={{ fontSize: '0.9rem' }}>Tarik gambar KTP ke sini atau <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>pilih file</span></span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                    JPG, PNG, WebP — maks. 5 MB
                  </span>
                </div>
                <input
                  id="ktp-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleKtpInputChange}
                  disabled={!isEditMode || sellerStatus === 'menunggu'}
                />
              </label>
            )}
          </div>
        </div>

        {/* === Informasi Pembayaran === */}
        <h3 className="sub-title" style={{ marginTop: '3rem' }}>Informasi Pembayaran</h3>
        <div className="form-horizontal-group">
          <label>Nama Bank <span className="required">*</span></label>
          <div className="input-wrapper">
            <CustomSelect
              value={penjual.namaBank}
              onChange={(val) => setPenjual(prev => ({ ...prev, namaBank: val }))}
              placeholder="Pilih Bank"
              disabled={!isEditMode || sellerStatus === 'menunggu'}
              options={[
                { value: 'Mandiri', label: 'Mandiri' },
                { value: 'BCA', label: 'BCA' },
                { value: 'BNI', label: 'BNI' },
                { value: 'BRI', label: 'BRI' }
              ]}
            />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>No Rekening <span className="required">*</span></label>
          <div className="input-wrapper">
            <input type="text" inputMode="numeric" value={penjual.noRekening} onChange={(e) => setPenjual(prev => ({ ...prev, noRekening: e.target.value.replace(/\D/g, '') }))} required disabled={!isEditMode || sellerStatus === 'menunggu'} />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>Nama Pemilik<br />Rekening <span className="required">*</span></label>
          <div className="input-wrapper">
            <input type="text" value={penjual.namaPemilikRekening} onChange={handleChange('namaPemilikRekening')} required disabled={!isEditMode || sellerStatus === 'menunggu'} />
          </div>
        </div>

        {/* Action Buttons: Edit / Batal + Simpan */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginTop: '3rem' }}>
          {sellerStatus === 'menunggu' ? (
            null
          ) : isEditMode ? (
            <>
              <button type="button" onClick={handleBatal}
                style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '0.6rem 2.5rem', fontSize: '0.9rem', color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                Batal
              </button>
              <button type="submit" disabled={submitting}
                className="btn-primary-full"
                style={{ width: 'auto', padding: '0.6rem 2.5rem', margin: 0, fontSize: '0.9rem', borderRadius: '6px' }}>
                {submitting ? 'Memproses...' : (sellerStatus === 'disetujui' ? 'Simpan' : (hasHistory ? 'Ajukan Kembali' : 'Ajukan Pendaftaran'))}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setIsEditMode(true)}
              style={{ background: '#FFFFFF', border: '1px solid var(--primary)', borderRadius: '6px', padding: '0.6rem 2.5rem', fontSize: '0.9rem', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              Edit
            </button>
          )}
        </div>
      </form>
      </div>
    </div>
  );
}