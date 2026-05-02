'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';

export default function AkunPenjualPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPenjual, setIsPenjual] = useState(false);
  const [userId, setUserId] = useState(null);
  const [toast, setToast] = useState(null); // { msg, type }

  // State KTP
  const [ktpFile, setKtpFile] = useState(null);
  const [ktpPreview, setKtpPreview] = useState(null);
  const [ktpUrl, setKtpUrl] = useState(null);
  const [ktpUploading, setKtpUploading] = useState(false);
  const [ktpDragOver, setKtpDragOver] = useState(false);

  const [penjual, setPenjual] = useState({
    username: '', nama: '', email: '', jenisKelamin: '',
    noTelp: '', tglLahirTgl: '', tglLahirBulan: '', tglLahirTahun: '',
    alamat: '', namaBank: '', noRekening: '', namaPemilikRekening: '',
  });

  const bulanArr = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const bulanMap = { 'Januari':'01','Februari':'02','Maret':'03','April':'04','Mei':'05','Juni':'06','Juli':'07','Agustus':'08','September':'09','Oktober':'10','November':'11','Desember':'12' };

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

        // Cek status penjual dari seller_applications
        const { data: sellerApp } = await supabase
          .from('seller_applications')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const userIsPenjual = !!sellerApp;
        setIsPenjual(userIsPenjual);

        let tglLahirTgl = '', tglLahirBulan = '', tglLahirTahun = '';
        if (profile?.birth_date) {
          const parts = profile.birth_date.split('-');
          if (parts.length === 3) {
            tglLahirTahun = parts[0];
            tglLahirBulan = bulanArr[parseInt(parts[1]) - 1] || '';
            tglLahirTgl = parseInt(parts[2]).toString();
          }
        }

        setPenjual({
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
        });

        // Load KTP jika sudah ada
        if (sellerApp?.ktp_url) {
          setKtpUrl(sellerApp.ktp_url);
          const { data: signed } = await supabase.storage
            .from('ktp-uploads')
            .createSignedUrl(sellerApp.ktp_url, 60 * 60);
          if (signed?.signedUrl) setKtpPreview(signed.signedUrl);
        }
      } catch (err) {
        console.error(err);
        showToast('Gagal memuat data profil', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const handleLogout = async (e) => {
    e.preventDefault();
    localStorage.removeItem('lelangin_user');
    localStorage.removeItem('isLoggedIn');
    window.dispatchEvent(new Event('auth-change'));
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleChange = (field) => (e) => {
    setPenjual(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Simpan perubahan data pribadi
  const handleSimpanData = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const tgl = penjual.tglLahirTgl.padStart(2, '0');
      const bln = bulanMap[penjual.tglLahirBulan] || '01';
      const thn = penjual.tglLahirTahun || '2000';

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: penjual.username,
          full_name: penjual.nama,
          gender: penjual.jenisKelamin,
          phone_number: penjual.noTelp,
          birth_date: `${thn}-${bln}-${tgl}`,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      showToast('Data berhasil disimpan!', 'success');
      setIsEditMode(false);
    } catch (err) {
      const msg = err?.message || JSON.stringify(err);
      console.error('[Simpan] Error:', JSON.stringify(err, null, 2));
      showToast('Gagal menyimpan: ' + msg, 'error');
    } finally {
      setSaving(false);
    }
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

  // Submit daftar penjual — update role + data bank
  const handleDaftarPenjual = async (e) => {
    e.preventDefault();
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
      const tgl = penjual.tglLahirTgl.padStart(2, '0');
      const bln = bulanMap[penjual.tglLahirBulan] || '01';
      const thn = penjual.tglLahirTahun || '2000';

      // 1. Update data pribadi ke profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: penjual.username,
          full_name: penjual.nama,
          gender: penjual.jenisKelamin,
          phone_number: penjual.noTelp,
          birth_date: `${thn}-${bln}-${tgl}`,
          role: 'penjual',
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 2. Upsert semua field ke seller_applications (semua NOT NULL terpenuhi)
      const { data: appData, error: appError } = await supabase
        .from('seller_applications')
        .upsert({
          user_id: userId,
          lokasi: penjual.alamat,
          ktp_url: finalKtpPath,
          nama_bank: penjual.namaBank,
          no_rekening: penjual.noRekening,
          nama_pemilik: penjual.namaPemilikRekening,
          status: 'menunggu',
        }, { onConflict: 'user_id' })
        .select();

      console.log('[Daftar] seller_applications result:', appData, appError);
      if (appError) throw appError;

      // Update localStorage
      const localUser = localStorage.getItem('lelangin_user');
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          parsed.role = 'penjual';
          parsed.isPenjual = true;
          localStorage.setItem('lelangin_user', JSON.stringify(parsed));
        } catch (_) {}
      }

      setIsPenjual(true);
      showToast('Selamat! Pendaftaran penjual berhasil dikirim.', 'success');
    } catch (err) {
      const msg = err?.message || JSON.stringify(err);
      console.error('[Daftar] Error:', JSON.stringify(err, null, 2));
      showToast('Pendaftaran gagal: ' + msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <main className="akun-main-wrapper">
      <div className="akun-container-box" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p style={{ color: '#6B7280' }}>Memuat data...</p>
      </div>
    </main>
  );

  return (
    <main className="akun-main-wrapper">
      {/* Toast notifikasi */}
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

      <div className="akun-container-box">
        <div className="akun-header-banner"><h1>Informasi Akun Saya</h1></div>
        <div className="akun-layout-split">
          <aside className="akun-sidebar">
            <div className="sidebar-profile">
              <div className="sidebar-pic">{(penjual.username || 'U').charAt(0).toUpperCase()}</div>
              <div className="sidebar-user"><h3>{penjual.username || penjual.nama}</h3><Link href="/akun">Ubah Profil</Link></div>
            </div>
            <ul className="sidebar-nav">
              <li><Link href="/akun"><i className="ph ph-smiley"></i> Akun Saya</Link></li>
              <li><Link href="/akun/penjual" className="active"><i className="ph ph-cube"></i> Penjual</Link></li>
              <li><Link href="/akun/titip-lelang"><i className="ph ph-envelope-simple-open"></i> Titip Lelang</Link></li>
              <li><a href="#" onClick={handleLogout} style={{ color: 'var(--danger)', cursor: 'pointer' }}><i className="ph ph-sign-out"></i> Keluar</a></li>
            </ul>
          </aside>

          <div className="akun-content smooth-fade">
            {isPenjual && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '8px', padding: '0.75rem 1.1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#065F46', fontWeight: 500 }}>
                <i className="ph ph-check-circle" style={{ fontSize: '1.1rem' }}></i>
                Akun kamu sudah terdaftar sebagai <strong>Penjual</strong>
              </div>
            )}

            <h2 className="akun-section-title">Profil Penjual</h2>
            <p className="akun-section-desc">
              {isPenjual
                ? 'Data akun penjual kamu. Kamu bisa mengedit informasi di bawah jika diperlukan.'
                : 'Lengkapi data berikut untuk mulai menjual produk melalui sistem lelang di Lelangin'}
            </p>

            <form onSubmit={handleDaftarPenjual} id="formDaftarPenjual">
              {/* === Data Pribadi === */}
              <div className="form-horizontal-group">
                <label>Username</label>
                <div className="input-wrapper">
                  <input type="text" value={penjual.username} disabled={!isEditMode} onChange={handleChange('username')} />
                </div>
              </div>
              <div className="form-horizontal-group">
                <label>Nama</label>
                <div className="input-wrapper">
                  <input type="text" value={penjual.nama} disabled={!isEditMode} onChange={handleChange('nama')} />
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
                  <select disabled={!isEditMode} value={penjual.jenisKelamin} onChange={handleChange('jenisKelamin')}>
                    <option value="">Pilih</option>
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                  </select>
                </div>
              </div>
              <div className="form-horizontal-group">
                <label>No Telp</label>
                <div className="input-wrapper">
                  <input type="tel" value={penjual.noTelp} disabled={!isEditMode} onChange={handleChange('noTelp')} />
                </div>
              </div>
              <div className="form-horizontal-group">
                <label>Tanggal Lahir</label>
                <div className="input-wrapper">
                  <select disabled={!isEditMode} value={penjual.tglLahirTgl} onChange={handleChange('tglLahirTgl')}>
                    <option value="">Tgl</option>
                    {Array.from({ length: 31 }, (_, i) => <option key={i} value={String(i + 1)}>{i + 1}</option>)}
                  </select>
                  <select disabled={!isEditMode} value={penjual.tglLahirBulan} onChange={handleChange('tglLahirBulan')}>
                    <option value="">Bulan</option>
                    {bulanArr.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <select disabled={!isEditMode} value={penjual.tglLahirTahun} onChange={handleChange('tglLahirTahun')}>
                    <option value="">Tahun</option>
                    {Array.from({ length: 30 }, (_, i) => <option key={i} value={String(1995 + i)}>{1995 + i}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-horizontal-group">
                <label>Lokasi <span className="required">*</span></label>
                <div className="input-wrapper">
                  <select
                    value={penjual.alamat}
                    disabled={!isEditMode && isPenjual}
                    onChange={handleChange('alamat')}
                    required
                  >
                    <option value="">Pilih Provinsi</option>
                    <option value="Banten">Banten</option>
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="DI Yogyakarta">DI Yogyakarta</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                  </select>
                </div>
              </div>

              {/* Tombol Edit / Simpan Data Pribadi */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', gap: '0.75rem' }}>
                {isEditMode ? (
                  <>
                    <button type="button" onClick={() => setIsEditMode(false)}
                      style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '0.5rem 1.25rem', fontSize: '0.875rem', color: '#6B7280', cursor: 'pointer' }}>
                      Batal
                    </button>
                    <button type="button" onClick={handleSimpanData} disabled={saving}
                      className="btn-primary-full"
                      style={{ width: 'auto', padding: '0.5rem 1.5rem', margin: 0, fontSize: '0.875rem', borderRadius: '6px' }}>
                      {saving ? 'Menyimpan...' : 'Simpan Data'}
                    </button>
                  </>
                ) : (
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsEditMode(true); }}
                    style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                    Edit
                  </a>
                )}
              </div>

              {/* === Upload KTP === */}
              <h3 className="sub-title" style={{ marginTop: '2.5rem' }}>Upload KTP</h3>
              <div className="form-horizontal-group" style={{ alignItems: 'flex-start' }}>
                <label style={{ marginTop: '1rem' }}>KTP <span className="required">*</span></label>
                <div className="input-wrapper">
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
                          cursor: 'pointer', fontSize: '0.82rem', color: 'var(--primary)',
                          border: '1px solid var(--primary)', borderRadius: '6px',
                          padding: '0.45rem 1rem', fontWeight: 500
                        }}>
                          Ganti Foto
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            style={{ display: 'none' }}
                            onChange={handleKtpInputChange}
                          />
                        </label>
                        {/* Hapus */}
                        {ktpUrl && (
                          <button
                            type="button"
                            onClick={handleHapusKtp}
                            style={{
                              background: 'none', border: '1px solid #FCA5A5', borderRadius: '6px',
                              padding: '0.45rem 1rem', fontSize: '0.82rem', color: '#DC2626', cursor: 'pointer'
                            }}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Dropzone saat belum ada file */
                    <label
                      htmlFor="ktp-file-input"
                      className={`upload-dropzone${ktpDragOver ? ' drag-over' : ''}`}
                      style={{ cursor: 'pointer', display: 'block' }}
                      onDragOver={(e) => { e.preventDefault(); setKtpDragOver(true); }}
                      onDragLeave={() => setKtpDragOver(false)}
                      onDrop={handleKtpDrop}
                    >
                      <i className="ph ph-identification-card" style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.4rem' }}></i>
                      Tarik gambar KTP ke sini atau <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>pilih file</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                        JPG, PNG, WebP — maks. 5 MB
                      </span>
                      <input
                        id="ktp-file-input"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleKtpInputChange}
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
                  <select value={penjual.namaBank} onChange={handleChange('namaBank')} required>
                    <option value=""></option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BCA">BCA</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                  </select>
                </div>
              </div>
              <div className="form-horizontal-group">
                <label>No Rekening <span className="required">*</span></label>
                <div className="input-wrapper">
                  <input type="text" value={penjual.noRekening} onChange={handleChange('noRekening')} required />
                </div>
              </div>
              <div className="form-horizontal-group">
                <label>Nama Pemilik<br />Rekening <span className="required">*</span></label>
                <div className="input-wrapper">
                  <input type="text" value={penjual.namaPemilikRekening} onChange={handleChange('namaPemilikRekening')} required />
                </div>
              </div>

              {!isPenjual && (
                <>
                  <div className="checkbox-list-inline" style={{ marginTop: '2rem' }}>
                    <label><input type="checkbox" required /> Saya menyetujui syarat dan ketentuan yang berlaku di Lelangin</label>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
                    <button type="submit" disabled={submitting} className="btn-primary-full"
                      style={{ width: 'auto', padding: '0.8rem 2.5rem', borderRadius: '6px', margin: 0, fontSize: '1rem' }}>
                      {submitting ? 'Memproses...' : 'Daftar Penjual'}
                    </button>
                  </div>
                </>
              )}

              {isPenjual && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
                  <button type="submit" disabled={submitting} className="btn-primary-full"
                    style={{ width: 'auto', padding: '0.8rem 2.5rem', borderRadius: '6px', margin: 0, fontSize: '1rem' }}>
                    {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}