'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { supabase } from '../../../../../src/lib/supabase';

export default function AdminAkunTerhapusPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Restore Modal
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoring, setRestoring] = useState(false);

  // Permanent Delete Modal
  const [isPermDeleteModalOpen, setIsPermDeleteModalOpen] = useState(false);
  const [permDeleteTarget, setPermDeleteTarget] = useState(null);
  const [permDeleting, setPermDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDeletedUsers();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setIsFadingOut(false);
    setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => { setToast(null); setIsFadingOut(false); }, 300);
    }, 3000);
  };

  const fetchDeletedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching deleted users:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const openRestoreModal = (user) => {
    setRestoreTarget(user);
    setIsRestoreModalOpen(true);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: null })
        .eq('id', restoreTarget.id);

      if (error) throw error;
      setUsers(users.filter(u => u.id !== restoreTarget.id));
      showToast('Pengguna berhasil dikembalikan.');
      setIsRestoreModalOpen(false);
      setRestoreTarget(null);
    } catch (error) {
      showToast('Gagal mengembalikan pengguna: ' + error.message, 'error');
    } finally {
      setRestoring(false);
    }
  };

  const openPermDeleteModal = (user) => {
    setPermDeleteTarget(user);
    setIsPermDeleteModalOpen(true);
  };

  const handlePermanentDelete = async () => {
    if (!permDeleteTarget) return;
    setPermDeleting(true);
    try {
      // Catatan: Ini hanya menghapus profile. Akun Auth user tetap ada jika tidak dihapus dari supabase.auth.admin.
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', permDeleteTarget.id);

      if (error) throw error;
      setUsers(users.filter(u => u.id !== permDeleteTarget.id));
      showToast('Profil pengguna berhasil dihapus permanen.');
      setIsPermDeleteModalOpen(false);
      setPermDeleteTarget(null);
    } catch (error) {
      showToast('Gagal menghapus permanen: ' + error.message, 'error');
    } finally {
      setPermDeleting(false);
    }
  };

  return (
    <div className="admin-users-terhapus-page">
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

      <div className="admin-page-header">
        <div>
          <div className="admin-header-with-back">
            <Link href="/admin/users" className="admin-back-link">
              <i className="ph ph-arrow-left"></i>
            </Link>
            <h1 className="admin-page-title" style={{ marginBottom: 0, color: '#DC2626' }}>Akun Terhapus</h1>
          </div>
          <span className="admin-subtitle" style={{ marginLeft: '56px' }}>
            Daftar pengguna yang telah dihapus atau dinonaktifkan
          </span>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>NAMA LENGKAP</th>
              <th>USERNAME</th>
              <th>EMAIL</th>
              <th>TGL DIHAPUS</th>
              <th>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <div style={{ height: '20px', borderRadius: '4px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Tidak ada akun yang terhapus.</td></tr>
            ) : (
              users.map((user, index) => {
                const deletedDate = user.deleted_at 
                  ? new Date(user.deleted_at).toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':')
                  : '-';
                  
                return (
                  <tr key={user.id}>
                    <td>{index + 1}.</td>
                    <td><strong>{user.full_name || 'Tanpa Nama'}</strong></td>
                    <td><span style={{color: '#4F46E5'}}>@{user.username || 'user'}</span></td>
                    <td><a href={`mailto:${user.email}`}>{user.email}</a></td>
                    <td>{deletedDate}</td>
                    <td>
                      <div className="admin-action-btns">
                        <button className="admin-badge-blue-text" onClick={() => openRestoreModal(user)}>Kembalikan</button>
                        <button className="admin-badge-red-text" onClick={() => openPermDeleteModal(user)}>Hapus Permanen</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals via Portal */}
      {mounted && createPortal(
        <>
          {/* Restore Modal */}
          <div className={`admin-modal-overlay ${isRestoreModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target.classList.contains('admin-modal-overlay')) { setIsRestoreModalOpen(false); setRestoreTarget(null); } }}>
            <div className="admin-modal" style={{ maxWidth: '480px' }}>
              <button className="admin-modal-close" onClick={() => { setIsRestoreModalOpen(false); setRestoreTarget(null); }}>
                <i className="ph ph-x"></i>
              </button>

              <div className="admin-modal-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#059669', fontSize: '1.6rem' }}>Kembalikan Akun Pengguna?</h2>
                <p style={{ marginTop: '0.5rem', color: '#4B5563', fontWeight: 500, fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Akun <strong>{restoreTarget?.full_name || restoreTarget?.username || 'pengguna'}</strong> akan dikembalikan ke daftar pengguna aktif dan dapat mengakses platform kembali.
                </p>
              </div>

              <div className="modal-reject-actions" style={{ marginTop: '0.5rem' }}>
                <button className="btn-reject-cancel" onClick={() => { setIsRestoreModalOpen(false); setRestoreTarget(null); }}>Kembali</button>
                <button className="btn-approve-confirm" onClick={handleRestore} disabled={restoring} style={{ borderRadius: '8px' }}>
                  {restoring ? 'Memproses...' : 'Ya, Kembalikan'}
                </button>
              </div>
            </div>
          </div>

          {/* Permanent Delete Modal */}
          <div className={`admin-modal-overlay ${isPermDeleteModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target.classList.contains('admin-modal-overlay')) { setIsPermDeleteModalOpen(false); setPermDeleteTarget(null); } }}>
            <div className="admin-modal" style={{ maxWidth: '480px' }}>
              <button className="admin-modal-close" onClick={() => { setIsPermDeleteModalOpen(false); setPermDeleteTarget(null); }}>
                <i className="ph ph-x"></i>
              </button>

              <div className="admin-modal-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#EF4444', fontSize: '1.6rem' }}>Hapus Permanen Pengguna?</h2>
                <p style={{ marginTop: '0.5rem', color: '#4B5563', fontWeight: 500, fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Data profil <strong>{permDeleteTarget?.full_name || permDeleteTarget?.username || 'pengguna'}</strong> akan dihapus secara permanen dan <strong style={{ color: '#DC2626' }}>tidak dapat dikembalikan</strong>. Pastikan Anda yakin sebelum melanjutkan.
                </p>
              </div>

              <div className="modal-reject-actions" style={{ marginTop: '0.5rem' }}>
                <button className="btn-reject-cancel" onClick={() => { setIsPermDeleteModalOpen(false); setPermDeleteTarget(null); }}>Kembali</button>
                <button className="btn-reject-confirm" onClick={handlePermanentDelete} disabled={permDeleting}>
                  {permDeleting ? 'Menghapus...' : 'Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
