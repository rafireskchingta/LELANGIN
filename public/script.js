// =============================================
// LELANGIN - Backend JavaScript
// =============================================

// =============================================
// DATA MANAGEMENT (localStorage)
// =============================================
const DB = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  remove: (key) => localStorage.removeItem(key),
  getUser: () => DB.get('lelangin_user'),
  setUser: (u) => DB.set('lelangin_user', u),
  isLoggedIn: () => !!DB.get('lelangin_user'),
  getProducts: () => DB.get('lelangin_products') || [],
  setProducts: (p) => DB.set('lelangin_products', p),
  addProduct: (p) => { const products = DB.getProducts(); p.id = Date.now(); p.createdAt = new Date().toISOString(); products.push(p); DB.setProducts(products); return p; },
  deleteProduct: (id) => { const products = DB.getProducts().filter(p => p.id !== id); DB.setProducts(products); },
  getFavorites: () => DB.get('lelangin_favorites') || [],
  toggleFavorite: (itemId) => { const favs = DB.getFavorites(); const idx = favs.indexOf(itemId); if (idx >= 0) favs.splice(idx, 1); else favs.push(itemId); DB.set('lelangin_favorites', favs); return idx < 0; },
  isFavorite: (itemId) => DB.getFavorites().includes(itemId),
};

// =============================================
// DEFAULT USER
// =============================================
// [REMOVED] initDefaultUser() removed so Safira is not forced on load

// =============================================
// TOAST NOTIFICATION
// =============================================
function showToast(msg, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;top:5.5rem;right:1.5rem;z-index:99999;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const bg = type === 'success' ? '#4F46E5' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#6B7280';
  toast.style.cssText = `background:${bg};color:#fff;padding:0.85rem 1.5rem;border-radius:8px;font-size:0.9rem;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.2);opacity:0;transform:translateY(-10px);transition:all 0.3s ease;max-width:320px;pointer-events:auto;`;
  toast.textContent = msg;
  container.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-10px)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// =============================================
// MODAL SYSTEM
// =============================================
function setupModals() {
  const modalOverlay = document.getElementById('modalOverlay');
  if (!modalOverlay) return;
  const modals = modalOverlay.querySelectorAll('.modal');

  function openModal(modal) {
    modalOverlay.classList.add('active');
    modals.forEach(m => m.classList.remove('active'));
    if (modal) modal.classList.add('active');
  }
  function closeModal() {
    modalOverlay.classList.remove('active');
    modals.forEach(m => m.classList.remove('active'));
  }

  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
  modalOverlay.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', closeModal));

  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const successModal = document.getElementById('successModal');

  const linkToRegister = document.getElementById('linkToRegister');
  const linkToLogin = document.getElementById('linkToLogin');
  if (linkToRegister) linkToRegister.addEventListener('click', (e) => { e.preventDefault(); openModal(registerModal); });
  if (linkToLogin) linkToLogin.addEventListener('click', (e) => { e.preventDefault(); openModal(loginModal); });

  const btnToLoginFromSuccess = document.getElementById('btnToLoginFromSuccess');
  if (btnToLoginFromSuccess) btnToLoginFromSuccess.addEventListener('click', () => openModal(loginModal));

  // LOGIN & REGISTER: Now handled by React Component (AuthModals.js)
  // Vanilla JS listeners removed to prevent conflicts.

  // Item detail modal
  const itemDetailModal = document.getElementById('itemDetailModal');
  if (itemDetailModal) {
    const detailBtn = itemDetailModal.querySelector('.btn-primary-full');
    if (detailBtn) detailBtn.addEventListener('click', () => { window.location.href = 'detail.html'; });
    const btnHistory = itemDetailModal.querySelector('.btn-history');
    if (btnHistory) btnHistory.addEventListener('click', (e) => { e.stopPropagation(); showToast('Memuat riwayat penawaran...', 'info'); });
  }

  // Warning modal
  const warningModal = document.getElementById('warningModal');
  if (warningModal) {
    const btnLanjut = warningModal.querySelector('.btn-primary, .btn-primary-full');
    if (btnLanjut) {
      btnLanjut.addEventListener('click', () => {
        closeModal();
        showToast('Penawaran berhasil dikirim!', 'success');
        // Redirect setelah tawar jika sudah login
        setTimeout(() => { window.location.href = 'status-lelang.html'; }, 1500);
      });
    }
  }

  window._openLoginModal = () => openModal(loginModal);
  return { openModal, closeModal };
}

// =============================================
// HEADER STATE
// =============================================
function updateHeaderState() {
  const user = DB.getUser();
  const sidebarPic = document.querySelector('.sidebar-pic');
  const sidebarH3 = document.querySelector('.sidebar-user h3');
  if (sidebarPic && user) sidebarPic.textContent = user.avatar || (user.nama || 'U').charAt(0).toUpperCase();
  if (sidebarH3 && user) sidebarH3.textContent = user.username || user.nama;

  // [REMOVED] Navbar.js (React) now handles the btn-akun state entirely.
  // document.querySelectorAll('.btn-akun').forEach(btn => { ... });

  const btnKeluar = document.getElementById('btnKeluar');
  if (btnKeluar) {
    btnKeluar.addEventListener('click', (e) => {
      e.preventDefault();
      DB.remove('lelangin_user');
      localStorage.removeItem('isLoggedIn');
      window.dispatchEvent(new Event('auth-change')); // Beritahu React
      
      if (window.supabaseClient) {
        window.supabaseClient.auth.signOut(); // Logout dari Supabase
      }
      
      showToast('Berhasil keluar!', 'info');
      setTimeout(() => window.location.href = '/', 1000);
    });
  }
}

// =============================================
// ACCORDION
// =============================================
function setupAccordion() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const activeItem = document.querySelector('.accordion-item.active');
      const currentItem = header.parentElement;
      if (activeItem && activeItem !== currentItem) {
        activeItem.classList.remove('active');
        const icon = activeItem.querySelector('i.ph');
        if (icon) { icon.classList.remove('ph-caret-up'); icon.classList.add('ph-caret-down'); }
      }
      currentItem.classList.toggle('active');
      const currentIcon = header.querySelector('i.ph');
      if (currentIcon) {
        if (currentItem.classList.contains('active')) { currentIcon.classList.remove('ph-caret-down'); currentIcon.classList.add('ph-caret-up'); }
        else { currentIcon.classList.remove('ph-caret-up'); currentIcon.classList.add('ph-caret-down'); }
      }
    });
  });
}

// =============================================
// CARA LELANG TABS
// =============================================
function setupCaraTabs() {
  const caraTabs = document.querySelectorAll('.cara-tab');
  const caraContents = document.querySelectorAll('.cara-content-section');
  if (!caraTabs.length) return;
  caraTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      caraTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      caraContents.forEach(c => { c.style.display = (c.id === 'content-' + target) ? 'block' : 'none'; });
    });
  });
}

// =============================================
// RIWAYAT TOGGLE
// =============================================
function setupRiwayatToggle() {
  const btn = document.getElementById('btnToggleRiwayat');
  const body = document.getElementById('bodyRiwayat');
  const icon = document.getElementById('iconRiwayatToggle');
  if (!btn || !body) return;
  btn.addEventListener('click', () => {
    const hidden = body.style.display === 'none' || body.style.display === '';
    body.style.display = hidden ? 'block' : 'none';
    if (icon) { icon.classList.toggle('ph-caret-down', !hidden); icon.classList.toggle('ph-caret-up', hidden); }
  });
}

// =============================================
// FORM PENAWARAN
// =============================================
function setupFormPenawaran() {
  const form = document.getElementById('formPenawaran');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!DB.isLoggedIn()) {
      showToast('Silakan masuk terlebih dahulu.', 'warning');
      if (window._openLoginModal) window._openLoginModal();
      return;
    }
    const warningModal = document.getElementById('warningModal');
    if (warningModal) {
      const overlay = document.getElementById('modalOverlay');
      if (overlay) { overlay.classList.add('active'); document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); warningModal.classList.add('active'); }
    }
  });
}

// =============================================
// EDIT PROFIL (akun-saya.html)
// =============================================
function setupEditProfile() {
  const formProfile = document.getElementById('formProfile');
  if (!formProfile) return;

  const btnEdit   = document.getElementById('btnEditProfile');
  const btnSimpan = document.getElementById('btnSimpanProfile');

  // Ambil elemen field by id
  const $ = (id) => document.getElementById(id);

  // --- Load data user dari localStorage ke form ---
  function loadUserToForm() {
    const user = DB.getUser();
    if (!user) return;

    if ($('field-username')) $('field-username').value = user.username || '';
    if ($('field-nama'))     $('field-nama').value     = user.nama     || '';
    if ($('field-email'))    $('field-email').value    = user.email    || '';
    if ($('field-noTelp'))   $('field-noTelp').value   = user.noTelp  || '';
    if ($('field-alamat'))   $('field-alamat').value   = user.alamat  || '';

    // Select jenis kelamin
    if ($('field-jenisKelamin')) {
      $('field-jenisKelamin').value = user.jenisKelamin || 'Perempuan';
    }
    // Select tanggal lahir
    if ($('field-tgl'))   $('field-tgl').value   = String(user.tglLahirTgl   || '');
    if ($('field-bulan')) $('field-bulan').value = String(user.tglLahirBulan || '');
    if ($('field-tahun')) $('field-tahun').value = String(user.tglLahirTahun || '');

    // Update sidebar avatar & username
    const pic = document.querySelector('.sidebar-pic');
    const h3  = document.querySelector('.sidebar-user h3');
    if (pic) pic.textContent = user.avatar || (user.nama || 'U').charAt(0).toUpperCase();
    if (h3)  h3.textContent  = user.username || user.nama || '';
  }

  // Jalankan load saat halaman dibuka
  loadUserToForm();

  // --- Tombol EDIT: buka semua field ---
  if (btnEdit) {
    btnEdit.addEventListener('click', function (e) {
      e.preventDefault();

      // Aktifkan semua input & select di form ini
      formProfile.querySelectorAll('input, select, textarea').forEach(function (el) {
        el.disabled = false;
        el.readOnly = false;
      });

      btnEdit.style.display   = 'none';
      if (btnSimpan) btnSimpan.style.display = 'inline-block';

      showToast('Mode edit aktif. Ubah data lalu klik Simpan.', 'info');
    });
  }

  // --- Tombol SIMPAN (submit form): simpan ke localStorage ---
  formProfile.addEventListener('submit', function (e) {
    e.preventDefault();

    const user = DB.getUser() || {};

    // Baca nilai dari setiap field
    if ($('field-username') && $('field-username').value.trim()) user.username = $('field-username').value.trim();
    if ($('field-nama')     && $('field-nama').value.trim())     user.nama     = $('field-nama').value.trim();
    if ($('field-email')    && $('field-email').value.trim())    user.email    = $('field-email').value.trim();
    if ($('field-noTelp')   && $('field-noTelp').value.trim())   user.noTelp   = $('field-noTelp').value.trim();
    if ($('field-alamat'))  user.alamat  = $('field-alamat').value.trim();

    if ($('field-jenisKelamin') && $('field-jenisKelamin').value) user.jenisKelamin  = $('field-jenisKelamin').value;
    if ($('field-tgl')   && $('field-tgl').value)   user.tglLahirTgl   = $('field-tgl').value;
    if ($('field-bulan') && $('field-bulan').value) user.tglLahirBulan = $('field-bulan').value;
    if ($('field-tahun') && $('field-tahun').value) user.tglLahirTahun = $('field-tahun').value;

    user.avatar = (user.nama || user.username || 'U').charAt(0).toUpperCase();

    // Simpan ke localStorage
    DB.setUser(user);

    // Kunci kembali semua field
    formProfile.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.disabled = true;
    });

    // Tampilkan kembali tombol Edit, sembunyikan Simpan
    if (btnEdit)   btnEdit.style.display   = 'inline';
    if (btnSimpan) btnSimpan.style.display = 'none';

    // Update sidebar
    const pic = document.querySelector('.sidebar-pic');
    const h3  = document.querySelector('.sidebar-user h3');
    if (pic) pic.textContent = user.avatar;
    if (h3)  h3.textContent  = user.username || user.nama;

    showToast('✓ Profil berhasil disimpan!', 'success');
  });
}

// =============================================
// DAFTAR PENJUAL (akun-penjual.html)
// =============================================
function setupDaftarPenjual() {
  const form = document.getElementById('formDaftarPenjual');
  const overlay = document.getElementById('modalOverlayPenjual');
  const successModal = document.getElementById('successModalPenjual');
  if (!form) return;

  // Upload area
  const fileInputs = form.querySelectorAll('input[type="file"]');
  fileInputs.forEach(fileInput => {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) showToast('File "' + file.name + '" siap diupload.', 'info');
    });
  });

  // Click on "upload file" links
  form.querySelectorAll('a[href="#"]').forEach(link => {
    const nearInput = link.closest('[class*="upload"], .upload-area')?.querySelector('input[type="file"]') || fileInputs[0];
    if (nearInput) link.addEventListener('click', (e) => { e.preventDefault(); nearInput.click(); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const user = DB.getUser() || {};
    user.isPenjual = true;
    DB.setUser(user);
    if (overlay && successModal) { overlay.classList.add('active'); successModal.classList.add('active'); }
    showToast('Pendaftaran penjual berhasil!', 'success');
  });

  if (overlay) {
    overlay.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => { overlay.classList.remove('active'); if (successModal) successModal.classList.remove('active'); });
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.classList.remove('active'); if (successModal) successModal.classList.remove('active'); }
    });
  }
}

// =============================================
// TAMBAH PRODUK (akun-tambah-produk.html)
// =============================================
function setupTambahProduk() {
  const form = document.getElementById('formTambahProduk');
  if (!form) return;

  const fileInput = form.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let preview = document.getElementById('imgPreview');
        if (!preview) {
          preview = document.createElement('img');
          preview.id = 'imgPreview';
          preview.style.cssText = 'width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin-top:0.75rem;';
          const uploadArea = form.querySelector('[style*="border: 1px dashed"], [style*="border:1px dashed"], .upload-area');
          if (uploadArea) uploadArea.appendChild(preview);
        }
        preview.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  form.querySelectorAll('a[href="#"]').forEach(link => {
    if (fileInput) link.addEventListener('click', (e) => { e.preventDefault(); fileInput.click(); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const product = {};
    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.name) product[el.name] = el.value;
    });
    // fallback: get inputs by order
    const allInputs = form.querySelectorAll('input[type="text"], input[type="number"], textarea');
    if (!product.nama && allInputs[0]) product.nama = allInputs[0].value;
    if (!product.harga && allInputs[1]) product.harga = allInputs[1].value;

    const imgPreview = document.getElementById('imgPreview');
    if (imgPreview) product.foto = imgPreview.src;

    DB.addProduct(product);
    showToast('Produk berhasil ditambahkan!', 'success');
    setTimeout(() => window.location.href = 'akun-titip-lelang.html', 1200);
  });

  // The "Tambah Produk" link in akun-tambah-produk.html is actually an <a> not submit
  const tambahLink = document.querySelector('a.btn-primary-full[href="akun-titip-lelang.html"]');
  if (tambahLink) {
    tambahLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (form) form.dispatchEvent(new Event('submit'));
    });
  }
}

// =============================================
// TITIP LELANG (akun-titip-lelang.html)
// =============================================
function setupTitipLelang() {
  const emptyState = document.querySelector('[style*="background-color: #FAFAFA"]');
  if (!emptyState) return;

  renderProducts();

  function renderProducts() {
    const products = DB.getProducts();
    const centerDiv = emptyState.querySelector('[style*="flex-direction: column"][style*="align-items: center"]');
    if (!centerDiv) return;

    const existing = document.getElementById('productList');
    if (existing) existing.remove();

    if (products.length === 0) {
      centerDiv.style.display = 'flex';
      return;
    }

    centerDiv.style.display = 'none';
    const listEl = document.createElement('div');
    listEl.id = 'productList';
    listEl.style.cssText = 'width:100%;display:flex;flex-direction:column;gap:0.75rem;padding-top:3.5rem;';

    products.forEach(p => {
      const item = document.createElement('div');
      item.dataset.id = p.id;
      item.style.cssText = 'background:#fff;border:1px solid #E5E7EB;border-radius:8px;padding:0.85rem 1.25rem;display:flex;justify-content:space-between;align-items:center;';
      item.innerHTML = `
        <div style="display:flex;gap:1rem;align-items:center;">
          ${p.foto ? `<img src="${p.foto}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;">` : '<div style="width:48px;height:48px;background:#EEF2FF;border-radius:6px;display:flex;align-items:center;justify-content:center;"><i class="ph ph-image" style="color:#4F46E5;font-size:1.4rem;"></i></div>'}
          <div>
            <p style="font-weight:600;margin:0 0 0.2rem;">${p.nama || p['nama-produk'] || 'Produk'}</p>
            <p style="font-size:0.8rem;color:#6B7280;margin:0;">Harga Awal: Rp ${parseInt(p.harga || p['harga-awal'] || 0).toLocaleString('id-ID')}</p>
          </div>
        </div>
        <button class="btn-hapus-produk" style="background:none;border:none;color:#EF4444;cursor:pointer;padding:0.4rem;font-size:1.2rem;" title="Hapus Produk"><i class="ph ph-trash"></i></button>
      `;
      listEl.appendChild(item);
    });

    emptyState.insertBefore(listEl, emptyState.firstChild);

    // Tambah produk button
    let addBtnWrap = document.getElementById('addProductBtnWrap');
    if (!addBtnWrap) {
      addBtnWrap = document.createElement('div');
      addBtnWrap.id = 'addProductBtnWrap';
      addBtnWrap.style.cssText = 'display:flex;justify-content:center;margin-top:1rem;';
      addBtnWrap.innerHTML = `<a href="akun-tambah-produk.html" style="text-decoration:none;display:flex;align-items:center;gap:0.5rem;color:#4F46E5;font-weight:600;font-size:0.9rem;"><i class="ph ph-plus-circle" style="font-size:1.2rem;"></i> Tambah Produk</a>`;
      emptyState.appendChild(addBtnWrap);
    }

    document.querySelectorAll('.btn-hapus-produk').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.closest('[data-id]').dataset.id);
        if (confirm('Yakin hapus produk ini?')) {
          DB.deleteProduct(id);
          renderProducts();
          showToast('Produk dihapus.', 'info');
        }
      });
    });
  }

  // Tampilkan Seluruh Produk
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.includes('Tampilkan Seluruh Produk')) {
      btn.addEventListener('click', () => { renderProducts(); showToast('Menampilkan semua produk.', 'info'); });
    }
  });

  // + button (add product)
  document.querySelectorAll('button').forEach(btn => {
    const icon = btn.querySelector('i.ph-plus');
    if (icon) btn.addEventListener('click', () => window.location.href = 'akun-tambah-produk.html');
  });

  // Trash button (header area)
  document.querySelectorAll('button').forEach(btn => {
    const icon = btn.querySelector('i.ph-trash');
    if (icon) btn.addEventListener('click', () => {
      if (!DB.getProducts().length) { showToast('Tidak ada produk.', 'info'); return; }
      if (confirm('Hapus semua produk?')) { DB.setProducts([]); renderProducts(); showToast('Semua produk dihapus.', 'info'); }
    });
  });
}

// =============================================
// JELAJAHI
// =============================================
function setupJelajahi() {
  const btnCari = document.querySelector('.btn-primary-j');
  const searchInput = document.querySelector('input[placeholder], input[type="search"], input[type="text"]');

  if (btnCari) {
    btnCari.addEventListener('click', () => {
      const val = searchInput ? searchInput.value.trim() : '';
      if (!val) { showToast('Masukkan kata kunci.', 'info'); return; }
      showToast('Mencari "' + val + '"...', 'info');
    });
  }

  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.trim() === 'Terapkan') {
      btn.addEventListener('click', () => showToast('Filter berhasil diterapkan!', 'success'));
    }
  });

  // Category cards click
  document.querySelectorAll('.category-card, .category-wrap').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => window.location.href = 'jelajahi.html');
  });
}

// =============================================
// STATUS LELANG TABS
// =============================================
function setupStatusLelang() {
  const tabPb = document.getElementById('tabPembeli');
  const tabPj = document.getElementById('tabPenjual');
  const vPb = document.getElementById('pembeliView');
  const vPj = document.getElementById('penjualView');
  if (!tabPb || !tabPj) return;

  tabPb.addEventListener('click', () => {
    tabPb.classList.add('active'); tabPj.classList.remove('active');
    tabPb.style.color = 'var(--primary)'; tabPj.style.color = '';
    vPb.style.display = 'flex'; vPj.style.display = 'none';
  });
  tabPj.addEventListener('click', () => {
    tabPj.classList.add('active'); tabPb.classList.remove('active');
    tabPj.style.color = 'var(--primary)'; tabPb.style.color = '';
    vPj.style.display = 'flex'; vPb.style.display = 'none';
  });
}

// =============================================
// PENGIRIMAN - UBAH ALAMAT
// =============================================
function setupPengiriman() {
  document.querySelectorAll('a[href="#"]').forEach(link => {
    if (link.textContent.trim() === 'Ubah') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const user = DB.getUser();
        const currentAddr = user?.alamat || 'Jalan Kelapa Geng Macang, RT.3/RW.3, Desa Beruas, Kelapa';
        const newAddr = prompt('Alamat pengiriman baru:', currentAddr);
        if (newAddr && newAddr !== currentAddr) {
          if (user) { user.alamat = newAddr; DB.setUser(user); }
          const addrEl = link.closest('[style*="display: flex"]')?.querySelector('p[style*="line-height"]');
          if (addrEl) addrEl.innerHTML = newAddr;
          showToast('Alamat berhasil diubah!', 'success');
        }
      });
    }
  });
}

// =============================================
// PENGIRIMAN PENJUAL
// =============================================
function setupPengirimanPenjual() {
  document.querySelectorAll('a[href="javascript:void(0)"]').forEach(btn => {
    if (btn.textContent.trim() === 'Kirim Produk') {
      btn.addEventListener('click', () => {
        showToast('Produk berhasil dikirim!', 'success');
        setTimeout(() => window.location.href = 'detail-selesai.html', 1500);
      });
    }
  });
}

// =============================================
// AUCTION FAV (heart button)
// =============================================
function setupAuctionFav() {
  document.querySelectorAll('.auction-fav').forEach((btn, idx) => {
    const itemId = 'auction-' + idx;
    const icon = btn.querySelector('i');
    if (DB.isFavorite(itemId) && icon) { icon.classList.add('ph-fill'); btn.style.color = '#EF4444'; }
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!DB.isLoggedIn()) {
        showToast('Masuk untuk menyimpan favorit.', 'warning');
        if (window._openLoginModal) window._openLoginModal();
        return;
      }
      const added = DB.toggleFavorite(itemId);
      if (icon) icon.classList.toggle('ph-fill', added);
      btn.style.color = added ? '#EF4444' : '';
      showToast(added ? 'Disimpan ke favorit!' : 'Dihapus dari favorit.', added ? 'success' : 'info');
    });
  });
}

// =============================================
// UBAH PROFIL LINK (sidebar)
// =============================================
function setupUbahProfilLink() {
  document.querySelectorAll('.sidebar-user a[href="#"]').forEach(link => {
    link.addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'akun-saya.html'; });
  });
}

// =============================================
// IMAGE GALLERY
// =============================================
function setupImageGallery() {
  const mainImg = document.getElementById('detailMainImg');
  const thumbs = document.querySelectorAll('.thumb-img');
  if (!mainImg || !thumbs.length) return;
  thumbs.forEach(thumb => {
    thumb.style.cursor = 'pointer';
    thumb.addEventListener('click', () => {
      mainImg.src = thumb.src;
      thumbs.forEach(t => t.style.border = '2px solid transparent');
      thumb.style.border = '2px solid #4F46E5';
    });
  });
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  setupModals();
  updateHeaderState();
  setupAccordion();
  setupCaraTabs();
  setupRiwayatToggle();
  setupFormPenawaran();
  setupEditProfile();
  setupDaftarPenjual();
  setupTambahProduk();
  setupTitipLelang();
  setupJelajahi();
  setupStatusLelang();
  setupPengiriman();
  setupPengirimanPenjual();
  setupAuctionFav();
  setupUbahProfilLink();
  setupImageGallery();

  // Proteksi halaman akun
  const protectedPages = ['akun-saya.html', 'akun-penjual.html', 'akun-titip-lelang.html', 'akun-tambah-produk.html'];
  const currentPage = window.location.pathname.split('/').pop();
  if (protectedPages.includes(currentPage) && !DB.isLoggedIn()) {
    showToast('Silakan masuk terlebih dahulu.', 'warning');
    setTimeout(() => window.location.href = 'index.html', 1200);
  }
});
