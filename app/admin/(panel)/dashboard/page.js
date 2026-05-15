'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../src/lib/supabase';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, sellers: 0, activeAuctions: 0, completedTransactions: 0 });
  const [activities, setActivities] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Users (exclude admins maybe, or all profiles)
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).is('deleted_at', null);
      
      // Sellers
      const { count: sellersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'penjual').is('deleted_at', null);
      
      // Active Auctions
      const { count: activeCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'aktif').is('deleted_at', null);
      
      // Completed Transactions (assuming terjual is the status for completed ones)
      const { count: transCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'terjual').is('deleted_at', null);

      setStats({
        users: usersCount || 0,
        sellers: sellersCount || 0,
        activeAuctions: activeCount || 0,
        completedTransactions: transCount || 0
      });
    };

    const fetchActivities = async () => {
      setLoadingActivities(true);
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

        // Fetch recent new auctions (products created recently) ONLY TODAY
        const { data: newProducts } = await supabase
          .from('products')
          .select('id, nama_produk, created_at, current_price, seller_id, profiles(full_name, username)')
          .is('deleted_at', null)
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay)
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch completed transactions (sold items) ONLY TODAY
        const { data: completedTrans } = await supabase
          .from('transactions')
          .select('id, created_at, product_id, products(nama_produk, current_price, harga_awal)')
          .eq('status_transaksi', 'selesai')
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay)
          .order('created_at', { ascending: false })
          .limit(10);

        // Combine and sort activities
        const combined = [];

        if (newProducts && newProducts.length > 0) {
          newProducts.forEach(p => {
            combined.push({
              type: 'new_auction',
              sellerName: p.profiles?.full_name || p.profiles?.username || 'Penjual',
              productName: p.nama_produk || 'Produk',
              timestamp: p.created_at,
              id: 'prod-' + p.id
            });
          });
        }

        if (completedTrans && completedTrans.length > 0) {
          completedTrans.forEach(t => {
            combined.push({
              type: 'auction_sold',
              productName: t.products?.nama_produk || 'Produk',
              price: t.products?.current_price || t.products?.harga_awal || 0,
              timestamp: t.created_at,
              id: 'trans-' + t.id
            });
          });
        }

        // Sort all by timestamp descending
        combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setActivities(combined);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoadingActivities(false);
      }
    };

    const fetchRecentTransactions = async () => {
      setLoadingTransactions(true);
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

        const { data, error } = await supabase
          .from('transactions')
          .select(`
            id,
            status_transaksi,
            created_at,
            product_id,
            products(nama_produk, seller_id, profiles(full_name, username))
          `)
          .in('status_transaksi', ['selesai', 'dikirim', 'diproses'])
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setRecentTransactions(data);
        }
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchStats();
    fetchActivities();
    fetchRecentTransactions();
  }, []);

  const formatRupiah = (angka) => {
    if (!angka) return 'Rp 0';
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const day = date.getDate();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'selesai': return 'Selesai';
      case 'dikirim': return 'Dikirim';
      case 'diproses': return 'Diproses';
      case 'menunggu_pembayaran': return 'Menunggu';
      case 'dibatalkan': return 'Dibatalkan';
      default: return status || '-';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'selesai': return 'badge-selesai';
      case 'dikirim': return 'badge-dikirim';
      case 'diproses': return 'badge-dikirim';
      default: return 'badge-selesai';
    }
  };

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
        <div className="admin-panel-card admin-panel-card-stretch">
          <h2 className="panel-card-title" style={{ color: '#111827', textDecoration: 'none' }}>Aktivitas Terbaru</h2>
          <div className="activity-list-scroll">
            {loadingActivities ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ width: '85%', height: '14px', borderRadius: '4px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                      <div style={{ width: '50px', height: '10px', borderRadius: '4px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>Belum ada aktivitas terbaru.</p>
            ) : (
              <ul className="activity-list">
                {activities.map((activity) => (
                  <li key={activity.id}>
                    <div className="activity-icon">
                      {activity.type === 'new_auction' ? (
                        <i className="ph ph-plus-circle"></i>
                      ) : (
                        <i className="ph ph-check-circle"></i>
                      )}
                    </div>
                    <div className="activity-content">
                      {activity.type === 'new_auction' ? (
                        <p style={{ color: '#111827' }}>
                          <strong>{activity.sellerName}</strong> membuat lelang baru &quot;{activity.productName}&quot;
                        </p>
                      ) : (
                        <p style={{ color: '#111827' }}>
                          Lelang <strong>&quot;{activity.productName}&quot;</strong> terjual seharga <strong>{formatRupiah(activity.price)}</strong>
                        </p>
                      )}
                      <span className="activity-time">{formatDateTime(activity.timestamp)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Status Transaksi Terkini */}
        <div className="admin-panel-card admin-panel-card-stretch">
          <h2 className="panel-card-title" style={{ color: '#111827' }}>Status Transaksi Terkini</h2>
          <div className="activity-list-scroll">
            {loadingTransactions ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                    <div style={{ flex: 1, height: '14px', borderRadius: '4px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                    <div style={{ width: '60px', height: '22px', borderRadius: '999px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                  </div>
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>Belum ada transaksi terkini.</p>
            ) : (
              <ul className="transaction-list">
                {recentTransactions.map((trx) => {
                  const productName = trx.products?.nama_produk || 'Produk';
                  const sellerName = trx.products?.profiles?.full_name || trx.products?.profiles?.username || 'Penjual';
                  const statusLabel = getStatusLabel(trx.status_transaksi);
                  const badgeClass = getStatusBadgeClass(trx.status_transaksi);

                  return (
                    <li key={trx.id}>
                      <div className="trans-icon">
                        <i className="ph ph-check-circle"></i>
                      </div>
                      <div className="trans-name" style={{ color: '#111827' }}>
                        Lelang <strong>&quot;{productName}&quot;</strong> oleh <strong>{sellerName}</strong> telah selesai
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.25rem' }}>{formatDateTime(trx.created_at)}</div>
                      </div>
                      <div className={`trans-badge ${badgeClass}`}>{statusLabel}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
