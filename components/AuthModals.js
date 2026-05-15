'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../src/lib/supabase';
import CustomSelect from './CustomSelect';

export default function AuthModals() {
  const pathname = usePathname();

  // States for Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // States for Register
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regGender, setRegGender] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regTgl, setRegTgl] = useState('');
  const [regBulan, setRegBulan] = useState('');
  const [regTahun, setRegTahun] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Jangan render modals di halaman admin
  if (pathname.startsWith('/admin')) return null;

  // Helper to show vanilla JS Toast from script.js
  const showToast = (msg, type = 'success') => {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(msg, type);
    } else {
      alert(msg);
    }
  };

  // Helper to close modal from script.js
  const closeAllModals = () => {
    if (typeof document !== 'undefined') {
      const modalOverlay = document.getElementById('modalOverlay');
      if (modalOverlay) {
        modalOverlay.classList.remove('active');
        modalOverlay.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
      }
    }
  };

  const openRegisterModal = () => {
    if (typeof document !== 'undefined') {
      const modalOverlay = document.getElementById('modalOverlay');
      const registerModal = document.getElementById('registerModal');
      if (modalOverlay && registerModal) {
        modalOverlay.classList.add('active');
        modalOverlay.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        registerModal.classList.add('active');
      }
    }
  };

  const openLoginModal = () => {
    if (typeof document !== 'undefined') {
      const modalOverlay = document.getElementById('modalOverlay');
      const loginModal = document.getElementById('loginModal');
      if (modalOverlay && loginModal) {
        modalOverlay.classList.add('active');
        modalOverlay.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        loginModal.classList.add('active');
      }
    }
  };

  const openSuccessModal = () => {
    if (typeof document !== 'undefined') {
      const modalOverlay = document.getElementById('modalOverlay');
      const successModal = document.getElementById('successModal');
      if (modalOverlay && successModal) {
        modalOverlay.classList.add('active');
        modalOverlay.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        successModal.classList.add('active');
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      // Ambil data profil untuk mengisi halaman 'Akun Saya'
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileData?.deleted_at) {
        // Jika akun sudah di-soft-delete
        await supabase.auth.signOut();
        throw new Error('Akun ini telah dihapus. Silakan hubungi admin jika ini adalah sebuah kesalahan.');
      }

      if (profileData?.role === 'admin') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('isAdminLoggedIn', 'true');
          window.location.href = '/admin/dashboard';
        }
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('isLoggedIn', 'true');
        window.dispatchEvent(new Event('auth-change'));

        const userObj = {
          id: data.user.id,
          email: data.user.email,
          nama: profileData?.full_name || data.user.email.split('@')[0],
          username: profileData?.username || '',
          jenisKelamin: profileData?.gender || '',
          noTelp: profileData?.phone_number || '',
          role: profileData?.role || 'pembeli',
          isPenjual: profileData?.role === 'penjual'
        };

        if (profileData?.birth_date) {
          const parts = profileData.birth_date.split('-');
          if (parts.length === 3) {
            userObj.tglLahirTahun = parts[0];
            const blnIndex = parseInt(parts[1]) - 1;
            const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            userObj.tglLahirBulan = bulanArr[blnIndex] || '';
            userObj.tglLahirTgl = parseInt(parts[2]).toString();
          }
        }

        userObj.avatar = (userObj.nama || 'U').charAt(0).toUpperCase();

        // Simpan langsung ke localStorage, jangan mengandalkan window.DB
        localStorage.setItem('lelangin_user', JSON.stringify(userObj));

        if (window.DB) window.DB.setUser(userObj);
        if (window.updateHeaderState) window.updateHeaderState();
      }

      showToast('Berhasil masuk! Selamat datang.', 'success');
      closeAllModals();
    } catch (error) {
      showToast('Login gagal: ' + error.message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);

    try {
      // Konversi bulan string ke angka untuk birth_date
      const bulanMap = {
        'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
        'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
        'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
      };

      const tgl = regTgl.padStart(2, '0');
      const bln = bulanMap[regBulan] || '01';
      const thn = regTahun || '2000';
      const birthDate = `${thn}-${bln}-${tgl}`;
      const genderFormatted = regGender.charAt(0).toUpperCase() + regGender.slice(1);

      // 1. Daftar Auth Supabase dengan Metadata (Trigger DB akan membuat profil otomatis)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            full_name: regFullName,
            username: regUsername,
            gender: genderFormatted,
            phone_number: regPhone,
            birth_date: birthDate,
            email: regEmail,
            role: 'pembeli'
          }
        }
      });

      if (authError) throw authError;

      const userId = authData?.user?.id;
      if (!userId) throw new Error('Pendaftaran gagal. Silakan coba lagi.');

      // 2. Berhasil! (Insert manual dihapus karena sudah ditangani Trigger Database)
      openSuccessModal();
    } catch (error) {
      showToast('Pendaftaran gagal: ' + error.message, 'error');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="modal-overlay" id="modalOverlay">
      {/* Login Modal */}
      <div className="modal" id="loginModal">
        <button className="modal-close" data-close onClick={closeAllModals}>
          <i className="ph ph-x"></i>
        </button>
        <div className="modal-header">
          <h2>Masuk ke akun Anda</h2>
          <p>Masuk dan nikmati penawaran terbaru kami</p>
        </div>
        <form className="modal-form" id="loginForm" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Kata Sandi</label>
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary-full" disabled={loginLoading}>
            {loginLoading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>
        <div className="modal-footer-text">
          Belum punya akun? <a href="#" onClick={(e) => { e.preventDefault(); closeAllModals(); openRegisterModal(); }}>Daftar Sekarang</a>
        </div>
      </div>

      {/* Register Modal */}
      <div className="modal" id="registerModal">
        <button className="modal-close" data-close onClick={closeAllModals}>
          <i className="ph ph-x"></i>
        </button>
        <div className="modal-header">
          <h2>Daftar</h2>
          <p>Daftarkan akun Anda</p>
        </div>
        <form className="modal-form" id="registerForm" onSubmit={handleRegister}>
          {/* Honeypot fields to trap browser autofill and prevent it from filling the real username field */}
          <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden' }}>
            <input type="email" name="dummy_email" tabIndex="-1" autoComplete="email" />
            <input type="text" name="dummy_username" tabIndex="-1" autoComplete="username" />
            <input type="password" name="dummy_password" tabIndex="-1" autoComplete="current-password" />
          </div>
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input
              type="text"
              name="reg_fullname"
              autoComplete="off"
              required
              value={regFullName}
              onChange={(e) => setRegFullName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Nama Akun (Username)</label>
            <input
              type="text"
              name="reg_username"
              autoComplete="off"
              required
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Jenis Kelamin</label>
            <CustomSelect
              value={regGender}
              onChange={(val) => setRegGender(val)}
              options={[
                { value: 'pria', label: 'Pria' },
                { value: 'wanita', label: 'Wanita' }
              ]}
              placeholder="Pilih"
            />
          </div>
          <div className="form-group">
            <label>No Telp</label>
            <input type="tel" inputMode="numeric" required value={regPhone} onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))} />
          </div>
          <div className="form-group">
            <label>Tanggal Lahir</label>
            <div className="date-group">
              <select required value={regTgl} onChange={(e) => setRegTgl(e.target.value)}>
                <option value="" disabled>Tanggal</option>
                {Array.from({ length: 31 }, (_, i) => <option key={i}>{i + 1}</option>)}
              </select>
              <select required value={regBulan} onChange={(e) => setRegBulan(e.target.value)}>
                <option value="" disabled>Bulan</option>
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(b => <option key={b}>{b}</option>)}
              </select>
              <select required value={regTahun} onChange={(e) => setRegTahun(e.target.value)}>
                <option value="" disabled>Tahun</option>
                {Array.from({ length: 30 }, (_, i) => <option key={i}>{1995 + i}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Kata Sandi</label>
            <input
              type="password"
              name="reg_password"
              autoComplete="new-password"
              required
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary-full" disabled={regLoading}>
            {regLoading ? 'Memproses...' : 'Buat Akun'}
          </button>
        </form>
        <div className="modal-footer-text">
          Sudah punya akun? <a href="#" onClick={(e) => { e.preventDefault(); closeAllModals(); openLoginModal(); }}>Masuk Sekarang</a>
        </div>
      </div>

      {/* Success Modal */}
      <div className="modal" id="successModal" style={{ textAlign: 'center' }}>
        <button className="modal-close" data-close onClick={closeAllModals}>
          <i className="ph ph-x"></i>
        </button>
        <div className="modal-header">
          <h2>Pendaftaran Berhasil!</h2>
          <p>Akun Anda telah terdaftar sebagai pembeli.<br />Anda sekarang dapat mulai melakukan penawaran lelang.</p>
        </div>
        <button type="button" className="btn-primary-full" onClick={(e) => { e.preventDefault(); closeAllModals(); openLoginModal(); }}>Masuk</button>
      </div>
    </div>
  );
}
