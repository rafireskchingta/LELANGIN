import { supabase } from '../lib/supabase';

export async function fetchProducts(options = {}) {
  const {
    kategori = 'Semua',
    hargaMin = 0,
    hargaMax = Infinity,
    lokasi = [],
    tahunMin = 0,
    tahunMax = 9999,
    search = '',
    sortBy = 'terbaru'
  } = options;

  try {
    let query = supabase
      .from('products')
      .select(`
        id,
        nama_produk,
        kategori,
        harga_awal,
        current_price,
        image_urls,
        lokasi,
        tahun_produksi,
        waktu_mulai,
        waktu_selesai,
        status,
        seller_id,
        merk,
        model,
        warna,
        daya_listrik,
        kapasitas,
        tegangan
      `)
      .eq('status', 'aktif')
      .filter('deleted_at', 'is', null);

    if (kategori !== 'Semua') {
      query = query.eq('kategori', kategori);
    }

    if (hargaMin > 0 || hargaMax !== Infinity) {
      query = query.gte('current_price', hargaMin).lte('current_price', hargaMax);
    }

    if (lokasi.length > 0) {
      query = query.in('lokasi', lokasi);
    }

    if (tahunMin > 0 || tahunMax < 9999) {
      query = query.gte('tahun_produksi', tahunMin).lte('tahun_produksi', tahunMax);
    }

    // Filter search — hanya satu kali (FIX B-02: hapus duplikat)
    if (search) {
      query = query.ilike('nama_produk', `%${search}%`);
    }

    // FIX B-01: Sorting diterapkan SEBELUM eksekusi query
    if (sortBy === 'terbaru') {
      query = query.order('waktu_mulai', { ascending: false });
    } else if (sortBy === 'terlama') {
      query = query.order('waktu_mulai', { ascending: true });
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in fetchProducts:', err);
    return [];
  }
}

export async function fetchProductDetail(productId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        nama_produk,
        kategori,
        harga_awal,
        current_price,
        image_urls,
        lokasi,
        tahun_produksi,
        waktu_mulai,
        waktu_selesai,
        status,
        seller_id,
        merk,
        model,
        warna,
        daya_listrik,
        kapasitas,
        tegangan,
        kondisi_fisik,
        kelengkapan,
        estetika_tampilan,
        dokumen_pendukung,
        kemasan_box,
        aksesoris_tambahan,
        kondisi,
        created_at
      `)
      .eq('id', productId)
      .filter('deleted_at', 'is', null)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product detail:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in fetchProductDetail:', err);
    return null;
  }
}

export async function getCategories() {
  return ['Semua', 'Seni', 'Elektronik', 'Hobi', 'Furniture', 'Fashion', 'Otomotif'];
}

export function getJavaProvinces() {
  return [
    'DKI Jakarta',
    'Banten',
    'Jawa Barat',
    'Jawa Tengah',
    'DI Yogyakarta',
    'Jawa Timur'
  ];
}

export async function fetchProductBids(productId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        id,
        product_id,
        bidder_id,
        amount,
        is_winning_bid,
        created_at,
        profiles:bidder_id(username, full_name)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching bids:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in fetchProductBids:', err);
    return [];
  }
}