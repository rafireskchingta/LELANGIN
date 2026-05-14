import { supabase } from '../lib/supabase';

/**
 * Fetch products with filters, search, and sorting
 * @param {Object} options - Filter options
 * @param {string} options.kategori - Product category filter (e.g., 'Elektronik', 'Seni', 'Hobi', 'Semua')
 * @param {number} options.hargaMin - Minimum price filter
 * @param {number} options.hargaMax - Maximum price filter
 * @param {array} options.lokasi - Array of locations to filter (Java provinces)
 * @param {number} options.tahunMin - Minimum production year
 * @param {number} options.tahunMax - Maximum production year
 * @param {string} options.search - Search keyword in product name
 * @param {string} options.sortBy - Sort order: 'terbaru' or 'terlama'
 * @returns {Promise<Array>} Array of products
 */
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

    // Filter kategori
    if (kategori !== 'Semua') {
      query = query.eq('kategori', kategori);
    }

    // Filter harga berdasarkan current_price
    if (hargaMin > 0 || hargaMax !== Infinity) {
      query = query.gte('current_price', hargaMin).lte('current_price', hargaMax);
    }

    // Filter lokasi
    if (lokasi.length > 0) {
      query = query.in('lokasi', lokasi);
    }

    // Filter tahun produksi
    if (tahunMin > 0 || tahunMax < 9999) {
      query = query.gte('tahun_produksi', tahunMin).lte('tahun_produksi', tahunMax);
    }

    // Filter search (case-insensitive)
    if (search) {
      query = query.ilike('nama_produk', `%${search}%`);
    }

    // FIX B-01 & B-02: Terapkan sorting SEBELUM eksekusi query, hapus duplikat ilike
    if (sortBy === 'terbaru') {
      query = query.order('waktu_mulai', { ascending: false });
    } else if (sortBy === 'terlama') {
      query = query.order('waktu_mulai', { ascending: true });
    }

    // Execute query
    let { data, error } = await query;

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

/**
 * Fetch single product detail by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Product data
 */
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
      .single();

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

/**
 * Get all product categories from database (or predefined)
 * @returns {Promise<Array>} Array of category strings
 */
export async function getCategories() {
  // Predefined categories based on enum
  // In production, these could be fetched from a categories table
  return ['Semua', 'Seni', 'Elektronik', 'Hobi', 'Furniture', 'Fashion', 'Otomotif'];
}

/**
 * Get all Java provinces for location filter
 * @returns {Array} Array of Java province names
 */
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

/**
 * Fetch bids for a product
 * @param {string} productId - Product ID
 * @param {number} limit - Maximum number of bids to fetch
 * @returns {Promise<Array>} Array of bids
 */
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
