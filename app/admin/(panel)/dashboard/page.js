'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../src/lib/supabase';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, sellers: 0, activeAuctions: 0, completedTransactions: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      // Users (exclude admins maybe, or all profiles)
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).is('deleted_at', null);
      
      // Sellers
      const { count: sellersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'penjual').is('deleted_at', null);
      
      // Active Auctions
      const { count: activeCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'berlangsung');
      
      // Completed Transactions (assuming terjual is the status for completed ones)
      const { count: transCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'terjual');

      setStats({
        users: usersCount || 0,
        sellers: sellersCount || 0,
        activeAuctions: activeCount || 0,
        completedTransactions: transCount || 0
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard">
      <h1 className="admin-page-title">Ringkasan Sistem</h1>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon stat-users">
            <i className="ph ph-users"></i>
          </div>
          <div className="stat-info">
            <p>Total Pengguna</p>
            <h3>{stats.users}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon stat-done">
            <i className="ph ph-storefront"></i>
          </div>
          <div className="stat-info">
            <p>Total Penjual</p>
            <h3>{stats.sellers}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon stat-active">
            <i className="ph ph-browser"></i>
          </div>
          <div className="stat-info">
            <p>Lelang Aktif</p>
            <h3>{stats.activeAuctions}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon stat-trans">
            <i className="ph ph-currency-dollar"></i>
          </div>
          <div className="stat-info">
            <p>Transaksi Selesai</p>
            <h3>{stats.completedTransactions}</h3>
          </div>
        </div>
      </div>

      {/* 2 Column Section */}
      <div className="admin-dashboard-split">
        {/* Aktivitas Terbaru */}
        <div className="admin-panel-card">
          <h2 className="panel-card-title underline-blue">Aktivitas Terbaru</h2>
          <ul className="activity-list">
            <li>
              <div className="activity-icon">
                <i className="ph ph-check-circle"></i>
              </div>
              <div className="activity-content">
                <p><strong>User #42</strong> menyelesaikan transaksi untuk "Kamera Vintage"</p>
                <span className="activity-time">2 menit yang lalu</span>
              </div>
            </li>
            <li>
              <div className="activity-icon">
                <i className="ph ph-check-circle"></i>
              </div>
              <div className="activity-content">
                <p><strong>User #30</strong> menyelesaikan transaksi untuk "Kamera Vintage"</p>
                <span className="activity-time">2 menit yang lalu</span>
              </div>
            </li>
            <li>
              <div className="activity-icon">
                <i className="ph ph-check-circle"></i>
              </div>
              <div className="activity-content">
                <p><strong>User #21</strong> menyelesaikan transaksi untuk "Kamera Vintage"</p>
                <span className="activity-time">2 menit yang lalu</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Status Transaksi Terkini */}
        <div className="admin-panel-card">
          <h2 className="panel-card-title">Status Transaksi Terkini</h2>
          <ul className="transaction-list">
            <li>
              <div className="trans-icon">
                <i className="ph ph-currency-dollar"></i>
              </div>
              <div className="trans-name">Budi Santoso</div>
              <div className="trans-badge badge-dikirim">Dikirim</div>
            </li>
            <li>
              <div className="trans-icon">
                <i className="ph ph-currency-dollar"></i>
              </div>
              <div className="trans-name">Safira Zahra</div>
              <div className="trans-badge badge-selesai">Selesai</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
