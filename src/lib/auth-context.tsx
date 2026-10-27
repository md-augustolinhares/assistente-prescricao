'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
});

const DEFAULT_EMAIL =
  process.env.NEXT_PUBLIC_FIREBASE_DEFAULT_EMAIL || 'augustolinharesmed@hotmail.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      const isAuthPage = pathname === '/login';
      const isPublicAsset = pathname?.startsWith('/_next') || pathname?.startsWith('/favicon.ico') || pathname?.startsWith('/logos');

      if (!currentUser && !isAuthPage && !isPublicAsset) {
        router.replace('/login');
      } else if (currentUser && isAuthPage) {
        router.replace('/');
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  async function login(password: string) {
    try {
      await signInWithEmailAndPassword(auth, DEFAULT_EMAIL, password);
      router.replace('/');
      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMsg = 'Senha incorreta. Tente novamente.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Senha incorreta.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Muitas tentativas. Aguarde alguns instantes.';
      }
      return { success: false, error: errorMsg };
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
