'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import CustomDatePicker from '../../../components/CustomDatePicker';
import CustomTimePicker from '../../../components/CustomTimePicker';
import CustomSelect from '../../../components/CustomSelect';

export default function TambahProdukPage() {
  const [kondisiFisik, setKondisiFisik] = useState("");
  const [kelengkapan, setKelengkapan] = useState("");
  const [estetika, setEstetika] = useState("");
  const [dokumen, setDokumen] = useState("");
  const [kemasan, setKemasan] = useState("");
  const [aksesoris, setAksesoris] = useState("");
  const [hargaAwal, setHargaAwal] = useState("");

  const formatRibuan = (val) => {
    const num = val.replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const kondisiFisikOptions = [
    { value: 'Sangat Baik', label: 'Sangat Baik' },
    { value: 'Baik', label: 'Baik' },
    { value: 'Cukup Baik', label: 'Cukup Baik' },
  ];

  const kelengkapanOptions = [
    { value: 'Lengkap', label: 'Lengkap' },
    { value: 'Sebagian', label: 'Sebagian' },
    { value: 'Hanya Unit', label: 'Hanya Unit' },
  ];

  const estetikaOptions = [
    { value: 'Mulus', label: 'Mulus' },
    { value: 'Ada Goresan', label: 'Ada Goresan Halus' },
    { value: 'Banyak Goresan', label: 'Banyak Goresan/Lecet' },
  ];

  const ketersediaanOptions = [
    { value: 'Ada', label: 'Ada' },
    { value: 'Tidak Ada', label: 'Tidak Ada' },
  ];

  const kemasanOptions = [
    { value: 'Lengkap (Original)', label: 'Lengkap (Original)' },
    { value: 'Pengganti', label: 'Pengganti' },
    { value: 'Tanpa Kemasan', label: 'Tanpa Kemasan' },
  ];

  const aksesorisOptions = [
    { value: 'Lengkap', label: 'Lengkap' },
    { value: 'Sebagian', label: 'Sebagian' },
    { value: 'Tidak Ada', label: 'Tidak Ada' },
  ];

  return (
    <>
      <h2 className="akun-section-title">Tambah Produk Jual</h2>
      <p className="akun-section-desc">Yuk, mulai titipkan produkmu dan ikuti proses lelang dengan mudah!</p>
      <form action="#" method="POST" id="formTambahProduk">
        <div className="form-horizontal-group"><label>Nama Produk <span className="required">*</span></label><div className="input-wrapper"><input type="text" name="nama" required /></div></div>
        <div className="form-horizontal-group"><label>Kategori <span className="required">*</span></label><div className="input-wrapper checkbox-list-inline"><label><input type="radio" name="kategori" /> Elektronik</label><label><input type="radio" name="kategori" /> Seni</label><label><input type="radio" name="kategori" /> Hobi</label></div></div>

        <h3 className="sub-title">Info Produk</h3>
        <div className="form-horizontal-group"><label>Kondisi <span className="required">*</span></label><div className="input-wrapper checkbox-list-inline"><label><input type="radio" name="kondisi" /> Baru</label><label><input type="radio" name="kondisi" /> Bekas</label></div></div>
        <div className="form-horizontal-group"><label>Merk <span className="required">*</span></label><div className="input-wrapper"><input type="text" required /></div></div>
        <div className="form-horizontal-group"><label>Model <span className="required">*</span></label><div className="input-wrapper"><input type="text" required /></div></div>
        <div className="form-horizontal-group"><label>Warna <span className="required">*</span></label><div className="input-wrapper"><input type="text" required /></div></div>
        <div className="form-horizontal-group"><label>Tahun Produksi <span className="required">*</span></label><div className="input-wrapper"><input type="number" required /></div></div>
        <div className="form-horizontal-group"><label>Daya Listrik</label><div className="input-wrapper"><input type="text" /></div></div>
        <div className="form-horizontal-group"><label>Kapasitas</label><div className="input-wrapper"><input type="text" /></div></div>
        <div className="form-horizontal-group"><label>Tegangan</label><div className="input-wrapper"><input type="text" /></div></div>

        <h3 className="sub-title">Kondisi Produk</h3>
        <div className="form-horizontal-group"><label>Kondisi Fisik <span className="required">*</span></label><div className="input-wrapper">
          <CustomSelect options={kondisiFisikOptions} value={kondisiFisik} onChange={setKondisiFisik} placeholder="Pilih Kondisi Fisik" />
        </div></div>
        <div className="form-horizontal-group"><label>Kelengkapan <span className="required">*</span></label><div className="input-wrapper">
          <CustomSelect options={kelengkapanOptions} value={kelengkapan} onChange={setKelengkapan} placeholder="Pilih Kelengkapan" />
        </div></div>
        <div className="form-horizontal-group"><label>Estetika/Tampilan <span className="required">*</span></label><div className="input-wrapper">
          <CustomSelect options={estetikaOptions} value={estetika} onChange={setEstetika} placeholder="Pilih Estetika" />
        </div></div>

        <h3 className="sub-title">Detail Kelengkapan</h3>
        <div className="form-horizontal-group"><label>Dokumen<br />Pendukung <span className="required">*</span></label><div className="input-wrapper">
          <CustomSelect options={ketersediaanOptions} value={dokumen} onChange={setDokumen} placeholder="Pilih Ketersediaan" />
        </div></div>
        <div className="form-horizontal-group"><label>Kemasan (Box) <span className="required">*</span></label><div className="input-wrapper">
          <CustomSelect options={kemasanOptions} value={kemasan} onChange={setKemasan} placeholder="Pilih Kemasan" />
        </div></div>
        <div className="form-horizontal-group"><label>Aksesoris<br />Tambahan <span className="required">*</span></label><div className="input-wrapper">
          <CustomSelect options={aksesorisOptions} value={aksesoris} onChange={setAksesoris} placeholder="Pilih Aksesoris" />
        </div></div>

        <h3 className="sub-title">Detail Lelang</h3>
        <div className="form-horizontal-group"><label>Harga Awal <span className="required">*</span></label><div className="input-wrapper"><input type="text" inputMode="numeric" value={hargaAwal} onChange={(e) => setHargaAwal(formatRibuan(e.target.value))} placeholder="0" required /></div></div>
        <div className="form-horizontal-group" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
          <label style={{ whiteSpace: 'nowrap', width: '140px', minWidth: '140px' }}>Tanggal Mulai <span className="required">*</span></label>
          <div className="input-wrapper" style={{ flex: 1, position: 'relative' }}>
            <CustomDatePicker placeholder="" />
          </div>
          <label style={{ whiteSpace: 'nowrap', marginLeft: '1.5rem', width: '140px', minWidth: '140px' }}>Tanggal Selesai</label>
          <div className="input-wrapper" style={{ flex: 1, position: 'relative' }}>
            <CustomDatePicker placeholder="" alignRight={true} />
          </div>
        </div>
        <div className="form-horizontal-group" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
          <label style={{ whiteSpace: 'nowrap', width: '140px', minWidth: '140px' }}>Waktu Mulai <span className="required">*</span></label>
          <div className="input-wrapper" style={{ flex: 1, position: 'relative' }}>
            <CustomTimePicker placeholder="" />
          </div>
          <label style={{ whiteSpace: 'nowrap', marginLeft: '1.5rem', width: '140px', minWidth: '140px' }}>Waktu Selesai</label>
          <div className="input-wrapper" style={{ flex: 1, position: 'relative' }}>
            <CustomTimePicker placeholder="" alignRight={true} />
          </div>
        </div>

        <h3 className="sub-title">Foto Produk</h3>
        <div className="upload-dropzone"><i className="ph ph-camera"></i> Tarik gambar ke sini atau <a href="#">upload file</a></div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
          <Link href="/akun/titip-lelang" className="btn-primary-full" style={{ width: 'auto', padding: '0.8rem 2.5rem', borderRadius: '6px', margin: 0, fontSize: '1rem', textDecoration: 'none' }}>Tambah Produk</Link>
        </div>
      </form>
    </>
  );
}
