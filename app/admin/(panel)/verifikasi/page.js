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
      // Fetch seller_applications
      const { data: apps, error: appsError } = await supabase
        .from('seller_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // We need to fetch profiles for the names and usernames
      if (apps && apps.length > 0) {
        const userIds = apps.map(app => app.user_id);
        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', userIds);

        if (!profError && profiles) {
          const combined = apps.map(app => {
            const prof = profiles.find(p => p.id === app.user_id);
            return {
              ...app,
              full_name: prof?.full_name || 'Nama Lengkap',
              username: prof?.username ? `@${prof.username}` : '@username'
            };
          });
          setApplications(combined);
        } else {
          setApplications(apps);
        }
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.warn('Error fetching applications. Using fallback data for demo.', error.message);
      // Fallback dummy data if table is empty or error
      setApplications([
        { id: 'APP1', user_id: 'u1', full_name: 'Jibran Aditya', username: '@jbr.12', status: 'menunggu', lokasi: 'Jawa Tengah', created_at: '2024-01-17T10:15:00Z' },
        { id: 'APP2', user_id: 'u2', full_name: 'Adriel Ananda', username: '@Adriel.123', status: 'disetujui', lokasi: 'Jawa Barat', created_at: '2024-01-18T12:30:00Z' },
        { id: 'APP3', user_id: 'u3', full_name: 'Safira Zahra', username: '@safirrash', status: 'ditolak', lokasi: 'DKI Jakarta', created_at: '2024-02-22T11:45:00Z' }
      ]);
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
              <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>Memuat data verifikasi...</td></tr>
            ) : filteredApps.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>Tidak ada pengajuan penjual.</td></tr>
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
                    <td>{app.created_at ? new Date(app.created_at).toLocaleString('id-ID', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'}).replace(/\//g, ' - ').replace(/\./g, ':') : '-'}</td>
                    <td>
                      <button 
                        className="btn-lihat-detail"
                        onClick={() => router.push(`/admin/verifikasi/${app.user_id}`)}
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
