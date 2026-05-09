'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../../src/lib/supabase';

export default function AdminAkunTerhapusPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeletedUsers();
  }, []);

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

  const handleRestore = async (id) => {
    if (!confirm('Anda yakin ingin mengembalikan pengguna ini?')) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;
      setUsers(users.filter(u => u.id !== id));
      alert('Pengguna berhasil dikembalikan.');
    } catch (error) {
      alert('Gagal mengembalikan pengguna: ' + error.message);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!confirm('PERINGATAN: Tindakan ini akan menghapus data profil secara permanen. Lanjutkan?')) return;
    try {
      // Catatan: Ini hanya menghapus profile. Akun Auth user tetap ada jika tidak dihapus dari supabase.auth.admin.
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setUsers(users.filter(u => u.id !== id));
      alert('Profil pengguna berhasil dihapus permanen.');
    } catch (error) {
      alert('Gagal menghapus permanen: ' + error.message);
    }
  };

  return (
    <div className="admin-users-terhapus-page">
      <div className="admin-page-header">
        <div>
          <div className="admin-header-with-back">
            <Link href="/admin/users" className="admin-back-link">
              <i className="ph ph-arrow-left"></i>
            </Link>
            <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Akun Terhapus</h1>
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
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Memuat data...</td></tr>
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
                        <button className="admin-badge-blue-text" onClick={() => handleRestore(user.id)}>Kembalikan</button>
                        <button className="admin-badge-red-text" onClick={() => handlePermanentDelete(user.id)}>Hapus Permanen</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
