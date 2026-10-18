import { useEffect } from 'react';
import { profileSliceActions } from '../../redux/profileSlice';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { crashReportingService } from '../crashReporting/crashReporting.service';
import { subscribeProfile } from './profile.service';

// Espelha o perfil do usuário logado no redux, em tempo real - mesmo papel
// do useAuthListener, só que pro doc users/{uid} do Firestore.
export function useProfileListener(): void {
  const dispatch = useAppDispatch();
  const uid = useAppSelector(state => state.auth.user?.uid);

  useEffect(() => {
    dispatch(profileSliceActions.setProfile(undefined));
    if (!uid) return;
    return subscribeProfile(
      uid,
      profile => dispatch(profileSliceActions.setProfile(profile)),
      error => crashReportingService.recordError(error, 'useProfileListener'),
    );
  }, [dispatch, uid]);
}
