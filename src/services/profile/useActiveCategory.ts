import { useCallback } from 'react';
import { persistedSliceActions } from '../../redux/persistedSlice';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { Category } from '../duels/duels.types';

// Categoria "da vez" + a carteira dela no perfil logado.
export function useActiveCategory() {
  const dispatch = useAppDispatch();
  const category = useAppSelector(state => state.persisted.activeCategory) ?? 'tcg';
  const wallet = useAppSelector(state => state.profile.profile?.wallets[category]);
  const setCategory = useCallback(
    (next: Category) => dispatch(persistedSliceActions.setActiveCategory(next)),
    [dispatch],
  );
  return { category, wallet, setCategory };
}
