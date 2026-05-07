'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (email === 'adminlelangin@gmail.com' && password === '122026') {
      setTimeout(() => {
        setLoading(false);
        router.push('/admin/dashboard');
      }, 500);
      return;
    }

    setTimeout(() => {
      setLoading(false);
      alert('Email atau kata sandi salah. Gunakan adminlelangin@gmail.com / 122026');
    }, 500);
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-logo">
            <div className="logo-icon admin-icon">
              <i className="ph-fill ph-gavel"></i>
            </div>
            <h2>Lelangin<span style={{color: 'var(--primary)'}}>Admin</span></h2>
          </div>
          <p>Masuk ke Panel Administrasi</p>
        </div>
        
        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group">
            <label>Email Admin</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lelangin.com"
            />
          </div>
          <div className="form-group">
            <label>Kata Sandi</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
            />
          </div>
          <button type="submit" className="btn-primary-full" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>
      </div>
    </main>
  );
}
