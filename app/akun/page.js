'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import CustomSelect from '../../components/CustomSelect';

export default function AkunSayaPage() {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalUser, setOriginalUser] = useState(null);
  const [user, setUser] = useState({
    id: '', username: '', nama: '', email: '', jenisKelamin: '',
    noTelp: '', tglLahirTgl: '', tglLahirBulan: '', tglLahirTahun: '', avatar: 'U'
  });
  const [toast, setToast] = useState(null);
  const [dateError, setDateError] = useState(null);

  const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const bulanMap = { 'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04', 'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08', 'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12' };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function fetchUser() {
      if (typeof window === 'undefined') return;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          // Fallback: cek localStorage sebelum redirect
          const localUser = localStorage.getItem('lelangin_user');
          const isLoggedIn = localStorage.getItem('isLoggedIn');

          if (isLoggedIn === 'true' && localUser) {
            try {
              const parsed = JSON.parse(localUser);
              const userObj = {
                id: parsed.id || '',
                email: parsed.email || '',
                username: parsed.username || '',
                nama: parsed.nama || '',
                jenisKelamin: parsed.jenisKelamin || '',
                noTelp: parsed.noTelp || '',
                tglLahirTgl: parsed.tglLahirTgl || '',
                tglLahirBulan: parsed.tglLahirBulan || '',
                tglLahirTahun: parsed.tglLahirTahun || '',
                avatar: parsed.avatar || (parsed.nama || 'U').charAt(0).toUpperCase(),
                role: parsed.role || 'pembeli'
              };
              setUser(userObj);
              setOriginalUser(userObj);
              return; // Jangan redirect, data dari localStorage sudah cukup
            } catch (parseErr) {
              console.error('Failed to parse local user data:', parseErr);
            }
          }

          // Tidak ada session DAN tidak ada data localStorage -> redirect
          router.push('/');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Supabase Profile Fetch Error:", profileError);
        } else {
          console.log("Successfully fetched profile:", profile);
        }

        const userObj = {
          id: session.user.id,
          email: session.user.email,
          username: profile?.username || '',
          nama: profile?.full_name || session.user.email.split('@')[0],
          jenisKelamin: profile?.gender || '',
          noTelp: profile?.phone_number || '',
          avatar: (profile?.full_name || session.user.email).charAt(0).toUpperCase(),
          role: profile?.role || 'pembeli'
        };

        if (profile?.birth_date) {
          const parts = profile.birth_date.split('-');
          if (parts.length === 3) {
            userObj.tglLahirTahun = parts[0];
            const blnIndex = parseInt(parts[1]) - 1;
            userObj.tglLahirBulan = bulanArr[blnIndex] || '';
            userObj.tglLahirTgl = parseInt(parts[2]).toString();
          }
        }

        setUser(userObj);
        setOriginalUser(userObj);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        // Fallback: cek localStorage sebelum redirect
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn !== 'true') {
          router.push('/');
        }
      }
    }

    fetchUser();
  }, [router]);

  // Simpan perubahan profil ke Supabase
  const handleSimpanData = async () => {
    if (!user.id) return;
    setSaving(true);
    try {
      const tgl = (user.tglLahirTgl || '1').padStart(2, '0');
      const bln = bulanMap[user.tglLahirBulan] || '01';
      const thn = user.tglLahirTahun || '2000';

      const dateObj = new Date(`${thn}-${bln}-${tgl}`);
      if (dateObj.getMonth() + 1 !== parseInt(bln)) {
        setDateError(`Tanggal ${user.tglLahirTgl} tidak valid untuk bulan ${user.tglLahirBulan}.`);
        setSaving(false);
        return;
      }
      setDateError(null);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: user.username,
          full_name: user.nama,
          gender: user.jenisKelamin,
          phone_number: user.noTelp,
          birth_date: `${thn}-${bln}-${tgl}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setOriginalUser({ ...user });
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

  // Batal edit — kembalikan data ke semula
  const handleBatal = () => {
    if (originalUser) setUser(originalUser);
    setIsEditMode(false);
    setDateError(null);
  };

  return (
    <>
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

      <h2 className="akun-section-title">Profil Saya</h2>
      <p className="akun-section-desc">Kelola informasi pribadi Anda untuk mengontrol, melindungi, dan mengamankan akun</p>
      <form action="#" method="POST" id="formProfile">
        <div className="form-horizontal-group">
          <label>Username</label>
          <div className="input-wrapper"><input type="text" name="username" value={user.username || ''} disabled={!isEditMode} onChange={(e) => setUser({ ...user, username: e.target.value })} /></div>
        </div>
        <div className="form-horizontal-group">
          <label>Nama Lengkap</label>
          <div className="input-wrapper"><input type="text" name="nama" value={user.nama || ''} disabled={!isEditMode} onChange={(e) => setUser({ ...user, nama: e.target.value })} /></div>
        </div>
        <div className="form-horizontal-group">
          <label>Email</label>
          <div className="input-wrapper"><input type="email" name="email" value={user.email || ''} disabled /></div>
        </div>
        <div className="form-horizontal-group">
          <label>Jenis Kelamin</label>
          <div className="input-wrapper">
            <CustomSelect 
              disabled={!isEditMode}
              options={[
                { label: 'Pria', value: 'Pria' },
                { label: 'Wanita', value: 'Wanita' }
              ]}
              value={user.jenisKelamin}
              onChange={(val) => setUser({ ...user, jenisKelamin: val })}
              placeholder="Pilih Jenis Kelamin"
            />
          </div>
        </div>
        <div className="form-horizontal-group">
          <label>No Telp</label>
          <div className="input-wrapper"><input type="tel" name="noTelp" inputMode="numeric" value={user.noTelp || ''} disabled={!isEditMode} onChange={(e) => setUser({ ...user, noTelp: e.target.value.replace(/\D/g, '') })} /></div>
        </div>
        <div className="form-horizontal-group" style={{ alignItems: 'flex-start' }}>
          <label style={{ marginTop: '0.6rem' }}>Tanggal Lahir</label>
          <div style={{ flex: 1 }}>
            <div className="input-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', width: '100%' }}>
              <CustomSelect 
                disabled={!isEditMode}
                error={!!dateError}
                options={Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) }))}
                value={user.tglLahirTgl}
                onChange={(val) => { setUser({ ...user, tglLahirTgl: val }); setDateError(null); }}
                placeholder="Tgl"
              />
              <CustomSelect 
                disabled={!isEditMode}
                error={!!dateError}
                options={bulanArr.map(b => ({ label: b, value: b }))}
                value={user.tglLahirBulan}
                onChange={(val) => { setUser({ ...user, tglLahirBulan: val }); setDateError(null); }}
                placeholder="Bulan"
              />
              <CustomSelect 
                disabled={!isEditMode}
                error={!!dateError}
                options={Array.from({ length: 30 }, (_, i) => ({ label: String(1995 + i), value: String(1995 + i) }))}
                value={user.tglLahirTahun}
                onChange={(val) => { setUser({ ...user, tglLahirTahun: val }); setDateError(null); }}
                placeholder="Tahun"
              />
            </div>
            {dateError && (
              <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 500 }}>
                {dateError}
              </div>
            )}
          </div>
        </div>

        {/* Tombol Edit / Batal + Simpan — konsisten di kanan bawah */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginTop: '3rem' }}>
          {isEditMode ? (
            <>
              <button type="button" onClick={handleBatal}
                style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '0.6rem 2rem', fontSize: '0.9rem', color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                Batal
              </button>
              <button type="button" onClick={handleSimpanData} disabled={saving}
                className="btn-primary-full"
                style={{ width: 'auto', padding: '0.6rem 2rem', margin: 0, fontSize: '0.9rem', borderRadius: '6px' }}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setIsEditMode(true)}
              style={{ background: '#FFFFFF', border: '1px solid var(--primary)', borderRadius: '6px', padding: '0.6rem 2rem', fontSize: '0.9rem', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              Edit
            </button>
          )}
        </div>
        {user.role !== 'penjual' && (
          <div style={{ marginTop: '2rem', padding: '1.25rem 1.5rem', border: '1px solid #E0E7FF', borderRadius: '10px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', margin: 0 }}>Daftar Penjual</p>
              <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '0.2rem 0 0' }}>Jadilah penjual dan mulai lelang produkmu di Lelangin</p>
            </div>
            <Link href="/akun/penjual" className="btn-primary-full" style={{ width: 'auto', margin: 0, padding: '0.55rem 1.5rem', fontSize: '0.88rem', borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Daftar Sekarang</Link>
          </div>
        )}
      </form>
    </>
  );
}
