'use client';

import Link from 'next/link';

export default function AkunPenjualPage() {
  const handleLogout = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lelangin_user');
      localStorage.removeItem('isLoggedIn');
      window.dispatchEvent(new Event('auth-change'));
      window.location.href = '/';
    }
  };

  return (
    <main className="akun-main-wrapper">
      <div className="akun-container-box">
        <div className="akun-header-banner"><h1>Informasi Akun Saya</h1></div>
        <div className="akun-layout-split">
          <aside className="akun-sidebar">
            <div className="sidebar-profile">
              <div className="sidebar-pic">S</div>
              <div className="sidebar-user"><h3>safirazahra123</h3><Link href="/akun">Ubah Profil</Link></div>
            </div>
            <ul className="sidebar-nav">
              <li><Link href="/akun"><i className="ph ph-smiley"></i> Akun Saya</Link></li>
              <li><Link href="/akun/penjual" className="active"><i className="ph ph-cube"></i> Penjual</Link></li>
              <li><Link href="/akun/titip-lelang"><i className="ph ph-envelope-simple-open"></i> Titip Lelang</Link></li>
              <li><a href="#" onClick={handleLogout} style={{ color: 'var(--danger)', cursor: 'pointer' }}><i className="ph ph-sign-out"></i> Keluar</a></li>
            </ul>
          </aside>
          <div className="akun-content smooth-fade">
            <h2 className="akun-section-title">Profil Penjual</h2>
            <p className="akun-section-desc">Lengkapi data berikut untuk mulai menjual produk melalui sistem lelang di Lelangin</p>
            <form action="#" method="POST" id="formDaftarPenjual">
              <div className="form-horizontal-group"><label>Username</label><div className="input-wrapper"><input type="text" defaultValue="safirazahra123" disabled /></div></div>
              <div className="form-horizontal-group"><label>Nama</label><div className="input-wrapper"><input type="text" defaultValue="Safira Zahra Asshifa" disabled /></div></div>
              <div className="form-horizontal-group"><label>Email</label><div className="input-wrapper"><input type="email" defaultValue="safirazahra@gmail.com" disabled /></div></div>
              <div className="form-horizontal-group"><label>Jenis Kelamin</label><div className="input-wrapper"><select disabled defaultValue="Perempuan"><option value="Perempuan">Perempuan</option><option value="Laki-laki">Laki-laki</option></select></div></div>
              <div className="form-horizontal-group"><label>No Telp</label><div className="input-wrapper"><input type="tel" defaultValue="085271822796" disabled /></div></div>
              <div className="form-horizontal-group"><label>Tanggal Lahir</label><div className="input-wrapper"><select disabled defaultValue="17"><option value="17">17</option></select><select disabled defaultValue="Januari"><option value="Januari">Januari</option></select><select disabled defaultValue="2006"><option value="2006">2006</option></select></div></div>
              <div className="form-horizontal-group"><label>Alamat <span className="required">*</span></label><div className="input-wrapper"><input type="text" required /></div></div>
              <h3 className="sub-title" style={{ marginTop: '3rem' }}>Upload KTP</h3>
              <div className="form-horizontal-group" style={{ alignItems: 'flex-start' }}>
                <label style={{ marginTop: '1rem' }}>KTP <span className="required">*</span></label>
                <div className="input-wrapper"><div className="upload-dropzone"><i className="ph ph-camera"></i> Tarik gambar ke sini atau <a href="#">upload file</a></div></div>
              </div>
              <h3 className="sub-title" style={{ marginTop: '3rem' }}>Informasi Pembayaran</h3>
              <div className="form-horizontal-group"><label>Nama Bank <span className="required">*</span></label><div className="input-wrapper"><select required defaultValue=""><option value=""></option><option value="Mandiri">Mandiri</option><option value="BCA">BCA</option><option value="BNI">BNI</option><option value="BRI">BRI</option></select></div></div>
              <div className="form-horizontal-group"><label>No Rekening <span className="required">*</span></label><div className="input-wrapper"><input type="text" required /></div></div>
              <div className="form-horizontal-group"><label>Nama Pemilik<br />Rekening <span className="required">*</span></label><div className="input-wrapper"><input type="text" required /></div></div>
              <div className="checkbox-list-inline" style={{ marginTop: '2rem' }}>
                <label><input type="checkbox" required /> Saya menyetujui syarat dan ketentuan yang berlaku di Lelangin</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
                <button type="submit" className="btn-primary-full" style={{ width: 'auto', padding: '0.8rem 2.5rem', borderRadius: '6px', margin: 0, fontSize: '1rem' }}>Daftar Penjual</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
