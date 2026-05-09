'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../../src/lib/supabase';

export default function AdminDetailVerifikasiPage({ params }) {
  const router = useRouter();
  const { id: userId } = params;
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [appData, setAppData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [ktpPreview, setKtpPreview] = useState(null);
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [savedRejectReason, setSavedRejectReason] = useState('');

  useEffect(() => {
    if (userId) fetchDetail();
  }, [userId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      // Fetch application
      const { data: app, error: appError } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (appError) throw appError;

      // Fetch profile
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profError) throw profError;

      setAppData(app || {
        lokasi: 'Jawa Tengah',
        nama_bank: 'MANDIRI',
        no_rekening: '3437-8274-9343-8749-238',
        nama_pemilik: 'Safira Zahra',
        status: 'menunggu',
        created_at: '2024-01-17T10:32:00Z',
        ktp_url: null
      });

      setProfileData(profile || {
        full_name: 'Safira Zahra Asshifa',
        username: 'safirraa123',
        email: 'safirraazahra@gmail.com',
        gender: 'Perempuan',
        phone_number: '+62837484368',
        birth_date: '2006-01-17',
        role: 'user'
      });

      // Fetch signed KTP URL if exists
      if (app?.ktp_url) {
        const { data: signed } = await supabase.storage
          .from('ktp-uploads')
          .createSignedUrl(app.ktp_url, 60 * 60);
        if (signed?.signedUrl) setKtpPreview(signed.signedUrl);
      }

      // If status is ditolak, fetch reason from history
      if (app?.status === 'ditolak') {
        const { data: history } = await supabase
          .from('seller_applications_history')
          .select('reason')
          .eq('user_id', userId)
          .eq('status', 'ditolak')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (history?.reason) {
          setSavedRejectReason(history.reason);
        } else {
          setSavedRejectReason('Ditolak oleh admin tanpa alasan spesifik.');
        }
      }

    } catch (error) {
      console.warn('Error fetching details:', error);
      // Fallback
      setAppData({
        lokasi: 'Jawa Tengah',
        nama_bank: 'MANDIRI',
        no_rekening: '3437-8274-9343-8749-238',
        nama_pemilik: 'Safira Zahra',
        status: 'menunggu',
        created_at: '2024-01-17T10:32:00Z',
        ktp_url: null
      });
      setProfileData({
        full_name: 'Safira Zahra Asshifa',
        username: 'safirraa123',
        email: 'safirraazahra@gmail.com',
        gender: 'Perempuan',
        phone_number: '+62837484368',
        birth_date: '2006-01-17',
        role: 'user'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Anda yakin ingin menyetujui pengguna ini sebagai penjual?')) return;
    setProcessing(true);
    try {
      // 1. Update seller_applications
      const { error: appError } = await supabase
        .from('seller_applications')
        .update({ status: 'disetujui' })
        .eq('user_id', userId);
      
      // 2. Insert to history
      await supabase.from('seller_applications_history').insert({
        user_id: userId,
        status: 'disetujui'
      });

      // 3. Update profiles role to 'penjual'
      await supabase.from('profiles').update({ role: 'penjual' }).eq('id', userId);

      setAppData(prev => ({ ...prev, status: 'disetujui' }));
      alert('Pengguna berhasil diverifikasi sebagai Penjual!');
    } catch (error) {
      alert('Terjadi kesalahan: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Harap masukkan alasan penolakan.');
      return;
    }
    setProcessing(true);
    try {
      // 1. Update seller_applications
      await supabase
        .from('seller_applications')
        .update({ status: 'ditolak' })
        .eq('user_id', userId);
      
      // 2. Insert to history
      await supabase.from('seller_applications_history').insert({
        user_id: userId,
        status: 'ditolak',
        reason: rejectReason
      });

      setSavedRejectReason(rejectReason);
      setAppData(prev => ({ ...prev, status: 'ditolak' }));
      setIsRejectModalOpen(false);
      alert('Pengajuan penjual berhasil ditolak.');
    } catch (error) {
      alert('Terjadi kesalahan: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data detail penjual...</div>;

  const currentStatus = appData?.status || 'menunggu';

  return (
    <div className="admin-detail-verifikasi-page">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-header-with-back">
          <Link href="/admin/verifikasi" className="admin-back-link">
            <i className="ph ph-arrow-left"></i>
          </Link>
        </div>
      </div>

      <div style={{ background: '#4F46E5', padding: '1.5rem 2rem', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', color: 'white' }}>
        <h1 className="admin-page-title" style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>Detail Data Penjual</h1>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>Verifikasi akun penjual sesuai ketentuan</p>
      </div>

      <div className="detail-verifikasi-layout" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
        {/* Kolom Kiri */}
        <div>
          <h3 className="detail-section-title">KARTU TANDA PENDUDUK</h3>
          <div className="ktp-image-box">
            {ktpPreview ? (
              <img src={ktpPreview} alt="KTP Penjual" />
            ) : (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9CA3AF', border: '2px dashed #E5E7EB', borderRadius: '8px' }}>
                <i className="ph ph-image-broken" style={{ fontSize: '2rem' }}></i>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>Gambar KTP tidak tersedia atau belum diunggah.</p>
              </div>
            )}
          </div>

          <h3 className="detail-section-title">INFORMASI PEMBAYARAN</h3>
          <div className="info-group">
            <label>NAMA BANK</label>
            <div className="info-value">{appData?.nama_bank || '-'}</div>
          </div>
          <div className="info-group">
            <label>NO REKENING</label>
            <div className="info-value">{appData?.no_rekening || '-'}</div>
          </div>
          <div className="info-group">
            <label>NAMA PEMILIK REKENING</label>
            <div className="info-value">{appData?.nama_pemilik || '-'}</div>
          </div>

          <h3 className="detail-section-title" style={{ marginTop: '2.5rem' }}>INFORMASI PENGAJUAN</h3>
          <div className="info-group">
            <label>WAKTU PENGAJUAN</label>
            <div className="info-value">
              {appData?.created_at ? new Date(appData.created_at).toLocaleString('id-ID', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'}).replace(/\//g, ' - ').replace(/\./g, ' : ') : '-'}
            </div>
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>STATUS</label>
            {currentStatus === 'menunggu' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="status-badge-large menunggu">Menunggu</span>
                <button className="btn-status-action tolak" onClick={() => setIsRejectModalOpen(true)} disabled={processing}>Tolak</button>
                <button className="btn-status-action setuju" onClick={handleApprove} disabled={processing}>Setuju</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="status-badge-large menunggu" style={{ opacity: 0.5 }}>Menunggu</span>
                <span className={`status-badge-large ${currentStatus === 'ditolak' ? 'ditolak' : ''}`} style={{ opacity: currentStatus === 'ditolak' ? 1 : 0.5, border: currentStatus === 'ditolak' ? undefined : '1px solid #D1D5DB', background: currentStatus === 'ditolak' ? undefined : 'transparent', color: currentStatus === 'ditolak' ? undefined : '#9CA3AF' }}>Ditolak</span>
                <span className={`status-badge-large ${currentStatus === 'disetujui' ? 'disetujui' : ''}`} style={{ opacity: currentStatus === 'disetujui' ? 1 : 0.5, border: currentStatus === 'disetujui' ? undefined : '1px solid #D1D5DB', background: currentStatus === 'disetujui' ? undefined : 'transparent', color: currentStatus === 'disetujui' ? undefined : '#9CA3AF' }}>Disetujui</span>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan */}
        <div>
          <h3 className="detail-section-title">PROFIL PENJUAL</h3>
          <div className="info-group">
            <label>NAMA</label>
            <div className="info-value">{profileData?.full_name || '-'}</div>
          </div>
          <div className="info-group">
            <label>USERNAME</label>
            <div className="info-value">{profileData?.username || '-'}</div>
          </div>
          <div className="info-group">
            <label>EMAIL</label>
            <div className="info-value">{profileData?.email || '-'}</div>
          </div>
          <div className="info-group">
            <label>JENIS KELAMIN</label>
            <div className="info-value">{profileData?.gender || '-'}</div>
          </div>
          <div className="info-group">
            <label>No Telp</label>
            <div className="info-value">{profileData?.phone_number || '-'}</div>
          </div>
          <div className="info-group">
            <label>TANGGAL LAHIR</label>
            <div className="info-value">
              {profileData?.birth_date ? new Date(profileData.birth_date).toLocaleDateString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, ' - ') : '-'}
            </div>
          </div>
          <div className="info-group">
            <label>ALAMAT</label>
            <div className="info-value" style={{ minHeight: '80px', lineHeight: '1.6' }}>
              {appData?.lokasi || profileData?.address || 'Alamat lengkap penjual...'}
            </div>
          </div>

          {currentStatus === 'ditolak' && (
            <div className="info-group" style={{ marginTop: '2.5rem' }}>
              <label style={{ color: '#4F46E5' }}>ALASAN PENOLAKAN</label>
              <div className="info-value" style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}>
                {savedRejectReason || 'Tidak ada alasan tersimpan.'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Penolakan */}
      <div className={`admin-modal-overlay ${isRejectModalOpen ? 'active' : ''}`} onClick={(e) => { if(e.target.classList.contains('admin-modal-overlay')) setIsRejectModalOpen(false) }}>
        <div className="admin-modal" style={{ maxWidth: '450px' }}>
          <button className="admin-modal-close" onClick={() => setIsRejectModalOpen(false)}>
            <i className="ph ph-x"></i>
          </button>
          
          <div className="modal-reject-container">
            <h2>Ingin Menolak Akun Penjual?</h2>
            <p>Pemilik akan menerima notifikasi jika akunnya dibatalkan dan dapat mengajukan akun penjual kembali.</p>
            
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Alasan Menolak Akun</label>
            <textarea 
              placeholder="Berikan alasan menolak akun"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>
            
            <div className="modal-reject-actions">
              <button className="btn-reject-cancel" onClick={() => setIsRejectModalOpen(false)}>Kembali</button>
              <button className="btn-reject-confirm" onClick={handleReject} disabled={processing}>
                {processing ? 'Memproses...' : 'Tolak Akun Penjual'}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
