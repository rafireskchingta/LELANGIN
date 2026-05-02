'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function AkunSayaPage() {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [user, setUser] = useState({
    username: '', nama: '', email: '', jenisKelamin: '',
    noTelp: '', tglLahirTgl: '', tglLahirBulan: '', tglLahirTahun: '', avatar: 'U'
  });

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
              setUser({
                id: parsed.id || '',
                email: parsed.email || '',
                username: parsed.username || '',
                nama: parsed.nama || '',
                jenisKelamin: parsed.jenisKelamin || '',
                noTelp: parsed.noTelp || '',
                tglLahirTgl: parsed.tglLahirTgl || '',
                tglLahirBulan: parsed.tglLahirBulan || '',
                tglLahirTahun: parsed.tglLahirTahun || '',
                avatar: parsed.avatar || (parsed.nama || 'U').charAt(0).toUpperCase()
              });
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
          avatar: (profile?.full_name || session.user.email).charAt(0).toUpperCase()
        };

        if (profile?.birth_date) {
          const parts = profile.birth_date.split('-');
          if (parts.length === 3) {
            userObj.tglLahirTahun = parts[0];
            const blnIndex = parseInt(parts[1]) - 1;
            const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            userObj.tglLahirBulan = bulanArr[blnIndex] || '';
            userObj.tglLahirTgl = parseInt(parts[2]).toString();
          }
        }

        setUser(userObj);
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

  const handleLogout = async (e) => {
    e.preventDefault();
    localStorage.removeItem('lelangin_user');
    localStorage.removeItem('isLoggedIn');
    window.dispatchEvent(new Event('auth-change'));

    await supabase.auth.signOut();

    // Gunakan fungsi showToast dari script.js jika ada
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('Berhasil keluar!', 'info');
    }

    router.push('/');
  };

  return (
    <main className="akun-main-wrapper">
      <div className="akun-container-box">
        <div className="akun-header-banner">
          <h1>Informasi Akun Saya</h1>
        </div>
        <div className="akun-layout-split">
          <aside className="akun-sidebar">
            <div className="sidebar-profile">
              <div className="sidebar-pic">{user.avatar}</div>
              <div className="sidebar-user">
                <h3>{user.username || user.nama}</h3>
                <a href="#">Ubah Profil</a>
              </div>
            </div>
            <ul className="sidebar-nav">
              <li><Link href="/akun" className="active"><i className="ph ph-smiley"></i> Akun Saya</Link></li>
              <li><Link href="/akun/penjual"><i className="ph ph-cube"></i> Penjual</Link></li>
              <li><Link href="/akun/titip-lelang"><i className="ph ph-envelope-simple-open"></i> Titip Lelang</Link></li>
              <li><a href="#" onClick={handleLogout} style={{ color: 'var(--danger)', cursor: 'pointer' }}><i className="ph ph-sign-out"></i> Keluar</a></li>
            </ul>
          </aside>
          <div className="akun-content smooth-fade">
            <h2 className="akun-section-title">Profil Saya</h2>
            <p className="akun-section-desc">Kelola informasi pribadi Anda untuk mengontrol, melindungi, dan mengamankan akun</p>
            <form action="#" method="POST" id="formProfile">
              <div className="form-horizontal-group">
                <label>Username</label>
                <div className="input-wrapper"><input type="text" name="username" value={user.username || ''} disabled={!isEditMode} onChange={(e) => setUser({...user, username: e.target.value})} /></div>
              </div>
              <div className="form-horizontal-group">
                <label>Nama Lengkap</label>
                <div className="input-wrapper"><input type="text" name="nama" value={user.nama || ''} disabled={!isEditMode} onChange={(e) => setUser({...user, nama: e.target.value})} /></div>
              </div>
              <div className="form-horizontal-group">
                <label>Email</label>
                <div className="input-wrapper"><input type="email" name="email" value={user.email || ''} disabled /></div>
              </div>
              <div className="form-horizontal-group">
                <label>Jenis Kelamin</label>
                <div className="input-wrapper">
                  <select disabled={!isEditMode} value={user.jenisKelamin || ''} onChange={(e) => setUser({...user, jenisKelamin: e.target.value})}>
                    <option value="" disabled>Pilih Jenis Kelamin</option>
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                    <option value="Perempuan">Perempuan</option>
                    <option value="Laki-laki">Laki-laki</option>
                  </select>
                </div>
              </div>
              <div className="form-horizontal-group">
                <label>No Telp</label>
                <div className="input-wrapper"><input type="tel" name="noTelp" inputMode="numeric" value={user.noTelp || ''} disabled={!isEditMode} onChange={(e) => setUser({...user, noTelp: e.target.value})} /></div>
              </div>
              <div className="form-horizontal-group">
                <label>Tanggal Lahir</label>
                <div className="input-wrapper">
                  <select disabled={!isEditMode} value={user.tglLahirTgl || ''} onChange={(e) => setUser({...user, tglLahirTgl: e.target.value})}>
                    <option value="">Tgl</option>
                    {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                  </select>
                  <select disabled={!isEditMode} value={user.tglLahirBulan || ''} onChange={(e) => setUser({...user, tglLahirBulan: e.target.value})}>
                    <option value="">Bulan</option>
                    {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <select disabled={!isEditMode} value={user.tglLahirTahun || ''} onChange={(e) => setUser({...user, tglLahirTahun: e.target.value})}>
                    <option value="">Tahun</option>
                    {Array.from({ length: 30 }, (_, i) => <option key={i} value={1995 + i}>{1995 + i}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
                {isEditMode ? (
                  <button onClick={(e) => { e.preventDefault(); setIsEditMode(false); }} className="btn-primary-full" style={{ width: 'auto', padding: '0.6rem 2rem', margin: 0, fontSize: '0.9rem', borderRadius: '6px' }}>Simpan Profil</button>
                ) : (
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsEditMode(true); }} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Edit</a>
                )}
              </div>
              <div style={{ marginTop: '2rem', padding: '1.25rem 1.5rem', border: '1px solid #E0E7FF', borderRadius: '10px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', margin: 0 }}>Daftar Penjual</p>
                  <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '0.2rem 0 0' }}>Jadilah penjual dan mulai lelang produkmu di Lelangin</p>
                </div>
                <Link href="/akun/penjual" className="btn-primary-full" style={{ width: 'auto', margin: 0, padding: '0.55rem 1.5rem', fontSize: '0.88rem', borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Daftar Sekarang</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
