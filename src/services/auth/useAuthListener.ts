import { useEffect } from 'react';
import { onAuthStateChanged } from './auth.service';
import { authSliceActions } from '../../redux/authSlice';
import { useAppDispatch } from '../../redux/store';
import { analyticsService } from '../analytics/analytics.service';
import { crashReportingService } from '../crashReporting/crashReporting.service';

// Assina o estado de sessão do Firebase uma vez, na raiz do app, e espelha
// no redux (ver AuthSlice) - único lugar que fala direto com o SDK do
// Firebase Auth pra isso; o resto do app só lê `state.auth.user`.
export function useAuthListener(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(user => {
      dispatch(authSliceActions.setAuthUser(user));

      // Mesmo uid em Analytics e Crashlytics - dá pra filtrar eventos E
      // crashes de uma pessoa específica nos dois consoles, cruzando os
      // dois (ver analytics.service.ts/crashReporting.service.ts).
      analyticsService.setUser(user?.uid ?? null);
      crashReportingService.setUser(user?.uid ?? null);
    });
    return unsubscribe;
  }, [dispatch]);
}
