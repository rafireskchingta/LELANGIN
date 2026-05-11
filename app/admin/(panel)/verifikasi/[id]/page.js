'use client';

import { useState, useEffect, use } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../../src/lib/supabase';

export default function AdminDetailVerifikasiPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { id: applicationId } = unwrappedParams;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [appData, setAppData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [ktpPreview, setKtpPreview] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [savedRejectReason, setSavedRejectReason] = useState('');
  const [rejectError, setRejectError] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (applicationId) fetchDetail();
  }, [applicationId]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setIsFadingOut(false);
    setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => { setToast(null); setIsFadingOut(false); }, 300);
    }, 2500);
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const { data: app, error: appError } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('id', applicationId)
        .maybeSingle();

      if (appError) throw appError;

      let profile = null;
      if (app) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', app.user_id)
          .maybeSingle();
        profile = p;
      }

      setAppData(app);
      setProfileData(profile);
      if (app?.catatan_admin) setSavedRejectReason(app.catatan_admin);

      if (app?.ktp_url) {
        const { data: signed } = await supabase.storage
          .from('ktp-uploads')
          .createSignedUrl(app.ktp_url, 60 * 60);
        if (signed?.signedUrl) setKtpPreview(signed.signedUrl);
      }
    } catch (err) {
      console.error('[Detail] Direct fetch error:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleApprove = async () => {
    if (!appData?.id) return;
    setProcessing(true);
    try {
      // 1. Update application status
      const { error: updateError } = await supabase
        .from('seller_applications')
        .update({ status: 'disetujui', catatan_admin: null })
        .eq('id', appData.id);

      if (updateError) throw updateError;

      // 2. Update user role in profiles
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'penjual' })
        .eq('id', appData.user_id);

      if (roleError) console.warn('Role update error:', roleError.message);

      setAppData(prev => ({ ...prev, status: 'disetujui' }));
      setIsApproveModalOpen(false);
      showToast('Pengguna berhasil diverifikasi sebagai Penjual!', 'success');
    } catch (error) {
      showToast('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!appData?.id) return;
    if (!rejectReason.trim()) {
      setRejectError(true);
      return;
    }
    setProcessing(true);
    try {
      // Update application status and reason
      const { error: updateError } = await supabase
        .from('seller_applications')
        .update({ status: 'ditolak', catatan_admin: rejectReason })
        .eq('id', appData.id);

      if (updateError) throw updateError;

      setSavedRejectReason(rejectReason);
      setAppData(prev => ({ ...prev, status: 'ditolak', catatan_admin: rejectReason }));
      setIsRejectModalOpen(false);
      setRejectReason('');
      showToast('Pengajuan penjual berhasil ditolak.', 'success');
    } catch (error) {
      showToast('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data detail penjual...</div>;

  const currentStatus = appData?.status || 'menunggu';

  // Warna bar header berdasarkan status
  const headerBg = currentStatus === 'disetujui'
    ? '#059669'
    : currentStatus === 'ditolak'
      ? '#DC2626'
      : '#4F46E5';

  return (
    <div className="admin-detail-verifikasi-page">
      {/* Toast */}
      {mounted && toast && createPortal(
        <div style={{
          position: 'fixed', top: '2rem', right: '2rem', zIndex: 9999,
          background: toast.type === 'success' ? '#10B981' : '#EF4444',
          color: '#fff', padding: '1rem 2rem', borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: 500,
          animation: isFadingOut ? 'fadeOut 0.3s forwards' : 'fadeIn 0.3s forwards'
        }}>
          {toast.message}
        </div>,
        document.body
      )}

      {/* Purple/Green/Red Header dengan Back button di sebelah kiri teks */}
      <div style={{
        background: headerBg,
        padding: '1.5rem 2rem',
        borderRadius: '12px 12px 0 0',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        transition: 'background 0.3s ease'
      }}>
        <Link href="/admin/verifikasi" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.4)',
          color: 'white',
          textDecoration: 'none',
          fontSize: '1.1rem',
          flexShrink: 0,
          transition: 'background 0.2s'
        }}>
          <i className="ph-bold ph-arrow-left"></i>
        </Link>
        <div>
          <h1 className="admin-page-title" style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>Detail Data Penjual</h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>Verifikasi akun penjual sesuai ketentuan</p>
        </div>
      </div>

      {/* Konten utama — scrollable */}
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
              {appData?.created_at ? (() => {
                const date = new Date(appData.created_at);
                const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                const day = date.getDate().toString().padStart(2, '0');
                const month = months[date.getMonth()];
                const year = date.getFullYear();
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${day} - ${month} - ${year}, ${hours} : ${minutes}`;
              })() : '-'}
            </div>
          </div>

          {/* Status Indicator — Menunggu, Disetujui, Ditolak */}
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem' }}>STATUS</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Menunggu */}
                <span className={`status-badge-large ${currentStatus === 'menunggu' ? 'menunggu active-status' : ''}`}
                  style={currentStatus !== 'menunggu' ? { background: 'transparent', border: '1px solid #D1D5DB', color: '#9CA3AF' } : {}}>
                  Menunggu
                </span>
                {/* Disetujui */}
                <span className={`status-badge-large ${currentStatus === 'disetujui' ? 'disetujui active-status' : ''}`}
                  style={currentStatus !== 'disetujui' ? { background: 'transparent', border: '1px solid #D1D5DB', color: '#9CA3AF' } : {}}>
                  Disetujui
                </span>
                {/* Ditolak */}
                <span className={`status-badge-large ${currentStatus === 'ditolak' ? 'ditolak active-status' : ''}`}
                  style={currentStatus !== 'ditolak' ? { background: 'transparent', border: '1px solid #D1D5DB', color: '#9CA3AF' } : {}}>
                  Ditolak
                </span>
              </div>
            </div>

            {/* Action buttons — hanya tampil jika status menunggu */}
            {currentStatus === 'menunggu' && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.9rem' }}>
                <button className="btn-status-action setuju" onClick={() => setIsApproveModalOpen(true)} disabled={processing} style={{ padding: '0.5rem 2rem' }}>
                  Setuju
                </button>
                <button className="btn-status-action tolak" onClick={() => setIsRejectModalOpen(true)} disabled={processing} style={{ padding: '0.5rem 2rem' }}>
                  Tolak
                </button>
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
            <label>NO TELP</label>
            <div className="info-value">{profileData?.phone_number || '-'}</div>
          </div>
          <div className="info-group">
            <label>TANGGAL LAHIR</label>
            <div className="info-value">
              {profileData?.birth_date ? new Date(profileData.birth_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' - ') : '-'}
            </div>
          </div>
          <div className="info-group">
            <label>LOKASI</label>
            <div className="info-value" style={{ minHeight: '40px', lineHeight: '1.6' }}>
              {appData?.lokasi || '-'}
            </div>
          </div>

          {/* Alasan penolakan - selalu tampil untuk ditolak, kosong untuk disetujui */}
          {currentStatus === 'ditolak' && (
            <div className="info-group" style={{ marginTop: '2.5rem' }}>
              <label style={{ color: '#DC2626' }}>ALASAN PENOLAKAN</label>
              <div className="info-value" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', color: '#991B1B' }}>
                {savedRejectReason || appData?.catatan_admin || 'Tidak ada alasan tersimpan.'}
              </div>
            </div>
          )}

          {currentStatus === 'disetujui' && (
            <div className="info-group" style={{ marginTop: '2.5rem' }}>
              <label style={{ color: '#6B7280' }}>ALASAN PENOLAKAN</label>
              <div className="info-value" style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                -
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals via Portal — render langsung ke document.body */}
      {mounted && createPortal(
        <>
          {/* Modal Penolakan */}
          <div className={`admin-modal-overlay ${isRejectModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target.classList.contains('admin-modal-overlay')) setIsRejectModalOpen(false) }}>
            <div className="admin-modal" style={{ maxWidth: '480px' }}>
              <button className="admin-modal-close" onClick={() => { setIsRejectModalOpen(false); setRejectError(false); }}>
                <i className="ph ph-x"></i>
              </button>

              <div className="admin-modal-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#EF4444', fontSize: '1.6rem' }}>Ingin Menolak Akun Penjual?</h2>
                <p style={{ marginTop: '0.5rem', color: '#4B5563', fontWeight: 500, fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Pemilik akan menerima notifikasi jika akunnya dibatalkan dan dapat mengajukan akun penjual kembali.
                </p>
              </div>

              <div className="modal-reject-container" style={{ padding: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.6rem' }}>Alasan Menolak Akun</label>
                <textarea
                  className={rejectError ? 'error-state' : ''}
                  placeholder="Berikan alasan menolak akun"
                  value={rejectReason}
                  onChange={(e) => { setRejectReason(e.target.value); if(e.target.value.trim()) setRejectError(false); }}
                ></textarea>
                {rejectError && (
                  <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '-0.5rem', marginBottom: '1rem', fontWeight: 500, animation: 'fadeIn 0.3s ease' }}>
                    Alasan penolakan wajib diisi.
                  </div>
                )}

                <div className="modal-reject-actions" style={{ marginTop: '0.5rem' }}>
                  <button className="btn-reject-cancel" onClick={() => { setIsRejectModalOpen(false); setRejectError(false); }}>Kembali</button>
                  <button className="btn-reject-confirm" onClick={handleReject} disabled={processing}>
                    {processing ? 'Memproses...' : 'Tolak Akun Penjual'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Persetujuan */}
          <div className={`admin-modal-overlay ${isApproveModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target.classList.contains('admin-modal-overlay')) setIsApproveModalOpen(false) }}>
            <div className="admin-modal" style={{ maxWidth: '480px' }}>
              <button className="admin-modal-close" onClick={() => setIsApproveModalOpen(false)}>
                <i className="ph ph-x"></i>
              </button>

              <div className="admin-modal-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#059669', fontSize: '1.6rem' }}>Setujui Akun Penjual?</h2>
                <p style={{ marginTop: '0.5rem', color: '#4B5563', fontWeight: 500, fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Dengan menyetujui, pengguna ini akan mendapatkan akses penuh sebagai penjual dan dapat mulai membuat lelang di platform Lelangin.
                </p>
              </div>

              <div className="modal-approve-container" style={{ padding: 0 }}>
                <div className="modal-approve-actions" style={{ marginTop: '1.5rem' }}>
                  <button className="btn-approve-cancel" onClick={() => setIsApproveModalOpen(false)}>Kembali</button>
                  <button className="btn-approve-confirm" onClick={handleApprove} disabled={processing}>
                    {processing ? 'Memproses...' : 'Setujui Akun Penjual'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

    </div>
  );
}
