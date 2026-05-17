'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

/**
 * Hook ini melindungi halaman pengguna dari akun admin.
 * Jika admin mencoba mengakses halaman pengguna (pembeli/penjual),
 * admin akan otomatis di-logout dan diarahkan ke beranda.
 */
export function useAdminGuard() {
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'admin') {
        localStorage.removeItem('lelangin_user');
        localStorage.removeItem('isLoggedIn');
        await supabase.auth.signOut();

        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast('Akun admin tidak dapat mengakses halaman pengguna.', 'error');
        }

        router.push('/');
      }
    };

    checkAdmin();
  }, [router]);
}
