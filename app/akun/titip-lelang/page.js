'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';

const statusColor = {
  'Berlangsung': { bg: '#D1FAE5', color: '#065F46' },
  'Menunggu':    { bg: '#FEF3C7', color: '#92400E' },
  'Selesai':     { bg: '#E5E7EB', color: '#374151' },
  'Ditolak':     { bg: '#FEE2E2', color: '#991B1B' },
};

export default function TitipLelangPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [produkList, setProdukList] = useState([]);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState(null);
  const [isPenjual, setIsPenjual] = useState(false);
  const [toast, setToast] = useState(null);

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

        // Ambil profil user
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name, role')
          .eq('id', session.user.id)
          .single();

        setUsername(profile?.username || profile?.full_name || '');
        const userIsPenjual = profile?.role === 'penjual';
        setIsPenjual(userIsPenjual);

        if (userIsPenjual) {
          // Ambil produk titip lelang milik user ini
          const { data: produk, error: produkError } = await supabase
            .from('produk')
            .select('id, nama_produk, kategori, harga_awal, status_lelang, tanggal_selesai')
            .eq('penjual_id', session.user.id)
            .order('created_at', { ascending: false });

          if (produkError) {
            console.error('Produk fetch error:', produkError);
            // Kolom mungkin berbeda, coba fallback
          } else {
            setProdukList(produk || []);
          }
        }
      } catch (err) {
        console.error(err);
        showToast('Gagal memuat data', 'error');
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

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleHapus = async () => {
    if (selected.length === 0) return;
    if (!confirm(`Hapus ${selected.length} produk yang dipilih?`)) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('produk')
        .delete()
        .in('id', selected);

      if (error) throw error;

      setProdukList(prev => prev.filter(p => !selected.includes(p.id)));
      setSelected([]);
      showToast(`${selected.length} produk berhasil dihapus`, 'success');
    } catch (err) {
      showToast('Gagal menghapus: ' + err.message, 'error');
    } finally {
      setDeleting(false);
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
              <div className="sidebar-pic">{(username || 'U').charAt(0).toUpperCase()}</div>
              <div className="sidebar-user"><h3>{username}</h3><Link href="/akun">Ubah Profil</Link></div>
            </div>
            <ul className="sidebar-nav">
              <li><Link href="/akun"><i className="ph ph-smiley"></i> Akun Saya</Link></li>
              <li><Link href="/akun/penjual"><i className="ph ph-cube"></i> Penjual</Link></li>
              <li><Link href="/akun/titip-lelang" className="active"><i className="ph ph-envelope-simple-open"></i> Titip Lelang</Link></li>
              <li><a href="#" onClick={handleLogout} style={{ color: 'var(--danger)', cursor: 'pointer' }}><i className="ph ph-sign-out"></i> Keluar</a></li>
            </ul>
          </aside>

          <div className="akun-content smooth-fade">
            {/* Header */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Produk Titip Lelang</h2>
            </div>

            {/* Belum jadi penjual */}
            {!isPenjual ? (
              <div style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', padding: '3rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#D1D5DB' }}>
                  <i className="ph ph-lock-simple"></i>
                </div>
                <p style={{ fontWeight: 600, fontSize: '1rem', color: '#374151', margin: '0 0 0.5rem' }}>Fitur ini khusus untuk Penjual</p>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0 0 1.5rem' }}>Daftar sebagai penjual terlebih dahulu untuk mulai menitipkan produk lelang.</p>
                <Link href="/akun/penjual" className="btn-primary-full"
                  style={{ width: 'auto', margin: '0 auto', padding: '0.65rem 2rem', fontSize: '0.9rem', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }}>
                  Daftar Penjual
                </Link>
              </div>
            ) : (
              <div style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', minHeight: '400px', padding: '1.5rem' }}>
                {/* Action bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>
                    {produkList.length} produk terdaftar
                    {selected.length > 0 && ` · ${selected.length} dipilih`}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link href="/status-lelang?role=penjual" className="btn-primary-full"
                      style={{ width: 'auto', margin: 0, padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '999px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                      Tampilkan Seluruh Produk
                    </Link>
                    <Link href="/akun/tambah-produk" title="Tambah produk"
                      style={{ border: 'none', background: '#EEF2FF', color: 'var(--primary)', width: '35px', height: '35px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                      <i className="ph ph-plus"></i>
                    </Link>
                    <button title="Hapus produk dipilih" onClick={handleHapus} disabled={deleting}
                      style={{ border: 'none', background: selected.length > 0 ? '#FEE2E2' : '#EEF2FF', color: selected.length > 0 ? '#DC2626' : '#9CA3AF', width: '35px', height: '35px', borderRadius: '50%', fontSize: '1.2rem', cursor: selected.length > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={deleting ? 'ph ph-spinner' : 'ph ph-trash'}></i>
                    </button>
                  </div>
                </div>

                {produkList.length === 0 ? (
                  /* Kosong — belum ada produk */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '280px', gap: '1.25rem' }}>
                    <p style={{ fontWeight: 500, fontSize: '1rem', color: '#6B7280' }}>Tambahkan produk untuk mulai lelang.</p>
                    <Link href="/akun/tambah-produk"
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#EEF2FF', color: 'var(--primary)', fontSize: '2.5rem', boxShadow: '0 4px 10px rgba(79,70,229,0.1)' }}>
                      <i className="ph ph-plus"></i>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Tabel produk */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                            <th style={{ padding: '0.6rem 0.5rem', width: '32px' }}></th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#374151', fontWeight: 600 }}>Nama Produk</th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#374151', fontWeight: 600 }}>Kategori</th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#374151', fontWeight: 600 }}>Harga Awal</th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#374151', fontWeight: 600 }}>Tgl Selesai</th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#374151', fontWeight: 600 }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {produkList.map((p) => {
                            const statusLabel = p.status_lelang || 'Menunggu';
                            return (
                              <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: selected.includes(p.id) ? '#EEF2FF' : 'transparent' }}>
                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)}
                                    style={{ accentColor: 'var(--primary)', width: '15px', height: '15px', cursor: 'pointer' }} />
                                </td>
                                <td style={{ padding: '0.75rem', fontWeight: 500, color: '#111827' }}>{p.nama_produk}</td>
                                <td style={{ padding: '0.75rem', color: '#6B7280' }}>{p.kategori}</td>
                                <td style={{ padding: '0.75rem', color: '#111827' }}>
                                  {p.harga_awal ? `Rp ${Number(p.harga_awal).toLocaleString('id-ID')}` : '-'}
                                </td>
                                <td style={{ padding: '0.75rem', color: '#6B7280' }}>
                                  {p.tanggal_selesai ? new Date(p.tanggal_selesai).toLocaleDateString('id-ID') : '-'}
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                  <span style={{
                                    display: 'inline-block', padding: '0.2rem 0.75rem', borderRadius: '999px',
                                    fontSize: '0.75rem', fontWeight: 600,
                                    backgroundColor: statusColor[statusLabel]?.bg || '#E5E7EB',
                                    color: statusColor[statusLabel]?.color || '#374151',
                                  }}>
                                    {statusLabel}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                      <Link href="/akun/tambah-produk"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 500 }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#EEF2FF', fontSize: '0.9rem' }}>
                          <i className="ph ph-plus"></i>
                        </span>
                        Titipkan Produk Baru
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
