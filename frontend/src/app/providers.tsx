'use client';

import { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { store, AppDispatch, RootState } from '@/lib/store';
import { getCurrentUser } from '@/lib/store/slices/authSlice';
import Toast from '@/components/common/Toast';

// Auth initialization component
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Token varsa ve user bilgisi yoksa, kullanıcı bilgilerini al
    if (accessToken && !user) {
      dispatch(getCurrentUser());
    }
  }, [accessToken, user, dispatch]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthInitializer>
          {children}
        </AuthInitializer>
        <Toast />
      </ThemeProvider>
    </Provider>
  );
}
