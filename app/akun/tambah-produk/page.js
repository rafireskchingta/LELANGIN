'use client';

import Link from 'next/link';

export default function TambahProdukPage() {
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
              <li><Link href="/akun/penjual"><i className="ph ph-cube"></i> Penjual</Link></li>
              <li><Link href="/akun/titip-lelang" className="active"><i className="ph ph-envelope-simple-open"></i> Titip Lelang</Link></li>
            </ul>
          </aside>
          <div className="akun-content smooth-fade">
            <h2 className="akun-section-title">Tambah Produk Jual</h2>
            <p className="akun-section-desc">Yuk, mulai titipkan produkmu dan ikuti proses lelang dengan mudah!</p>
            <form action="#" method="POST" id="formTambahProduk">
              <div className="form-horizontal-group"><label>Nama Produk <span className="required">*</span></label><div className="input-wrapper"><input type="text" name="nama" required /></div></div>
              <div className="form-horizontal-group"><label>Kategori <span className="required">*</span></label><div className="input-wrapper checkbox-list-inline"><label><input type="checkbox" /> Elektronik</label><label><input type="checkbox" /> Seni</label><label><input type="checkbox" /> Hobi</label></div></div>

              <h3 className="sub-title">Info Produk</h3>
              <div className="form-horizontal-group"><label>Kondisi <span className="required">*</span></label><div className="input-wrapper checkbox-list-inline"><label><input type="checkbox" /> Baru</label><label><input type="checkbox" /> Bekas</label></div></div>
              <div className="form-horizontal-group"><label>Merk <span className="required">*</span></label><div className="input-wrapper"><input type="text" required /></div></div>
              <div className="form-horizontal-group"><label>Model <span className="required">*</span></label><div className="input-wrapper"><input type="text" required /></div></div>
              <div className="form-horizontal-group"><label>Warna <span className="required">*</span></label><div className="input-wrapper"><input type="text" required /></div></div>
              <div className="form-horizontal-group"><label>Tahun Produksi <span className="required">*</span></label><div className="input-wrapper"><input type="number" required /></div></div>
              <div className="form-horizontal-group"><label>Daya Listrik</label><div className="input-wrapper"><input type="text" /></div></div>
              <div className="form-horizontal-group"><label>Kapasitas</label><div className="input-wrapper"><input type="text" /></div></div>
              <div className="form-horizontal-group"><label>Tegangan</label><div className="input-wrapper"><input type="text" /></div></div>

              <h3 className="sub-title">Kondisi Produk</h3>
              <div className="form-horizontal-group"><label>Kondisi Fisik <span className="required">*</span></label><div className="input-wrapper"><select required style={{ height: 'auto' }} size="3"><option value="Sangat Baik">Sangat Baik</option><option value="Baik">Baik</option><option value="Cukup Baik">Cukup Baik</option></select></div></div>
              <div className="form-horizontal-group"><label>Kelengkapan <span className="required">*</span></label><div className="input-wrapper"><select required defaultValue=""><option value="">Pilih Kelengkapan</option></select></div></div>
              <div className="form-horizontal-group"><label>Estetika/Tampilan <span className="required">*</span></label><div className="input-wrapper"><select required defaultValue=""><option value="">Pilih Estetika</option></select></div></div>

              <h3 className="sub-title">Detail Kelengkapan</h3>
              <div className="form-horizontal-group"><label>Dokumen<br />Pendukung <span className="required">*</span></label><div className="input-wrapper"><select required size="2" style={{ height: 'auto' }}><option value="Ada">Ada</option><option value="Tidak Ada">Tidak Ada</option></select></div></div>
              <div className="form-horizontal-group"><label>Kemasan (Box) <span className="required">*</span></label><div className="input-wrapper"><select required defaultValue=""><option value=""></option></select></div></div>
              <div className="form-horizontal-group"><label>Aksesoris<br />Tambahan <span className="required">*</span></label><div className="input-wrapper"><select required defaultValue=""><option value=""></option></select></div></div>

              <h3 className="sub-title">Detail Lelang</h3>
              <div className="form-horizontal-group"><label>Harga Awal <span className="required">*</span></label><div className="input-wrapper"><input type="number" required /></div></div>
              <div className="form-horizontal-group" style={{ alignItems: 'center' }}>
                <label>Tanggal Mulai <span className="required">*</span></label>
                <div className="input-wrapper" style={{ alignItems: 'center' }}>
                  <input type="date" required style={{ flex: 1 }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, minWidth: '110px' }}>Tanggal Selesai <span className="required">*</span></span>
                  <input type="date" required style={{ flex: 1 }} />
                </div>
              </div>

              <h3 className="sub-title">Foto Produk</h3>
              <div className="upload-dropzone"><i className="ph ph-camera"></i> Tarik gambar ke sini atau <a href="#">upload file</a></div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
                <Link href="/akun/titip-lelang" className="btn-primary-full" style={{ width: 'auto', padding: '0.8rem 2.5rem', borderRadius: '6px', margin: 0, fontSize: '1rem', textDecoration: 'none' }}>Tambah Produk</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
