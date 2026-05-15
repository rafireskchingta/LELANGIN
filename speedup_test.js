
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Baca file .env.local secara manual agar tidak perlu modul dotenv tambahan
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function speedUpAuction() {
  try {
    const { data: latestBid, error: bidError } = await supabase
      .from('bids')
      .select('bidder_id, product_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (bidError || !latestBid) {
      console.log("❌ Tidak ada data bid ditemukan. Silakan lakukan bid pada salah satu barang dulu di web.");
      return;
    }

    const productId = latestBid.product_id;
    const newEndTime = new Date(Date.now() + 65000).toISOString(); 

    const { data, error } = await supabase
      .from('products')
      .update({ waktu_selesai: newEndTime })
      .eq('id', productId)
      .select();

    if (error) throw error;

    console.log(`✅ BERHASIL! Barang "${data[0].nama_produk}" akan berakhir dalam 1 menit.`);
    console.log(`Silakan cek tab "Sedang Diikuti", tunggu sampai 00:00:00, lalu cek tab "Menang Lelang".`);
  } catch (err) {
    console.error("❌ Gagal mempercepat lelang:", err.message);
  }
}

speedUpAuction();
