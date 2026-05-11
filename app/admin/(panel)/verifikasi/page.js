'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../src/lib/supabase';

export default function AdminVerifikasiPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let { data: authData } = await supabase.auth.getSession();

      // Jaring Pengaman Otentikasi
      if (!authData.session) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          setApplications([]);
          setLoading(false);
          return;
        }
      }

      // Eksekusi query utama
      const { data, error: appsError } = await supabase
        .from('seller_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      let apps = data || [];

      // Fetch nama dan username dari profiles
      if (apps.length > 0) {
        const userIds = apps.map(app => app.user_id);
        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', userIds);

        if (!profError && profiles) {
          apps = apps.map(app => {
            const prof = profiles.find(p => p.id === app.user_id);
            return {
              ...app,
              full_name: prof?.full_name || 'Nama Lengkap',
              username: prof?.username ? `@${prof.username}` : '@username'
            };
          });
        }
      }

      setApplications(apps);
    } catch (error) {
      console.error('[Verifikasi] Error fetching applications:', error.message);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = activeTab === 'Semua'
    ? applications
    : applications.filter(app => (app.status || '').toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="admin-verifikasi-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Verifikasi Penjual</h1>
        <div className="verifikasi-tabs">
          {['Semua', 'Menunggu', 'Disetujui', 'Ditolak'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`verifikasi-tab ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>NAMA LENGKAP</th>
              <th>USERNAME</th>
              <th>STATUS</th>
              <th>LOKASI</th>
              <th>WAKTU PENGAJUAN</th>
              <th>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data verifikasi...</td></tr>
            ) : filteredApps.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada pengajuan penjual.</td></tr>
            ) : (
              filteredApps.map((app, index) => {
                const statusStr = (app.status || 'menunggu').toLowerCase();
                const displayId = app.id ? app.id.toString().substring(0, 5) : index + 1;

                return (
                  <tr key={index}>
                    <td style={{ color: '#4F46E5', fontWeight: 600 }}>{displayId}.</td>
                    <td style={{ fontWeight: 600, color: '#111827' }}>{app.full_name}</td>
                    <td style={{ color: '#4F46E5' }}>{app.username}</td>
                    <td>
                      <span className={`verifikasi-status ${statusStr}`}>
                        {statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}
                      </span>
                    </td>
                    <td>{app.lokasi || '-'}</td>
                    <td>{app.created_at ? (() => {
                      const date = new Date(app.created_at);
                      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                      const day = date.getDate().toString().padStart(2, '0');
                      const month = months[date.getMonth()];
                      const year = date.getFullYear();
                      const hours = date.getHours().toString().padStart(2, '0');
                      const minutes = date.getMinutes().toString().padStart(2, '0');
                      return `${day} - ${month} - ${year}, ${hours}:${minutes}`;
                    })() : '-'}</td>
                    <td>
                      <button
                        className="btn-lihat-detail"
                        onClick={() => router.push(`/admin/verifikasi/${app.id}`)}
                      >
                        Lihat Detail
                      </button>
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
