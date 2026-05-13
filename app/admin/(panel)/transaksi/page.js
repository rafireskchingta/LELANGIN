'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../../src/lib/supabase';

function AdminTransaksiContent() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          product_id,
          winner_id,
          phone_number,
          status_transaksi,
          created_at,
          products(nama_produk, current_price, harga_awal),
          profiles(full_name, phone_number)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error.message);
        setTransactions([]);
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka) => {
    if (!angka) return 'Rp 0';
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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

  const getStatusClass = (status) => {
    switch (status) {
      case 'selesai': return 'selesai';
      case 'dikirim': return 'dikirim';
      case 'diproses': return 'dikirim';
      default: return 'selesai';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y} - ${m} - ${d}`;
  };

  return (
    <div className="admin-transaksi-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Riwayat Transaksi</h1>
      </div>

      <div className="admin-table-container" style={{ marginTop: '2rem' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID TRANSAKSI</th>
              <th>NAMA PRODUK</th>
              <th>PEMENANG</th>
              <th>NO TELP</th>
              <th>STATUS</th>
              <th>HARGA TERTINGGI</th>
              <th>TANGGAL DIBUAT</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}>
                        <div style={{ height: '20px', borderRadius: '4px', background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : (() => {
              const filteredTransactions = transactions.filter(trx => {
                const productName = trx.products?.nama_produk || '';
                const winnerName = trx.profiles?.full_name || '';
                const idShort = trx.id?.substring(0, 8) || '';
                return productName.toLowerCase().includes(query.toLowerCase()) || 
                  winnerName.toLowerCase().includes(query.toLowerCase()) ||
                  idShort.toLowerCase().includes(query.toLowerCase());
              });

              if (filteredTransactions.length === 0) {
                return <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>Tidak ada riwayat transaksi{query ? ' yang cocok dengan pencarian' : ''}.</td></tr>;
              }

              return filteredTransactions.map((trx, index) => {
                const statusClass = getStatusClass(trx.status_transaksi);
                const statusLabel = getStatusLabel(trx.status_transaksi);
                const harga = trx.products?.current_price || trx.products?.harga_awal || 0;
                const winnerName = trx.profiles?.full_name || '-';
                const phone = trx.phone_number || trx.profiles?.phone_number || '-';
                const productName = trx.products?.nama_produk || '-';
                
                return (
                  <tr key={trx.id || index}>
                    <td style={{ color: '#4F46E5', fontWeight: 600 }}>{trx.id?.substring(0, 8).toUpperCase() || '-'}</td>
                    <td style={{ color: '#4F46E5', fontWeight: 600 }}>{productName}</td>
                    <td><strong>{winnerName}</strong></td>
                    <td>{phone}</td>
                    <td>
                      <span className={`status-badge ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td>{formatRupiah(harga)}</td>
                    <td>{formatDate(trx.created_at)}</td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminTransaksiPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminTransaksiContent />
    </Suspense>
  );
}
