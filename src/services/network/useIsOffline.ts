import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// null em isInternetReachable = ainda não testou; só conta como offline
// quando a resposta é um "não" explícito, pra não piscar a tela na abertura.
const isOffline = (state: NetInfoState) =>
  state.isConnected === false || state.isInternetReachable === false;

export function useIsOffline(): boolean {
  const [offline, setOffline] = useState(false);
  useEffect(() => NetInfo.addEventListener(state => setOffline(isOffline(state))), []);
  return offline;
}

export async function checkConnection(): Promise<boolean> {
  return !isOffline(await NetInfo.refresh());
}
