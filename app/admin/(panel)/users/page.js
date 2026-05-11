'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { supabase } from '../../../../src/lib/supabase';
import CustomSelect from '../../../../components/CustomSelect';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [dateError, setDateError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUsers();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setIsFadingOut(false);
    setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => setToast(null), 300);
    }, 3000);
  };

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    full_name: '', username: '', gender: '', phone_number: '', 
    birth_date_tgl: '', birth_date_bln: '', birth_date_thn: '', 
    email: '', role: '', password: ''
  });

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Anda yakin ingin menghapus pengguna ini?')) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setUsers(users.filter(u => u.id !== id));
      showToast('Pengguna berhasil dihapus.');
    } catch (error) {
      showToast('Gagal menghapus pengguna: ' + error.message, 'error');
    }
  };

  const openEditModal = (user) => {
    let tgl = '', bln = '', thn = '';
    if (user.birth_date) {
      const parts = user.birth_date.split('-');
      if (parts.length === 3) {
        thn = parts[0];
        const blnIndex = parseInt(parts[1]) - 1;
        const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        bln = bulanArr[blnIndex] || '';
        tgl = parseInt(parts[2]).toString();
      }
    }

    setEditFormData({
      id: user.id,
      full_name: user.full_name || '',
      username: user.username || '',
      gender: (user.gender || '').toLowerCase(),
      phone_number: user.phone_number || '',
      birth_date_tgl: tgl,
      birth_date_bln: bln,
      birth_date_thn: thn,
      email: user.email || '',
      role: (user.role || 'user').toLowerCase()
    });
    setIsEditMode(false);
    setDateError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const bulanMap = {
        'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
        'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
        'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
      };

      const tgl = (editFormData.birth_date_tgl || '1').toString().padStart(2, '0');
      const bln = bulanMap[editFormData.birth_date_bln] || '01';
      const thn = editFormData.birth_date_thn || '2000';
      const birthDate = `${thn}-${bln}-${tgl}`;

      const dateObj = new Date(birthDate);
      const now = new Date();
      if (dateObj.getMonth() + 1 !== parseInt(bln) || dateObj > now) {
        setDateError('Data tanggal lahir kurang valid.');
        return;
      }
      setDateError(null);

      const payload = {
        id: editFormData.id,
        full_name: editFormData.full_name,
        username: editFormData.username,
        gender: editFormData.gender.charAt(0).toUpperCase() + editFormData.gender.slice(1),
        phone_number: editFormData.phone_number,
        birth_date: birthDate,
        role: editFormData.role
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: payload.full_name,
          username: payload.username,
          gender: payload.gender,
          phone_number: payload.phone_number,
          birth_date: payload.birth_date,
          role: payload.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', payload.id);

      if (updateError) throw updateError;
      
      showToast('Data pengguna berhasil diperbarui.');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      showToast('Gagal memperbarui pengguna: ' + error.message, 'error');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    const bulanMap = {
      'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
      'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
      'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
    };
    const tgl = (addFormData.birth_date_tgl || '1').toString().padStart(2, '0');
    const bln = bulanMap[addFormData.birth_date_bln] || '01';
    const thn = addFormData.birth_date_thn || '2000';
    const birthDate = `${thn}-${bln}-${tgl}`;

    const dateObj = new Date(birthDate);
    const now = new Date();
    if (dateObj.getMonth() + 1 !== parseInt(bln) || dateObj > now) {
      setDateError('Data tanggal lahir kurang valid.');
      return;
    }
    setDateError(null);

    showToast('Fungsi tambah pengguna lewat admin perlu integrasi Auth Server-Side / Edge Functions karena Supabase tidak mengizinkan bypass admin auth client-side tanpa key khusus. (Harap gunakan halaman register publik untuk simulasi demo)', 'error');
    setIsAddModalOpen(false);
  };

  return (
    <div className="admin-users-page">
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
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Manajemen User</h1>
        <div className="admin-page-actions">
          <Link href="/admin/users/terhapus" className="btn-admin-outline">
            <i className="ph ph-archive-box"></i> Akun Terhapus
          </Link>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-admin-primary">
            <i className="ph ph-plus"></i> Tambah User
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>NAMA LENGKAP</th>
              <th>USERNAME</th>
              <th>ROLE</th>
              <th>EMAIL</th>
              <th>GENDER</th>
              <th>PHONE</th>
              <th>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{textAlign: 'center'}}>Memuat data...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="8" style={{textAlign: 'center'}}>Tidak ada data pengguna.</td></tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}.</td>
                  <td><strong>{user.full_name || 'Tanpa Nama'}</strong></td>
                  <td><span style={{color: '#4F46E5'}}>@{user.username || 'user'}</span></td>
                  <td>
                    <span className={`admin-badge ${user.role?.toLowerCase() === 'admin' ? 'admin-badge-admin' : 'admin-badge-user'}`}>
                      {user.role || 'USER'}
                    </span>
                  </td>
                  <td><a href={`mailto:${user.email}`}>{user.email}</a></td>
                  <td>{user.gender || '-'}</td>
                  <td>{user.phone_number || '-'}</td>
                  <td>
                    <div className="admin-action-btns">
                      <button className="admin-action-btn" onClick={() => openEditModal(user)}><i className="ph ph-pencil-simple"></i></button>
                      <button className="admin-action-btn" onClick={() => handleDelete(user.id)}><i className="ph ph-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mounted && createPortal(
        <>
          {/* Tambah User Modal */}
          <div className={`admin-modal-overlay ${isAddModalOpen ? 'active' : ''}`}>
            <div className="admin-modal">
              <button className="admin-modal-close" onClick={() => setIsAddModalOpen(false)}>
                <i className="ph ph-x"></i>
              </button>
              
              <div className="admin-modal-header">
                <h2>Tambah Pengguna</h2>
                <p>Daftarkan akun pengguna baru</p>
              </div>

              <form className="admin-modal-form" onSubmit={handleAddSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' }}>
                  <div className="form-group">
                    <label>Nama Lengkap</label>
                    <input type="text" required />
                  </div>
                  
                  <div className="form-group">
                    <label>Nama Akun (Username)</label>
                    <input type="text" required />
                  </div>

                  <div className="form-group">
                    <label>Jenis Kelamin</label>
                    <CustomSelect 
                      options={[
                        { label: 'Pria', value: 'pria' },
                        { label: 'Wanita', value: 'wanita' }
                      ]}
                      value={addFormData.gender}
                      onChange={(val) => setAddFormData({...addFormData, gender: val})}
                      placeholder="Pilih Jenis Kelamin"
                    />
                  </div>

                  <div className="form-group">
                    <label>No Telp</label>
                    <input type="tel" required />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" required />
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <CustomSelect 
                      options={[
                        { label: 'Pembeli', value: 'pembeli' },
                        { label: 'Penjual', value: 'penjual' },
                        { label: 'Admin', value: 'admin' }
                      ]}
                      value={addFormData.role}
                      onChange={(val) => setAddFormData({...addFormData, role: val})}
                      placeholder="Pilih Role"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label>Tanggal Lahir</label>
                  <div className="date-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <CustomSelect 
                      error={!!dateError}
                      options={Array.from({ length: 31 }, (_, i) => ({ label: (i + 1).toString(), value: (i + 1).toString() }))}
                      value={addFormData.birth_date_tgl}
                      onChange={(val) => { setAddFormData({...addFormData, birth_date_tgl: val}); setDateError(null); }}
                      placeholder="Tanggal"
                    />
                    <CustomSelect 
                      error={!!dateError}
                      options={['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(b => ({ label: b, value: b }))}
                      value={addFormData.birth_date_bln}
                      onChange={(val) => { setAddFormData({...addFormData, birth_date_bln: val}); setDateError(null); }}
                      placeholder="Bulan"
                    />
                    <CustomSelect 
                      error={!!dateError}
                      options={Array.from({ length: 100 }, (_, i) => ({ label: (1925 + i).toString(), value: (1925 + i).toString() }))}
                      value={addFormData.birth_date_thn}
                      onChange={(val) => { setAddFormData({...addFormData, birth_date_thn: val}); setDateError(null); }}
                      placeholder="Tahun"
                    />
                  </div>
                  {dateError && (
                    <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 500 }}>
                      {dateError}
                    </div>
                  )}
                </div>

                <div className="admin-modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Kembali</button>
                  <button type="submit" className="btn-submit">Buat Akun</button>
                </div>
              </form>
            </div>
          </div>

          {/* Edit User Modal */}
          <div className={`admin-modal-overlay ${isEditModalOpen ? 'active' : ''}`}>
            <div className="admin-modal">
              <button className="admin-modal-close" onClick={() => setIsEditModalOpen(false)}>
                <i className="ph ph-x"></i>
              </button>
              
              <div className="admin-modal-header">
                <h2>Edit Data Pengguna</h2>
                {editFormData && <p style={{ fontWeight: 600 }}>ID_User : {editFormData.id}</p>}
              </div>

              {editFormData && (
                <form className="admin-modal-form" onSubmit={handleEditSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' }}>
                    <div className="form-group">
                      <label>Nama Lengkap</label>
                      <input type="text" disabled={!isEditMode} value={editFormData.full_name} onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})} required style={{ backgroundColor: isEditMode ? '#FFFFFF' : '#E5E7EB' }} />
                    </div>
                    
                    <div className="form-group">
                      <label>Nama Akun (Username)</label>
                      <input type="text" disabled={!isEditMode} value={editFormData.username} onChange={(e) => setEditFormData({...editFormData, username: e.target.value})} required style={{ backgroundColor: isEditMode ? '#FFFFFF' : '#E5E7EB' }} />
                    </div>

                    <div className="form-group">
                      <label>Jenis Kelamin</label>
                      <CustomSelect 
                        disabled={!isEditMode}
                        options={[
                          { label: 'Pria', value: 'pria' },
                          { label: 'Wanita', value: 'wanita' }
                        ]}
                        value={editFormData.gender ? editFormData.gender.toLowerCase() : ''}
                        onChange={(val) => setEditFormData({...editFormData, gender: val})}
                        placeholder="Pilih Jenis Kelamin"
                      />
                    </div>

                    <div className="form-group">
                      <label>No Telp</label>
                      <input type="tel" disabled={!isEditMode} value={editFormData.phone_number} onChange={(e) => setEditFormData({...editFormData, phone_number: e.target.value.replace(/\D/g, '')})} required style={{ backgroundColor: isEditMode ? '#FFFFFF' : '#E5E7EB' }} />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" disabled={true} value={editFormData.email} title="Email tidak dapat diubah" style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }} />
                    </div>

                    <div className="form-group">
                      <label>Role</label>
                      <CustomSelect 
                        disabled={!isEditMode}
                        options={[
                          { label: 'Pembeli', value: 'pembeli' },
                          { label: 'Penjual', value: 'penjual' },
                          { label: 'Admin', value: 'admin' }
                        ]}
                        value={editFormData.role}
                        onChange={(val) => setEditFormData({...editFormData, role: val})}
                        placeholder="Pilih Role"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label>Tanggal Lahir</label>
                    <div className="date-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      <CustomSelect 
                        disabled={!isEditMode}
                        error={!!dateError}
                        options={Array.from({ length: 31 }, (_, i) => ({ label: (i + 1).toString(), value: (i + 1).toString() }))}
                        value={editFormData.birth_date_tgl}
                        onChange={(val) => { setEditFormData({...editFormData, birth_date_tgl: val}); setDateError(null); }}
                        placeholder="Tanggal"
                      />
                      <CustomSelect 
                        disabled={!isEditMode}
                        error={!!dateError}
                        options={['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(b => ({ label: b, value: b }))}
                        value={editFormData.birth_date_bln}
                        onChange={(val) => { setEditFormData({...editFormData, birth_date_bln: val}); setDateError(null); }}
                        placeholder="Bulan"
                      />
                      <CustomSelect 
                        disabled={!isEditMode}
                        error={!!dateError}
                        options={Array.from({ length: 100 }, (_, i) => ({ label: (1925 + i).toString(), value: (1925 + i).toString() }))}
                        value={editFormData.birth_date_thn}
                        onChange={(val) => { setEditFormData({...editFormData, birth_date_thn: val}); setDateError(null); }}
                        placeholder="Tahun"
                      />
                    </div>
                    {dateError && (
                      <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 500 }}>
                        {dateError}
                      </div>
                    )}
                  </div>

                  <div className="admin-modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Kembali</button>
                    {!isEditMode ? (
                      <button type="button" className="btn-submit" onClick={(e) => { e.preventDefault(); setIsEditMode(true); }}>Edit</button>
                    ) : (
                      <button type="submit" className="btn-submit">Simpan</button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
